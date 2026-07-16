import "server-only";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";

import { env } from "@/config/env";
import type { Database } from "@/types/database";

/**
 * !!! SERVER-ONLY. NEVER IMPORT THIS FILE FROM A CLIENT COMPONENT !!!
 *
 * This client authenticates with the Supabase *service role* key, which
 * bypasses Row Level Security entirely. It must only be used for trusted,
 * server-only operations that legitimately need cross-user or
 * RLS-bypassing access -- e.g. background file processing (extracting
 * text/generating embeddings for `file_chunks` after an upload), scheduled
 * jobs, or admin tooling.
 *
 * Hard rules:
 *   - Only ever read the key from `process.env.SUPABASE_SERVICE_ROLE_KEY`
 *     directly (never thread it through a NEXT_PUBLIC_ variable, never
 *     accept it as a function argument, never log it).
 *   - Never import this module from anything under a "use client" boundary,
 *     from src/app/**\/page.tsx client trees, or from any code path that
 *     could be bundled into the browser. The `server-only` import above
 *     makes an accidental client-side import a build-time error.
 *   - Every query issued through this client must manually re-check
 *     `user_id`/ownership in application code -- RLS will NOT do it here.
 */
function assertServiceRoleKeyConfigured(): string {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is not set. The admin Supabase client must never be " +
        "used without it -- set it in your server environment (never in a NEXT_PUBLIC_ " +
        "variable) before calling createSupabaseAdminClient().",
    );
  }
  return key;
}

export function createSupabaseAdminClient() {
  const serviceRoleKey = assertServiceRoleKeyConfigured();

  return createSupabaseClient<Database>(env.NEXT_PUBLIC_SUPABASE_URL ?? "", serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
