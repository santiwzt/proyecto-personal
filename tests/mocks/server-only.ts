// Vitest alias target for the "server-only" package (see vitest.config.ts).
// That package unconditionally throws outside Next.js's bundler, which
// special-cases it at build time; tests run in plain Node, so it's aliased
// to this no-op instead.
export {};
