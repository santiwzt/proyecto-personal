# 0001 — Demo mode runs on an in-memory store, not SQLite/local Postgres

## Status
Accepted

## Context
The MVP must be fully runnable and reviewable with zero external credentials
(no Supabase project, no API keys). We need a persistence layer that behaves
close enough to the real one (per-user isolation, CRUD, referential shape)
to exercise the same repository interfaces and security tests as the
Supabase-backed path.

## Decision
`src/lib/database/demo` implements a process-lifetime, in-memory store
(`DemoStore`, one `InMemoryCollection` per entity) seeded on first import and
kept alive across requests via `globalThis` (survives Next.js dev
hot-reload). No file, no SQLite, no embedded Postgres.

## Consequences
- Zero setup: `pnpm dev` works immediately, no migrations to run locally.
- Data does **not** survive a server restart. This is intentional and must
  stay visible to the user (see README "Modo demo") — it must never be
  confused with real persistence.
- Cross-user isolation is enforced in code (`InMemoryCollection` throws on
  access to another user's row), so the same security tests that would run
  against Postgres RLS policies exercise real logic here too.
- When Supabase is configured, the repository files in `src/server/repositories`
  are the only place that needs an equivalent Postgres-backed implementation
  — see ADR 0002.
