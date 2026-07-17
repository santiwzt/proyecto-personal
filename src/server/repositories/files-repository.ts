import { getDemoStore } from "@/lib/database/demo/store";
import { generateId } from "@/lib/database/demo/ids";
import { AppError } from "@/lib/errors/app-error";
import { isDemoMode } from "@/config/env";
import { createSupabaseServerClient } from "@/lib/database/supabase/server";
import type { FileAsset, FileChunk } from "@/types/domain";
import type { FileChunksTable, FilesTable } from "@/types/database";

type NewFile = Omit<
  FileAsset,
  "id" | "userId" | "createdAt" | "status" | "extractedText" | "processingError"
>;

function dbError(action: string, error: { message: string }): never {
  console.error(`Supabase error (${action}):`, error.message);
  throw new AppError("INTERNAL", "Ocurrio un error al acceder a la base de datos.");
}

function mapFile(row: FilesTable["Row"]): FileAsset {
  return {
    id: row.id,
    userId: row.user_id,
    originalName: row.original_name,
    safeName: row.safe_name,
    mimeType: row.mime_type,
    sizeBytes: row.size_bytes,
    storagePath: row.storage_path,
    status: row.status,
    subjectId: row.subject_id,
    projectId: row.project_id,
    extractedText: row.extracted_text,
    processingError: row.processing_error,
    contentHash: row.content_hash,
    createdAt: row.created_at,
  };
}

export const filesRepository = {
  async list(userId: string): Promise<FileAsset[]> {
    if (isDemoMode) return getDemoStore().files.list(userId).filter((f) => f.status !== "eliminado");
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("files")
      .select("*")
      .eq("user_id", userId)
      .neq("status", "eliminado")
      .order("created_at", { ascending: false });
    if (error) dbError("files.list", error);
    return data.map(mapFile);
  },

  async listBySubject(userId: string, subjectId: string): Promise<FileAsset[]> {
    return (await this.list(userId)).filter((f) => f.subjectId === subjectId);
  },

  async get(userId: string, id: string): Promise<FileAsset> {
    if (isDemoMode) {
      const file = getDemoStore().files.get(userId, id);
      if (!file) throw new AppError("NOT_FOUND", "No encontramos el archivo.");
      return file;
    }
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.from("files").select("*").eq("user_id", userId).eq("id", id).single();
    if (error) throw new AppError("NOT_FOUND", "No encontramos el archivo.");
    return mapFile(data);
  },

  async findByHash(userId: string, contentHash: string): Promise<FileAsset | null> {
    if (isDemoMode) {
      return (
        getDemoStore()
          .files.list(userId)
          .find((f) => f.contentHash === contentHash && f.status !== "eliminado") ?? null
      );
    }
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("files")
      .select("*")
      .eq("user_id", userId)
      .eq("content_hash", contentHash)
      .neq("status", "eliminado")
      .maybeSingle();
    if (error) dbError("files.findByHash", error);
    return data ? mapFile(data) : null;
  },

  async create(userId: string, input: NewFile): Promise<FileAsset> {
    if (isDemoMode) {
      return getDemoStore().files.insert({
        ...input,
        id: generateId("file"),
        userId,
        status: "subiendo",
        extractedText: null,
        processingError: null,
        createdAt: new Date().toISOString(),
      });
    }
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("files")
      .insert({
        user_id: userId,
        original_name: input.originalName,
        safe_name: input.safeName,
        mime_type: input.mimeType,
        size_bytes: input.sizeBytes,
        storage_path: input.storagePath,
        subject_id: input.subjectId,
        project_id: input.projectId,
        content_hash: input.contentHash,
        status: "subiendo",
      })
      .select("*")
      .single();
    if (error) dbError("files.create", error);
    return mapFile(data);
  },

  async markProcessing(userId: string, id: string): Promise<FileAsset> {
    return this.updateStatus(userId, id, { status: "procesando" });
  },

  async markReady(userId: string, id: string, extractedText: string): Promise<FileAsset> {
    return this.updateStatus(userId, id, { status: "listo", extractedText, processingError: null });
  },

  async markFailed(userId: string, id: string, processingError: string): Promise<FileAsset> {
    return this.updateStatus(userId, id, { status: "fallo", processingError });
  },

  async softDelete(userId: string, id: string): Promise<FileAsset> {
    return this.updateStatus(userId, id, { status: "eliminado" });
  },

  async updateStatus(
    userId: string,
    id: string,
    patch: Partial<Pick<FileAsset, "status" | "extractedText" | "processingError">>,
  ): Promise<FileAsset> {
    if (isDemoMode) return getDemoStore().files.update(userId, id, patch);
    const supabase = await createSupabaseServerClient();
    const dbPatch: Partial<FilesTable["Update"]> = {};
    if (patch.status !== undefined) dbPatch.status = patch.status;
    if (patch.extractedText !== undefined) dbPatch.extracted_text = patch.extractedText;
    if (patch.processingError !== undefined) dbPatch.processing_error = patch.processingError;
    const { data, error } = await supabase
      .from("files")
      .update(dbPatch)
      .eq("user_id", userId)
      .eq("id", id)
      .select("*")
      .single();
    if (error) dbError("files.updateStatus", error);
    return mapFile(data);
  },
};

function mapFileChunk(row: FileChunksTable["Row"]): FileChunk {
  return {
    id: row.id,
    userId: row.user_id,
    fileId: row.file_id,
    chunkIndex: row.chunk_index,
    content: row.content,
    charCount: row.char_count,
    page: row.page,
    embedding: row.embedding,
  };
}

export const fileChunksRepository = {
  async listByFile(userId: string, fileId: string): Promise<FileChunk[]> {
    if (isDemoMode) return getDemoStore().fileChunks.list(userId).filter((c) => c.fileId === fileId);
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("file_chunks")
      .select("*")
      .eq("user_id", userId)
      .eq("file_id", fileId)
      .order("chunk_index");
    if (error) dbError("fileChunks.listByFile", error);
    return data.map(mapFileChunk);
  },

  async listByFiles(userId: string, fileIds: string[]): Promise<FileChunk[]> {
    if (fileIds.length === 0) return [];
    if (isDemoMode) return getDemoStore().fileChunks.list(userId).filter((c) => fileIds.includes(c.fileId));
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("file_chunks")
      .select("*")
      .eq("user_id", userId)
      .in("file_id", fileIds);
    if (error) dbError("fileChunks.listByFiles", error);
    return data.map(mapFileChunk);
  },

  async replaceForFile(
    userId: string,
    fileId: string,
    chunks: Omit<FileChunk, "id" | "userId" | "fileId">[],
  ): Promise<FileChunk[]> {
    if (isDemoMode) {
      const store = getDemoStore();
      const existing = store.fileChunks.list(userId).filter((c) => c.fileId === fileId);
      for (const chunk of existing) store.fileChunks.remove(userId, chunk.id);
      return chunks.map((chunk) => store.fileChunks.insert({ ...chunk, id: generateId("chunk"), userId, fileId }));
    }
    const supabase = await createSupabaseServerClient();
    const { error: deleteError } = await supabase
      .from("file_chunks")
      .delete()
      .eq("user_id", userId)
      .eq("file_id", fileId);
    if (deleteError) dbError("fileChunks.replaceForFile.delete", deleteError);
    if (chunks.length === 0) return [];
    const { data, error } = await supabase
      .from("file_chunks")
      .insert(
        chunks.map((chunk) => ({
          user_id: userId,
          file_id: fileId,
          chunk_index: chunk.chunkIndex,
          content: chunk.content,
          char_count: chunk.charCount,
          page: chunk.page,
          embedding: chunk.embedding,
        })),
      )
      .select("*");
    if (error) dbError("fileChunks.replaceForFile.insert", error);
    return data.map(mapFileChunk);
  },

  async removeByFile(userId: string, fileId: string): Promise<void> {
    if (isDemoMode) {
      const store = getDemoStore();
      for (const chunk of store.fileChunks.list(userId).filter((c) => c.fileId === fileId)) {
        store.fileChunks.remove(userId, chunk.id);
      }
      return;
    }
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.from("file_chunks").delete().eq("user_id", userId).eq("file_id", fileId);
    if (error) dbError("fileChunks.removeByFile", error);
  },
};
