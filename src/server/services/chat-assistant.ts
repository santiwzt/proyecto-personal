import { buildExcerpt, retrieveRelevantChunks } from "@/server/services/retrieval";
import type { FileChunk, MessageSource } from "@/types/domain";

export type ChatMode =
  | "explicame"
  | "resumime"
  | "preguntame"
  | "corregime"
  | "repaso_rapido"
  | "preparame";

const MODE_INSTRUCTIONS: Record<ChatMode, string> = {
  explicame: "Explica el concepto de forma clara y sencilla, como a un estudiante secundario.",
  resumime: "Da un resumen breve y organizado de los puntos mas importantes.",
  preguntame: "Hace una pregunta de repaso al estudiante sobre el material, en vez de solo explicar.",
  corregime: "El estudiante va a compartir un intento de respuesta o ejercicio: señala el primer error importante y da una pista antes de la solucion completa.",
  repaso_rapido: "Da un repaso muy breve, en formato de puntos clave, para revisar justo antes de estudiar o rendir.",
  preparame: "Ayuda a armar un plan de repaso enfocado en los puntos mas debiles para el examen.",
};

export function buildChatSystemPrompt(mode: ChatMode): string {
  return (
    "Sos el asistente de estudio de Nexo, para un estudiante secundario argentino. " +
    "Respondes en español rioplatense, de forma clara y cercana, sin sonar excesivamente formal. " +
    "SOLO podes usar la informacion de los fragmentos de material provistos como contexto: nunca inventes " +
    "datos, citas o paginas que no esten en ese material. Si el material no alcanza para responder, decilo " +
    "explicitamente en vez de adivinar. Cuando cites algo, mencion el nombre del archivo de origen. " +
    `Modo actual: ${MODE_INSTRUCTIONS[mode]}`
  );
}

export function buildChatUserPrompt(
  chunks: { chunk: FileChunk; fileName: string }[],
  message: string,
): string {
  const context = chunks
    .map((c, i) => `[Fuente ${i + 1}: ${c.fileName}]\n${c.chunk.content}`)
    .join("\n\n---\n\n");
  return (
    (context.length > 0 ? `Material disponible:\n\n${context}\n\n---\n\n` : "No hay material disponible.\n\n") +
    `Pregunta del estudiante: ${message}`
  );
}

export interface RetrievedContext {
  chunk: FileChunk;
  fileName: string;
  score: number;
}

export function retrieveChatContext(
  chunks: FileChunk[],
  fileNameById: Map<string, string>,
  query: string,
  topK = 4,
): RetrievedContext[] {
  return retrieveRelevantChunks(chunks, query, topK).map((r) => ({
    chunk: r.chunk,
    fileName: fileNameById.get(r.chunk.fileId) ?? "Archivo",
    score: r.score,
  }));
}

export function toMessageSources(context: RetrievedContext[], query: string): MessageSource[] {
  return context.map((c) => ({
    fileId: c.chunk.fileId,
    fileName: c.fileName,
    chunkId: c.chunk.id,
    excerpt: buildExcerpt(c.chunk.content, query),
    page: c.chunk.page,
  }));
}

/**
 * No-AI-key fallback: quotes the most relevant material directly instead of
 * generating free text. Less fluent than a real model, but never invents
 * anything — every sentence shown is copied verbatim from the user's files.
 */
export function buildHeuristicChatAnswer(
  context: RetrievedContext[],
  query: string,
  mode: ChatMode,
): { content: string; sources: MessageSource[] } {
  if (context.length === 0) {
    return {
      content:
        "No encontre informacion suficiente en el material seleccionado para responder eso. " +
        "Proba subir un archivo sobre el tema o elegir otro material en el selector.",
      sources: [],
    };
  }

  const lead =
    mode === "resumime"
      ? "Esto es lo mas relevante que encontre en tu material:"
      : mode === "repaso_rapido"
        ? "Repaso rapido segun tu material:"
        : "Segun tu material, encontre esto:";

  const body = context
    .slice(0, 2)
    .map((c) => `Segun "${c.fileName}": "${buildExcerpt(c.chunk.content, query, 300)}"`)
    .join("\n\n");

  return {
    content: `${lead}\n\n${body}\n\n(Este modo no tiene un proveedor de IA configurado: te muestro citas directas en vez de una explicacion generada.)`,
    sources: toMessageSources(context, query),
  };
}
