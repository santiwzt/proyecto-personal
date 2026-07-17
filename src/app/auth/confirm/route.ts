import { redirect } from "next/navigation";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/database/supabase/server";

/**
 * Where Supabase Auth's confirmation/reset emails send the user after they
 * click the link. Handles both shapes Supabase can use to deliver the
 * token, depending on project/template config:
 *   - PKCE: ?code=...                          -> exchangeCodeForSession
 *   - OTP-hash: ?token_hash=...&type=signup     -> verifyOtp
 * Either way, on success this establishes the real session cookie (via the
 * server client's cookie adapter) and sends the user into the app.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next") ?? "/onboarding";

  const supabase = await createSupabaseServerClient();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) redirect(next);
  } else if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
    if (!error) redirect(next);
  }

  redirect("/login?error=confirmacion_invalida");
}
