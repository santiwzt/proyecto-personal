"use server";

import { revalidatePath } from "next/cache";
import { requireSessionUser } from "@/lib/auth/session";
import { trainingSessionsRepository } from "@/server/repositories/training-repository";
import { createTrainingSessionSchema, type CreateTrainingSessionInput } from "@/lib/validation/schemas";
import type { TrainingSession } from "@/types/domain";

export async function createTrainingSessionAction(input: CreateTrainingSessionInput): Promise<TrainingSession> {
  const user = await requireSessionUser();
  const parsed = createTrainingSessionSchema.parse(input);
  const session = await trainingSessionsRepository.create(user.userId, parsed);
  revalidatePath("/entrenamiento");
  return session;
}

export async function deleteTrainingSessionAction(id: string): Promise<void> {
  const user = await requireSessionUser();
  await trainingSessionsRepository.remove(user.userId, id);
  revalidatePath("/entrenamiento");
}
