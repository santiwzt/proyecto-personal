import { getDemoStore } from "@/lib/database/demo/store";
import { generateId } from "@/lib/database/demo/ids";
import { AppError } from "@/lib/errors/app-error";
import { isDemoMode } from "@/config/env";
import { createSupabaseServerClient } from "@/lib/database/supabase/server";
import type { GeneratedPlan, PlannerRun, PlannerRunStatus } from "@/types/domain";
import type { PlannerRunsTable } from "@/types/database";

function dbError(action: string, error: { message: string }): never {
  console.error(`Supabase error (${action}):`, error.message);
  throw new AppError("INTERNAL", "Ocurrio un error al acceder a la base de datos.");
}

function mapPlannerRun(row: PlannerRunsTable["Row"]): PlannerRun {
  return {
    id: row.id,
    userId: row.user_id,
    weekStart: row.week_start,
    plan: row.plan as unknown as GeneratedPlan,
    status: row.status,
    approvedBlockIds: row.approved_block_ids,
    createdAt: row.created_at,
  };
}

export const plannerRepository = {
  async list(userId: string): Promise<PlannerRun[]> {
    if (isDemoMode) {
      return getDemoStore()
        .plannerRuns.list(userId)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    }
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("planner_runs")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (error) dbError("planner.list", error);
    return data.map(mapPlannerRun);
  },

  async get(userId: string, id: string): Promise<PlannerRun> {
    if (isDemoMode) {
      const run = getDemoStore().plannerRuns.get(userId, id);
      if (!run) throw new AppError("NOT_FOUND", "No encontramos esa propuesta de planificacion.");
      return run;
    }
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("planner_runs")
      .select("*")
      .eq("user_id", userId)
      .eq("id", id)
      .single();
    if (error) throw new AppError("NOT_FOUND", "No encontramos esa propuesta de planificacion.");
    return mapPlannerRun(data);
  },

  async create(userId: string, weekStart: string, plan: GeneratedPlan): Promise<PlannerRun> {
    if (isDemoMode) {
      return getDemoStore().plannerRuns.insert({
        id: generateId("plan"),
        userId,
        weekStart,
        plan,
        status: "propuesto",
        approvedBlockIds: [],
        createdAt: new Date().toISOString(),
      });
    }
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("planner_runs")
      .insert({ user_id: userId, week_start: weekStart, plan: plan as never })
      .select("*")
      .single();
    if (error) dbError("planner.create", error);
    return mapPlannerRun(data);
  },

  async updateStatus(
    userId: string,
    id: string,
    status: PlannerRunStatus,
    approvedBlockIds: string[],
  ): Promise<PlannerRun> {
    if (isDemoMode) return getDemoStore().plannerRuns.update(userId, id, { status, approvedBlockIds });
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("planner_runs")
      .update({ status, approved_block_ids: approvedBlockIds })
      .eq("user_id", userId)
      .eq("id", id)
      .select("*")
      .single();
    if (error) dbError("planner.updateStatus", error);
    return mapPlannerRun(data);
  },
};
