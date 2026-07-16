import { differenceInCalendarDays, parseISO } from "date-fns";
import type { Exam, ExamReadiness, PracticeAttempt, ReadinessFactor, StudyTopic, Task } from "@/types/domain";

/**
 * Transparent, explainable exam readiness score. Every point on the 0-100
 * scale is traceable to one of five factors below — never present this as a
 * mysterious black-box number. Weights are fixed and documented so the same
 * inputs always produce the same score.
 */
const MAX_POINTS = {
  temas_practicados: 30,
  resultados_preguntas: 30,
  confianza_declarada: 15,
  dias_desde_ultima_practica: 15,
  tareas_completadas: 10,
} as const;

const RECENCY_WINDOW_DAYS = 14;

export interface ExamReadinessInputs {
  exam: Exam;
  topics: StudyTopic[]; // all topics belonging to exam.subjectId; will be filtered to exam.topicIds
  attempts: PracticeAttempt[]; // attempts for questions related to those topics
  relatedTasks: Task[]; // tasks for the same subject, due before the exam
  now?: Date;
}

export function computeExamReadiness({
  exam,
  topics,
  attempts,
  relatedTasks,
  now = new Date(),
}: ExamReadinessInputs): ExamReadiness {
  const examTopics = topics.filter((t) => exam.topicIds.includes(t.id));
  const factors: ReadinessFactor[] = [];

  // Factor 1: how many of the exam's topics have moved past "no iniciado".
  const practicedCount = examTopics.filter((t) => t.status !== "no_iniciado").length;
  const topicsRatio = examTopics.length > 0 ? practicedCount / examTopics.length : 0;
  const topicsPoints = Math.round(topicsRatio * MAX_POINTS.temas_practicados);
  factors.push({
    key: "temas_practicados",
    label: "Temas practicados",
    weight: MAX_POINTS.temas_practicados / 100,
    contribution: topicsPoints,
    explanation:
      examTopics.length > 0
        ? `${practicedCount} de ${examTopics.length} temas ya se empezaron a estudiar.`
        : "Todavia no se asociaron temas a este examen.",
  });

  // Factor 2: accuracy on practice questions tied to this exam's topics.
  const correctCount = attempts.filter((a) => a.isCorrect).length;
  const accuracyRatio = attempts.length > 0 ? correctCount / attempts.length : 0;
  const accuracyPoints = Math.round(accuracyRatio * MAX_POINTS.resultados_preguntas);
  factors.push({
    key: "resultados_preguntas",
    label: "Resultados en preguntas de practica",
    weight: MAX_POINTS.resultados_preguntas / 100,
    contribution: accuracyPoints,
    explanation:
      attempts.length > 0
        ? `${correctCount} de ${attempts.length} respuestas de practica fueron correctas.`
        : "Todavia no se respondieron preguntas de practica para este examen.",
  });

  // Factor 3: self-declared confidence, averaged across the exam's topics.
  const avgConfidence =
    examTopics.length > 0
      ? examTopics.reduce((sum, t) => sum + t.selfConfidence, 0) / examTopics.length
      : 0;
  const confidencePoints = Math.round((avgConfidence / 100) * MAX_POINTS.confianza_declarada);
  factors.push({
    key: "confianza_declarada",
    label: "Confianza declarada",
    weight: MAX_POINTS.confianza_declarada / 100,
    contribution: confidencePoints,
    explanation:
      examTopics.length > 0
        ? `Confianza propia promedio de ${Math.round(avgConfidence)}/100 en los temas del examen.`
        : "No hay confianza declarada porque no hay temas asociados.",
  });

  // Factor 4: recency — practicing today counts more than practicing weeks ago.
  const lastPracticed = examTopics
    .map((t) => t.lastPracticedAt)
    .filter((d): d is string => !!d)
    .map((d) => parseISO(d).getTime());
  const mostRecent = lastPracticed.length > 0 ? new Date(Math.max(...lastPracticed)) : null;
  const daysSince = mostRecent ? differenceInCalendarDays(now, mostRecent) : null;
  const recencyRatio =
    daysSince === null ? 0 : Math.max(0, 1 - daysSince / RECENCY_WINDOW_DAYS);
  const recencyPoints = Math.round(recencyRatio * MAX_POINTS.dias_desde_ultima_practica);
  factors.push({
    key: "dias_desde_ultima_practica",
    label: "Tiempo desde la ultima practica",
    weight: MAX_POINTS.dias_desde_ultima_practica / 100,
    contribution: recencyPoints,
    explanation:
      daysSince === null
        ? "Todavia no se registro ninguna sesion de practica."
        : daysSince === 0
          ? "Se practico hoy."
          : `Ultima practica hace ${daysSince} dias.`,
  });

  // Factor 5: completion of related tasks (readings, exercises) for the subject.
  const completedTasks = relatedTasks.filter((t) => t.status === "completada").length;
  const tasksRatio = relatedTasks.length > 0 ? completedTasks / relatedTasks.length : 0;
  const tasksPoints = Math.round(tasksRatio * MAX_POINTS.tareas_completadas);
  factors.push({
    key: "tareas_completadas",
    label: "Tareas completadas",
    weight: MAX_POINTS.tareas_completadas / 100,
    contribution: tasksPoints,
    explanation:
      relatedTasks.length > 0
        ? `${completedTasks} de ${relatedTasks.length} tareas relacionadas estan completadas.`
        : "No hay tareas relacionadas con esta materia todavia.",
  });

  const score = factors.reduce((sum, f) => sum + f.contribution, 0);

  return {
    examId: exam.id,
    score: Math.min(100, Math.max(0, score)),
    factors,
    computedAt: now.toISOString(),
  };
}

/**
 * Estimated (system-derived) confidence for a single topic, distinct from
 * the user's self-reported confidence. Never claim "dominado" from reading
 * alone — it requires actual practice signal.
 */
export function estimateTopicConfidence(attempts: PracticeAttempt[], hasRecentPractice = true): number {
  if (attempts.length === 0) return 0;
  const correctRatio = attempts.filter((a) => a.isCorrect).length / attempts.length;
  const recencyBoost = hasRecentPractice ? 1 : 0.7;
  return Math.round(correctRatio * 100 * recencyBoost);
}
