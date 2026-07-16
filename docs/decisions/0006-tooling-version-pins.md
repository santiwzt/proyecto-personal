# 0006 — ESLint pinned to 9.x, TypeScript pinned to 5.9.x

## Status
Accepted

## Context
At the time of writing, `npm view <pkg> version` reports ESLint 10.7.0 and
TypeScript 7.0.2 as the current `latest` dist-tags — both legitimately
stable releases, not prereleases. However:

- `eslint-config-next@16.2.10` pulls in `eslint-plugin-react@7.37.5`, whose
  peer dependency caps at `eslint ^9.7` and which calls the removed
  `context.getFilename()` API under ESLint 10, crashing every lint run
  (`contextOrFilename.getFilename is not a function`).
- TypeScript 7's native rewrite is very new; pinning the well-established
  5.9 line avoids chasing day-one ecosystem compatibility issues with
  `typescript-eslint`/Next's type-checking plugin for an MVP whose priority
  is a working, checkable build today.

## Decision
`package.json` pins `eslint: 9.39.5` (ESLint's own "maintenance" dist-tag)
and `typescript: 5.9.3`. `eslint.config.mjs` imports
`eslint-config-next/core-web-vitals`'s flat config array directly instead of
routing it through `@eslint/eslintrc`'s `FlatCompat` (which independently
crashed with a circular-JSON error resolving the legacy config shape under
ESLint 10 — flat config negates the need for that compatibility shim
entirely).

## Consequences
- `pnpm lint` is fully clean and fast.
- Revisit this pin once `eslint-config-next`/`eslint-plugin-react` publish
  an ESLint 10-compatible release — remove this ADR's constraint at that
  point rather than carrying it forward indefinitely.
