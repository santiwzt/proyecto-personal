import { addDays, format, parseISO } from "date-fns";
import { todayISODate } from "@/lib/dates";
import type { HabitLog } from "@/types/domain";

function shiftISODate(iso: string, days: number): string {
  return format(addDays(parseISO(iso), days), "yyyy-MM-dd");
}

/**
 * Consecutive-day streak of completed logs for one habit, counting backwards
 * from today. If today isn't marked completed yet, counting starts from
 * yesterday instead -- so a habit you haven't gotten to yet today doesn't
 * show a broken streak while the day is still in progress.
 */
export function computeHabitStreak(logs: HabitLog[], habitId: string, now: Date = new Date()): number {
  const completedDates = new Set(logs.filter((l) => l.habitId === habitId && l.completed).map((l) => l.date));
  let cursor = todayISODate(now);
  if (!completedDates.has(cursor)) {
    cursor = shiftISODate(cursor, -1);
  }
  let streak = 0;
  while (completedDates.has(cursor)) {
    streak += 1;
    cursor = shiftISODate(cursor, -1);
  }
  return streak;
}

export interface HabitDay {
  date: string;
  completed: boolean;
}

/** The last 7 calendar days (oldest first, today last) with completion state for one habit. */
export function computeHabitWeek(logs: HabitLog[], habitId: string, now: Date = new Date()): HabitDay[] {
  const today = todayISODate(now);
  const days: HabitDay[] = [];
  for (let i = 6; i >= 0; i--) {
    const date = shiftISODate(today, -i);
    const completed = logs.some((l) => l.habitId === habitId && l.date === date && l.completed);
    days.push({ date, completed });
  }
  return days;
}
