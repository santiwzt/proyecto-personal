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

function significantTerms(text: string): Set<string> {
  return new Set(
    text
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((t) => t.length >= 3 && !SPANISH_STOPWORDS.has(t)),
  );
}

function overlapRatio(answer: Set<string>, expected: Set<string>): number {
  if (expected.size === 0) return 0;
  let matches = 0;
  for (const term of expected) if (answer.has(term)) matches += 1;
  return matches / expected.size;
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

  const answerTerms = significantTerms(answerText);
  const criteriaTerms = significantTerms(
    [question.expectedAnswer, ...question.gradingCriteria].join(" "),
  );
  const ratio = overlapRatio(answerTerms, criteriaTerms);
  const isCorrect = ratio >= 0.4;

  const missingCriterion = question.gradingCriteria.find(
    (criterion) => overlapRatio(answerTerms, significantTerms(criterion)) < 0.3,
  );

  return {
    isCorrect,
    feedback: isCorrect
      ? "Tu respuesta cubre los puntos clave esperados."
      : `Te falta cubrir: ${missingCriterion ?? question.gradingCriteria[0] ?? "un aspecto importante"}.`,
    firstErrorHint: isCorrect ? null : (missingCriterion ?? null),
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
