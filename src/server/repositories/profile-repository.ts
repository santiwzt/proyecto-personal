import { getDemoStore } from "@/lib/database/demo/store";
import { availabilityRepository } from "@/server/repositories/calendar-repository";
import type { Profile, UserPreferences } from "@/types/domain";

export const profileRepository = {
  get(userId: string): Profile | null {
    return getDemoStore().getProfile(userId);
  },
  upsert(userId: string, patch: Partial<Omit<Profile, "id">>): Profile {
    return getDemoStore().upsertProfile(userId, patch);
  },
  completeOnboarding(userId: string, displayName: string, role: Profile["role"]): Profile {
    return getDemoStore().upsertProfile(userId, {
      displayName,
      role,
      onboardingCompletedAt: new Date().toISOString(),
    });
  },
};

export const preferencesRepository = {
  get(userId: string): UserPreferences {
    const stored = getDemoStore().getPreferences(userId) ?? getDemoStore().upsertPreferences(userId, {});
    return {
      ...stored,
      preferredStudyWindows: availabilityRepository.list(userId).filter((r) => r.kind === "disponible"),
    };
  },
  update(userId: string, patch: Partial<Omit<UserPreferences, "userId" | "preferredStudyWindows">>): UserPreferences {
    getDemoStore().upsertPreferences(userId, patch);
    return this.get(userId);
  },
};
