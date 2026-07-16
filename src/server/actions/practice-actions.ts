"use server";

import { revalidatePath } from "next/cache";
import { requireSessionUser } from "@/lib/auth/session";
import { AppError } from "@/lib/errors/app-error";
import { generateQuestionsSchema, gradeAnswerSchema, type GenerateQuestionsInput, type GradeAnswerInput } from "@/lib/validation/schemas";
import { practiceRepository } from "@/server/repositories/assistant-repository";
import { fileChunksRepository } from "@/server/repositories/files-repository";
import { topicsRepository } from "@/server/repositories/academic-repository";
import { aiUsageRepository } from "@/server/repositories/misc-repository";
import { generateQuestions } from "@/server/services/question-generation";
import { gradeAnswer } from "@/server/services/grading";
import { estimateTopicConfidence } from "@/server/services/exam-readiness";
import { env } from "@/config/env";
import type { PracticeAttempt, PracticeQuestion, PracticeSet } from "@/types/domain";

export async function generateQuestionsAction(
  input: GenerateQuestionsInput,
): Promise<{ set: PracticeSet; questions: PracticeQuestion[] }> {
  const user = await requireSessionUser();
  const parsed = generateQuestionsSchema.parse(input);

  const usedToday = aiUsageRepository.countToday(user.userId);
  if (usedToday >= env.AI_DAILY_REQUEST_LIMIT) {
    throw new AppError("LIMIT_EXCEEDED", "Alcanzaste el limite diario de solicitudes de IA.");
  }

  const chunks = parsed.fileIds.length > 0 ? fileChunksRepository.listByFiles(user.userId, parsed.fileIds) : [];
  const topic = parsed.topicId ? topicsRepository.get(user.userId, parsed.topicId) : null;

  const { questions, generatedBy } = await generateQuestions({
    chunks,
    topicName: topic?.name ?? null,
    difficulty: parsed.difficulty,
    count: parsed.count,
    kind: parsed.kind,
  });

  if (questions.length === 0) {
    throw new AppError(
      "VALIDATION",
      "No pudimos generar preguntas: elegi al menos un archivo con contenido procesado.",
    );
  }

  const set = practiceRepository.createSet(user.userId, {
    subjectId: parsed.subjectId,
    topicId: parsed.topicId,
    title: topic ? `Practica: ${topic.name}` : "Practica",
    generatedBy,
  });
  const created = questions.map((q) => practiceRepository.addQuestion({ ...q, setId: set.id }));

  aiUsageRepository.record(user.userId, {
    feature: "questions",
    provider: generatedBy === "ia" ? "anthropic" : "heuristico",
    inputTokens: 0,
    outputTokens: 0,
  });

  revalidatePath("/estudios");
  return { set, questions: created };
}

export async function gradeAnswerAction(input: GradeAnswerInput): Promise<PracticeAttempt> {
  const user = await requireSessionUser();
  const parsed = gradeAnswerSchema.parse(input);
  const question = practiceRepository.getQuestion(parsed.questionId);

  const previousAttempts = practiceRepository.listAttemptsByQuestion(user.userId, parsed.questionId);
  const result = await gradeAnswer(question, parsed.answerText);

  const attempt = practiceRepository.addAttempt(user.userId, {
    questionId: parsed.questionId,
    answerText: parsed.answerText,
    isCorrect: result.isCorrect,
    feedback: result.feedback,
    firstErrorHint: result.firstErrorHint,
    attemptNumber: previousAttempts.length + 1,
  });

  const set = practiceRepository.getSet(user.userId, question.setId);
  if (set.topicId) {
    const allAttempts = [...previousAttempts, attempt];
    const confidence = estimateTopicConfidence(allAttempts, true);
    topicsRepository.markPracticed(user.userId, set.topicId, confidence);
  }

  aiUsageRepository.record(user.userId, {
    feature: "grading",
    provider: result.gradedBy === "ia" ? "anthropic" : "heuristico",
    inputTokens: 0,
    outputTokens: 0,
  });

  revalidatePath("/estudios");
  return attempt;
}
