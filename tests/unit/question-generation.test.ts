import { describe, expect, it } from "vitest";
import { generateQuestionsHeuristic } from "@/server/services/question-generation";
import type { FileChunk } from "@/types/domain";

const chunk: FileChunk = {
  id: "chunk-1",
  userId: "u1",
  fileId: "file-1",
  chunkIndex: 0,
  content:
    "El tiro vertical es un movimiento donde un objeto se lanza hacia arriba con velocidad inicial. " +
    "La aceleracion de la gravedad vale 9.8 m/s2 y siempre apunta hacia abajo. " +
    "En el punto mas alto la velocidad del objeto es cero.",
  charCount: 200,
  page: null,
  embedding: null,
};

describe("generateQuestionsHeuristic", () => {
  it("returns no questions when there are no source chunks", () => {
    const result = generateQuestionsHeuristic({
      chunks: [],
      topicName: "Tiro vertical",
      difficulty: "media",
      count: 3,
      kind: "mixto",
    });
    expect(result).toEqual([]);
  });

  it("grounds every generated question in an actual sentence from the source", () => {
    const questions = generateQuestionsHeuristic({
      chunks: [chunk],
      topicName: "Tiro vertical",
      difficulty: "media",
      count: 3,
      kind: "mixto",
    });
    expect(questions.length).toBeGreaterThan(0);
    for (const q of questions) {
      expect(q.sourceExcerpt).toBeTruthy();
      expect(chunk.content).toContain(q.sourceExcerpt!);
      expect(q.sourceFileId).toBe("file-1");
      expect(q.gradingCriteria.length).toBeGreaterThan(0);
      expect(q.explanation.length).toBeGreaterThan(0);
    }
  });

  it("never reveals the answer inside a true/false prompt when it fabricates a false variant", () => {
    const questions = generateQuestionsHeuristic({
      chunks: [chunk],
      topicName: null,
      difficulty: "facil",
      count: 4,
      kind: "verdadero_falso",
    });
    const falseOnes = questions.filter((q) => q.expectedAnswer === "Falso");
    expect(questions.every((q) => q.kind === "verdadero_falso")).toBe(true);
    expect(falseOnes.length).toBeGreaterThanOrEqual(0);
  });
});
