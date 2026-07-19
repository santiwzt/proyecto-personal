"use server";

import { revalidatePath } from "next/cache";
import { requireSessionUser } from "@/lib/auth/session";
import { AppError } from "@/lib/errors/app-error";
import { fetchIcsText } from "@/lib/integrations/ics-fetch";
import {
  createExpenseSchema,
  updateProfileSchema,
  updateSchoolCalendarUrlSchema,
  type CreateExpenseInput,
  type UpdateProfileInput,
  type UpdateSchoolCalendarUrlInput,
} from "@/lib/validation/schemas";
import { expensesRepository } from "@/server/repositories/misc-repository";
import { preferencesRepository, profileRepository } from "@/server/repositories/profile-repository";
import { parseIcsCalendar } from "@/server/services/school-calendar";
import type { Expense, Profile, UserPreferences } from "@/types/domain";

export async function createExpenseAction(input: CreateExpenseInput): Promise<Expense> {
  const user = await requireSessionUser();
  const parsed = createExpenseSchema.parse(input);
  const expense = await expensesRepository.create(user.userId, parsed);
  revalidatePath("/gastos");
  return expense;
}

export async function updatePreferencesAction(
  patch: Partial<Pick<UserPreferences, "theme" | "dailyStudyLimitMinutes" | "aiConsentGiven" | "monthlyBudgetArs">>,
): Promise<UserPreferences> {
  const user = await requireSessionUser();
  if (
    patch.monthlyBudgetArs !== undefined &&
    patch.monthlyBudgetArs !== null &&
    (!Number.isFinite(patch.monthlyBudgetArs) || patch.monthlyBudgetArs < 0)
  ) {
    throw new AppError("VALIDATION", "El presupuesto debe ser un numero positivo.");
  }
  const updated = await preferencesRepository.update(user.userId, patch);
  revalidatePath("/configuracion");
  revalidatePath("/gastos");
  return updated;
}

export async function updateProfileAction(input: UpdateProfileInput): Promise<Profile> {
  const user = await requireSessionUser();
  const parsed = updateProfileSchema.parse(input);
  const updated = await profileRepository.upsert(user.userId, parsed);
  revalidatePath("/configuracion");
  return updated;
}

export type UpdateSchoolCalendarUrlResult = { ok: true } | { ok: false; message: string };

export async function updateSchoolCalendarUrlAction(
  input: UpdateSchoolCalendarUrlInput,
): Promise<UpdateSchoolCalendarUrlResult> {
  const user = await requireSessionUser();
  const parsed = updateSchoolCalendarUrlSchema.parse(input);

  if (parsed.icsUrl) {
    try {
      const icsText = await fetchIcsText(parsed.icsUrl);
      const calendar = parseIcsCalendar(icsText);
      const hasEvents = Object.values(calendar).some(
        (component) => component && typeof component === "object" && component.type === "VEVENT",
      );
      if (!hasEvents) {
        return { ok: false, message: "Esa URL no tiene ningun evento -- revisa que sea el link correcto." };
      }
    } catch (error) {
      return { ok: false, message: error instanceof Error ? error.message : "No pudimos leer ese calendario." };
    }
  }

  try {
    await preferencesRepository.update(user.userId, { schoolCalendarIcsUrl: parsed.icsUrl });
  } catch (error) {
    console.error("updateSchoolCalendarUrlAction: preferences update failed", error);
    return {
      ok: false,
      message: "No pudimos guardar el calendario. Intenta nuevamente en unos minutos.",
    };
  }
  revalidatePath("/configuracion");
  revalidatePath("/agenda");
  return { ok: true };
}
