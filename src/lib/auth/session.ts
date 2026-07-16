import "server-only";
import { cookies } from "next/headers";
import { isDemoMode } from "@/config/env";
import { DEMO_USER_ID } from "@/lib/database/demo/ids";
import { AppError } from "@/lib/errors/app-error";

export const DEMO_SESSION_COOKIE = "nexo_demo_session";

export interface SessionUser {
  userId: string;
  displayName: string;
}

/**
 * Returns the current authenticated user, or null when signed out.
 * Demo mode: a cookie set by the "Continuar en modo demo" action.
 * Supabase mode: a real Supabase Auth session (see lib/database/supabase/server.ts).
 * Never trust a userId sent by the client — this is the only source of truth.
 */
export async function getSessionUser(): Promise<SessionUser | null> {
  if (isDemoMode) {
    const store = await cookies();
    const active = store.get(DEMO_SESSION_COOKIE)?.value === "active";
    if (!active) return null;
    return { userId: DEMO_USER_ID, displayName: "Santiago" };
  }

  const { createSupabaseServerClient } = await import("@/lib/database/supabase/server");
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  return {
    userId: user.id,
    displayName: (user.user_metadata?.["display_name"] as string | undefined) ?? user.email ?? "Usuario",
  };
}

export async function requireSessionUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) {
    throw new AppError("AUTHENTICATION", "Necesitas iniciar sesion para continuar.");
  }
  return user;
}
