# Security

## Reporting a vulnerability

This is a personal/portfolio project without a dedicated security team.
If you find a vulnerability, please open a private report (GitHub Security
Advisories on this repository) rather than a public issue, so it can be
fixed before details are public. There is no bug bounty.

## Secrets handling

- `.env.local` is git-ignored and must never be committed. `.env.example`
  documents variable names only, with empty values.
- `SUPABASE_SERVICE_ROLE_KEY` is read in exactly one file,
  `src/lib/database/supabase/admin.ts`, directly from `process.env` (never
  threaded through the shared `env` object, never exposed as
  `NEXT_PUBLIC_*`). This is enforced by a static test
  (`tests/unit/no-service-key-leak.test.ts`), not just convention.
- `ANTHROPIC_API_KEY` and other server-only secrets in `src/config/env.ts`
  are read server-side only; nothing re-exports them to a Client Component.
- No secret is ever logged. AI usage is recorded (`ai_usage` /
  `aiUsageRepository`) as counters/metadata only — never the prompt,
  response, or reasoning content.

## Data isolation

- **Demo mode**: `InMemoryCollection` (`src/lib/database/demo/collection.ts`)
  throws on any attempt to read or write a row owned by a different user —
  the same rule a database-level policy would enforce, exercised by
  `tests/unit/cross-user-isolation.test.ts`.
- **Supabase mode**: every table in `supabase/migrations` has Row Level
  Security enabled with a `user_id = auth.uid()` policy (or the equivalent
  join for tables without a direct `user_id` column — see
  `0009_rls_policies.sql`).
- A `userId` is **never** trusted from client input. It is always resolved
  server-side from the session (`src/lib/auth/session.ts`), including
  inside every Server Action and the chat API route.

## File uploads

- MIME type is verified by inspecting real file bytes (magic-byte
  sniffing in `src/lib/storage/file-validation.ts`), never by trusting the
  browser-supplied `Content-Type` or file extension alone.
- Filenames are sanitized before storage (`sanitizeFileName`).
- Size is capped by `MAX_UPLOAD_SIZE_MB` (configurable).
- Duplicate uploads are detected via a SHA-256 content hash.
- A scanned PDF with no extractable text layer is reported as such
  (`partial`/`warning`), never silently treated as if it had been read.

## AI usage

- Every AI-backed feature has a deterministic, zero-cost fallback that
  activates automatically when no provider is configured
  (`isAiConfigured` in `src/config/env.ts`) — see the relevant ADRs.
- Daily usage is rate-limited per user via `AI_DAILY_REQUEST_LIMIT`,
  enforced server-side before any request reaches a model
  (`tests/integration/ai-endpoint-security.test.ts`).
- The chat API route re-verifies file ownership server-side before using
  any file as context — a client-supplied file id it doesn't actually own
  is silently dropped, never trusted.
- Conflict detection and the planner's actual scheduling decisions are
  deterministic code, never a model call (ADR 0004) — an AI provider may
  only be used to word-smith explanatory text.

## Known limitations

- The demo store is in-memory and not durable — appropriate for its
  purpose (a zero-setup demo), inappropriate for real user data. Real
  persistence requires connecting Supabase (see ADR 0002 / ROADMAP).
- Heuristic (no-AI) grading and question generation are simpler than the
  AI-assisted path — documented in ADR 0005, not hidden.
- Account deletion / data export UI is not yet implemented (see ROADMAP
  0.3) — the demo store's non-persistence means there's nothing to delete
  today, but this is a real gap for the eventual Supabase-backed version.

## Data retention policy

- **Demo mode**: data lives only in server process memory and is lost on
  restart. Nothing is retained beyond that.
- **Supabase mode** (when connected): data is retained until the user
  deletes it. Account/data deletion tooling is on the roadmap (0.3) —
  until then, deletion would need to be done directly against the
  database by whoever operates that Supabase project.
- Material uploaded for AI features is only sent to the configured AI
  provider (Anthropic) at query time for the specific request being
  answered — it is not used to train any model, and the app does not
  forward material to any other third party.
