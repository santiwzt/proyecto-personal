import "server-only";
import { AppError } from "@/lib/errors/app-error";

export interface ExtractedPage {
  page: number | null;
  text: string;
}

export interface ExtractionResult {
  text: string;
  pages: ExtractedPage[];
  /** True when we could only partially recover text (e.g. a scanned PDF with no text layer). */
  partial: boolean;
  warning: string | null;
}

const SUPPORTED_MIME_TYPES = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  "text/markdown",
  "image/png",
  "image/jpeg",
  "image/webp",
]);

export function isSupportedMimeType(mimeType: string): boolean {
  return SUPPORTED_MIME_TYPES.has(mimeType);
}

/**
 * Extracts plain text from an uploaded file buffer. Never fabricates text —
 * if a PDF has no extractable text layer (a scanned document), we say so
 * explicitly via `partial`/`warning` instead of pretending to have read it.
 */
export async function extractText(buffer: Buffer, mimeType: string): Promise<ExtractionResult> {
  switch (mimeType) {
    case "text/plain":
    case "text/markdown": {
      const text = buffer.toString("utf-8");
      return { text, pages: [{ page: null, text }], partial: false, warning: null };
    }

    case "application/pdf": {
      const { PDFParse } = await import("pdf-parse");
      const parser = new PDFParse({ data: new Uint8Array(buffer) });
      try {
        const result = await parser.getText();
        const trimmedText = result.text.trim();
        const pages: ExtractedPage[] = result.pages.map((p) => ({ page: p.num, text: p.text }));
        if (trimmedText.length < 20) {
          return {
            text: trimmedText,
            pages,
            partial: true,
            warning:
              "Este PDF no tiene una capa de texto reconocible (probablemente esta escaneado). " +
              "No pudimos extraer su contenido automaticamente.",
          };
        }
        return { text: trimmedText, pages, partial: false, warning: null };
      } finally {
        await parser.destroy();
      }
    }

    case "application/vnd.openxmlformats-officedocument.wordprocessingml.document": {
      const mammoth = await import("mammoth");
      const result = await mammoth.extractRawText({ buffer });
      const text = result.value.trim();
      return {
        text,
        pages: [{ page: null, text }],
        partial: text.length === 0,
        warning: text.length === 0 ? "No pudimos extraer texto de este documento DOCX." : null,
      };
    }

    case "image/png":
    case "image/jpeg":
    case "image/webp":
      // No local OCR in the MVP: images are stored and can be sent to a
      // vision-capable model at chat time, but we don't fabricate extracted
      // text for them here.
      return {
        text: "",
        pages: [],
        partial: true,
        warning:
          "Las imagenes no se procesan automaticamente en este momento. El asistente puede usarlas " +
          "si el modelo de IA configurado admite entrada visual.",
      };

    default:
      throw new AppError("INVALID_FILE", `Tipo de archivo no soportado: ${mimeType}`);
  }
}
