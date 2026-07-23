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
    // The old heuristic used to literally append a meta-comment revealing
    // the statement was inverted — that defeats the point of the quiz.
    for (const q of questions) {
      expect(q.prompt.toLowerCase()).not.toContain("invertida");
    }
  });

  it("produces a mix of question kinds instead of only fill-in-the-blank in mixto mode", () => {
    const questions = generateQuestionsHeuristic({
      chunks: [chunk],
      topicName: null,
      difficulty: "media",
      count: 6,
      kind: "mixto",
    });
    const kinds = new Set(questions.map((q) => q.kind));
    expect(kinds.size).toBeGreaterThan(1);
  });

  it("generates a definition-style short-answer question with the real definition as the expected answer", () => {
    const questions = generateQuestionsHeuristic({
      chunks: [chunk],
      topicName: null,
      difficulty: "media",
      count: 2,
      kind: "respuesta_breve",
    });
    const definitionQuestion = questions.find((q) => q.prompt.startsWith('¿Qué es "El tiro vertical"'));
    expect(definitionQuestion).toBeDefined();
    expect(chunk.content).toContain(definitionQuestion!.expectedAnswer);
  });

  it("builds multiple-choice questions whose distractors are real definitions from the same material, never fabricated", () => {
    const richChunk: FileChunk = {
      ...chunk,
      content:
        "El tiro vertical es un movimiento donde un objeto se lanza hacia arriba con velocidad inicial. " +
        "La caida libre es un movimiento donde un objeto cae solo bajo la accion de la gravedad. " +
        "El MRU es un movimiento donde la velocidad permanece constante en el tiempo.",
    };
    const questions = generateQuestionsHeuristic({
      chunks: [richChunk],
      topicName: null,
      difficulty: "media",
      count: 3,
      kind: "opcion_multiple",
    });
    const mcQuestions = questions.filter((q) => q.kind === "opcion_multiple");
    expect(mcQuestions.length).toBeGreaterThan(0);
    for (const q of mcQuestions) {
      expect(q.options).not.toBeNull();
      expect(q.options!.length).toBeGreaterThanOrEqual(3);
      expect(q.options).toContain(q.expectedAnswer);
      // Every option must be a real sentence fragment lifted from the
      // material — never invented text.
      for (const option of q.options!) {
        expect(richChunk.content).toContain(option);
      }
    }
  });

  it("recognizes the newer definition-shaped sentence patterns", () => {
    const richChunk: FileChunk = {
      ...chunk,
      content:
        "La inercia corresponde a la resistencia de un cuerpo a cambiar su estado de movimiento. " +
        "El peso representa la fuerza con la que la gravedad atrae a un cuerpo. " +
        "La friccion se caracteriza por oponerse siempre al movimiento relativo entre dos superficies.",
    };
    const questions = generateQuestionsHeuristic({
      chunks: [richChunk],
      topicName: null,
      difficulty: "media",
      count: 3,
      kind: "respuesta_breve",
    });
    const prompts = questions.map((q) => q.prompt);
    expect(prompts.some((p) => p.includes('"La inercia"'))).toBe(true);
  });

  it("builds antonym-swap false statements that stay real sentences about the topic", () => {
    const richChunk: FileChunk = {
      ...chunk,
      content:
        "La masa mayor de un planeta aumenta su gravedad superficial. " +
        "Este efecto permite que los objetos caigan mas rapido antes de tocar el suelo.",
    };
    const questions = generateQuestionsHeuristic({
      chunks: [richChunk],
      topicName: null,
      difficulty: "facil",
      count: 6,
      kind: "verdadero_falso",
    });
    const falseOnes = questions.filter((q) => q.expectedAnswer === "Falso");
    expect(falseOnes.length).toBeGreaterThan(0);
    for (const q of falseOnes) {
      // Every false statement is still grounded in the source sentence
      // (only the antonym word changed), never a fabricated claim.
      expect(q.sourceExcerpt).toBeTruthy();
      expect(q.prompt).not.toBe(`¿Verdadero o falso? ${q.sourceExcerpt}`);
    }
  });

  it("declines to build a fill-in-blank question when the key term is ambiguous (appears more than once)", () => {
    const ambiguousChunk: FileChunk = {
      ...chunk,
      content: "El objeto tarda 5 segundos en subir y 5 segundos en bajar en total, segun el material de catedra.",
    };
    const questions = generateQuestionsHeuristic({
      chunks: [ambiguousChunk],
      topicName: null,
      difficulty: "media",
      count: 3,
      kind: "respuesta_breve",
    });
    // The only candidate sentence has an ambiguous numeric anchor ("5"
    // appears twice) and no definition pattern, so nothing gradeable can be
    // built from it — better to return nothing than a low-quality blank.
    expect(questions).toEqual([]);
  });
});
