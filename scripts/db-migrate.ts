/**
 * pnpm db:migrate
 *
 * Applies every file in supabase/migrations/ (in filename order) to a real
 * Postgres/Supabase database. There is no Supabase CLI or live project
 * baked into this sandbox, so this script:
 *
 *   1. Prefers the Supabase CLI (`supabase db push`) when it's installed
 *      and the project has been linked.
 *   2. Falls back to applying each migration file directly with `psql`
 *      when DATABASE_URL is set and `psql` is available.
 *   3. Otherwise prints exactly what to install/configure and exits 1 --
 *      it never pretends to succeed.
 */
import { readdirSync } from "node:fs";
import path from "node:path";

import { commandExists, fail, run } from "./_lib/shell";

const MIGRATIONS_DIR = path.join(process.cwd(), "supabase", "migrations");

function listMigrationFiles(): string[] {
  return readdirSync(MIGRATIONS_DIR)
    .filter((file) => file.endsWith(".sql"))
    .sort();
}

function main(): void {
  const hasSupabaseCli = commandExists("supabase");
  const databaseUrl = process.env.DATABASE_URL;

  if (hasSupabaseCli) {
    console.log("[db:migrate] Supabase CLI found. Running `supabase db push`...");
    const code = run("supabase", ["db", "push"]);
    if (code !== 0) {
      fail(
        "[db:migrate] `supabase db push` failed (see output above). Common causes: the " +
          "project isn't linked yet (`supabase link --project-ref <your-project-ref>`) or " +
          "you're not logged in (`supabase login`).",
      );
    }
    console.log("[db:migrate] Done.");
    return;
  }

  if (databaseUrl && commandExists("psql")) {
    console.log(
      "[db:migrate] Supabase CLI not found; applying supabase/migrations/*.sql directly via psql...",
    );
    const files = listMigrationFiles();
    if (files.length === 0) {
      fail(`[db:migrate] No .sql files found in ${MIGRATIONS_DIR}.`);
    }
    for (const file of files) {
      const fullPath = path.join(MIGRATIONS_DIR, file);
      console.log(`[db:migrate] Applying ${file}...`);
      const code = run("psql", [databaseUrl, "-v", "ON_ERROR_STOP=1", "-f", fullPath]);
      if (code !== 0) {
        fail(`[db:migrate] Failed applying ${file} (psql exit code ${code}). Aborting.`);
      }
    }
    console.log(`[db:migrate] Applied ${files.length} migration file(s) successfully.`);
    return;
  }

  fail(
    [
      "[db:migrate] Cannot run migrations: no working Supabase CLI and no DATABASE_URL + psql fallback.",
      "",
      "Fix ONE of the following, then re-run `pnpm db:migrate`:",
      "",
      "  Option A -- Supabase CLI (recommended):",
      "    1. npm install -g supabase        (or: brew install supabase/tap/supabase)",
      "    2. supabase login",
      "    3. supabase link --project-ref <your-project-ref>",
      "",
      "  Option B -- Direct psql:",
      "    1. Install the PostgreSQL client (provides the `psql` binary).",
      "    2. Set DATABASE_URL to your Supabase project's connection string",
      "       (Supabase Dashboard -> Project Settings -> Database -> Connection string -> URI).",
      "",
      "This script never silently no-ops -- one of the above must succeed.",
    ].join("\n"),
  );
}

main();
