import { describe, expect, it } from "vitest";
import { deriveEffectiveTaskStatus } from "@/server/services/task-status";

describe("deriveEffectiveTaskStatus", () => {
  const now = new Date("2026-07-16T12:00:00-03:00");

  it("returns vencida for a pending task past its due date", () => {
    expect(
      deriveEffectiveTaskStatus({ status: "pendiente", dueAt: "2026-07-10T00:00:00-03:00" }, now),
    ).toBe("vencida");
  });

  it("returns completada even if the due date already passed", () => {
    expect(
      deriveEffectiveTaskStatus({ status: "completada", dueAt: "2026-07-10T00:00:00-03:00" }, now),
    ).toBe("completada");
  });

  it("returns the original status when the due date has not passed", () => {
    expect(
      deriveEffectiveTaskStatus({ status: "en_progreso", dueAt: "2026-07-20T00:00:00-03:00" }, now),
    ).toBe("en_progreso");
  });

  it("returns the original status when there is no due date", () => {
    expect(deriveEffectiveTaskStatus({ status: "pendiente", dueAt: null }, now)).toBe("pendiente");
  });
});
