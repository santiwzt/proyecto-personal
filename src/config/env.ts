import { z } from "zod";

/**
 * All environment variables the app can use, validated once at import time.
 * Never read `process.env` directly anywhere else — import `env` from here.
 *
 * Exception: `SUPABASE_SERVICE_ROLE_KEY` is deliberately NOT parsed into
 * this shared object. It is read only inside
 * `src/lib/database/supabase/admin.ts`, directly from `process.env`, so
 * that file is the single place in the codebase where that secret's name
 * appears (enforced by tests/unit/no-service-key-leak.test.ts). Server-only
 * secrets that ARE here (ANTHROPIC_API_KEY, ...) must never be re-exported
 * to a Client Component.
 */
const envSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
  NEXT_PUBLIC_DATA_MODE: z.enum(["demo", "supabase"]).default("demo"),

  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional().or(z.literal("")),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().optional().or(z.literal("")),

  ANTHROPIC_API_KEY: z.string().optional().or(z.literal("")),
  AI_MODEL: z.string().default("claude-sonnet-5"),
  EMBEDDING_PROVIDER: z.string().optional().or(z.literal("")),
  EMBEDDING_API_KEY: z.string().optional().or(z.literal("")),

  MAX_UPLOAD_SIZE_MB: z.coerce.number().int().positive().default(20),
  AI_DAILY_REQUEST_LIMIT: z.coerce.number().int().positive().default(50),

  NEXT_PUBLIC_VAPID_PUBLIC_KEY: z.string().optional().or(z.literal("")),
  VAPID_PRIVATE_KEY: z.string().optional().or(z.literal("")),
  VAPID_SUBJECT: z.string().default("mailto:notificaciones@nexo-personal-os.app"),
  CRON_SECRET: z.string().optional().or(z.literal("")),
});

const parsed = envSchema.safeParse({
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  NEXT_PUBLIC_DATA_MODE: process.env.NEXT_PUBLIC_DATA_MODE,
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
  AI_MODEL: process.env.AI_MODEL,
  EMBEDDING_PROVIDER: process.env.EMBEDDING_PROVIDER,
  EMBEDDING_API_KEY: process.env.EMBEDDING_API_KEY,
  MAX_UPLOAD_SIZE_MB: process.env.MAX_UPLOAD_SIZE_MB,
  AI_DAILY_REQUEST_LIMIT: process.env.AI_DAILY_REQUEST_LIMIT,
  NEXT_PUBLIC_VAPID_PUBLIC_KEY: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY: process.env.VAPID_PRIVATE_KEY,
  VAPID_SUBJECT: process.env.VAPID_SUBJECT,
  CRON_SECRET: process.env.CRON_SECRET,
});

if (!parsed.success) {
  throw new Error(`Invalid environment variables: ${parsed.error.message}`);
}

export const env = parsed.data;

export const isDemoMode = env.NEXT_PUBLIC_DATA_MODE === "demo";
export const isSupabaseConfigured =
  env.NEXT_PUBLIC_DATA_MODE === "supabase" &&
  !!env.NEXT_PUBLIC_SUPABASE_URL &&
  !!env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
export const isAiConfigured = !!env.ANTHROPIC_API_KEY;
export const isPushConfigured = !!env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && !!env.VAPID_PRIVATE_KEY;
