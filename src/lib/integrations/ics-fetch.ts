import "server-only";
import { Agent as UndiciAgent, fetch as undiciFetch } from "undici";
import { assertSafeExternalUrl } from "@/lib/security/url-safety";

const FETCH_TIMEOUT_MS = 8000;
const MAX_RESPONSE_BYTES = 2 * 1024 * 1024; // 2 MB is generous for a calendar feed

export class IcsFetchError extends Error {}

/**
 * Some institutional servers (school campus platforms in particular) don't
 * send the intermediate certificate in their TLS handshake, so a fully
 * strict client can't build a trust path to a root CA even though the leaf
 * certificate itself is legitimate. These are the specific OpenSSL codes for
 * that "incomplete chain" case -- deliberately narrower than "any TLS
 * error", so we never relax verification for a self-signed cert or a
 * hostname mismatch, only a server that forgot to send its intermediate.
 */
const INCOMPLETE_CHAIN_CODES = new Set([
  "UNABLE_TO_VERIFY_LEAF_SIGNATURE",
  "UNABLE_TO_GET_ISSUER_CERT",
  "UNABLE_TO_GET_ISSUER_CERT_LOCALLY",
]);

export function incompleteChainCode(error: unknown): string | null {
  const cause = error instanceof Error ? error.cause : undefined;
  const code = cause && typeof cause === "object" && "code" in cause ? (cause as { code?: unknown }).code : undefined;
  return typeof code === "string" && INCOMPLETE_CHAIN_CODES.has(code) ? code : null;
}

/**
 * A dispatcher that skips certificate verification, used ONLY as a
 * fallback retry after a normal, fully-verified fetch has already failed
 * with one of the incomplete-chain codes above -- never the default path.
 * This is scoped to this one function; it never changes Node's global TLS
 * behavior for the rest of the app (e.g. Supabase/Anthropic calls stay
 * fully verified).
 */
const relaxedTlsAgent = new UndiciAgent({ connect: { rejectUnauthorized: false } });

/**
 * Downloads the raw text of an external .ics feed, guarding against SSRF,
 * slow hosts and oversized responses. Pass `revalidateSeconds` to let Next's
 * fetch cache absorb repeat reads (e.g. Agenda page views); omit it for an
 * always-fresh check (e.g. validating a URL right after the user pastes it).
 */
export async function fetchIcsText(rawUrl: string, options?: { revalidateSeconds?: number }): Promise<string> {
  const url = await assertSafeExternalUrl(rawUrl).catch((error: unknown) => {
    throw new IcsFetchError(error instanceof Error ? error.message : "La URL no es valida.");
  });

  const cacheOptions = options?.revalidateSeconds !== undefined
    ? { next: { revalidate: options.revalidateSeconds } }
    : { cache: "no-store" as const };

  try {
    return await doFetch(url, cacheOptions);
  } catch (error) {
    const chainCode = incompleteChainCode(error);
    if (!chainCode) throw error;
    console.warn(
      `ics-fetch: ${url.hostname} sent an incomplete certificate chain (${chainCode}) -- retrying without strict TLS verification for this request only.`,
    );
    return doFetch(url, cacheOptions, relaxedTlsAgent);
  }
}

async function doFetch(
  url: URL,
  cacheOptions: { next: { revalidate: number } } | { cache: "no-store" },
  dispatcher?: UndiciAgent,
): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const response = dispatcher
      ? await undiciFetch(url, {
          signal: controller.signal,
          redirect: "manual",
          headers: { Accept: "text/calendar, text/plain, */*" },
          dispatcher,
          ...cacheOptions,
        })
      : await fetch(url, {
          signal: controller.signal,
          redirect: "manual",
          headers: { Accept: "text/calendar, text/plain, */*" },
          ...cacheOptions,
        });

    if (response.status >= 300 && response.status < 400) {
      throw new IcsFetchError("Esa URL redirige a otra direccion -- pega el link final directamente.");
    }
    if (!response.ok) {
      throw new IcsFetchError(`El calendario respondio con un error (${response.status}).`);
    }

    const contentLength = Number(response.headers.get("content-length") ?? 0);
    if (contentLength > MAX_RESPONSE_BYTES) {
      throw new IcsFetchError("El calendario es demasiado grande.");
    }

    const text = await response.text();
    if (text.length > MAX_RESPONSE_BYTES) {
      throw new IcsFetchError("El calendario es demasiado grande.");
    }
    return text;
  } catch (error) {
    if (error instanceof IcsFetchError) throw error;
    if (error instanceof Error && error.name === "AbortError") {
      throw new IcsFetchError("El calendario del colegio tardo demasiado en responder.");
    }
    if (incompleteChainCode(error)) throw error; // let the caller decide whether to retry
    console.error(
      "ics-fetch error:",
      error,
      error instanceof Error ? { name: error.name, message: error.message, cause: error.cause } : undefined,
    );
    throw new IcsFetchError("No pudimos leer el calendario del colegio.");
  } finally {
    clearTimeout(timeout);
  }
}
