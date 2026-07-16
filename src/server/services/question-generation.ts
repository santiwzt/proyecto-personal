import { isAiConfigured } from "@/config/env";
import { getAiProvider } from "@/lib/ai/provider";
import type { FileChunk, PracticeQuestion, QuestionDifficulty, QuestionKind } from "@/types/domain";
import { z } from "zod";

/**
 * Question generation with a real, deterministic heuristic fallback (no
 * fabricated answers — every question is grounded in an actual sentence
 * from the source material) and an optional AI-enhanced path.
 */

export interface GenerateQuestionsRequest {
  chunks: FileChunk[];
  topicName: string | null;
  difficulty: QuestionDifficulty;
  count: number;
  kind: QuestionKind | "mixto";
}

type NewQuestion = Omit<PracticeQuestion, "id" | "setId">;

function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 30 && s.length <= 260);
}

function findKeyTerm(sentence: string): string | null {
  // Prefer the subject of an "X es/son Y" definition sentence.
  const definitionMatch = sentence.match(/^([A-ZÁÉÍÓÚÑ][\wÁÉÍÓÚÑáéíóúñ\s]{2,40}?)\s+(es|son)\s+/);
  if (definitionMatch) return definitionMatch[1]!.trim();
  // Otherwise pick the longest capitalized-or-numeric token as a stand-in.
  const numberMatch = sentence.match(/-?\d+(?:[.,]\d+)?\s*(?:m\/s2?|m|kg|s|%)?/);
  return numberMatch ? numberMatch[0] : null;
}

function buildFillInBlank(sentence: string, keyTerm: string, source: FileChunk): NewQuestion {
  const blanked = sentence.replace(keyTerm, "____");
  return {
    kind: "respuesta_breve",
    difficulty: "media",
    prompt: `Completa el espacio en blanco: "${blanked}"`,
    options: null,
    expectedAnswer: keyTerm,
    gradingCriteria: [`Debe mencionar "${keyTerm}" o un sinonimo equivalente.`],
    explanation: sentence,
    commonMistakes: ["Confundir este concepto con otro mencionado en el mismo material."],
    sourceFileId: source.fileId,
    sourceExcerpt: sentence,
  };
}

function buildTrueFalse(sentence: string, source: FileChunk, makeFalse: boolean): NewQuestion {
  let prompt = sentence;
  let expectedAnswer = "Verdadero";
  if (makeFalse) {
    const numberMatch = sentence.match(/\d+(?:[.,]\d+)?/);
    if (numberMatch) {
      const original = numberMatch[0];
      const altered = String(Math.round(Number(original.replace(",", ".")) * 1.5 + 1));
      prompt = sentence.replace(original, altered);
      expectedAnswer = "Falso";
    } else {
      prompt = `${sentence} (afirmacion invertida para esta practica)`;
      expectedAnswer = "Falso";
    }
  }
  return {
    kind: "verdadero_falso",
    difficulty: "facil",
    prompt: `¿Verdadero o falso? ${prompt}`,
    options: ["Verdadero", "Falso"],
    expectedAnswer,
    gradingCriteria: [`La respuesta correcta es "${expectedAnswer}", segun el material fuente.`],
    explanation: sentence,
    commonMistakes: ["No prestar atencion a los valores numericos exactos del enunciado."],
    sourceFileId: source.fileId,
    sourceExcerpt: sentence,
  };
}

export function generateQuestionsHeuristic(request: GenerateQuestionsRequest): NewQuestion[] {
  const candidates: { sentence: string; source: FileChunk }[] = [];
  for (const chunk of request.chunks) {
    for (const sentence of splitSentences(chunk.content)) {
      candidates.push({ sentence, source: chunk });
    }
  }
  if (candidates.length === 0) return [];

  const questions: NewQuestion[] = [];
  let cursor = 0;
  let falseToggle = false;
  while (questions.length < request.count && cursor < candidates.length * 2) {
    const candidate = candidates[cursor % candidates.length]!;
    cursor += 1;
    const wantsTrueFalse =
      request.kind === "verdadero_falso" || (request.kind === "mixto" && questions.length % 2 === 0);

    if (wantsTrueFalse) {
      questions.push(buildTrueFalse(candidate.sentence, candidate.source, falseToggle));
      falseToggle = !falseToggle;
      continue;
    }

    const keyTerm = findKeyTerm(candidate.sentence);
    if (!keyTerm) continue;
    questions.push(buildFillInBlank(candidate.sentence, keyTerm, candidate.source));
  }
  return questions;
}

const aiQuestionSchema = z.object({
  questions: z
    .array(
      z.object({
        kind: z.enum(["opcion_multiple", "verdadero_falso", "respuesta_breve", "desarrollo", "ejercicio_paso_a_paso"]),
        prompt: z.string().min(5),
        options: z.array(z.string()).nullable(),
        expectedAnswer: z.string().min(1),
        gradingCriteria: z.array(z.string()).min(1),
        explanation: z.string().min(5),
        commonMistakes: z.array(z.string()),
        sourceExcerpt: z.string().min(1),
      }),
    )
    .min(1),
});

export async function generateQuestions(request: GenerateQuestionsRequest): Promise<{
  questions: NewQuestion[];
  generatedBy: "ia" | "heuristico";
}> {
  if (!isAiConfigured || request.chunks.length === 0) {
    return { questions: generateQuestionsHeuristic(request), generatedBy: "heuristico" };
  }

  try {
    const provider = await getAiProvider();
    const context = request.chunks.map((c, i) => `[Fragmento ${i + 1}] ${c.content}`).join("\n\n");
    const { data } = await provider.generateStructured({
      system:
        "Sos un generador de preguntas de estudio para un estudiante secundario argentino. " +
        "Basate UNICAMENTE en el material provisto, nunca inventes datos que no esten en el texto. " +
        "Respondes exclusivamente con JSON valido, sin texto adicional.",
      prompt:
        `Genera ${request.count} preguntas de tipo "${request.kind}" y dificultad "${request.difficulty}" ` +
        `${request.topicName ? `sobre el tema "${request.topicName}" ` : ""}` +
        `usando este material:\n\n${context}\n\n` +
        `Responde con un JSON con la forma { "questions": [{ "kind", "prompt", "options", "expectedAnswer", ` +
        `"gradingCriteria", "explanation", "commonMistakes", "sourceExcerpt" }] }. "sourceExcerpt" debe ser una ` +
        `cita textual del material provisto.`,
      maxTokens: 2048,
      parse: (raw) => aiQuestionSchema.parse(JSON.parse(raw)),
    });

    const questions: NewQuestion[] = data.questions.map((q) => ({
      kind: q.kind,
      difficulty: request.difficulty,
      prompt: q.prompt,
      options: q.options,
      expectedAnswer: q.expectedAnswer,
      gradingCriteria: q.gradingCriteria,
      explanation: q.explanation,
      commonMistakes: q.commonMistakes,
      sourceFileId: request.chunks[0]?.fileId ?? null,
      sourceExcerpt: q.sourceExcerpt,
    }));
    return { questions, generatedBy: "ia" };
  } catch (error) {
    console.error("AI question generation failed, falling back to heuristic:", error);
    return { questions: generateQuestionsHeuristic(request), generatedBy: "heuristico" };
  }
}
