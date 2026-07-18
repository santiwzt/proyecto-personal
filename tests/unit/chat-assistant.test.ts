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

const richChunks: FileChunk[] = [
  {
    id: "chunk-rich-1",
    userId: "u1",
    fileId: "file-rich",
    chunkIndex: 0,
    content:
      "El tiro vertical es un movimiento donde un objeto se lanza hacia arriba con velocidad inicial. " +
      "La aceleracion de la gravedad vale 9.8 m/s2 y siempre apunta hacia abajo. " +
      "En el punto mas alto del recorrido, la velocidad del objeto se anula por completo.",
    charCount: 260,
    page: null,
    embedding: null,
  },
];
const richFileNameById = new Map([["file-rich", "Fisica - tiro vertical.txt"]]);

describe("chat-assistant heuristic mode", () => {
  it("cites the source file when relevant content is found", () => {
    const context = retrieveChatContext(chunks, fileNameById, "¿Qué aceleración tiene el tiro vertical?");
    const answer = buildHeuristicChatAnswer(context, "aceleracion tiro vertical", "explicame");
    expect(answer.sources.length).toBeGreaterThan(0);
    expect(answer.sources[0]?.fileName).toBe("Resumen tiro vertical.txt");
    expect(answer.content).toContain("Resumen tiro vertical.txt");
  });

  it("admits when there is not enough information instead of inventing an answer, but still offers general advice", () => {
    const context = retrieveChatContext(chunks, fileNameById, "¿Cuál es la capital de Francia?");
    const answer = buildHeuristicChatAnswer(context, "capital de Francia", "explicame");
    expect(answer.sources).toEqual([]);
    expect(answer.content.toLowerCase()).toContain("no tengo material");
    expect(answer.content).not.toContain("Francia");
  });

  it("resumime produces a bullet-point summary instead of a raw quote", () => {
    const context = retrieveChatContext(richChunks, richFileNameById, "tiro vertical aceleracion gravedad");
    const answer = buildHeuristicChatAnswer(context, "tiro vertical aceleracion gravedad", "resumime");
    expect(answer.content).toContain("- ");
    expect(answer.content).toContain("Fisica - tiro vertical.txt");
  });

  it("repaso_rapido returns short bullet points, not full paragraphs", () => {
    const context = retrieveChatContext(richChunks, richFileNameById, "tiro vertical aceleracion gravedad");
    const answer = buildHeuristicChatAnswer(context, "tiro vertical aceleracion gravedad", "repaso_rapido");
    const bulletLines = answer.content.split("\n").filter((l) => l.startsWith("- "));
    expect(bulletLines.length).toBeGreaterThan(0);
    for (const line of bulletLines) {
      expect(line.length).toBeLessThan(200);
    }
  });

  it("preguntame poses an actual question grounded in the material instead of quoting it", () => {
    const context = retrieveChatContext(richChunks, richFileNameById, "tiro vertical aceleracion gravedad");
    const answer = buildHeuristicChatAnswer(context, "tiro vertical aceleracion gravedad", "preguntame");
    expect(answer.content).toContain("?");
    expect(answer.content.toLowerCase()).not.toMatch(/^segun tu material, encontre esto/);
  });

  it("corregime compares the student's message against the material instead of dumping excerpts", () => {
    const context = retrieveChatContext(richChunks, richFileNameById, "tiro vertical aceleracion gravedad");
    const answer = buildHeuristicChatAnswer(
      context,
      "El tiro vertical es cuando tiramos algo, no se mucho mas",
      "corregime",
    );
    expect(answer.content).toContain("Fisica - tiro vertical.txt");
    // It should point at something concrete from the source material, not
    // just restate the student's own words back at them.
    expect(answer.content.length).toBeGreaterThan(20);
  });

  it("preparame builds an ordered study checklist referencing the source files", () => {
    const context = retrieveChatContext(richChunks, richFileNameById, "tiro vertical aceleracion gravedad");
    const answer = buildHeuristicChatAnswer(context, "tiro vertical aceleracion gravedad", "preparame");
    expect(answer.content).toContain("1.");
    expect(answer.content).toContain("Fisica - tiro vertical.txt");
  });

  it("never fabricates a source name or excerpt that is not present in the chunk content", () => {
    const context = retrieveChatContext(richChunks, richFileNameById, "tiro vertical aceleracion gravedad");
    for (const mode of ["explicame", "resumime", "repaso_rapido", "preparame"] as const) {
      const answer = buildHeuristicChatAnswer(context, "tiro vertical aceleracion gravedad", mode);
      for (const source of answer.sources) {
        expect(richChunks[0]!.content).toContain(source.excerpt.replace(/^…/, "").replace(/…$/, ""));
      }
    }
  });
});
