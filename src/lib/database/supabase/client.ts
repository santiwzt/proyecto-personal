"use client";

import { createBrowserClient } from "@supabase/ssr";

import { env } from "@/config/env";
import type { Database } from "@/types/database";

/**
 * Browser-side Supabase client, safe to import from Client Components.
 * Only ever uses the public URL + anon key (both readable by the browser) --
 * never import the service role client (`./admin`) from anywhere reachable
 * by client code.
 *
 * Call this once per component tree that needs it; `@supabase/ssr`'s
 * `createBrowserClient` is cheap to call multiple times and internally
 * reuses the underlying auth storage, but memoizing the instance (e.g. via
 * a singleton or a React context) is recommended to avoid creating a new
 * client on every render.
 */
export function createSupabaseBrowserClient() {
  return createBrowserClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
  );
}
