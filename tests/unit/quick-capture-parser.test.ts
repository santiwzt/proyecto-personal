import { describe, expect, it } from "vitest";
import { parseQuickCapture } from "@/server/services/quick-capture-parser";

const now = new Date("2026-07-16T10:00:00-03:00"); // a Thursday

const context = {
  now,
  subjects: [
    { id: "sub-fisica", name: "Fisica" },
    { id: "sub-matematica", name: "Matematica" },
  ],
  topics: [{ id: "top-tiro-vertical", name: "tiro vertical", subjectId: "sub-fisica" }],
};

describe("parseQuickCapture", () => {
  it("interprets an exam mention with weekday and time", () => {
    const result = parseQuickCapture("Rindo Fisica el lunes a las 9", context);
    expect(result.type).toBe("exam");
    if (result.type === "exam") {
      expect(result.data.subjectId).toBe("sub-fisica");
      expect(result.data.scheduledAt).toContain("T09:00:00");
    }
  });

  it("interprets a reminder-style task due tomorrow", () => {
    const result = parseQuickCapture("Recordame llevar la carpeta mañana", context);
    expect(result.type).toBe("task");
    if (result.type === "task") {
      expect(result.data.title.toLowerCase()).toContain("llevar la carpeta");
      expect(result.data.dueAt).not.toBeNull();
    }
  });

  it("interprets a training event with a time range", () => {
    const result = parseQuickCapture("Tengo entrenamiento el miercoles de 18 a 20", context);
    expect(result.type).toBe("event");
    if (result.type === "event") {
      expect(result.data.category).toBe("entrenamiento");
      expect(result.data.startsAt).toContain("T18:00:00");
      expect(result.data.endsAt).toContain("T20:00:00");
    }
  });

  it("interprets an idea capture", () => {
    const result = parseQuickCapture("Idea: crear un juego de terror en Unity", context);
    expect(result.type).toBe("idea");
    if (result.type === "idea") {
      expect(result.data.content).toBe("crear un juego de terror en Unity");
    }
  });

  it("interprets a study task with an estimated duration and links the subject via its topic", () => {
    const result = parseQuickCapture("Estudiar tiro vertical durante una hora", context);
    expect(result.type).toBe("task");
    if (result.type === "task") {
      expect(result.data.estimatedMinutes).toBe(60);
      expect(result.data.subjectId).toBe("sub-fisica");
    }
  });

  it("interprets an expense with Argentine number formatting", () => {
    const result = parseQuickCapture("Gaste 8.500 pesos en una salida", context);
    expect(result.type).toBe("expense");
    if (result.type === "expense") {
      expect(result.data.amount).toBe(8500);
      expect(result.data.currency).toBe("ARS");
    }
  });

  it("returns unknown with a clarification for ambiguous, very short input", () => {
    const result = parseQuickCapture("eh", context);
    expect(result.type).toBe("unknown");
  });

  it("never returns a save-able entity type for pure gibberish without a resolvable subject", () => {
    const result = parseQuickCapture("Rindo Quimica el lunes", context);
    expect(result.type).toBe("unknown");
  });
});
