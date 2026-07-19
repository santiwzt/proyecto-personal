import { describe, expect, it } from "vitest";
import { incompleteChainCode } from "@/lib/integrations/ics-fetch";

function fetchFailedError(code: string): Error {
  const cause = { code, message: "some TLS detail" };
  return new Error("fetch failed", { cause });
}

describe("incompleteChainCode", () => {
  it("recognizes the known 'missing intermediate certificate' codes", () => {
    expect(incompleteChainCode(fetchFailedError("UNABLE_TO_VERIFY_LEAF_SIGNATURE"))).toBe(
      "UNABLE_TO_VERIFY_LEAF_SIGNATURE",
    );
    expect(incompleteChainCode(fetchFailedError("UNABLE_TO_GET_ISSUER_CERT"))).toBe("UNABLE_TO_GET_ISSUER_CERT");
    expect(incompleteChainCode(fetchFailedError("UNABLE_TO_GET_ISSUER_CERT_LOCALLY"))).toBe(
      "UNABLE_TO_GET_ISSUER_CERT_LOCALLY",
    );
  });

  it("does not match a self-signed certificate or hostname mismatch -- those stay rejected", () => {
    expect(incompleteChainCode(fetchFailedError("DEPTH_ZERO_SELF_SIGNED_CERT"))).toBeNull();
    expect(incompleteChainCode(fetchFailedError("ERR_TLS_CERT_ALTNAME_INVALID"))).toBeNull();
  });

  it("returns null for errors with no cause, or non-Error values", () => {
    expect(incompleteChainCode(new Error("plain error"))).toBeNull();
    expect(incompleteChainCode("not an error")).toBeNull();
    expect(incompleteChainCode(undefined)).toBeNull();
  });
});
