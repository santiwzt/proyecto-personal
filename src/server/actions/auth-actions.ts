"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { env, isDemoMode, isSupabaseConfigured } from "@/config/env";
import { DEMO_SESSION_COOKIE, requireSessionUser } from "@/lib/auth/session";
import { DEMO_USER_ID } from "@/lib/database/demo/ids";
import { resetDemoStore } from "@/lib/database/demo/store";
import { AppError } from "@/lib/errors/app-error";
import { profileRepository } from "@/server/repositories/profile-repository";
import {
  requestPasswordResetSchema,
  signInSchema,
  signUpSchema,
  updatePasswordSchema,
  type RequestPasswordResetInput,
  type SignInInput,
  type SignUpInput,
  type UpdatePasswordInput,
} from "@/lib/validation/schemas";

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

/**
 * Translates common Supabase Auth error messages to plain Spanish. Never
 * leaks raw provider detail to the client -- but DOES log the raw message
 * server-side (console.error at the call site) so it's visible in Vercel's
 * runtime logs when something doesn't match a known pattern below.
 */
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
  if (normalized.includes("rate limit") || normalized.includes("security purposes")) {
    return "Hiciste muchos intentos seguidos. Esperá un minuto y volvé a intentar.";
  }
  if (normalized.includes("database error")) {
    return "Ocurrio un error creando tu cuenta en el servidor. Ya lo estamos revisando.";
  }
  if (normalized.includes("password")) {
    return "La contraseña no cumple los requisitos minimos (al menos 8 caracteres).";
  }
  return "No pudimos completar la operacion. Intenta nuevamente.";
}

// Next.js strips the `message` off any *thrown* Server Action error before
// it reaches the client in production (by design, to avoid leaking server
// detail) -- so expected, user-facing outcomes here are returned as plain
// data instead of thrown, and only truly unexpected failures throw.
export type SignUpResult =
  | { ok: true; requiresEmailConfirmation: boolean }
  | { ok: false; message: string };

export async function signUpAction(input: SignUpInput): Promise<SignUpResult> {
  if (!isSupabaseConfigured) {
    return { ok: false, message: "El registro con email no esta disponible en modo demo." };
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
    console.error("Supabase signUp error:", error.status, error.message);
    return { ok: false, message: translateAuthError(error.message) };
  }

  // If email confirmation is required, Supabase returns a user but no
  // session yet -- the account exists but can't sign in until confirmed.
  const requiresEmailConfirmation = !data.session;
  if (!requiresEmailConfirmation) {
    redirect("/onboarding");
  }
  return { ok: true, requiresEmailConfirmation };
}

export type SignInResult = { ok: true } | { ok: false; message: string };

export async function signInAction(input: SignInInput): Promise<SignInResult> {
  if (!isSupabaseConfigured) {
    return { ok: false, message: "El inicio de sesion con email no esta disponible en modo demo." };
  }
  const parsed = signInSchema.parse(input);

  const { createSupabaseServerClient } = await import("@/lib/database/supabase/server");
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.email,
    password: parsed.password,
  });

  if (error) {
    console.error("Supabase signIn error:", error.status, error.message);
    return { ok: false, message: translateAuthError(error.message) };
  }
  redirect("/hoy");
}

export type RequestPasswordResetResult = { ok: true } | { ok: false; message: string };

/**
 * Always reports success (even in demo mode, even when Supabase reports an
 * error) so the response can never be used to check whether an email is
 * registered -- a real error is still logged server-side for diagnosis.
 */
export async function requestPasswordResetAction(input: RequestPasswordResetInput): Promise<RequestPasswordResetResult> {
  if (!isSupabaseConfigured) {
    return { ok: false, message: "Esta funcion no esta disponible en modo demo." };
  }
  const parsed = requestPasswordResetSchema.parse(input);

  const { createSupabaseServerClient } = await import("@/lib/database/supabase/server");
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.email, {
    redirectTo: `${env.NEXT_PUBLIC_APP_URL}/auth/confirm?next=${encodeURIComponent("/restablecer-contrasena")}`,
  });
  if (error) {
    console.error("Supabase resetPasswordForEmail error:", error.status, error.message);
  }
  return { ok: true };
}

export type UpdatePasswordResult = { ok: true } | { ok: false; message: string };

export async function updatePasswordAction(input: UpdatePasswordInput): Promise<UpdatePasswordResult> {
  if (!isSupabaseConfigured) {
    return { ok: false, message: "Esta funcion no esta disponible en modo demo." };
  }
  const parsed = updatePasswordSchema.parse(input);

  const { createSupabaseServerClient } = await import("@/lib/database/supabase/server");
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.password });
  if (error) {
    console.error("Supabase updateUser error:", error.status, error.message);
    return {
      ok: false,
      message: "No pudimos actualizar tu contraseña. El link puede haber vencido -- pedi uno nuevo desde el login.",
    };
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

export type DeleteAccountResult = { ok: true } | { ok: false; message: string };

/**
 * Permanently deletes every row this user owns. In Supabase mode this is a
 * single `auth.admin.deleteUser` call -- every table cascades from
 * `profiles.id`, which itself cascades from `auth.users.id` (see the
 * migrations), so there is nothing else to clean up manually. In demo mode
 * there's only one shared demo user, so "deleting" it means resetting the
 * whole in-memory store back to fresh seed data.
 */
export async function deleteAccountAction(): Promise<DeleteAccountResult> {
  const user = await requireSessionUser();

  if (isDemoMode) {
    resetDemoStore();
    const store = await cookies();
    store.delete(DEMO_SESSION_COOKIE);
    redirect("/login");
  }

  const { createSupabaseAdminClient } = await import("@/lib/database/supabase/admin");
  const admin = createSupabaseAdminClient();
  const { error } = await admin.auth.admin.deleteUser(user.userId);
  if (error) {
    console.error("Supabase deleteUser error:", error.status, error.message);
    return { ok: false, message: "No pudimos eliminar tu cuenta. Intenta nuevamente en unos minutos." };
  }

  const { createSupabaseServerClient } = await import("@/lib/database/supabase/server");
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/login");
}
