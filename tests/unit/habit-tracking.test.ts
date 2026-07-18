import { describe, expect, it } from "vitest";
import { computeHabitStreak, computeHabitWeek } from "@/server/services/habit-tracking";
import type { HabitLog } from "@/types/domain";

const now = new Date("2026-07-18T09:00:00-03:00"); // Saturday

function makeLog(habitId: string, date: string, completed = true): HabitLog {
  return { id: `log-${habitId}-${date}`, userId: "u1", habitId, date, completed };
}

describe("computeHabitStreak", () => {
  it("counts consecutive completed days ending today", () => {
    const logs = [
      makeLog("h1", "2026-07-18"),
      makeLog("h1", "2026-07-17"),
      makeLog("h1", "2026-07-16"),
    ];
    expect(computeHabitStreak(logs, "h1", now)).toBe(3);
  });

  it("still counts the streak from yesterday if today isn't logged yet", () => {
    const logs = [makeLog("h1", "2026-07-17"), makeLog("h1", "2026-07-16")];
    expect(computeHabitStreak(logs, "h1", now)).toBe(2);
  });

  it("resets to 0 when yesterday is missing and today isn't done", () => {
    const logs = [makeLog("h1", "2026-07-10")];
    expect(computeHabitStreak(logs, "h1", now)).toBe(0);
  });

  it("stops at the first gap", () => {
    const logs = [makeLog("h1", "2026-07-18"), makeLog("h1", "2026-07-16")]; // missing 07-17
    expect(computeHabitStreak(logs, "h1", now)).toBe(1);
  });

  it("ignores logs marked not completed", () => {
    const logs = [makeLog("h1", "2026-07-18", false), makeLog("h1", "2026-07-17")];
    expect(computeHabitStreak(logs, "h1", now)).toBe(1);
  });

  it("ignores logs belonging to a different habit", () => {
    const logs = [makeLog("h2", "2026-07-18"), makeLog("h2", "2026-07-17")];
    expect(computeHabitStreak(logs, "h1", now)).toBe(0);
  });
});

describe("computeHabitWeek", () => {
  it("returns the last 7 calendar days ending today, oldest first", () => {
    const days = computeHabitWeek([], "h1", now);
    expect(days).toHaveLength(7);
    expect(days[0]?.date).toBe("2026-07-12");
    expect(days[6]?.date).toBe("2026-07-18");
  });

  it("marks completed days correctly", () => {
    const logs = [makeLog("h1", "2026-07-16"), makeLog("h1", "2026-07-18")];
    const days = computeHabitWeek(logs, "h1", now);
    const byDate = Object.fromEntries(days.map((d) => [d.date, d.completed]));
    expect(byDate["2026-07-16"]).toBe(true);
    expect(byDate["2026-07-18"]).toBe(true);
    expect(byDate["2026-07-17"]).toBe(false);
  });
});
