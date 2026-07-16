import { getDemoStore } from "@/lib/database/demo/store";
import { generateId } from "@/lib/database/demo/ids";
import { AppError } from "@/lib/errors/app-error";
import type { FileAsset, FileChunk } from "@/types/domain";

type NewFile = Omit<
  FileAsset,
  "id" | "userId" | "createdAt" | "status" | "extractedText" | "processingError"
>;

export const filesRepository = {
  list(userId: string): FileAsset[] {
    return getDemoStore().files.list(userId).filter((f) => f.status !== "eliminado");
  },
  listBySubject(userId: string, subjectId: string): FileAsset[] {
    return this.list(userId).filter((f) => f.subjectId === subjectId);
  },
  get(userId: string, id: string): FileAsset {
    const file = getDemoStore().files.get(userId, id);
    if (!file) throw new AppError("NOT_FOUND", "No encontramos el archivo.");
    return file;
  },
  findByHash(userId: string, contentHash: string): FileAsset | null {
    return getDemoStore()
      .files.list(userId)
      .find((f) => f.contentHash === contentHash && f.status !== "eliminado") ?? null;
  },
  create(userId: string, input: NewFile): FileAsset {
    return getDemoStore().files.insert({
      ...input,
      id: generateId("file"),
      userId,
      status: "subiendo",
      extractedText: null,
      processingError: null,
      createdAt: new Date().toISOString(),
    });
  },
  markProcessing(userId: string, id: string): FileAsset {
    return getDemoStore().files.update(userId, id, { status: "procesando" });
  },
  markReady(userId: string, id: string, extractedText: string): FileAsset {
    return getDemoStore().files.update(userId, id, { status: "listo", extractedText, processingError: null });
  },
  markFailed(userId: string, id: string, processingError: string): FileAsset {
    return getDemoStore().files.update(userId, id, { status: "fallo", processingError });
  },
  softDelete(userId: string, id: string): FileAsset {
    return getDemoStore().files.update(userId, id, { status: "eliminado" });
  },
};

export const fileChunksRepository = {
  listByFile(userId: string, fileId: string): FileChunk[] {
    return getDemoStore().fileChunks.list(userId).filter((c) => c.fileId === fileId);
  },
  listByFiles(userId: string, fileIds: string[]): FileChunk[] {
    return getDemoStore().fileChunks.list(userId).filter((c) => fileIds.includes(c.fileId));
  },
  replaceForFile(userId: string, fileId: string, chunks: Omit<FileChunk, "id" | "userId" | "fileId">[]): FileChunk[] {
    const store = getDemoStore();
    const existing = store.fileChunks.list(userId).filter((c) => c.fileId === fileId);
    for (const chunk of existing) store.fileChunks.remove(userId, chunk.id);
    return chunks.map((chunk) =>
      store.fileChunks.insert({ ...chunk, id: generateId("chunk"), userId, fileId }),
    );
  },
  removeByFile(userId: string, fileId: string): void {
    const store = getDemoStore();
    for (const chunk of store.fileChunks.list(userId).filter((c) => c.fileId === fileId)) {
      store.fileChunks.remove(userId, chunk.id);
    }
  },
};
