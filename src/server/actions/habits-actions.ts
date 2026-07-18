"use server";

import { revalidatePath } from "next/cache";
import { requireSessionUser } from "@/lib/auth/session";
import { habitLogsRepository, habitsRepository } from "@/server/repositories/habits-repository";
import { createHabitSchema, type CreateHabitInput } from "@/lib/validation/schemas";
import type { Habit, HabitLog } from "@/types/domain";

export async function createHabitAction(input: CreateHabitInput): Promise<Habit> {
  const user = await requireSessionUser();
  const parsed = createHabitSchema.parse(input);
  const habit = await habitsRepository.create(user.userId, parsed);
  revalidatePath("/habitos");
  return habit;
}

export async function archiveHabitAction(id: string): Promise<void> {
  const user = await requireSessionUser();
  await habitsRepository.archive(user.userId, id);
  revalidatePath("/habitos");
}

export async function toggleHabitLogAction(habitId: string, date: string): Promise<HabitLog> {
  const user = await requireSessionUser();
  const log = await habitLogsRepository.toggle(user.userId, habitId, date);
  revalidatePath("/habitos");
  revalidatePath("/hoy");
  return log;
}
