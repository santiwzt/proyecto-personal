import { describe, expect, it } from "vitest";
import { computeContentHash, sanitizeFileName, validateUpload } from "@/lib/storage/file-validation";
import { AppError } from "@/lib/errors/app-error";

const PDF_MAGIC = Buffer.from("%PDF-1.4\n%test content padding to look real\n");
const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);

describe("sanitizeFileName", () => {
  it("strips path separators and unsafe characters", () => {
    expect(sanitizeFileName("../../etc/passwd")).not.toContain("..");
    expect(sanitizeFileName("../../etc/passwd")).not.toContain("/");
  });

  it("lowercases and normalizes accents", () => {
    expect(sanitizeFileName("Resumen Físíca.PDF")).toBe("resumen-fisica.pdf");
  });

  it("never returns an empty string", () => {
    expect(sanitizeFileName("***")).toBe("archivo");
  });
});

describe("computeContentHash", () => {
  it("is deterministic for identical content", () => {
    const a = computeContentHash(Buffer.from("hola mundo"));
    const b = computeContentHash(Buffer.from("hola mundo"));
    expect(a).toBe(b);
  });

  it("differs for different content", () => {
    const a = computeContentHash(Buffer.from("hola"));
    const b = computeContentHash(Buffer.from("mundo"));
    expect(a).not.toBe(b);
  });
});

describe("validateUpload", () => {
  it("accepts a real PDF under the size limit", () => {
    expect(() =>
      validateUpload({ buffer: PDF_MAGIC, declaredMimeType: "application/pdf", maxSizeBytes: 1024 }),
    ).not.toThrow();
  });

  it("rejects a file declared as PDF but whose bytes are actually a PNG", () => {
    expect(() =>
      validateUpload({ buffer: PNG_MAGIC, declaredMimeType: "application/pdf", maxSizeBytes: 1024 }),
    ).toThrow(AppError);
  });

  it("rejects a file over the configured size limit", () => {
    expect(() =>
      validateUpload({ buffer: PDF_MAGIC, declaredMimeType: "application/pdf", maxSizeBytes: 5 }),
    ).toThrow(AppError);
  });

  it("rejects an empty file", () => {
    expect(() =>
      validateUpload({ buffer: Buffer.alloc(0), declaredMimeType: "text/plain", maxSizeBytes: 1024 }),
    ).toThrow(AppError);
  });

  it("rejects a disallowed mime type", () => {
    expect(() =>
      validateUpload({ buffer: PDF_MAGIC, declaredMimeType: "application/x-msdownload", maxSizeBytes: 1024 }),
    ).toThrow(AppError);
  });

  it("rejects text/plain content that is actually a renamed PNG", () => {
    expect(() =>
      validateUpload({ buffer: PNG_MAGIC, declaredMimeType: "text/plain", maxSizeBytes: 1024 }),
    ).toThrow(AppError);
  });
});
