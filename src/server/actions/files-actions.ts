"use server";

import { revalidatePath } from "next/cache";
import { env } from "@/config/env";
import { requireSessionUser } from "@/lib/auth/session";
import { AppError } from "@/lib/errors/app-error";
import { computeContentHash, sanitizeFileName, validateUpload } from "@/lib/storage/file-validation";
import { extractText } from "@/lib/storage/text-extraction";
import { chunkText } from "@/server/services/chunking";
import { fileChunksRepository, filesRepository } from "@/server/repositories/files-repository";
import { activityLogRepository } from "@/server/repositories/misc-repository";
import type { FileAsset } from "@/types/domain";

export async function uploadFileAction(formData: FormData): Promise<FileAsset> {
  const user = await requireSessionUser();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    throw new AppError("INVALID_FILE", "No se recibio ningun archivo.");
  }
  const subjectId = (formData.get("subjectId") as string | null) || null;
  const projectId = (formData.get("projectId") as string | null) || null;

  const buffer = Buffer.from(await file.arrayBuffer());
  const maxSizeBytes = env.MAX_UPLOAD_SIZE_MB * 1024 * 1024;
  validateUpload({ buffer, declaredMimeType: file.type, maxSizeBytes });

  const contentHash = computeContentHash(buffer);
  const existing = filesRepository.findByHash(user.userId, contentHash);
  if (existing) {
    throw new AppError("CONFLICT", `Ya subiste este archivo como "${existing.originalName}".`);
  }

  const record = filesRepository.create(user.userId, {
    originalName: file.name,
    safeName: sanitizeFileName(file.name),
    mimeType: file.type,
    sizeBytes: buffer.length,
    storagePath: `demo/${user.userId}/${contentHash}-${sanitizeFileName(file.name)}`,
    subjectId,
    projectId,
    contentHash,
  });

  filesRepository.markProcessing(user.userId, record.id);
  try {
    const extraction = await extractText(buffer, file.type);
    if (extraction.partial && extraction.text.length === 0) {
      filesRepository.markFailed(user.userId, record.id, extraction.warning ?? "No se pudo procesar el archivo.");
    } else {
      const chunks = chunkText(extraction.text);
      fileChunksRepository.replaceForFile(
        user.userId,
        record.id,
        chunks.map((c) => ({ chunkIndex: c.index, content: c.content, charCount: c.charCount, page: null, embedding: null })),
      );
      filesRepository.markReady(user.userId, record.id, extraction.text);
    }
  } catch (error) {
    console.error("File processing failed:", error);
    filesRepository.markFailed(user.userId, record.id, "Ocurrio un error al procesar el archivo.");
  }

  activityLogRepository.record(user.userId, "subio", "file", record.id);
  revalidatePath("/archivos");
  return filesRepository.get(user.userId, record.id);
}

export async function deleteFileAction(id: string): Promise<void> {
  const user = await requireSessionUser();
  filesRepository.softDelete(user.userId, id);
  fileChunksRepository.removeByFile(user.userId, id);
  revalidatePath("/archivos");
}

/**
 * Re-chunks an already-extracted file (useful after a chunking config
 * change). Demo mode doesn't persist the original file bytes, so a file
 * that failed extraction entirely can't be recovered here — the user has
 * to re-upload it. With real Supabase Storage configured, this would
 * instead re-download `file.storagePath` and re-run extractText from
 * scratch, which also recovers from a genuine extraction failure.
 */
export async function reprocessFileAction(id: string): Promise<FileAsset> {
  const user = await requireSessionUser();
  const file = filesRepository.get(user.userId, id);
  if (!file.extractedText) {
    throw new AppError(
      "PROCESSING_FAILED",
      "No conservamos el archivo original en modo demo: volve a subirlo para reprocesarlo.",
    );
  }
  const chunks = chunkText(file.extractedText);
  fileChunksRepository.replaceForFile(
    user.userId,
    id,
    chunks.map((c) => ({ chunkIndex: c.index, content: c.content, charCount: c.charCount, page: null, embedding: null })),
  );
  filesRepository.markReady(user.userId, id, file.extractedText);
  revalidatePath("/archivos");
  return filesRepository.get(user.userId, id);
}
