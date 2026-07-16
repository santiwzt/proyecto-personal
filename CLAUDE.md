# CLAUDE.md

Guidance for any AI agent (or human) working on this repository.

## Vision

Nexo Personal OS is a private, personal life-and-studies operating system for
a single user (initially an Argentine secondary school student). It is not a
calendar, not a to-do list, not a generic chatbot: it is a layer that
connects subjects, exams, tasks, schedules, availability, projects, files and
study material so it can propose realistic plans, explain *why*, and never
take irreversible action without explicit user approval.

Product name and description are centralized in `src/config/app.ts` — change
the product identity there only, never hardcode "Nexo" as a display string
elsewhere.

## Architecture

- **Next.js App Router**, Server Components by default, Client Components only
  where interactivity is required (forms, chat streaming, quick capture).
- **`src/app`** — routes only. Route files stay thin: fetch/auth/redirect,
  delegate everything else to `features/`, `server/services`, `server/actions`.
- **`src/components/ui`** — small, accessible, unstyled-ish primitives (button,
  input, dialog, etc). No business logic.
- **`src/components/layout`** / **`src/components/shared`** — navigation chrome
  and cross-feature presentational components.
- **`src/features/<name>`** — feature-scoped React components (client-side
  presentation only; no direct DB/AI calls from components).
- **`src/server/repositories`** — the *only* code that reads/writes the demo
  store or (when configured) Supabase. Swapping persistence means editing
  these files only.
- **`src/server/services`** — pure business logic: conflict detection, exam
  readiness, the planner engine, the quick-capture parser, RAG retrieval,
  question generation/grading. These take/return plain data — no framework
  imports — so they're trivial to unit test.
- **`src/server/actions`** — Server Actions / route handlers: validate input
  (zod), call services/repositories, enforce auth, return typed results.
- **`src/lib`** — cross-cutting infrastructure: `ai/` (provider abstraction),
  `auth/` (session resolution), `database/` (demo store + Supabase clients),
  `dates/`, `errors/`, `security/`, `validation/`.
- **`src/types/domain.ts`** — the single source of truth for every entity
  shape. Read this file first before touching persistence or services.

### Data modes

Two modes, chosen by `NEXT_PUBLIC_DATA_MODE` (see `.env.example`):

- `demo` (default, no credentials needed): an in-memory store
  (`src/lib/database/demo`), reseeded on every server restart. This is what
  makes the app runnable and reviewable with zero setup. It is **not** real
  persistence and must never be presented as such in the UI.
- `supabase`: real Postgres + Auth + Storage. Migrations live in
  `supabase/migrations`, hand-written types in `src/types/database.ts`,
  clients in `src/lib/database/supabase`. The repository layer currently
  ships a complete **demo** implementation; wiring an equivalent Supabase
  implementation per repository file is the documented first task when
  connecting a real project (see `docs/ROADMAP.md`).

### AI

`src/lib/ai` wraps the Anthropic SDK behind a small provider interface so the
model/provider can change without touching feature code. Every AI-backed
feature (chat, planner explanations, question generation, grading) has a
**deterministic fallback** that runs with zero API key and zero cost — see
`isAiConfigured` in `src/config/env.ts`. Conflict detection and the core
planner schedule are always deterministic code, never the model — the model
may only explain or word-smith, never decide what gets scheduled.

## Conventions

- TypeScript strict mode. No `any`. If you're tempted to use `any`, the type
  is missing from `src/types/domain.ts` or `src/types/database.ts` — add it.
- Validate all external input with `zod` in `src/lib/validation/schemas.ts`,
  re-validate server-side even if the client already validated.
- Never trust a `userId` from the client — always resolve it from the
  session (`src/lib/auth/session.ts`).
- Dates: use `src/lib/dates` helpers. Time zone is fixed to
  `America/Argentina/Buenos_Aires`, weeks start Monday, dates render
  `DD/MM/YYYY`.
- Errors: throw `AppError` (`src/lib/errors/app-error.ts`) with one of the
  fixed `AppErrorCode`s. Never leak stack traces or internal detail to the
  client; log internally, return the typed `{ code, message }` shape.
- No decorative/no-op UI. Every button either does something now or is
  visibly disabled/labeled "Proximamente" — never a silent no-op.

## Commands

```bash
pnpm dev            # start the dev server (demo mode by default)
pnpm build          # production build
pnpm start          # run the production build
pnpm lint           # eslint
pnpm typecheck      # tsc --noEmit
pnpm test           # vitest (unit + integration)
pnpm test:watch     # vitest watch mode
pnpm test:e2e       # playwright
pnpm format         # prettier --write
pnpm check          # lint + typecheck + test + build, in that order
```

## Security rules

- `.env.local` is git-ignored. Never commit real credentials. `.env.example`
  documents variable names only, with empty values.
- `SUPABASE_SERVICE_ROLE_KEY` is only read from
  `src/lib/database/supabase/admin.ts`, server-side only. Never import that
  file from a Client Component, and never expose it as `NEXT_PUBLIC_*`.
- Every table in `supabase/migrations` has Row Level Security enabled with a
  `user_id = auth.uid()` policy (or an equivalent join for tables that don't
  carry `user_id` directly). The demo store enforces the same rule in code
  (`InMemoryCollection` throws on cross-user access) so security tests
  exercise real logic in both modes.
- File uploads: validate real MIME type (not just extension), sanitize
  filenames, cap size via `MAX_UPLOAD_SIZE_MB`, dedupe via content hash.
- Rate/usage limit AI endpoints via `AI_DAILY_REQUEST_LIMIT`.

## Testing rules

- Every service in `src/server/services` needs unit tests in
  `tests/unit`. Pure functions, no mocking framework internals — pass plain
  data in, assert plain data out.
- Security-relevant behavior (cross-user access, invalid files, unauthenticated
  AI calls) needs an explicit test — see `tests/unit/*security*` and
  `tests/integration`.
- Never delete or weaken a test to make CI pass. Fix the underlying code.
- Before declaring any task done: `pnpm check` must pass in full.

## Adding a new module

1. Add/extend types in `src/types/domain.ts` (and `src/types/database.ts` +
   a migration if it needs to eventually live in Postgres).
2. Add a repository in `src/server/repositories/*.ts` (demo-store backed).
3. Add pure business logic (if any) in `src/server/services/*.ts` with unit
   tests.
4. Add validation schemas in `src/lib/validation/schemas.ts`.
5. Add server actions / route handlers in `src/server/actions` or
   `src/app/api`.
6. Add feature UI in `src/features/<name>`, wired into `src/app/(dashboard)`.
7. Update the sidebar nav (`src/components/layout`) if it's a top-level
   section; otherwise nest it under its parent feature.
8. Update `docs/ROADMAP.md` / `README.md` if user-facing scope changed.

## Before every commit

- [ ] `pnpm lint` passes
- [ ] `pnpm typecheck` passes
- [ ] `pnpm test` passes
- [ ] `pnpm build` succeeds
- [ ] No secrets in the diff (`git diff --staged` reviewed)
- [ ] No decorative buttons / fake data outside demo mode or tests
- [ ] Docs updated if behavior or setup changed

Keep documentation in sync with the code — a stale README/ARCHITECTURE.md is
worse than no documentation. Do not change the stack (framework, DB, AI
provider) without writing the reasoning down in `docs/decisions/`.
