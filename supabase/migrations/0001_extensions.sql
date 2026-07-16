-- ============================================================================
-- 0001_extensions.sql
-- Enables the Postgres extensions the rest of the schema depends on.
-- Idempotent: safe to re-run.
-- ============================================================================

-- gen_random_uuid() for all primary keys.
create extension if not exists "pgcrypto";

-- vector(n) column type + similarity operators/indexes for file_chunks.embedding.
create extension if not exists "vector";
