import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Security requirement: the Supabase service role key must never be
 * reachable from client-bundled code (PROMPT MAESTRO section 20/26). This
 * statically scans the whole `src/` tree so a future accidental import
 * anywhere else fails CI immediately, rather than relying on code review.
 */

const SRC_DIR = join(__dirname, "../../src");
// admin.ts is the only file allowed to actually read the key; env.ts is
// allowed to *mention* its name in a comment explaining why it's excluded.
const ALLOWED_FILES = [join(SRC_DIR, "lib/database/supabase/admin.ts"), join(SRC_DIR, "config/env.ts")];

function listFilesRecursively(dir: string): string[] {
  const entries = readdirSync(dir);
  return entries.flatMap((entry) => {
    const fullPath = join(dir, entry);
    const stats = statSync(fullPath);
    if (stats.isDirectory()) return listFilesRecursively(fullPath);
    return stats.isFile() ? [fullPath] : [];
  });
}

describe("SUPABASE_SERVICE_ROLE_KEY isolation", () => {
  it("is referenced only from admin.ts (and mentioned in a comment in env.ts)", () => {
    const files = listFilesRecursively(SRC_DIR).filter((f) => /\.(ts|tsx)$/.test(f));
    const offenders = files.filter((file) => {
      if (ALLOWED_FILES.includes(file)) return false;
      const content = readFileSync(file, "utf-8");
      return content.includes("SUPABASE_SERVICE_ROLE_KEY");
    });
    expect(offenders).toEqual([]);
  });

  it("env.ts's shared, zod-validated env object never actually holds the key's value", () => {
    const content = readFileSync(join(SRC_DIR, "config/env.ts"), "utf-8");
    expect(content).not.toMatch(/SUPABASE_SERVICE_ROLE_KEY:\s*z\./);
    expect(content).not.toMatch(/SUPABASE_SERVICE_ROLE_KEY:\s*process\.env/);
  });

  it("admin.ts is never imported from a file marked \"use client\"", () => {
    const files = listFilesRecursively(SRC_DIR).filter((f) => /\.(ts|tsx)$/.test(f));
    const clientFilesImportingAdmin = files.filter((file) => {
      const content = readFileSync(file, "utf-8");
      const isClientComponent = /^["']use client["'];?/m.test(content.trimStart());
      return isClientComponent && content.includes("database/supabase/admin");
    });
    expect(clientFilesImportingAdmin).toEqual([]);
  });
});
