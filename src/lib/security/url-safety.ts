import "server-only";
import dns from "node:dns/promises";
import net from "node:net";

/**
 * Blocks server-side requests to internal/private network addresses when a
 * user supplies an arbitrary external URL (e.g. a school calendar feed) --
 * without this, our server becomes an SSRF proxy a user could point at
 * internal infrastructure. Checks both IP literals and DNS-resolved
 * addresses; does not re-verify the IP actually connected to (a full
 * TOCTOU-proof implementation would need a custom fetch agent), which is a
 * proportionate tradeoff for this app's threat model.
 */

function ipv4ToInt(ip: string): number {
  return ip.split(".").reduce((acc, octet) => (acc << 8) + Number(octet), 0) >>> 0;
}

const PRIVATE_IPV4_RANGES: Array<[base: string, bits: number]> = [
  ["0.0.0.0", 8],
  ["10.0.0.0", 8],
  ["100.64.0.0", 10], // carrier-grade NAT
  ["127.0.0.0", 8],
  ["169.254.0.0", 16], // link-local, includes cloud metadata (169.254.169.254)
  ["172.16.0.0", 12],
  ["192.0.0.0", 24],
  ["192.168.0.0", 16],
  ["198.18.0.0", 15],
  ["224.0.0.0", 4], // multicast and above
];

function isPrivateIPv4(ip: string): boolean {
  const ipInt = ipv4ToInt(ip);
  return PRIVATE_IPV4_RANGES.some(([base, bits]) => {
    const mask = bits === 0 ? 0 : (~0 << (32 - bits)) >>> 0;
    return (ipInt & mask) === (ipv4ToInt(base) & mask);
  });
}

function isPrivateIPv6(ip: string): boolean {
  const lower = ip.toLowerCase();
  return (
    lower === "::1" ||
    lower.startsWith("fc") ||
    lower.startsWith("fd") || // unique local fc00::/7
    lower.startsWith("fe80") || // link-local
    lower.startsWith("::ffff:127.")
  );
}

function isPrivateOrReservedIp(ip: string): boolean {
  if (net.isIPv4(ip)) return isPrivateIPv4(ip);
  if (net.isIPv6(ip)) return isPrivateIPv6(ip);
  return true; // unrecognized format -- fail closed
}

/** Validates the URL is http(s) and resolves to a public address. Returns the parsed URL, or throws with a user-facing message. */
export async function assertSafeExternalUrl(rawUrl: string): Promise<URL> {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new Error("La URL no es valida.");
  }

  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new Error("Solo se permiten URLs que empiecen con http:// o https://.");
  }

  const hostname = url.hostname.toLowerCase();
  if (hostname === "localhost" || hostname.endsWith(".localhost")) {
    throw new Error("Esa direccion no esta permitida.");
  }

  if (net.isIP(hostname)) {
    if (isPrivateOrReservedIp(hostname)) {
      throw new Error("Esa direccion no esta permitida.");
    }
    return url;
  }

  let records: { address: string }[];
  try {
    records = await dns.lookup(hostname, { all: true });
  } catch {
    throw new Error("No pudimos resolver esa direccion.");
  }
  if (records.length === 0 || records.some((record) => isPrivateOrReservedIp(record.address))) {
    throw new Error("Esa direccion no esta permitida.");
  }

  return url;
}
