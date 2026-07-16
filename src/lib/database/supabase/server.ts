import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

import { env } from "@/config/env";
import type { Database } from "@/types/database";

/**
 * Server-side Supabase client for use in Server Components, Server Actions
 * and Route Handlers. Wired to the Next.js `cookies()` API so the user's
 * auth session (set via cookies by the Supabase auth helpers) is read and,
 * where possible, refreshed transparently.
 *
 * Next.js 16's `cookies()` is async, so this factory is async too -- always
 * `await createSupabaseServerClient()` at the call site.
 *
 * Server Components cannot write cookies (Next.js will throw if you try),
 * so the `set`/`remove` calls below are wrapped in a try/catch: they no-op
 * there and rely on middleware (or a Route Handler / Server Action) to
 * persist refreshed session cookies instead. This mirrors the official
 * `@supabase/ssr` Next.js App Router recipe.
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Called from a Server Component: cookies can't be set here.
            // Safe to ignore as long as middleware refreshes the session.
          }
        },
      },
    },
  );
}
