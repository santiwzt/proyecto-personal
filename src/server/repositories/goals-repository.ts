import { getDemoStore } from "@/lib/database/demo/store";
import { generateId } from "@/lib/database/demo/ids";
import { AppError } from "@/lib/errors/app-error";
import { isDemoMode } from "@/config/env";
import { createSupabaseServerClient } from "@/lib/database/supabase/server";
import type { Goal } from "@/types/domain";
import type { GoalsTable } from "@/types/database";

type NewGoal = Pick<Goal, "title" | "description" | "targetDate">;

function dbError(action: string, error: { message: string }): never {
  console.error(`Supabase error (${action}):`, error.message);
  throw new AppError("INTERNAL", "Ocurrio un error al acceder a la base de datos.");
}

function mapGoal(row: GoalsTable["Row"]): Goal {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    description: row.description,
    targetDate: row.target_date,
    progress: row.progress,
    createdAt: row.created_at,
  };
}

export const goalsRepository = {
  async list(userId: string): Promise<Goal[]> {
    if (isDemoMode) {
      return getDemoStore()
        .goals.list(userId)
        .sort((a, b) => (a.targetDate ?? "9999").localeCompare(b.targetDate ?? "9999"));
    }
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("goals")
      .select("*")
      .eq("user_id", userId)
      .order("target_date", { ascending: true, nullsFirst: false });
    if (error) dbError("goals.list", error);
    return data.map(mapGoal);
  },

  async create(userId: string, input: NewGoal): Promise<Goal> {
    if (isDemoMode) {
      return getDemoStore().goals.insert({
        id: generateId("goal"),
        userId,
        title: input.title,
        description: input.description,
        targetDate: input.targetDate,
        progress: 0,
        createdAt: new Date().toISOString(),
      });
    }
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("goals")
      .insert({
        user_id: userId,
        title: input.title,
        description: input.description,
        target_date: input.targetDate,
      })
      .select("*")
      .single();
    if (error) dbError("goals.create", error);
    return mapGoal(data);
  },

  async updateProgress(userId: string, id: string, progress: number): Promise<Goal> {
    if (isDemoMode) {
      return getDemoStore().goals.update(userId, id, { progress });
    }
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("goals")
      .update({ progress })
      .eq("user_id", userId)
      .eq("id", id)
      .select("*")
      .single();
    if (error) dbError("goals.updateProgress", error);
    return mapGoal(data);
  },

  async remove(userId: string, id: string): Promise<void> {
    if (isDemoMode) {
      getDemoStore().goals.remove(userId, id);
      return;
    }
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.from("goals").delete().eq("user_id", userId).eq("id", id);
    if (error) dbError("goals.remove", error);
  },
};
