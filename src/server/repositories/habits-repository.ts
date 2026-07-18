import { getDemoStore } from "@/lib/database/demo/store";
import { generateId } from "@/lib/database/demo/ids";
import { AppError } from "@/lib/errors/app-error";
import { isDemoMode } from "@/config/env";
import { createSupabaseServerClient } from "@/lib/database/supabase/server";
import type { Habit, HabitLog } from "@/types/domain";
import type { HabitLogsTable, HabitsTable } from "@/types/database";

type NewHabit = Pick<Habit, "name" | "targetPerWeek">;

function dbError(action: string, error: { message: string }): never {
  console.error(`Supabase error (${action}):`, error.message);
  throw new AppError("INTERNAL", "Ocurrio un error al acceder a la base de datos.");
}

function mapHabit(row: HabitsTable["Row"]): Habit {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    targetPerWeek: row.target_per_week,
    createdAt: row.created_at,
    archivedAt: row.archived_at,
  };
}

export const habitsRepository = {
  async list(userId: string): Promise<Habit[]> {
    if (isDemoMode) {
      return getDemoStore()
        .habits.list(userId)
        .filter((h) => !h.archivedAt);
    }
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("habits")
      .select("*")
      .eq("user_id", userId)
      .is("archived_at", null)
      .order("created_at", { ascending: true });
    if (error) dbError("habits.list", error);
    return data.map(mapHabit);
  },

  async create(userId: string, input: NewHabit): Promise<Habit> {
    if (isDemoMode) {
      return getDemoStore().habits.insert({
        id: generateId("habit"),
        userId,
        name: input.name,
        targetPerWeek: input.targetPerWeek,
        createdAt: new Date().toISOString(),
        archivedAt: null,
      });
    }
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("habits")
      .insert({ user_id: userId, name: input.name, target_per_week: input.targetPerWeek })
      .select("*")
      .single();
    if (error) dbError("habits.create", error);
    return mapHabit(data);
  },

  async archive(userId: string, id: string): Promise<void> {
    if (isDemoMode) {
      getDemoStore().habits.update(userId, id, { archivedAt: new Date().toISOString() });
      return;
    }
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase
      .from("habits")
      .update({ archived_at: new Date().toISOString() })
      .eq("user_id", userId)
      .eq("id", id);
    if (error) dbError("habits.archive", error);
  },
};

function mapHabitLog(row: HabitLogsTable["Row"]): HabitLog {
  return {
    id: row.id,
    userId: row.user_id,
    habitId: row.habit_id,
    date: row.date,
    completed: row.completed,
  };
}

export const habitLogsRepository = {
  /** All logs for every habit of this user, newest first -- enough to compute streaks and weekly counts client-side. */
  async listForUser(userId: string): Promise<HabitLog[]> {
    if (isDemoMode) {
      return getDemoStore()
        .habitLogs.list(userId)
        .sort((a, b) => b.date.localeCompare(a.date));
    }
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("habit_logs")
      .select("*")
      .eq("user_id", userId)
      .order("date", { ascending: false });
    if (error) dbError("habitLogs.listForUser", error);
    return data.map(mapHabitLog);
  },

  /** Flips a single day's completion for a habit (creates the row if it doesn't exist yet). */
  async toggle(userId: string, habitId: string, date: string): Promise<HabitLog> {
    if (isDemoMode) {
      const store = getDemoStore();
      const existing = store.habitLogs.list(userId).find((l) => l.habitId === habitId && l.date === date);
      if (existing) return store.habitLogs.update(userId, existing.id, { completed: !existing.completed });
      return store.habitLogs.insert({ id: generateId("habitlog"), userId, habitId, date, completed: true });
    }
    const supabase = await createSupabaseServerClient();
    const { data: existing, error: findError } = await supabase
      .from("habit_logs")
      .select("*")
      .eq("user_id", userId)
      .eq("habit_id", habitId)
      .eq("date", date)
      .maybeSingle();
    if (findError) dbError("habitLogs.toggle.find", findError);

    if (existing) {
      const { data, error } = await supabase
        .from("habit_logs")
        .update({ completed: !existing.completed })
        .eq("user_id", userId)
        .eq("id", existing.id)
        .select("*")
        .single();
      if (error) dbError("habitLogs.toggle.update", error);
      return mapHabitLog(data);
    }

    const { data, error } = await supabase
      .from("habit_logs")
      .insert({ user_id: userId, habit_id: habitId, date, completed: true })
      .select("*")
      .single();
    if (error) dbError("habitLogs.toggle.insert", error);
    return mapHabitLog(data);
  },
};
