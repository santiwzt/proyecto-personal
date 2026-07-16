# Contributing

This started as a personal project, but the same rules apply whether
you're the original author or a future contributor.

## Getting set up

Run `./scripts/setup.sh` (macOS/Linux) or `./scripts/setup.ps1` (Windows),
or manually: `pnpm install`, copy `.env.example` to `.env.local`, `pnpm dev`.
No credentials are needed for demo mode.

## Before opening a PR

```bash
pnpm check   # lint + typecheck + test + build, in that order
```

All four must pass. If you touched anything under `src/app` or a page
component, also run `pnpm test:e2e` if it's plausible your change affects
the golden path (login → onboarding → create subject/exam/task → dashboard
→ generate/approve a plan).

## Code conventions

See `CLAUDE.md` for the full set of architecture/convention rules this
codebase follows (they apply to human contributors too, not just AI
agents). The short version:

- TypeScript strict, no `any`. If you need one, a type is missing from
  `src/types/domain.ts` — add it there.
- Validate all external input with `zod` (`src/lib/validation/schemas.ts`),
  server-side, even if the client already validated.
- Never trust a `userId` from the client — resolve it from the session.
- Business logic goes in `src/server/services` as pure, framework-free
  functions with unit tests — not inline in a Server Action or a
  component.
- No decorative UI: every button does something real, or is visibly
  disabled/labeled "Proximamente."
- Don't add a dependency for something a small, clear implementation
  already handles well (this project deliberately hand-writes its UI
  primitives and its RAG retrieval instead of pulling in a large
  framework for either).

## Commit style

Small, focused commits. Prefix with a type: `feat:`, `fix:`, `test:`,
`docs:`, `chore:`, `refactor:`. Explain *why* in the body when it's not
obvious from the diff.

## Adding a new module

Follow the sequence documented in `CLAUDE.md` under "Adding a new module"
— types → repository → service (if any) → validation schema → server
action → feature UI → nav entry → docs.

## Architectural changes

Don't change the stack (framework, database, AI provider) without writing
the reasoning down in `docs/decisions/` first, following the existing ADR
format (numbered, Status/Context/Decision/Consequences).

## Reporting bugs / requesting features

Open a GitHub issue. For security-relevant reports, see `SECURITY.md`
instead — don't file those as public issues.
