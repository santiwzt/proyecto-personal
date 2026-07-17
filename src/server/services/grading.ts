import { z } from "zod";
import { isAiConfigured } from "@/config/env";
import { getAiProvider } from "@/lib/ai/provider";
import type { PracticeQuestion } from "@/types/domain";

export interface GradingResult {
  isCorrect: boolean;
  feedback: string;
  firstErrorHint: string | null;
  gradedBy: "ia" | "heuristico";
}

const SPANISH_STOPWORDS = new Set([
  "el", "la", "los", "las", "un", "una", "de", "del", "en", "y", "o", "que", "es",
  "son", "para", "por", "con", "sin", "se", "su", "al", "lo", "como", "mas",
  // Instructional filler words that show up in gradingCriteria phrasing
  // ("Debe mencionar...", "No debe decir...") but aren't part of the concept
  // being tested — excluding them keeps the overlap score about content.
  "debe", "deben", "mencionar", "decir", "debes", "indicar",
]);

/**
 * A small, deliberately conservative synonym table for common Spanish
 * academic phrasing. This does NOT try to be a general thesaurus — it only
 * collapses a handful of everyday synonym pairs to their canonical form
 * ("incrementa"/"sube"/"aumenta" all become "aumenta") so the concept-overlap
 * check keeps scoring concepts, not exact word choice, per
 * docs/decisions/0005-heuristic-grading-limitations.md.
 */
const SYNONYM_CANONICAL: Record<string, string> = {
  incrementa: "aumenta",
  incrementar: "aumenta",
  incremento: "aumenta",
  sube: "aumenta",
  subir: "aumenta",
  crece: "aumenta",
  crecer: "aumenta",
  decrece: "disminuye",
  decrecer: "disminuye",
  reduce: "disminuye",
  reducir: "disminuye",
  baja: "disminuye",
  bajar: "disminuye",
  cae: "disminuye",
  explica: "describe",
  explicar: "describe",
  origina: "causa",
  originar: "causa",
  provoca: "causa",
  provocar: "causa",
  genera: "causa",
  generar: "causa",
  produce: "causa",
  producir: "causa",
  comienza: "inicia",
  empieza: "inicia",
  finaliza: "termina",
  concluye: "termina",
};

function canonicalTerm(term: string): string {
  return SYNONYM_CANONICAL[term] ?? term;
}

function significantTerms(text: string): Set<string> {
  return new Set(
    text
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((t) => t.length >= 3 && !SPANISH_STOPWORDS.has(t))
      .map(canonicalTerm),
  );
}

function overlapRatio(answer: Set<string>, expected: Set<string>): number {
  if (expected.size === 0) return 0;
  let matches = 0;
  for (const term of expected) if (answer.has(term)) matches += 1;
  return matches / expected.size;
}

/** Picks the gradingCriteria entry the answer covers worst, rather than the
 * first one under a fixed threshold — a more precise "here's the gap"
 * signal when several criteria are only partially covered. */
function weakestCriterion(answerTerms: Set<string>, criteria: string[]): { criterion: string; ratio: number } | null {
  if (criteria.length === 0) return null;
  let weakest: { criterion: string; ratio: number } | null = null;
  for (const criterion of criteria) {
    const ratio = overlapRatio(answerTerms, significantTerms(criterion));
    if (!weakest || ratio < weakest.ratio) weakest = { criterion, ratio };
  }
  return weakest;
}

/**
 * Deterministic grading: keyword/criteria overlap against the question's
 * declared gradingCriteria. Simpler than true procedural evaluation (see
 * docs/decisions/0005-heuristic-grading-limitations.md) but never punishes
 * pure wording differences by design — it looks at concepts, not phrasing.
 */
export function gradeAnswerHeuristic(question: PracticeQuestion, answerText: string): GradingResult {
  if (question.kind === "verdadero_falso") {
    const normalized = answerText.trim().toLowerCase();
    const saidTrue = /^(verdadero|si|sí|true|v)$/i.test(normalized);
    const saidFalse = /^(falso|no|false|f)$/i.test(normalized);
    const expectedTrue = question.expectedAnswer.toLowerCase() === "verdadero";
    if (!saidTrue && !saidFalse) {
      return {
        isCorrect: false,
        feedback: 'Respondé "Verdadero" o "Falso".',
        firstErrorHint: null,
        gradedBy: "heuristico",
      };
    }
    const isCorrect = saidTrue === expectedTrue;
    return {
      isCorrect,
      feedback: isCorrect
        ? "¡Correcto!"
        : `No es correcto. ${question.explanation}`,
      firstErrorHint: isCorrect ? null : question.gradingCriteria[0] ?? null,
      gradedBy: "heuristico",
    };
  }

  const trimmedAnswer = answerText.trim();
  if (trimmedAnswer.length === 0) {
    return {
      isCorrect: false,
      feedback: "No escribiste una respuesta todavia.",
      firstErrorHint: question.gradingCriteria[0] ?? null,
      gradedBy: "heuristico",
    };
  }

  const answerTerms = significantTerms(answerText);
  const criteriaTerms = significantTerms(
    [question.expectedAnswer, ...question.gradingCriteria].join(" "),
  );
  const ratio = overlapRatio(answerTerms, criteriaTerms);
  const isCorrect = ratio >= 0.4;
  const gap = weakestCriterion(answerTerms, question.gradingCriteria);
  const missingCriterion = gap?.criterion ?? question.gradingCriteria[0] ?? null;

  let feedback: string;
  if (isCorrect && ratio >= 0.8) {
    feedback = "Tu respuesta cubre los puntos clave esperados.";
  } else if (isCorrect) {
    // Passed the threshold but there's still a partially-covered criterion
    // worth calling out — partial credit in tone, not just pass/fail.
    feedback =
      gap && gap.ratio < 0.6
        ? `Tu respuesta esta encaminada y cubre lo principal, pero podrias profundizar: ${gap.criterion}.`
        : "Tu respuesta cubre los puntos clave esperados.";
  } else if (ratio > 0) {
    feedback = `Vas por buen camino, pero te falta cubrir: ${missingCriterion ?? "un aspecto importante"}.`;
  } else {
    feedback = `No encuentro relacion con los puntos clave esperados. Repasa: ${missingCriterion ?? "el material de la pregunta"}.`;
  }

  return {
    isCorrect,
    feedback,
    firstErrorHint: isCorrect ? null : missingCriterion,
    gradedBy: "heuristico",
  };
}

const aiGradingSchema = z.object({
  isCorrect: z.boolean(),
  feedback: z.string().min(1),
  firstErrorHint: z.string().nullable(),
});

export async function gradeAnswer(question: PracticeQuestion, answerText: string): Promise<GradingResult> {
  if (!isAiConfigured) {
    return gradeAnswerHeuristic(question, answerText);
  }

  try {
    const provider = await getAiProvider();
    const { data } = await provider.generateStructured({
      system:
        "Sos un corrector pedagogico para un estudiante secundario argentino. Evaluas la respuesta contra " +
        "criterios explicitos, marcas el primer error importante, das una pista (no la solucion completa) y " +
        "nunca penalizas diferencias de redaccion cuando el concepto es correcto. Para fisica/matematica, " +
        "evaluas el procedimiento, no solo el resultado final: un resultado correcto por casualidad con un " +
        "procedimiento inconsistente NO es correcto. Respondes solo con JSON valido.",
      prompt:
        `Pregunta: ${question.prompt}\n` +
        `Respuesta esperada: ${question.expectedAnswer}\n` +
        `Criterios de correccion: ${question.gradingCriteria.join(" | ")}\n` +
        `Errores habituales: ${question.commonMistakes.join(" | ")}\n` +
        `Respuesta del estudiante: ${answerText}\n\n` +
        `Responde con JSON: { "isCorrect": boolean, "feedback": string, "firstErrorHint": string|null }.`,
      maxTokens: 512,
      parse: (raw) => aiGradingSchema.parse(JSON.parse(raw)),
    });
    return { ...data, gradedBy: "ia" };
  } catch (error) {
    console.error("AI grading failed, falling back to heuristic:", error);
    return gradeAnswerHeuristic(question, answerText);
  }
}
