import { describe, expect, it } from "vitest";
import { computeExamReadiness, estimateTopicConfidence } from "@/server/services/exam-readiness";
import type { Exam, PracticeAttempt, StudyTopic, Task } from "@/types/domain";

const exam: Exam = {
  id: "exam-1",
  userId: "u1",
  subjectId: "sub-1",
  title: "Examen de Fisica",
  scheduledAt: "2026-07-20T09:00:00-03:00",
  durationMinutes: 80,
  topicIds: ["top-1", "top-2"],
  importance: "alta",
  status: "programado",
  fileIds: [],
  resultScore: null,
  resultNotes: null,
  createdAt: "2026-07-01T00:00:00-03:00",
};

function topic(overrides: Partial<StudyTopic>): StudyTopic {
  return {
    id: "top-1",
    userId: "u1",
    subjectId: "sub-1",
    name: "Tema",
    status: "no_iniciado",
    selfConfidence: 0,
    estimatedConfidence: 0,
    commonMistakes: [],
    notes: null,
    lastPracticedAt: null,
    createdAt: "2026-07-01T00:00:00-03:00",
    ...overrides,
  };
}

describe("computeExamReadiness", () => {
  it("returns a low score when nothing has been practiced", () => {
    const topics = [topic({ id: "top-1" }), topic({ id: "top-2" })];
    const readiness = computeExamReadiness({ exam, topics, attempts: [], relatedTasks: [] });
    expect(readiness.score).toBe(0);
    expect(readiness.factors).toHaveLength(5);
  });

  it("increases the score as topics are practiced, confidence rises, and tasks are completed", () => {
    const topics = [
      topic({ id: "top-1", status: "dominado", selfConfidence: 90, lastPracticedAt: "2026-07-15T10:00:00-03:00" }),
      topic({ id: "top-2", status: "practicando", selfConfidence: 70, lastPracticedAt: "2026-07-15T10:00:00-03:00" }),
    ];
    const attempts: PracticeAttempt[] = [
      {
        id: "a1",
        userId: "u1",
        questionId: "q1",
        answerText: "ok",
        isCorrect: true,
        feedback: "bien",
        firstErrorHint: null,
        attemptNumber: 1,
        createdAt: "2026-07-15T10:00:00-03:00",
      },
    ];
    const tasks: Task[] = [
      {
        id: "t1",
        userId: "u1",
        title: "Practicar ejercicios",
        description: null,
        dueAt: null,
        estimatedMinutes: 30,
        priority: "media",
        status: "completada",
        subjectId: "sub-1",
        projectId: null,
        isFixed: false,
        completedAt: "2026-07-14T00:00:00-03:00",
        createdAt: "2026-07-01T00:00:00-03:00",
      },
    ];

    const readiness = computeExamReadiness({
      exam,
      topics,
      attempts,
      relatedTasks: tasks,
      now: new Date("2026-07-16T00:00:00-03:00"),
    });
    expect(readiness.score).toBeGreaterThan(60);
    expect(readiness.score).toBeLessThanOrEqual(100);
  });

  it("every factor contribution is explainable and sums to the total score", () => {
    const topics = [topic({ id: "top-1", status: "practicando", selfConfidence: 50 })];
    const readiness = computeExamReadiness({ exam, topics, attempts: [], relatedTasks: [] });
    const sum = readiness.factors.reduce((acc, f) => acc + f.contribution, 0);
    expect(sum).toBe(readiness.score);
    for (const factor of readiness.factors) {
      expect(factor.explanation.length).toBeGreaterThan(0);
    }
  });
});

describe("estimateTopicConfidence", () => {
  it("returns 0 with no practice attempts", () => {
    expect(estimateTopicConfidence([])).toBe(0);
  });

  it("reflects the correct-answer ratio", () => {
    const attempts: PracticeAttempt[] = [
      { id: "a1", userId: "u1", questionId: "q1", answerText: "", isCorrect: true, feedback: "", firstErrorHint: null, attemptNumber: 1, createdAt: "" },
      { id: "a2", userId: "u1", questionId: "q2", answerText: "", isCorrect: false, feedback: "", firstErrorHint: null, attemptNumber: 1, createdAt: "" },
    ];
    expect(estimateTopicConfidence(attempts, true)).toBe(50);
  });
});
