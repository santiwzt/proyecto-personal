import { describe, expect, it } from "vitest";
import { buildHeuristicChatAnswer, retrieveChatContext } from "@/server/services/chat-assistant";
import type { FileChunk } from "@/types/domain";

const chunks: FileChunk[] = [
  {
    id: "chunk-1",
    userId: "u1",
    fileId: "file-1",
    chunkIndex: 0,
    content: "El tiro vertical tiene una aceleracion constante igual a la gravedad, siempre hacia abajo.",
    charCount: 90,
    page: null,
    embedding: null,
  },
];
const fileNameById = new Map([["file-1", "Resumen tiro vertical.txt"]]);

describe("chat-assistant heuristic mode", () => {
  it("cites the source file when relevant content is found", () => {
    const context = retrieveChatContext(chunks, fileNameById, "¿Qué aceleración tiene el tiro vertical?");
    const answer = buildHeuristicChatAnswer(context, "aceleracion tiro vertical", "explicame");
    expect(answer.sources.length).toBeGreaterThan(0);
    expect(answer.sources[0]?.fileName).toBe("Resumen tiro vertical.txt");
    expect(answer.content).toContain("Resumen tiro vertical.txt");
  });

  it("admits when there is not enough information instead of inventing an answer", () => {
    const context = retrieveChatContext(chunks, fileNameById, "¿Cuál es la capital de Francia?");
    const answer = buildHeuristicChatAnswer(context, "capital de Francia", "explicame");
    expect(answer.sources).toEqual([]);
    expect(answer.content.toLowerCase()).toContain("no encontre informacion");
  });
});
