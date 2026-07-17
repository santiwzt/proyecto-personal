import { describe, expect, it } from "vitest";
import { generatePlan } from "@/server/services/planner-engine";
import type { AvailabilityRule, CalendarEvent, Exam, StudyTopic, Task } from "@/types/domain";

const subjectNameById = new Map([["sub-fisica", "Fisica"]]);

const topics: StudyTopic[] = [
  {
    id: "top-mru",
    userId: "u1",
    subjectId: "sub-fisica",
    name: "MRU",
    status: "dominado",
    selfConfidence: 90,
    estimatedConfidence: 90,
    commonMistakes: [],
    notes: null,
    lastPracticedAt: null,
    createdAt: "2026-06-01T00:00:00-03:00",
  },
  {
    id: "top-mruv",
    userId: "u1",
    subjectId: "sub-fisica",
    name: "MRUV",
    status: "aprendiendo",
    selfConfidence: 50,
    estimatedConfidence: 40,
    commonMistakes: [],
    notes: null,
    lastPracticedAt: null,
    createdAt: "2026-06-01T00:00:00-03:00",
  },
  {
    id: "top-caida",
    userId: "u1",
    subjectId: "sub-fisica",
    name: "Caida libre",
    status: "practicando",
    selfConfidence: 65,
    estimatedConfidence: 55,
    commonMistakes: [],
    notes: null,
    lastPracticedAt: null,
    createdAt: "2026-06-01T00:00:00-03:00",
  },
  {
    id: "top-tiro",
    userId: "u1",
    subjectId: "sub-fisica",
    name: "Tiro vertical",
    status: "aprendiendo",
    selfConfidence: 20,
    estimatedConfidence: 15,
    commonMistakes: [],
    notes: null,
    lastPracticedAt: null,
    createdAt: "2026-06-01T00:00:00-03:00",
  },
];

const exams: Exam[] = [
  {
    id: "exam-1",
    userId: "u1",
    subjectId: "sub-fisica",
    title: "Examen de Fisica",
    scheduledAt: "2026-07-20T09:00:00-03:00", // the Monday AFTER weekStart's week
    durationMinutes: 80,
    topicIds: ["top-mru", "top-mruv", "top-caida", "top-tiro"],
    importance: "alta",
    status: "programado",
    fileIds: [],
    resultScore: null,
    resultNotes: null,
    createdAt: "2026-07-01T00:00:00-03:00",
  },
];

const tasks: Task[] = [
  {
    id: "task-1",
    userId: "u1",
    title: "Entregar informe",
    description: null,
    dueAt: "2026-07-17T23:59:00-03:00", // Friday within the week
    estimatedMinutes: 60,
    priority: "alta",
    status: "pendiente",
    subjectId: null,
    projectId: null,
    isFixed: false,
    completedAt: null,
    createdAt: "2026-07-01T00:00:00-03:00",
  },
];

const events: CalendarEvent[] = [
  {
    id: "evt-entrenamiento",
    userId: "u1",
    title: "Entrenamiento",
    category: "entrenamiento",
    startsAt: "2026-07-15T18:00:00-03:00", // Wednesday
    endsAt: "2026-07-15T20:00:00-03:00",
    location: null,
    isFixed: true,
    relatedExamId: null,
    relatedTaskId: null,
    relatedProjectId: null,
    notes: null,
    createdAt: "2026-07-01T00:00:00-03:00",
  },
  {
    id: "evt-partido",
    userId: "u1",
    title: "Partido",
    category: "partido",
    startsAt: "2026-07-19T10:00:00-03:00", // Sunday
    endsAt: "2026-07-19T12:00:00-03:00",
    location: null,
    isFixed: true,
    relatedExamId: null,
    relatedTaskId: null,
    relatedProjectId: null,
    notes: null,
    createdAt: "2026-07-01T00:00:00-03:00",
  },
];

const availabilityRules: AvailabilityRule[] = [
  {
    id: "avail-colegio",
    userId: "u1",
    weekday: 1,
    startTime: "08:00",
    endTime: "13:00",
    kind: "no_disponible",
    label: "Colegio",
  },
  {
    id: "avail-sabado",
    userId: "u1",
    weekday: 6,
    startTime: "09:00",
    endTime: "11:00", // only 2 hours available on Saturday
    kind: "disponible",
    label: "Poco tiempo el sabado",
  },
];

describe("generatePlan", () => {
  it("builds a plan that respects the Saturday 2-hour cap and avoids fixed events", () => {
    const plan = generatePlan({
      weekStart: "2026-07-13", // Monday
      exams,
      topics,
      tasks,
      events,
      availabilityRules,
      studySessions: [],
      projects: [],
      subjectNameById,
    });

    expect(plan.blocks.length).toBeGreaterThan(0);

    const saturdayBlocks = plan.blocks.filter((b) => b.date === "2026-07-18");
    const saturdayMinutes = saturdayBlocks.reduce((sum, b) => {
      const [sh, sm] = b.startTime.split(":").map(Number);
      const [eh, em] = b.endTime.split(":").map(Number);
      return sum + ((eh! * 60 + em!) - (sh! * 60 + sm!));
    }, 0);
    expect(saturdayMinutes).toBeLessThanOrEqual(120);

    const wednesdayBlocks = plan.blocks.filter((b) => b.date === "2026-07-15");
    for (const block of wednesdayBlocks) {
      expect(block.startTime >= "20:00" || block.endTime <= "18:00").toBe(true);
    }

    expect(plan.blocks.every((b) => b.date >= "2026-07-13" && b.date <= "2026-07-19")).toBe(true);

    const examConflict = plan.conflicts.find((c) => c.kind === "examen_sin_sesiones");
    expect(examConflict).toBeDefined();

    expect(plan.assumptions.length).toBeGreaterThan(0);
    expect(typeof plan.summary).toBe("string");
    expect(plan.summary.length).toBeGreaterThan(0);
    // The summary should reference concrete numbers/names, not just a
    // generic block count.
    expect(plan.summary).toContain("Examen de Fisica");
    expect(plan.summary).toMatch(/\d+(\.\d+)? h en total/);
  });

  it("reports unscheduled items instead of silently dropping work when there is no capacity", () => {
    const scarceAvailability: AvailabilityRule[] = [
      { id: "a1", userId: "u1", weekday: 1, startTime: "20:00", endTime: "20:30", kind: "disponible", label: null },
      { id: "a2", userId: "u1", weekday: 2, startTime: "20:00", endTime: "20:15", kind: "disponible", label: null },
      { id: "a3", userId: "u1", weekday: 3, startTime: "20:00", endTime: "20:15", kind: "disponible", label: null },
      { id: "a4", userId: "u1", weekday: 4, startTime: "20:00", endTime: "20:15", kind: "disponible", label: null },
      { id: "a5", userId: "u1", weekday: 5, startTime: "20:00", endTime: "20:15", kind: "disponible", label: null },
      { id: "a6", userId: "u1", weekday: 6, startTime: "20:00", endTime: "20:15", kind: "disponible", label: null },
      { id: "a0", userId: "u1", weekday: 0, startTime: "20:00", endTime: "20:15", kind: "disponible", label: null },
    ];

    const plan = generatePlan({
      weekStart: "2026-07-13",
      exams,
      topics,
      tasks,
      events: [],
      availabilityRules: scarceAvailability,
      studySessions: [],
      projects: [],
      subjectNameById,
    });

    expect(plan.unscheduledItems.length).toBeGreaterThan(0);

    // The recommendations should call out the specific unscheduled items
    // and suggest a concrete lever (raising the daily max / availability),
    // not just report the schedule silently.
    const unscheduledRecommendation = plan.recommendations.find((r) =>
      r.message.includes("No quedo lugar esta semana"),
    );
    expect(unscheduledRecommendation).toBeDefined();
    expect(unscheduledRecommendation!.relatedIds.length).toBe(plan.unscheduledItems.length);
  });
});
