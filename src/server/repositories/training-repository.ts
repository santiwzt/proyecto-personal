import { getDemoStore } from "@/lib/database/demo/store";
import { generateId } from "@/lib/database/demo/ids";
import { AppError } from "@/lib/errors/app-error";
import { isDemoMode } from "@/config/env";
import { createSupabaseServerClient } from "@/lib/database/supabase/server";
import type { TrainingSession } from "@/types/domain";
import type { TrainingSessionsTable } from "@/types/database";

type NewTrainingSession = Omit<TrainingSession, "id" | "userId">;

function dbError(action: string, error: { message: string }): never {
  console.error(`Supabase error (${action}):`, error.message);
  throw new AppError("INTERNAL", "Ocurrio un error al acceder a la base de datos.");
}

function mapTrainingSession(row: TrainingSessionsTable["Row"]): TrainingSession {
  return {
    id: row.id,
    userId: row.user_id,
    activity: row.activity,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    notes: row.notes,
  };
}

export const trainingSessionsRepository = {
  async list(userId: string): Promise<TrainingSession[]> {
    if (isDemoMode) {
      return getDemoStore()
        .trainingSessions.list(userId)
        .sort((a, b) => b.startsAt.localeCompare(a.startsAt));
    }
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("training_sessions")
      .select("*")
      .eq("user_id", userId)
      .order("starts_at", { ascending: false });
    if (error) dbError("trainingSessions.list", error);
    return data.map(mapTrainingSession);
  },

  async create(userId: string, input: NewTrainingSession): Promise<TrainingSession> {
    if (isDemoMode) {
      return getDemoStore().trainingSessions.insert({ ...input, id: generateId("training"), userId });
    }
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("training_sessions")
      .insert({
        user_id: userId,
        activity: input.activity,
        starts_at: input.startsAt,
        ends_at: input.endsAt,
        notes: input.notes,
      })
      .select("*")
      .single();
    if (error) dbError("trainingSessions.create", error);
    return mapTrainingSession(data);
  },

  async remove(userId: string, id: string): Promise<void> {
    if (isDemoMode) {
      getDemoStore().trainingSessions.remove(userId, id);
      return;
    }
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.from("training_sessions").delete().eq("user_id", userId).eq("id", id);
    if (error) dbError("trainingSessions.remove", error);
  },
};
