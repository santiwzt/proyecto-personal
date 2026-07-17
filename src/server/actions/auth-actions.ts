"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { env, isDemoMode, isSupabaseConfigured } from "@/config/env";
import { DEMO_SESSION_COOKIE } from "@/lib/auth/session";
import { DEMO_USER_ID } from "@/lib/database/demo/ids";
import { AppError } from "@/lib/errors/app-error";
import { profileRepository } from "@/server/repositories/profile-repository";
import { signInSchema, signUpSchema, type SignInInput, type SignUpInput } from "@/lib/validation/schemas";

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
  const profile = await profileRepository.get(DEMO_USER_ID);
  redirect(profile?.onboardingCompletedAt ? "/hoy" : "/onboarding");
}

/** Translates common Supabase Auth error messages to plain Spanish. Never leaks raw provider detail. */
function translateAuthError(message: string): string {
  const normalized = message.toLowerCase();
  if (normalized.includes("already registered") || normalized.includes("already exists")) {
    return "Ya existe una cuenta con ese email.";
  }
  if (normalized.includes("invalid login credentials")) {
    return "Email o contraseña incorrectos.";
  }
  if (normalized.includes("email not confirmed")) {
    return "Todavia no confirmaste tu email. Revisa tu casilla de correo.";
  }
  if (normalized.includes("password")) {
    return "La contraseña no cumple los requisitos minimos (al menos 8 caracteres).";
  }
  return "No pudimos completar la operacion. Intenta nuevamente.";
}

export interface SignUpResult {
  requiresEmailConfirmation: boolean;
}

export async function signUpAction(input: SignUpInput): Promise<SignUpResult> {
  if (!isSupabaseConfigured) {
    throw new AppError("VALIDATION", "El registro con email no esta disponible en modo demo.");
  }
  const parsed = signUpSchema.parse(input);

  const { createSupabaseServerClient } = await import("@/lib/database/supabase/server");
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.email,
    password: parsed.password,
    options: {
      data: { display_name: parsed.displayName },
      emailRedirectTo: `${env.NEXT_PUBLIC_APP_URL}/auth/confirm`,
    },
  });

  if (error) {
    throw new AppError("VALIDATION", translateAuthError(error.message));
  }

  // If email confirmation is required, Supabase returns a user but no
  // session yet -- the account exists but can't sign in until confirmed.
  const requiresEmailConfirmation = !data.session;
  if (!requiresEmailConfirmation) {
    redirect("/onboarding");
  }
  return { requiresEmailConfirmation };
}

export async function signInAction(input: SignInInput): Promise<void> {
  if (!isSupabaseConfigured) {
    throw new AppError("VALIDATION", "El inicio de sesion con email no esta disponible en modo demo.");
  }
  const parsed = signInSchema.parse(input);

  const { createSupabaseServerClient } = await import("@/lib/database/supabase/server");
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.email,
    password: parsed.password,
  });

  if (error) {
    throw new AppError("AUTHENTICATION", translateAuthError(error.message));
  }
  redirect("/hoy");
}

export async function endSession(): Promise<void> {
  if (isSupabaseConfigured) {
    const { createSupabaseServerClient } = await import("@/lib/database/supabase/server");
    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut();
  }
  const store = await cookies();
  store.delete(DEMO_SESSION_COOKIE);
  redirect("/login");
}
