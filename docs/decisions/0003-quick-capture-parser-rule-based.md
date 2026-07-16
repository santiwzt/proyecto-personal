# 0003 — Quick capture uses a rule-based parser, not an LLM call

## Status
Accepted

## Context
Quick capture needs to be fast (feels instant while typing), free (no
per-keystroke API cost), reproducible (same input → same interpretation,
important for tests), and safe (never silently save an ambiguous guess).

## Decision
`src/server/services/quick-capture-parser.ts` is pure, deterministic
TypeScript: regex/keyword matching for Spanish date expressions ("el
lunes", "mañana", "a las 9", "de 18 a 20"), verb/keyword classification
(rindo/examen → exam, recordame/tengo que → task, entrenamiento/partido →
event, "idea:" → idea, gaste/pague → expense), and Argentine number
formatting for amounts. No AI provider is involved.

Regardless of parser confidence, the UI never saves anything until the user
explicitly confirms the previewed interpretation (`QuickCaptureResult` always
carries either a fully-typed entity or an `unknown` + clarification message
— see `src/types/domain.ts`).

## Consequences
- 100% test coverage of the parsing logic is straightforward
  (`tests/unit/quick-capture-parser.test.ts`) — no mocking an LLM, no
  flakiness.
- Coverage of natural language is necessarily narrower than an LLM-based
  parser. Ambiguous or unusual phrasing falls back to `type: "unknown"`
  with a clarification message rather than guessing.
- If a future version wants LLM-assisted parsing for broader phrasing
  coverage, it should sit *behind* this same `QuickCaptureResult` contract
  and still require confirmation before saving — never bypass that step.
