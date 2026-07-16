import { createHash } from "node:crypto";
import { AppError } from "@/lib/errors/app-error";

/**
 * Never trust a file's declared MIME type or its extension alone — sniff
 * the actual magic bytes. Extension-only checks are explicitly disallowed
 * by the project's security requirements.
 */
function sniffMimeType(buffer: Buffer): string | null {
  if (buffer.length >= 4 && buffer.subarray(0, 4).toString("ascii") === "%PDF") {
    return "application/pdf";
  }
  if (buffer.length >= 4 && buffer[0] === 0x50 && buffer[1] === 0x4b && buffer[2] === 0x03 && buffer[3] === 0x04) {
    // DOCX is a zip archive; we can't fully distinguish it from other zip-based
    // formats by magic bytes alone, so we accept it here and let the docx
    // parser itself fail loudly later if it isn't actually a Word document.
    return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  }
  if (buffer.length >= 8 && buffer.subarray(0, 8).toString("hex") === "89504e470d0a1a0a") {
    return "image/png";
  }
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "image/jpeg";
  }
  if (buffer.length >= 12 && buffer.subarray(8, 12).toString("ascii") === "WEBP") {
    return "image/webp";
  }
  return null; // plain text / markdown have no reliable magic bytes
}

export function sanitizeFileName(originalName: string): string {
  const base = originalName.split(/[/\\]/).pop() ?? "archivo";
  const normalized = base
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9.\-_]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^[-.]+|[-.]+$/g, "")
    .toLowerCase();
  return normalized.length > 0 ? normalized : "archivo";
}

export function computeContentHash(buffer: Buffer): string {
  return createHash("sha256").update(buffer).digest("hex");
}

export interface FileValidationInput {
  buffer: Buffer;
  declaredMimeType: string;
  maxSizeBytes: number;
}

const TEXT_LIKE_TYPES = new Set(["text/plain", "text/markdown"]);
const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  "text/markdown",
  "image/png",
  "image/jpeg",
  "image/webp",
]);

/** Throws AppError("INVALID_FILE", ...) on any validation failure. */
export function validateUpload({ buffer, declaredMimeType, maxSizeBytes }: FileValidationInput): void {
  if (buffer.length === 0) {
    throw new AppError("INVALID_FILE", "El archivo esta vacio.");
  }
  if (buffer.length > maxSizeBytes) {
    throw new AppError(
      "INVALID_FILE",
      `El archivo supera el limite permitido de ${Math.round(maxSizeBytes / (1024 * 1024))} MB.`,
    );
  }
  if (!ALLOWED_MIME_TYPES.has(declaredMimeType)) {
    throw new AppError("INVALID_FILE", "Tipo de archivo no permitido.");
  }

  const sniffed = sniffMimeType(buffer);
  if (TEXT_LIKE_TYPES.has(declaredMimeType)) {
    // No reliable magic bytes for plain text — but reject it if it sniffs as
    // something else entirely (e.g. a renamed PDF/image).
    if (sniffed !== null) {
      throw new AppError("INVALID_FILE", "El contenido del archivo no coincide con su tipo declarado.");
    }
    return;
  }

  if (sniffed !== declaredMimeType) {
    throw new AppError("INVALID_FILE", "El contenido del archivo no coincide con su tipo declarado.");
  }
}
