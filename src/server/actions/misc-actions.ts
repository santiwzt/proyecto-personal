"use server";

import { revalidatePath } from "next/cache";
import { requireSessionUser } from "@/lib/auth/session";
import {
  createExpenseSchema,
  updateProfileSchema,
  type CreateExpenseInput,
  type UpdateProfileInput,
} from "@/lib/validation/schemas";
import { expensesRepository } from "@/server/repositories/misc-repository";
import { preferencesRepository, profileRepository } from "@/server/repositories/profile-repository";
import type { Expense, Profile, UserPreferences } from "@/types/domain";

export async function createExpenseAction(input: CreateExpenseInput): Promise<Expense> {
  const user = await requireSessionUser();
  const parsed = createExpenseSchema.parse(input);
  const expense = await expensesRepository.create(user.userId, parsed);
  revalidatePath("/gastos");
  return expense;
}

export async function updatePreferencesAction(
  patch: Partial<Pick<UserPreferences, "theme" | "dailyStudyLimitMinutes" | "aiConsentGiven">>,
): Promise<UserPreferences> {
  const user = await requireSessionUser();
  const updated = await preferencesRepository.update(user.userId, patch);
  revalidatePath("/configuracion");
  return updated;
}

export async function updateProfileAction(input: UpdateProfileInput): Promise<Profile> {
  const user = await requireSessionUser();
  const parsed = updateProfileSchema.parse(input);
  const updated = await profileRepository.upsert(user.userId, parsed);
  revalidatePath("/configuracion");
  return updated;
}
