"use server";

import { revalidatePath } from "next/cache";
import { requireSessionUser } from "@/lib/auth/session";
import { createExpenseSchema, type CreateExpenseInput } from "@/lib/validation/schemas";
import { expensesRepository } from "@/server/repositories/misc-repository";
import { preferencesRepository } from "@/server/repositories/profile-repository";
import type { Expense, UserPreferences } from "@/types/domain";

export async function createExpenseAction(input: CreateExpenseInput): Promise<Expense> {
  const user = await requireSessionUser();
  const parsed = createExpenseSchema.parse(input);
  const expense = expensesRepository.create(user.userId, parsed);
  revalidatePath("/gastos");
  return expense;
}

export async function updatePreferencesAction(
  patch: Partial<Pick<UserPreferences, "theme" | "dailyStudyLimitMinutes" | "aiConsentGiven">>,
): Promise<UserPreferences> {
  const user = await requireSessionUser();
  const updated = preferencesRepository.update(user.userId, patch);
  revalidatePath("/configuracion");
  return updated;
}
