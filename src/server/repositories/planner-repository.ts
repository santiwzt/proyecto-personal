import { getDemoStore } from "@/lib/database/demo/store";
import { generateId } from "@/lib/database/demo/ids";
import { AppError } from "@/lib/errors/app-error";
import type { GeneratedPlan, PlannerRun, PlannerRunStatus } from "@/types/domain";

export const plannerRepository = {
  list(userId: string): PlannerRun[] {
    return getDemoStore()
      .plannerRuns.list(userId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },
  get(userId: string, id: string): PlannerRun {
    const run = getDemoStore().plannerRuns.get(userId, id);
    if (!run) throw new AppError("NOT_FOUND", "No encontramos esa propuesta de planificacion.");
    return run;
  },
  create(userId: string, weekStart: string, plan: GeneratedPlan): PlannerRun {
    return getDemoStore().plannerRuns.insert({
      id: generateId("plan"),
      userId,
      weekStart,
      plan,
      status: "propuesto",
      approvedBlockIds: [],
      createdAt: new Date().toISOString(),
    });
  },
  updateStatus(userId: string, id: string, status: PlannerRunStatus, approvedBlockIds: string[]): PlannerRun {
    return getDemoStore().plannerRuns.update(userId, id, { status, approvedBlockIds });
  },
};
