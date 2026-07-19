# 0007 — Semantic search stays heuristic; no embeddings provider is wired up

## Status
Accepted

## Context
The ROADMAP listed activating `EMBEDDING_PROVIDER` (the `file_chunks.embedding`
`pgvector` column is already modeled and ready) so the assistant's retrieval
could use real semantic search instead of keyword/IDF matching. Earlier in
this project the user explicitly chose *not* to wire up a real paid AI
provider for the assistant itself, preferring to keep enriching the free
heuristic engine instead — the stated reason being that paying per request
doesn't scale once the app is shared with a few friends. That reasoning
applies identically to an embeddings provider: every embeddings API
(OpenAI, Voyage, Cohere, Gemini, etc.) is a metered, per-request external
call with the same cost-at-scale problem, even where a free tier exists
today.

## Decision
We do **not** integrate a real embeddings provider. `src/server/services/retrieval.ts`
keeps using deterministic IDF-weighted keyword matching with sentence-aware
excerpting (already substantially improved this session) as the permanent
retrieval strategy, not a placeholder. `EMBEDDING_PROVIDER` stays defined in
`src/config/env.ts` as an optional, currently-unused escape hatch for later.

## Consequences
- Retrieval quality has a ceiling: queries phrased very differently from the
  source material's wording can still miss a match, since there's no vector
  similarity to bridge paraphrases.
- Zero added cost, zero new API keys/accounts to configure, no per-request
  rate limits to babysit.
- If this is ever revisited (e.g. once the app has paying users and the cost
  is acceptable), the path is bounded: populate `file_chunks.embedding` on
  upload via whichever provider is chosen, add a vector-similarity query
  path in `retrieval.ts` gated behind `isEmbeddingConfigured`, and keep the
  current IDF matching as the zero-cost fallback when it isn't configured —
  exactly the pattern already used for the main chat/grading AI provider.
