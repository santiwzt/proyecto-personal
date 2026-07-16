"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { isDemoMode } from "@/config/env";
import { DEMO_SESSION_COOKIE } from "@/lib/auth/session";
import { DEMO_USER_ID } from "@/lib/database/demo/ids";
import { AppError } from "@/lib/errors/app-error";
import { profileRepository } from "@/server/repositories/profile-repository";

const THIRTY_DAYS_SECONDS = 60 * 60 * 24 * 30;

export async function startDemoSession(): Promise<void> {
  if (!isDemoMode) {
    throw new AppError("VALIDATION", "El modo demo no esta disponible con esta configuracion.");
  }
  const store = await cookies();
  store.set(DEMO_SESSION_COOKIE, "active", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: THIRTY_DAYS_SECONDS,
  });
  const profile = profileRepository.get(DEMO_USER_ID);
  redirect(profile?.onboardingCompletedAt ? "/hoy" : "/onboarding");
}

export async function endSession(): Promise<void> {
  const store = await cookies();
  store.delete(DEMO_SESSION_COOKIE);
  redirect("/login");
}
