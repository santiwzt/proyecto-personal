import { describe, expect, it } from "vitest";
import { gradeAnswerHeuristic } from "@/server/services/grading";
import type { PracticeQuestion } from "@/types/domain";

const trueFalseQuestion: PracticeQuestion = {
  id: "q1",
  setId: "set1",
  kind: "verdadero_falso",
  difficulty: "facil",
  prompt: "¿Verdadero o falso? La aceleracion en el punto mas alto es cero.",
  options: ["Verdadero", "Falso"],
  expectedAnswer: "Falso",
  gradingCriteria: ["La aceleracion sigue siendo g, nunca es cero."],
  explanation: "La gravedad actua durante todo el movimiento.",
  commonMistakes: ["Creer que la aceleracion se anula"],
  sourceFileId: "file-1",
  sourceExcerpt: "excerpt",
};

const shortAnswerQuestion: PracticeQuestion = {
  id: "q2",
  setId: "set1",
  kind: "respuesta_breve",
  difficulty: "media",
  prompt: "¿Por que la velocidad es cero en el punto mas alto?",
  options: null,
  expectedAnswer: "Porque el objeto cambia de sentido de subida a bajada",
  gradingCriteria: ["Debe mencionar el cambio de sentido del movimiento"],
  explanation: "Es el instante de transicion entre subir y bajar.",
  commonMistakes: ["Confundir velocidad con aceleracion"],
  sourceFileId: "file-1",
  sourceExcerpt: "excerpt",
};

describe("gradeAnswerHeuristic — verdadero/falso", () => {
  it("marks a correct true/false answer as correct", () => {
    const result = gradeAnswerHeuristic(trueFalseQuestion, "Falso");
    expect(result.isCorrect).toBe(true);
  });

  it("marks an incorrect true/false answer as incorrect with a hint", () => {
    const result = gradeAnswerHeuristic(trueFalseQuestion, "Verdadero");
    expect(result.isCorrect).toBe(false);
    expect(result.firstErrorHint).toBeTruthy();
  });

  it("asks for clarification when the answer is not verdadero/falso", () => {
    const result = gradeAnswerHeuristic(trueFalseQuestion, "no se");
    expect(result.isCorrect).toBe(false);
  });
});

describe("gradeAnswerHeuristic — respuesta breve", () => {
  it("accepts an answer that covers the key concept even with different wording", () => {
    const result = gradeAnswerHeuristic(
      shortAnswerQuestion,
      "Porque en ese instante el movimiento cambia de sentido, deja de subir y empieza a bajar",
    );
    expect(result.isCorrect).toBe(true);
  });

  it("rejects an answer that misses the key concept entirely", () => {
    const result = gradeAnswerHeuristic(shortAnswerQuestion, "No tengo idea");
    expect(result.isCorrect).toBe(false);
    expect(result.firstErrorHint).toBeTruthy();
  });
});
