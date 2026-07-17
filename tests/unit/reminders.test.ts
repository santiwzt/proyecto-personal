import { describe, expect, it } from "vitest";
import { buildDailyReminder } from "@/server/services/reminders";
import type { Exam, Task } from "@/types/domain";

const now = new Date("2026-07-16T09:00:00-03:00"); // today = 2026-07-16, tomorrow = 2026-07-17

function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: "task-1",
    userId: "user-1",
    title: "Tarea",
    description: null,
    dueAt: null,
    estimatedMinutes: null,
    priority: "media",
    status: "pendiente",
    subjectId: null,
    projectId: null,
    isFixed: false,
    completedAt: null,
    createdAt: "2026-07-01T00:00:00-03:00",
    ...overrides,
  };
}

function makeExam(overrides: Partial<Exam> = {}): Exam {
  return {
    id: "exam-1",
    userId: "user-1",
    subjectId: "subject-1",
    title: "Parcial",
    scheduledAt: "2026-07-16T14:00:00-03:00",
    durationMinutes: 90,
    topicIds: [],
    importance: "alta",
    status: "programado",
    fileIds: [],
    resultScore: null,
    resultNotes: null,
    createdAt: "2026-07-01T00:00:00-03:00",
    ...overrides,
  };
}

describe("buildDailyReminder", () => {
  it("returns null when there is nothing due today or tomorrow", () => {
    const tasks = [makeTask({ dueAt: "2026-08-01T00:00:00-03:00" })];
    const exams = [makeExam({ scheduledAt: "2026-08-01T14:00:00-03:00" })];
    expect(buildDailyReminder(tasks, exams, now)).toBeNull();
  });

  it("mentions a single exam scheduled today by name", () => {
    const result = buildDailyReminder([], [makeExam({ scheduledAt: "2026-07-16T14:00:00-03:00" })], now);
    expect(result).not.toBeNull();
    expect(result!.body).toContain('Hoy rendis "Parcial"');
  });

  it("mentions a single exam scheduled tomorrow by name", () => {
    const result = buildDailyReminder([], [makeExam({ scheduledAt: "2026-07-17T14:00:00-03:00" })], now);
    expect(result!.body).toContain('Mañana rendis "Parcial"');
  });

  it("counts multiple exams instead of naming them", () => {
    const exams = [
      makeExam({ id: "e1", scheduledAt: "2026-07-16T10:00:00-03:00" }),
      makeExam({ id: "e2", scheduledAt: "2026-07-16T15:00:00-03:00" }),
    ];
    expect(buildDailyReminder([], exams, now)!.body).toContain("Hoy tenes 2 examenes");
  });

  it("ignores exams that already happened (status not programado)", () => {
    const exams = [makeExam({ scheduledAt: "2026-07-16T10:00:00-03:00", status: "rendido" })];
    expect(buildDailyReminder([], exams, now)).toBeNull();
  });

  it("counts tasks due today and tomorrow separately", () => {
    const tasks = [
      makeTask({ id: "t1", dueAt: "2026-07-16T18:00:00-03:00" }),
      makeTask({ id: "t2", dueAt: "2026-07-17T18:00:00-03:00" }),
    ];
    const result = buildDailyReminder(tasks, [], now);
    expect(result!.body).toContain("1 tarea vence hoy");
    expect(result!.body).toContain("1 tarea vence mañana");
  });

  it("excludes tasks that are already completed", () => {
    const tasks = [makeTask({ dueAt: "2026-07-16T18:00:00-03:00", status: "completada" })];
    expect(buildDailyReminder(tasks, [], now)).toBeNull();
  });

  it("excludes tasks with no due date", () => {
    const tasks = [makeTask({ dueAt: null })];
    expect(buildDailyReminder(tasks, [], now)).toBeNull();
  });

  it("combines exams and tasks in one message", () => {
    const tasks = [makeTask({ dueAt: "2026-07-16T18:00:00-03:00" })];
    const exams = [makeExam({ scheduledAt: "2026-07-16T10:00:00-03:00" })];
    const result = buildDailyReminder(tasks, exams, now);
    expect(result!.body).toContain('Hoy rendis "Parcial"');
    expect(result!.body).toContain("1 tarea vence hoy");
    expect(result!.title).toBe("Nexo Personal OS");
  });
});
