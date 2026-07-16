# Architecture

## High-level layers

```text
┌─────────────────────────────────────────────────────────────┐
│ src/app                                                      │
│  (auth)/login          — public, redirects if already signed in
│  (dashboard)/…         — gated by (dashboard)/layout.tsx      │
│  api/…                 — route handlers (chat streaming, etc) │
├─────────────────────────────────────────────────────────────┤
│ src/features/<name>     Client-side presentation, per feature │
│ src/components/{ui,layout,shared}  Reusable, no business logic│
├─────────────────────────────────────────────────────────────┤
│ src/server/actions       Server Actions: validate → auth →    │
│                          service/repository → revalidate      │
│ src/server/services      Pure business logic, framework-free  │
│ src/server/repositories  The ONLY code touching persistence   │
├─────────────────────────────────────────────────────────────┤
│ src/lib/{ai,auth,database,storage,validation,dates,errors}    │
│ src/config, src/types    Cross-cutting infra & shared types   │
└─────────────────────────────────────────────────────────────┘
```

Server Components read repositories directly (no extra "read" Server
Action layer needed for GETs — that indirection buys nothing). All
mutations go through `src/server/actions`, which is the only place that
combines auth + validation + a repository/service call + cache
revalidation.

## Auth flow

- **Demo mode** (`NEXT_PUBLIC_DATA_MODE=demo`, default): `startDemoSession`
  (`src/server/actions/auth-actions.ts`) sets an httpOnly cookie
  (`nexo_demo_session`). `getSessionUser()` (`src/lib/auth/session.ts`)
  reads it and returns a fixed demo user id. No password, no real identity
  — this is a single-user personal app running locally.
- **Supabase mode** (`NEXT_PUBLIC_DATA_MODE=supabase`): the same
  `getSessionUser()` instead calls `createSupabaseServerClient().auth.getUser()`.
  The rest of the app is unaware of which mode is active — it only ever
  calls `getSessionUser()`/`requireSessionUser()`.
- `(dashboard)/layout.tsx` is the single auth gate: unauthenticated users
  are redirected to `/login` there; no page below it re-checks auth for
  routing purposes (though every Server Action still calls
  `requireSessionUser()` independently — the layout gate is for UX/routing,
  not the security boundary).

## File flow

1. `uploadFileAction` (`src/server/actions/files-actions.ts`) receives a
   `FormData` with a `File`, validates real bytes (magic-byte sniffing, not
   extension) via `src/lib/storage/file-validation.ts`, hashes the content
   for dedup, sanitizes the filename.
2. `extractText` (`src/lib/storage/text-extraction.ts`) pulls text from
   PDF (`pdf-parse`)/DOCX (`mammoth`)/TXT/MD; a scanned PDF with no text
   layer is reported as `partial` with an honest warning, never faked.
3. `chunkText` (`src/server/services/chunking.ts`) splits the extracted
   text into ~1000-char, paragraph-aware, overlapping chunks.
4. Chunks are stored per file (`fileChunksRepository`); `file_chunks` in
   Postgres has both a `pgvector` `embedding` column (for when an embedding
   provider is configured) and a full-text `tsvector` column (fallback).

## RAG / assistant flow

1. `retrieveRelevantChunks` (`src/server/services/retrieval.ts`) — term-
   overlap scoring over `FileChunk.content`, normalized for chunk length.
   This is the active path today (no embedding provider configured by
   default). Swapping in real embeddings means ranking by cosine similarity
   over the same `embedding` column instead — same function signature.
2. `src/app/api/chat/route.ts` re-verifies file ownership server-side
   (never trusts client-supplied file ids), retrieves context, and either
   streams real model output (`AI_MODEL`/`ANTHROPIC_API_KEY` configured) or
   returns a heuristic answer that quotes the source chunks verbatim
   (`buildHeuristicChatAnswer`) — never fabricated text either way.
3. Every assistant message carries `sources: MessageSource[]` (file name +
   excerpt + optional page), persisted alongside the message.

## Planner flow

1. `detectAllConflicts` (`src/server/services/conflict-detection.ts`) —
   pure, deterministic: overlaps, out-of-availability events, overdue
   tasks/exams, exams with zero study sessions, missing breaks, daily
   overload. No AI involved (see ADR 0004).
2. `generatePlan` (`src/server/services/planner-engine.ts`) — builds a
   prioritized list of "needs" (exam topics weighted by importance and
   declared confidence, tasks weighted by priority/due date, at most two
   active projects) and greedily allocates them into free time computed
   from availability rules minus fixed events, respecting a daily study
   cap and minimum break between blocks.
3. `generatePlanAction` persists the proposal as a `PlannerRun` — nothing
   touches the real calendar yet.
4. `approvePlanAction` is the only path that turns `ProposedTimeBlock`s
   into real `CalendarEvent`s (and `StudySession`s for exam-linked blocks),
   and only for the blocks the user explicitly approved (all, a subset, or
   none/rejected).

## Technical decisions & alternatives considered

- **Next.js Server Actions over a separate API layer for mutations**:
  fewer moving parts than a REST/tRPC layer for a single-frontend app;
  route handlers are still used where a non-RSC contract is genuinely
  needed (the streaming chat endpoint).
- **Hand-written UI primitives over shadcn/ui CLI**: same resulting API,
  but written directly with no dependency on a codegen CLI needing network
  access at build time.
- **In-memory demo store over SQLite/local Postgres for demo mode**: see
  ADR 0001 — zero setup, and it's explicitly meant to be non-durable.
- **Full-text term overlap over calling an embeddings API by default**:
  keeps the app 100% functional and free with no provider configured; the
  `pgvector` column and repository shape are ready for real embeddings
  without an interface change.

## Risks

- The demo store resets on every server restart — real user data would
  need actual Supabase wiring before this could be anyone's daily driver.
- The heuristic (no-AI) grading/question-generation paths are meaningfully
  weaker than the AI paths — documented, not hidden (ADR 0005).
- The planner schedules per-day, not per-exact-time-of-day, for its
  "notAfterDate" deadline logic — a same-day evening study block after a
  same-day morning exam is a known edge case (ADR 0004).
