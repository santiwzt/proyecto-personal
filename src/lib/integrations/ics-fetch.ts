import "server-only";
import { assertSafeExternalUrl } from "@/lib/security/url-safety";

const FETCH_TIMEOUT_MS = 8000;
const MAX_RESPONSE_BYTES = 2 * 1024 * 1024; // 2 MB is generous for a calendar feed

export class IcsFetchError extends Error {}

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

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      redirect: "manual",
      headers: { Accept: "text/calendar, text/plain, */*" },
      ...(options?.revalidateSeconds !== undefined
        ? { next: { revalidate: options.revalidateSeconds } }
        : { cache: "no-store" as const }),
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
