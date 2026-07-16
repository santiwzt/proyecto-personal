# 0004 — The planner's scheduling logic is deterministic code, not an AI call

## Status
Accepted

## Context
PROMPT MAESTRO section 17 explicitly requires: "Creá un servicio
determinístico independiente de la IA. La IA puede explicar conflictos, pero
la detección básica debe realizarse con código." The planner is the
highest-trust feature in the app — it proposes changes to the user's real
schedule — so it must be auditable, reproducible, and testable without
depending on model behavior.

## Decision
`src/server/services/conflict-detection.ts` (overlaps, availability
violations, overdue items, missing study sessions, missing breaks, daily
overload) and `src/server/services/planner-engine.ts` (weekly block
allocation: priority scoring from exam importance/topic confidence/task
priority/due date, greedy scheduling into free slots computed from
availability rules minus fixed events) are pure, deterministic TypeScript.
Given the same inputs, they always produce the same output. Both are
covered by unit tests that assert exact scheduling behavior (e.g. the
Saturday 2-hour cap, avoiding a fixed training block).

An AI provider MAY be used later to rewrite `summary`/explanatory text for
tone (see `src/lib/ai`), but it never decides which activity gets which
time slot.

## Consequences
- The planner works identically with or without `ANTHROPIC_API_KEY` set.
- Every proposed block carries a plain-language `reason` generated from a
  template, not a model — no risk of a hallucinated justification.
- Scheduling bugs are regular bugs, fixable and testable like any other
  code, not prompt-engineering problems.
- Known simplification: the engine schedules at day granularity per need
  (it won't schedule study time *after* an exam that happens earlier the
  same day) — acceptable for a weekly planner, documented here rather than
  hidden.
