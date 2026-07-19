import { describe, expect, it } from "vitest";
import { assertSafeExternalUrl } from "@/lib/security/url-safety";

describe("assertSafeExternalUrl", () => {
  it("rejects non-http(s) schemes", async () => {
    await expect(assertSafeExternalUrl("file:///etc/passwd")).rejects.toThrow();
    await expect(assertSafeExternalUrl("ftp://example.com/calendar.ics")).rejects.toThrow();
  });

  it("rejects malformed URLs", async () => {
    await expect(assertSafeExternalUrl("not a url")).rejects.toThrow();
  });

  it("rejects localhost", async () => {
    await expect(assertSafeExternalUrl("http://localhost/calendar.ics")).rejects.toThrow();
    await expect(assertSafeExternalUrl("http://foo.localhost/calendar.ics")).rejects.toThrow();
  });

  it("rejects loopback and private IPv4 literals", async () => {
    await expect(assertSafeExternalUrl("http://127.0.0.1/calendar.ics")).rejects.toThrow();
    await expect(assertSafeExternalUrl("http://10.0.0.5/calendar.ics")).rejects.toThrow();
    await expect(assertSafeExternalUrl("http://192.168.1.1/calendar.ics")).rejects.toThrow();
    await expect(assertSafeExternalUrl("http://172.16.0.1/calendar.ics")).rejects.toThrow();
  });

  it("rejects the cloud metadata address", async () => {
    await expect(assertSafeExternalUrl("http://169.254.169.254/latest/meta-data/")).rejects.toThrow();
  });

  it("rejects IPv6 loopback and link-local literals", async () => {
    await expect(assertSafeExternalUrl("http://[::1]/calendar.ics")).rejects.toThrow();
    await expect(assertSafeExternalUrl("http://[fe80::1]/calendar.ics")).rejects.toThrow();
  });

  it("accepts a public https URL with a literal public IP", async () => {
    const url = await assertSafeExternalUrl("https://8.8.8.8/calendar.ics");
    expect(url.hostname).toBe("8.8.8.8");
  });
});
