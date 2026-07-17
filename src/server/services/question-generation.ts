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

export type NewQuestion = Omit<PracticeQuestion, "id" | "setId">;

function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 30 && s.length <= 260);
}

interface KeyTermMatch {
  /** The concept/subject the question should test. */
  term: string;
  /** The rest of the sentence describing `term`, when the sentence is a
   * definition-shaped statement ("X es/son/se define como Y..."). Null when
   * the only usable anchor is a bare number. */
  definition: string | null;
}

const DEFINITION_PATTERNS: RegExp[] = [
  /^([A-ZÁÉÍÓÚÑ][\wÁÉÍÓÚÑáéíóúñ\s]{2,40}?)\s+(?:es|son)\s+/,
  /^([A-ZÁÉÍÓÚÑ][\wÁÉÍÓÚÑáéíóúñ\s]{2,40}?)\s+se\s+(?:define|denomina|llama)\s+(?:como\s+)?/,
  /^([A-ZÁÉÍÓÚÑ][\wÁÉÍÓÚÑáéíóúñ\s]{2,40}?)\s+consiste\s+en\s+/,
  /^([A-ZÁÉÍÓÚÑ][\wÁÉÍÓÚÑáéíóúñ\s]{2,40}?)\s+significa\s+/,
];

const NUMBER_WITH_UNIT =
  /-?\d+(?:[.,]\d+)?\s*(?:m\/s2?|m\/s|km\/h|kg|km|cm|mm|g|l|ml|%|°c|grados?|años?|hs|horas?|min|minutos?)?/i;

/**
 * Finds the concept a question should be built around. Prefers the subject
 * of a definition-shaped sentence ("X es/son/se define como Y") — which
 * also yields `definition`, enabling short-answer and multiple-choice
 * questions, not just fill-in-the-blank. Falls back to a bare number when
 * no definition pattern matches.
 */
function findKeyTerm(sentence: string): KeyTermMatch | null {
  for (const pattern of DEFINITION_PATTERNS) {
    const match = sentence.match(pattern);
    if (!match) continue;
    const term = match[1]!.trim();
    const rest = sentence.slice(match[0].length).trim().replace(/[.!?]+$/, "");
    return { term, definition: rest.length >= 8 ? rest : null };
  }
  const numberMatch = sentence.match(NUMBER_WITH_UNIT);
  return numberMatch ? { term: numberMatch[0].trim(), definition: null } : null;
}

function countOccurrences(haystack: string, needle: string): number {
  if (!needle) return 0;
  return haystack.split(needle).length - 1;
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

function buildDefinitionQuestion(term: string, definition: string, sentence: string, source: FileChunk): NewQuestion {
  return {
    kind: "respuesta_breve",
    difficulty: "media",
    prompt: `¿Qué es "${term}"? Explicalo con tus palabras a partir de lo que dice tu material.`,
    options: null,
    expectedAnswer: definition,
    gradingCriteria: [`Debe explicar que ${term} ${definition}.`],
    explanation: sentence,
    commonMistakes: ["Confundir esta definicion con la de otro concepto del mismo material."],
    sourceFileId: source.fileId,
    sourceExcerpt: sentence,
  };
}

function stableHash(text: string): number {
  let hash = 0;
  for (let i = 0; i < text.length; i++) hash = (hash * 31 + text.charCodeAt(i)) >>> 0;
  return hash;
}

/** Deterministic "shuffle" (rotation seeded by the term) so the correct
 * option doesn't always land in the same position, without using Math.random
 * — same input always produces the same option order. */
function deterministicRotate<T>(items: T[], seed: string): T[] {
  if (items.length <= 1) return items;
  const rotation = stableHash(seed) % items.length;
  return [...items.slice(rotation), ...items.slice(0, rotation)];
}

/**
 * Multiple-choice question whose distractors are real definitions of OTHER
 * concepts found elsewhere in the same material — never invented text.
 * Returns null when the material doesn't contain enough other definitions
 * to build plausible distractors (caller should fall back to another kind).
 */
function buildMultipleChoice(
  term: string,
  definition: string,
  distractorDefinitions: string[],
  sentence: string,
  source: FileChunk,
): NewQuestion | null {
  const uniqueDistractors = Array.from(new Set(distractorDefinitions.filter((d) => d !== definition))).slice(0, 3);
  if (uniqueDistractors.length < 2) return null;
  const options = deterministicRotate([definition, ...uniqueDistractors], term);
  return {
    kind: "opcion_multiple",
    difficulty: "media",
    prompt: `¿Qué es "${term}"?`,
    options,
    expectedAnswer: definition,
    gradingCriteria: [`La opcion correcta es: "${definition}".`],
    explanation: sentence,
    commonMistakes: ["Elegir la definicion de otro concepto parecido del mismo material."],
    sourceFileId: source.fileId,
    sourceExcerpt: sentence,
  };
}

/** Turns an affirmative statement into a real negation ("es" -> "no es",
 * "siempre" -> "nunca", etc.) instead of appending a meta-comment that would
 * literally tell the student the statement is false. Returns null when no
 * negatable pattern is found, so the caller can skip this candidate rather
 * than fabricate a giveaway. */
function negateSentence(sentence: string): string | null {
  const patterns: [RegExp, string][] = [
    [/\bsiempre\b/i, "nunca"],
    [/\bnunca\b/i, "siempre"],
    [/\btodos\b/i, "ningunos"],
    [/\btodas\b/i, "ningunas"],
    [/\bes\b/, "no es"],
    [/\bson\b/, "no son"],
    [/\btiene\b/, "no tiene"],
    [/\btienen\b/, "no tienen"],
    [/\bhay\b/, "no hay"],
    [/\bpuede\b/, "no puede"],
    [/\bpueden\b/, "no pueden"],
    [/\bexiste\b/, "no existe"],
    [/\bexisten\b/, "no existen"],
  ];
  for (const [pattern, replacement] of patterns) {
    if (pattern.test(sentence)) return sentence.replace(pattern, replacement);
  }
  return null;
}

/**
 * Builds a verdadero/falso question. When `makeFalse` is true, prefers
 * altering a numeric fact (most reliable) and falls back to grammatically
 * negating the sentence; returns null (rather than an obviously-fake
 * placeholder statement) when neither is possible, so the caller can try a
 * different candidate instead of shipping a low-quality question.
 */
function buildTrueFalse(sentence: string, source: FileChunk, makeFalse: boolean): NewQuestion | null {
  if (!makeFalse) {
    return {
      kind: "verdadero_falso",
      difficulty: "facil",
      prompt: `¿Verdadero o falso? ${sentence}`,
      options: ["Verdadero", "Falso"],
      expectedAnswer: "Verdadero",
      gradingCriteria: ["La afirmacion es verdadera tal como aparece en el material fuente."],
      explanation: sentence,
      commonMistakes: ["Dudar de una afirmacion que el material confirma explicitamente."],
      sourceFileId: source.fileId,
      sourceExcerpt: sentence,
    };
  }

  const numberMatch = sentence.match(/\d+(?:[.,]\d+)?/);
  let prompt: string;
  if (numberMatch) {
    const original = numberMatch[0];
    const altered = String(Math.round(Number(original.replace(",", ".")) * 1.5 + 1));
    prompt = sentence.replace(original, altered);
  } else {
    const negated = negateSentence(sentence);
    if (!negated) return null;
    prompt = negated;
  }

  return {
    kind: "verdadero_falso",
    difficulty: "facil",
    prompt: `¿Verdadero o falso? ${prompt}`,
    options: ["Verdadero", "Falso"],
    expectedAnswer: "Falso",
    gradingCriteria: [`El material fuente dice: "${sentence}"`],
    explanation: sentence,
    commonMistakes: ["No prestar atencion a los valores o terminos exactos del enunciado."],
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

  // Every definition-shaped sentence anywhere in the material, used as a
  // pool of REAL (never fabricated) multiple-choice distractors.
  const definitionPool: { term: string; definition: string; sentence: string }[] = [];
  for (const candidate of candidates) {
    const match = findKeyTerm(candidate.sentence);
    if (match?.definition) {
      definitionPool.push({ term: match.term, definition: match.definition, sentence: candidate.sentence });
    }
  }

  const questions: NewQuestion[] = [];
  const maxAttempts = candidates.length * 4 + 10;

  let cursor = 0;
  let variety = 0;
  while (questions.length < request.count && cursor < maxAttempts) {
    const candidate = candidates[cursor % candidates.length]!;
    cursor += 1;

    const roll = variety % 3;
    const wantsTrueFalse = request.kind === "verdadero_falso" || (request.kind === "mixto" && roll === 0);

    if (wantsTrueFalse) {
      const falseSoFar = questions.filter((q) => q.kind === "verdadero_falso" && q.expectedAnswer === "Falso").length;
      const trueSoFar = questions.filter((q) => q.kind === "verdadero_falso" && q.expectedAnswer === "Verdadero").length;
      const makeFalse = falseSoFar <= trueSoFar;
      const question =
        buildTrueFalse(candidate.sentence, candidate.source, makeFalse) ??
        buildTrueFalse(candidate.sentence, candidate.source, !makeFalse);
      if (!question) continue;
      questions.push(question);
      variety += 1;
      continue;
    }

    const match = findKeyTerm(candidate.sentence);
    if (!match) continue;

    const wantsMultipleChoice = request.kind === "opcion_multiple" || (request.kind === "mixto" && roll === 1);
    if (wantsMultipleChoice && match.definition) {
      const distractors = definitionPool
        .filter((d) => d.term !== match.term)
        .map((d) => d.definition);
      const mcQuestion = buildMultipleChoice(match.term, match.definition, distractors, candidate.sentence, candidate.source);
      if (mcQuestion) {
        questions.push(mcQuestion);
        variety += 1;
        continue;
      }
      // Not enough real distractors in this material — fall through below.
    }

    if (match.definition && variety % 2 === 0) {
      questions.push(buildDefinitionQuestion(match.term, match.definition, candidate.sentence, candidate.source));
      variety += 1;
      continue;
    }

    // A blank is only a fair question if the term appears exactly once —
    // otherwise the answer stays visible elsewhere in the blanked sentence.
    if (countOccurrences(candidate.sentence, match.term) > 1) continue;
    questions.push(buildFillInBlank(candidate.sentence, match.term, candidate.source));
    variety += 1;
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
