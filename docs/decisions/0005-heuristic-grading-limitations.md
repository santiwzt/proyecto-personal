# 0005 — Heuristic (no-AI) grading is concept-overlap, not procedural evaluation

## Status
Accepted

## Context
PROMPT MAESTRO section 15 asks for procedural evaluation (checking the
steps of a Physics/Math answer, not just the final result) and never
punishing pure wording differences. Doing this well generally requires a
language model; without one configured, we still need *some* real grading,
not a stub.

## Decision
`src/server/services/grading.ts` ships two paths:
- **AI path** (`ANTHROPIC_API_KEY` set): the model is instructed explicitly
  to evaluate procedure over result, flag the first meaningful error, give a
  hint before the full solution, and never reward a correct-by-luck answer
  with an inconsistent procedure.
- **Heuristic path** (no key): keyword/concept overlap between the
  student's answer and the question's `gradingCriteria`/`expectedAnswer`,
  with a fixed 40% overlap threshold and instructional filler words
  (debe/mencionar/decir) excluded from the comparison so it scores concepts,
  not phrasing.

## Consequences
- The heuristic path is honest about being simpler: it cannot verify
  procedural correctness (e.g. correct final number via an inconsistent
  method) the way the AI path can. This is documented in code comments and
  here rather than silently overclaiming.
- `gradingCriteria` entries are written as positive "must mention X"
  statements, not negative constraints ("must NOT say Y") — the heuristic
  overlap check has no way to test for absence of a concept. Question
  generation (both heuristic and AI paths) follows this convention.
- Every graded attempt records which path graded it
  (`PracticeAttempt`/`AiUsageRecord`), so the UI can be transparent about it
  if needed.
- A small, hand-picked synonym table (`SYNONYM_CANONICAL` in
  `grading.ts`) collapses a handful of everyday Spanish synonym pairs
  ("sube"/"incrementa"/"aumenta") to one canonical term before the overlap
  check, and feedback wording now varies with how far above/below the 40%
  threshold the answer lands (e.g. "vas por buen camino" vs "no encuentro
  relacion"). This is still concept-overlap, not a real thesaurus or NLP —
  it only reduces false negatives from a few very common phrasing choices.
