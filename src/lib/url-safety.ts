/**
 * Reduces SSRF risk when the server fetches user-supplied URLs (e.g. training crawl).
 * Not a substitute for network egress controls — block obvious private/link-local targets.
 */
export function assertUrlSafeForServerFetch(raw: string): void {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new Error("Invalid URL");
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("Only http and https URLs are allowed");
  }

  const host = url.hostname.toLowerCase();

  if (
    host === "localhost" ||
    host.endsWith(".localhost") ||
    host === "0.0.0.0" ||
    host === "[::]" ||
    host === "::1"
  ) {
    throw new Error("That hostname is not allowed");
  }

  const ipv4 = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (ipv4) {
    const a = Number(ipv4[1]);
    const b = Number(ipv4[2]);
    if (a === 10) throw new Error("Private network addresses are not allowed");
    if (a === 172 && b >= 16 && b <= 31) throw new Error("Private network addresses are not allowed");
    if (a === 192 && b === 168) throw new Error("Private network addresses are not allowed");
    if (a === 127) throw new Error("Loopback addresses are not allowed");
    if (a === 169 && b === 254) throw new Error("Link-local addresses are not allowed");
    if (a === 0) throw new Error("That address is not allowed");
  }

  if (host.startsWith("[fd") || host.startsWith("[fe80:")) {
    throw new Error("That hostname is not allowed");
  }
}
