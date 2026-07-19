import { getDemoStore } from "@/lib/database/demo/store";
import { AppError } from "@/lib/errors/app-error";
import { isDemoMode } from "@/config/env";
import { createSupabaseServerClient } from "@/lib/database/supabase/server";
import { availabilityRepository } from "@/server/repositories/calendar-repository";
import type { Profile, UserPreferences } from "@/types/domain";
import type { ProfilesTable, UserPreferencesTable } from "@/types/database";

function dbError(action: string, error: { message: string }): never {
  console.error(`Supabase error (${action}):`, error.message);
  throw new AppError("INTERNAL", "Ocurrio un error al acceder a la base de datos.");
}

function mapProfile(row: ProfilesTable["Row"]): Profile {
  return {
    id: row.id,
    displayName: row.display_name,
    role: row.role,
    timeZone: row.time_zone,
    onboardingCompletedAt: row.onboarding_completed_at,
    createdAt: row.created_at,
  };
}

export const profileRepository = {
  async get(userId: string): Promise<Profile | null> {
    if (isDemoMode) return getDemoStore().getProfile(userId);
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
    if (error) dbError("profile.get", error);
    return data ? mapProfile(data) : null;
  },

  async upsert(userId: string, patch: Partial<Omit<Profile, "id">>): Promise<Profile> {
    if (isDemoMode) return getDemoStore().upsertProfile(userId, patch);
    const supabase = await createSupabaseServerClient();
    const dbPatch: Partial<ProfilesTable["Update"]> = {};
    if (patch.displayName !== undefined) dbPatch.display_name = patch.displayName;
    if (patch.role !== undefined) dbPatch.role = patch.role;
    if (patch.timeZone !== undefined) dbPatch.time_zone = patch.timeZone;
    if (patch.onboardingCompletedAt !== undefined) dbPatch.onboarding_completed_at = patch.onboardingCompletedAt;
    // The profiles row is auto-provisioned by the `handle_new_user` trigger
    // on signup, so it always exists by the time an authenticated user can
    // call this -- a plain update is enough, no need to upsert.
    const { data, error } = await supabase.from("profiles").update(dbPatch).eq("id", userId).select("*").single();
    if (error) dbError("profile.upsert", error);
    return mapProfile(data);
  },

  async completeOnboarding(userId: string, displayName: string, role: Profile["role"]): Promise<Profile> {
    return this.upsert(userId, { displayName, role, onboardingCompletedAt: new Date().toISOString() });
  },
};

function mapPreferences(row: UserPreferencesTable["Row"]): Omit<UserPreferences, "preferredStudyWindows"> {
  return {
    userId: row.user_id,
    locale: row.locale,
    dateFormat: row.date_format,
    weekStartsOn: row.week_starts_on,
    theme: row.theme,
    dailyStudyLimitMinutes: row.daily_study_limit_minutes,
    aiConsentGiven: row.ai_consent_given,
    monthlyBudgetArs: row.monthly_budget_ars,
    schoolCalendarIcsUrl: row.school_calendar_ics_url,
  };
}

export const preferencesRepository = {
  async get(userId: string): Promise<UserPreferences> {
    const preferredStudyWindows = (await availabilityRepository.list(userId)).filter((r) => r.kind === "disponible");

    if (isDemoMode) {
      const stored = getDemoStore().getPreferences(userId) ?? getDemoStore().upsertPreferences(userId, {});
      return { ...stored, preferredStudyWindows };
    }

    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.from("user_preferences").select("*").eq("user_id", userId).maybeSingle();
    if (error) dbError("preferences.get", error);
    if (data) return { ...mapPreferences(data), preferredStudyWindows };

    const { data: created, error: insertError } = await supabase
      .from("user_preferences")
      .insert({ user_id: userId })
      .select("*")
      .single();
    if (insertError) dbError("preferences.create-default", insertError);
    return { ...mapPreferences(created), preferredStudyWindows };
  },

  async update(
    userId: string,
    patch: Partial<Omit<UserPreferences, "userId" | "preferredStudyWindows">>,
  ): Promise<UserPreferences> {
    if (isDemoMode) {
      getDemoStore().upsertPreferences(userId, patch);
      return this.get(userId);
    }
    const supabase = await createSupabaseServerClient();
    const dbPatch: Partial<UserPreferencesTable["Update"]> = {};
    if (patch.locale !== undefined) dbPatch.locale = patch.locale;
    if (patch.dateFormat !== undefined) dbPatch.date_format = patch.dateFormat;
    if (patch.weekStartsOn !== undefined) dbPatch.week_starts_on = patch.weekStartsOn;
    if (patch.theme !== undefined) dbPatch.theme = patch.theme;
    if (patch.dailyStudyLimitMinutes !== undefined) dbPatch.daily_study_limit_minutes = patch.dailyStudyLimitMinutes;
    if (patch.aiConsentGiven !== undefined) dbPatch.ai_consent_given = patch.aiConsentGiven;
    if (patch.monthlyBudgetArs !== undefined) dbPatch.monthly_budget_ars = patch.monthlyBudgetArs;
    if (patch.schoolCalendarIcsUrl !== undefined) dbPatch.school_calendar_ics_url = patch.schoolCalendarIcsUrl;
    const { error } = await supabase.from("user_preferences").update(dbPatch).eq("user_id", userId);
    if (error) dbError("preferences.update", error);
    return this.get(userId);
  },
};
