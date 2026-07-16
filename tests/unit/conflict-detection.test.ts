import { describe, expect, it } from "vitest";
import {
  detectDailyOverload,
  detectEventOverlaps,
  detectExamsWithoutSessions,
  detectMissingBreaks,
  detectOutsideAvailability,
  detectOverdueTasks,
  detectTasksWithoutEnoughTime,
} from "@/server/services/conflict-detection";
import type { AvailabilityRule, CalendarEvent, Exam, StudySession, Task } from "@/types/domain";

function event(overrides: Partial<CalendarEvent> = {}): CalendarEvent {
  return {
    id: overrides.id ?? "evt-1",
    userId: "user-1",
    title: overrides.title ?? "Evento",
    category: "personal",
    startsAt: overrides.startsAt ?? "2026-07-20T09:00:00-03:00",
    endsAt: overrides.endsAt ?? "2026-07-20T10:00:00-03:00",
    location: null,
    isFixed: false,
    relatedExamId: null,
    relatedTaskId: null,
    relatedProjectId: null,
    notes: null,
    createdAt: "2026-07-01T00:00:00-03:00",
    ...overrides,
  };
}

describe("detectEventOverlaps", () => {
  it("flags two events that overlap in time", () => {
    const events = [
      event({ id: "a", startsAt: "2026-07-20T09:00:00-03:00", endsAt: "2026-07-20T11:00:00-03:00" }),
      event({ id: "b", startsAt: "2026-07-20T10:00:00-03:00", endsAt: "2026-07-20T12:00:00-03:00" }),
    ];
    const conflicts = detectEventOverlaps(events);
    expect(conflicts).toHaveLength(1);
    expect(conflicts[0]?.kind).toBe("solapamiento");
    expect(conflicts[0]?.relatedIds).toEqual(["a", "b"]);
  });

  it("does not flag back-to-back events with no overlap", () => {
    const events = [
      event({ id: "a", startsAt: "2026-07-20T09:00:00-03:00", endsAt: "2026-07-20T10:00:00-03:00" }),
      event({ id: "b", startsAt: "2026-07-20T10:00:00-03:00", endsAt: "2026-07-20T11:00:00-03:00" }),
    ];
    expect(detectEventOverlaps(events)).toHaveLength(0);
  });

  it("does not flag events on different days", () => {
    const events = [
      event({ id: "a", startsAt: "2026-07-20T09:00:00-03:00", endsAt: "2026-07-20T10:00:00-03:00" }),
      event({ id: "b", startsAt: "2026-07-21T09:00:00-03:00", endsAt: "2026-07-21T10:00:00-03:00" }),
    ];
    expect(detectEventOverlaps(events)).toHaveLength(0);
  });
});

describe("detectOutsideAvailability", () => {
  it("flags an event scheduled inside a no_disponible window", () => {
    const rule: AvailabilityRule = {
      id: "rule-1",
      userId: "user-1",
      weekday: 1, // Monday
      startTime: "08:00",
      endTime: "13:00",
      kind: "no_disponible",
      label: "Colegio",
    };
    const events = [
      event({
        id: "a",
        startsAt: "2026-07-20T09:00:00-03:00", // Monday
        endsAt: "2026-07-20T09:30:00-03:00",
      }),
    ];
    const conflicts = detectOutsideAvailability(events, [rule]);
    expect(conflicts).toHaveLength(1);
    expect(conflicts[0]?.kind).toBe("fuera_de_disponibilidad");
  });

  it("does not flag an event outside the blocked window", () => {
    const rule: AvailabilityRule = {
      id: "rule-1",
      userId: "user-1",
      weekday: 1,
      startTime: "08:00",
      endTime: "13:00",
      kind: "no_disponible",
      label: "Colegio",
    };
    const events = [
      event({
        id: "a",
        startsAt: "2026-07-20T18:00:00-03:00",
        endsAt: "2026-07-20T19:00:00-03:00",
      }),
    ];
    expect(detectOutsideAvailability(events, [rule])).toHaveLength(0);
  });
});

describe("detectOverdueTasks", () => {
  it("flags an incomplete task past its due date", () => {
    const task: Task = {
      id: "t1",
      userId: "user-1",
      title: "Entregar informe",
      description: null,
      dueAt: "2026-07-01T00:00:00-03:00",
      estimatedMinutes: 60,
      priority: "media",
      status: "pendiente",
      subjectId: null,
      projectId: null,
      isFixed: false,
      completedAt: null,
      createdAt: "2026-06-01T00:00:00-03:00",
    };
    const conflicts = detectOverdueTasks([task], new Date("2026-07-16T00:00:00-03:00"));
    expect(conflicts).toHaveLength(1);
  });

  it("does not flag a completed task past its due date", () => {
    const task: Task = {
      id: "t1",
      userId: "user-1",
      title: "Entregar informe",
      description: null,
      dueAt: "2026-07-01T00:00:00-03:00",
      estimatedMinutes: 60,
      priority: "media",
      status: "completada",
      subjectId: null,
      projectId: null,
      isFixed: false,
      completedAt: "2026-06-30T00:00:00-03:00",
      createdAt: "2026-06-01T00:00:00-03:00",
    };
    expect(detectOverdueTasks([task], new Date("2026-07-16T00:00:00-03:00"))).toHaveLength(0);
  });
});

describe("detectTasksWithoutEnoughTime", () => {
  it("flags a task whose estimate exceeds remaining free time", () => {
    const task: Task = {
      id: "t1",
      userId: "user-1",
      title: "Practicar tiro vertical",
      description: null,
      dueAt: "2026-07-20T00:00:00-03:00",
      estimatedMinutes: 180,
      priority: "alta",
      status: "pendiente",
      subjectId: null,
      projectId: null,
      isFixed: false,
      completedAt: null,
      createdAt: "2026-07-01T00:00:00-03:00",
    };
    const conflicts = detectTasksWithoutEnoughTime([task], () => 60);
    expect(conflicts).toHaveLength(1);
    expect(conflicts[0]?.kind).toBe("tarea_sin_tiempo_suficiente");
  });

  it("does not flag a task with enough remaining free time", () => {
    const task: Task = {
      id: "t1",
      userId: "user-1",
      title: "Practicar tiro vertical",
      description: null,
      dueAt: "2026-07-20T00:00:00-03:00",
      estimatedMinutes: 60,
      priority: "alta",
      status: "pendiente",
      subjectId: null,
      projectId: null,
      isFixed: false,
      completedAt: null,
      createdAt: "2026-07-01T00:00:00-03:00",
    };
    expect(detectTasksWithoutEnoughTime([task], () => 180)).toHaveLength(0);
  });
});

describe("detectExamsWithoutSessions", () => {
  it("flags an upcoming exam with zero study sessions", () => {
    const exam: Exam = {
      id: "e1",
      userId: "user-1",
      subjectId: "s1",
      title: "Fisica",
      scheduledAt: "2026-07-25T09:00:00-03:00",
      durationMinutes: 90,
      topicIds: [],
      importance: "alta",
      status: "programado",
      fileIds: [],
      resultScore: null,
      resultNotes: null,
      createdAt: "2026-07-01T00:00:00-03:00",
    };
    const conflicts = detectExamsWithoutSessions([exam], [], new Date("2026-07-16T00:00:00-03:00"));
    expect(conflicts).toHaveLength(1);
    expect(conflicts[0]?.kind).toBe("examen_sin_sesiones");
  });

  it("does not flag an exam that already has a study session", () => {
    const exam: Exam = {
      id: "e1",
      userId: "user-1",
      subjectId: "s1",
      title: "Fisica",
      scheduledAt: "2026-07-25T09:00:00-03:00",
      durationMinutes: 90,
      topicIds: [],
      importance: "alta",
      status: "programado",
      fileIds: [],
      resultScore: null,
      resultNotes: null,
      createdAt: "2026-07-01T00:00:00-03:00",
    };
    const session: StudySession = {
      id: "ss1",
      userId: "user-1",
      subjectId: "s1",
      topicId: null,
      examId: "e1",
      startsAt: "2026-07-18T18:00:00-03:00",
      endsAt: "2026-07-18T19:00:00-03:00",
      completed: false,
    };
    expect(
      detectExamsWithoutSessions([exam], [session], new Date("2026-07-16T00:00:00-03:00")),
    ).toHaveLength(0);
  });
});

describe("detectMissingBreaks", () => {
  it("flags two consecutive blocks with less than the minimum break", () => {
    const blocks = [
      { id: "b1", startsAt: "2026-07-20T09:00:00-03:00", endsAt: "2026-07-20T10:00:00-03:00", title: "Bloque 1" },
      { id: "b2", startsAt: "2026-07-20T10:05:00-03:00", endsAt: "2026-07-20T11:00:00-03:00", title: "Bloque 2" },
    ];
    expect(detectMissingBreaks(blocks, 10)).toHaveLength(1);
  });

  it("does not flag blocks with sufficient break", () => {
    const blocks = [
      { id: "b1", startsAt: "2026-07-20T09:00:00-03:00", endsAt: "2026-07-20T10:00:00-03:00", title: "Bloque 1" },
      { id: "b2", startsAt: "2026-07-20T10:15:00-03:00", endsAt: "2026-07-20T11:00:00-03:00", title: "Bloque 2" },
    ];
    expect(detectMissingBreaks(blocks, 10)).toHaveLength(0);
  });
});

describe("detectDailyOverload", () => {
  it("flags a day where total study minutes exceed the configured maximum", () => {
    const blocks = [
      { id: "b1", startsAt: "2026-07-20T09:00:00-03:00", endsAt: "2026-07-20T11:00:00-03:00", title: "Bloque 1" },
      { id: "b2", startsAt: "2026-07-20T12:00:00-03:00", endsAt: "2026-07-20T14:30:00-03:00", title: "Bloque 2" },
    ];
    const conflicts = detectDailyOverload(blocks, 240);
    expect(conflicts).toHaveLength(1);
    expect(conflicts[0]?.kind).toBe("sobrecarga_diaria");
  });

  it("does not flag a day within the configured maximum", () => {
    const blocks = [
      { id: "b1", startsAt: "2026-07-20T09:00:00-03:00", endsAt: "2026-07-20T10:00:00-03:00", title: "Bloque 1" },
    ];
    expect(detectDailyOverload(blocks, 240)).toHaveLength(0);
  });
});
