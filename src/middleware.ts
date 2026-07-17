import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { env, isSupabaseConfigured } from "@/config/env";

/**
 * Refreshes the Supabase auth session cookie on every request. Required by
 * @supabase/ssr for the App Router: Server Components can't write cookies,
 * so without this, a session nearing expiry would silently stop refreshing
 * and the user would get logged out. No-ops entirely in demo mode.
 */
export async function middleware(request: NextRequest) {
  if (!isSupabaseConfigured) {
    return NextResponse.next();
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(env.NEXT_PUBLIC_SUPABASE_URL ?? "", env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "", {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        supabaseResponse = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          supabaseResponse.cookies.set(name, value, options);
        }
      },
    },
  });

  // Calling getUser() (not getSession()) forces a round-trip that validates
  // and, when needed, refreshes the token -- getSession() alone trusts a
  // possibly-stale local cookie.
  await supabase.auth.getUser();

  return supabaseResponse;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
