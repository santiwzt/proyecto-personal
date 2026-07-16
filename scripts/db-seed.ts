/**
 * pnpm db:seed
 *
 * Loads supabase/seed.sql -- DEMO/DEVELOPMENT fixture data only, never for
 * production -- into a real Postgres/Supabase database.
 *
 *   1. Prefers the Supabase CLI (`supabase db execute --file supabase/seed.sql`).
 *   2. Falls back to `psql "$DATABASE_URL" -f supabase/seed.sql`.
 *   3. Otherwise prints exactly what to install/configure and exits 1 --
 *      it never pretends to succeed.
 */
import path from "node:path";

import { commandExists, fail, run } from "./_lib/shell";

const SEED_FILE = path.join(process.cwd(), "supabase", "seed.sql");

function main(): void {
  console.warn(
    "[db:seed] WARNING: this loads fixed-UUID demo data (supabase/seed.sql). " +
      "Never run this against a production project.",
  );

  const hasSupabaseCli = commandExists("supabase");
  const databaseUrl = process.env.DATABASE_URL;

  if (hasSupabaseCli) {
    console.log("[db:seed] Supabase CLI found. Running `supabase db execute --file supabase/seed.sql`...");
    const code = run("supabase", ["db", "execute", "--file", SEED_FILE]);
    if (code !== 0) {
      fail(
        "[db:seed] `supabase db execute` failed (see output above). Common causes: the project " +
          "isn't linked yet (`supabase link --project-ref <your-project-ref>`) or migrations " +
          "haven't been applied yet (`pnpm db:migrate`).",
      );
    }
    console.log("[db:seed] Done.");
    return;
  }

  if (databaseUrl && commandExists("psql")) {
    console.log("[db:seed] Supabase CLI not found; seeding directly via psql...");
    const code = run("psql", [databaseUrl, "-v", "ON_ERROR_STOP=1", "-f", SEED_FILE]);
    if (code !== 0) {
      fail(`[db:seed] psql exited with code ${code} while applying ${SEED_FILE}. Aborting.`);
    }
    console.log("[db:seed] Done.");
    return;
  }

  fail(
    [
      "[db:seed] Cannot seed the database: no working Supabase CLI and no DATABASE_URL + psql fallback.",
      "",
      "Fix ONE of the following, then re-run `pnpm db:seed`:",
      "",
      "  Option A -- Supabase CLI (recommended):",
      "    1. npm install -g supabase        (or: brew install supabase/tap/supabase)",
      "    2. supabase login && supabase link --project-ref <your-project-ref>",
      "    3. pnpm db:migrate   (run migrations first, then seed)",
      "",
      "  Option B -- Direct psql:",
      "    1. Install the PostgreSQL client (provides the `psql` binary).",
      "    2. Set DATABASE_URL to your Supabase project's connection string.",
      "    3. pnpm db:migrate   (run migrations first, then seed)",
      "",
      "This script never silently no-ops -- one of the above must succeed.",
    ].join("\n"),
  );
}

main();
