# 0002 — Supabase repository implementation is prepared, not built, for this MVP

## Status
Accepted

## Context
PROMPT MAESTRO section 6 requires that, if Supabase can't be fully configured
without credentials (true in this sandboxed session), we prepare migrations,
clients, types, env vars, instructions, and a clearly separate demo mode —
but does not require a fully wired, exercised Supabase repository
implementation when no live project exists to validate it against.

## Decision
We shipped:
- Complete SQL migrations (`supabase/migrations/*.sql`) with RLS on every
  table, validated against a real local Postgres + pgvector instance during
  development.
- Complete hand-written types (`src/types/database.ts`).
- Complete Supabase clients (`src/lib/database/supabase/{client,server,admin}.ts`).
- A complete demo-mode repository implementation (`src/server/repositories/*`)
  behind the exact same function shapes a Supabase-backed version would use.

We deliberately did **not** write untested Supabase query code for every
repository file — that would be exactly the kind of "half-finished
implementation" the project rules warn against, since it can't be exercised
here.

## Consequences
- The MVP is fully functional today in demo mode.
- Wiring a real Supabase project is a bounded, well-defined task: for each
  file in `src/server/repositories`, swap the `getDemoStore()`-backed
  functions for `supabase-js` queries against the matching table (already
  modeled 1:1 in `src/types/database.ts`), gated by
  `NEXT_PUBLIC_DATA_MODE=supabase`. See ROADMAP.md.
- Until that swap happens, running with `NEXT_PUBLIC_DATA_MODE=supabase` will
  use the same demo repositories (auth alone would use the real Supabase
  session, since `src/lib/auth/session.ts` already branches on
  `isDemoMode`).
