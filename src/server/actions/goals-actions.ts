"use server";

import { revalidatePath } from "next/cache";
import { requireSessionUser } from "@/lib/auth/session";
import { createGoalSchema, updateGoalProgressSchema, type CreateGoalInput, type UpdateGoalProgressInput } from "@/lib/validation/schemas";
import { goalsRepository } from "@/server/repositories/goals-repository";
import type { Goal } from "@/types/domain";

export async function createGoalAction(input: CreateGoalInput): Promise<Goal> {
  const user = await requireSessionUser();
  const parsed = createGoalSchema.parse(input);
  const goal = await goalsRepository.create(user.userId, parsed);
  revalidatePath("/objetivos");
  return goal;
}

export async function updateGoalProgressAction(id: string, input: UpdateGoalProgressInput): Promise<Goal> {
  const user = await requireSessionUser();
  const parsed = updateGoalProgressSchema.parse(input);
  const goal = await goalsRepository.updateProgress(user.userId, id, parsed.progress);
  revalidatePath("/objetivos");
  return goal;
}

export async function deleteGoalAction(id: string): Promise<void> {
  const user = await requireSessionUser();
  await goalsRepository.remove(user.userId, id);
  revalidatePath("/objetivos");
}
