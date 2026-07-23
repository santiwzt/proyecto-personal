import { deriveEffectiveTaskStatus } from "@/server/services/task-status";
import { todayISODate } from "@/lib/dates";
import type { Exam, Habit, HabitLog, Task } from "@/types/domain";

export interface ReminderNotification {
  title: string;
  body: string;
}

type ReminderTask = Pick<Task, "dueAt" | "status">;
type ReminderExam = Pick<Exam, "title" | "scheduledAt" | "status">;
type ReminderHabit = Pick<Habit, "id" | "name" | "archivedAt">;
type ReminderHabitLog = Pick<HabitLog, "habitId" | "date" | "completed">;

export interface DailyReminderInput {
  tasks: ReminderTask[];
  exams: ReminderExam[];
  /** Optional: omit (or pass []) to leave habits out of the reminder entirely. */
  habits?: ReminderHabit[];
  habitLogs?: ReminderHabitLog[];
  now?: Date;
}

/**
 * Pure, deterministic: given a user's tasks, exams and habits and "now",
 * decides whether they should get a daily reminder push and what it should
 * say. Looks at what's due "today" or "tomorrow" (Argentina-local calendar
 * days) and which habits still have no completed log for today — never
 * fabricates anything, just summarizes real data. Takes `Pick`ed shapes (not
 * the full domain types) so the daily reminders cron job can query just the
 * columns it needs via the admin client, without round-tripping through full
 * per-user repository reads.
 */
export function buildDailyReminder(input: DailyReminderInput): ReminderNotification | null {
  const { tasks, exams, habits = [], habitLogs = [], now = new Date() } = input;
  const today = todayISODate(now);
  const tomorrow = todayISODate(new Date(now.getTime() + 24 * 60 * 60 * 1000));

  const dueToday = tasks.filter(
    (t) => t.dueAt && t.dueAt.slice(0, 10) === today && deriveEffectiveTaskStatus(t, now) !== "completada",
  );
  const dueTomorrow = tasks.filter(
    (t) => t.dueAt && t.dueAt.slice(0, 10) === tomorrow && deriveEffectiveTaskStatus(t, now) !== "completada",
  );
  const examsToday = exams.filter((e) => e.scheduledAt.slice(0, 10) === today && e.status === "programado");
  const examsTomorrow = exams.filter((e) => e.scheduledAt.slice(0, 10) === tomorrow && e.status === "programado");
  const pendingHabits = habits.filter(
    (h) => !h.archivedAt && !habitLogs.some((l) => l.habitId === h.id && l.date === today && l.completed),
  );

  const parts: string[] = [];
  if (examsToday.length > 0) {
    parts.push(examsToday.length === 1 ? `Hoy rendis "${examsToday[0]!.title}"` : `Hoy tenes ${examsToday.length} examenes`);
  }
  if (examsTomorrow.length > 0) {
    parts.push(
      examsTomorrow.length === 1
        ? `Mañana rendis "${examsTomorrow[0]!.title}"`
        : `Mañana tenes ${examsTomorrow.length} examenes`,
    );
  }
  if (dueToday.length > 0) {
    parts.push(dueToday.length === 1 ? `1 tarea vence hoy` : `${dueToday.length} tareas vencen hoy`);
  }
  if (dueTomorrow.length > 0) {
    parts.push(dueTomorrow.length === 1 ? `1 tarea vence mañana` : `${dueTomorrow.length} tareas vencen mañana`);
  }
  if (pendingHabits.length > 0) {
    parts.push(
      pendingHabits.length === 1
        ? `Todavia no marcaste "${pendingHabits[0]!.name}"`
        : `Todavia no marcaste ${pendingHabits.length} habitos hoy`,
    );
  }

  if (parts.length === 0) return null;

  return {
    title: "Nexo Personal OS",
    body: parts.join(" · ") + ".",
  };
}
