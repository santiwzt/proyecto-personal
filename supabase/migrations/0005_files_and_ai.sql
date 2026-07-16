-- ============================================================================
-- 0005_files_and_ai.sql
-- File storage/RAG tables and the AI assistant/practice tables:
-- files, file_chunks, conversations, messages, practice_sets,
-- practice_questions, practice_attempts, study_sessions.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- files  (mirrors FileAsset)
-- ----------------------------------------------------------------------------
create table if not exists files (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references profiles(id) on delete cascade,
  original_name      text not null,
  safe_name          text not null,
  mime_type          text not null,
  size_bytes         bigint not null check (size_bytes >= 0),
  storage_path       text not null,
  status             file_processing_status not null default 'subiendo',
  subject_id         uuid references subjects(id) on delete set null,
  project_id         uuid references projects(id) on delete set null,
  extracted_text     text,
  processing_error   text,
  content_hash       text not null,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

comment on table files is 'Mirrors FileAsset in domain.ts.';

-- ----------------------------------------------------------------------------
-- file_chunks  (mirrors FileChunk)
-- embedding is nullable: populated only when EMBEDDING_PROVIDER is
-- configured (see src/config/env.ts). content_tsvector is a generated
-- column used as the full-text-search fallback when no embedding exists.
-- ----------------------------------------------------------------------------
create table if not exists file_chunks (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references profiles(id) on delete cascade,
  file_id            uuid not null references files(id) on delete cascade,
  chunk_index        integer not null check (chunk_index >= 0),
  content            text not null,
  char_count         integer not null check (char_count >= 0),
  page               integer,
  embedding          vector(1536),
  content_tsvector   tsvector generated always as (to_tsvector('spanish', content)) stored,
  constraint file_chunks_unique_index_per_file unique (file_id, chunk_index)
);

comment on table file_chunks is 'Mirrors FileChunk in domain.ts. Full-text search (content_tsvector) is the fallback when embedding is null.';

-- ----------------------------------------------------------------------------
-- conversations  (mirrors Conversation)
-- ConversationScope is a discriminated union in TS ({type:"subject",...} |
-- {type:"files",...} | {type:"general"}). Normalized into columns instead
-- of a jsonb blob so subject/file references stay real, queryable FKs.
-- scope_file_ids is a plain uuid[] (id list, not a flexible structure).
-- ----------------------------------------------------------------------------
create table if not exists conversations (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references profiles(id) on delete cascade,
  title            text not null,
  scope_type       conversation_scope_type not null default 'general',
  scope_subject_id uuid references subjects(id) on delete set null,
  scope_file_ids   uuid[],
  created_at       timestamptz not null default now(),
  constraint conversations_scope_shape check (
    (scope_type = 'subject' and scope_subject_id is not null and scope_file_ids is null)
    or (scope_type = 'files' and scope_file_ids is not null and scope_subject_id is null)
    or (scope_type = 'general' and scope_subject_id is null and scope_file_ids is null)
  )
);

comment on table conversations is 'Mirrors Conversation in domain.ts. scope is normalized into scope_type/scope_subject_id/scope_file_ids instead of a jsonb ConversationScope blob.';

-- ----------------------------------------------------------------------------
-- messages  (mirrors Message)
-- `sources` is jsonb: each is a point-in-time citation snapshot
-- (fileId/fileName/chunkId/excerpt/page) taken when the message was
-- generated, which may legitimately drift from the live chunk later --
-- exactly the "flexible, no independent lifecycle" case jsonb is for.
-- ----------------------------------------------------------------------------
create table if not exists messages (
  id               uuid primary key default gen_random_uuid(),
  conversation_id  uuid not null references conversations(id) on delete cascade,
  user_id          uuid not null references profiles(id) on delete cascade,
  role             message_role not null,
  content          text not null,
  sources          jsonb not null default '[]',
  created_at       timestamptz not null default now(),
  constraint messages_sources_is_array check (jsonb_typeof(sources) = 'array')
);

comment on table messages is 'Mirrors Message in domain.ts.';

-- ----------------------------------------------------------------------------
-- practice_sets  (mirrors PracticeSet)
-- ----------------------------------------------------------------------------
create table if not exists practice_sets (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references profiles(id) on delete cascade,
  subject_id   uuid references subjects(id) on delete set null,
  topic_id     uuid references study_topics(id) on delete set null,
  title        text not null,
  generated_by practice_generated_by not null default 'heuristico',
  created_at   timestamptz not null default now()
);

comment on table practice_sets is 'Mirrors PracticeSet in domain.ts.';

-- ----------------------------------------------------------------------------
-- practice_questions  (mirrors PracticeQuestion)
-- No user_id column: PracticeQuestion in domain.ts only carries setId, so
-- ownership is always resolved by joining through practice_sets.user_id
-- (see RLS policies in 0009). options/grading_criteria/common_mistakes are
-- plain text[] arrays (of option strings / criteria strings), not jsonb --
-- a plain array is enough since these are just lists of strings.
-- ----------------------------------------------------------------------------
create table if not exists practice_questions (
  id                uuid primary key default gen_random_uuid(),
  set_id            uuid not null references practice_sets(id) on delete cascade,
  kind              question_kind not null,
  difficulty        question_difficulty not null default 'media',
  prompt            text not null,
  options           text[],
  expected_answer   text not null,
  grading_criteria  text[] not null default '{}',
  explanation       text not null default '',
  common_mistakes   text[] not null default '{}',
  source_file_id    uuid references files(id) on delete set null,
  source_excerpt    text,
  created_at        timestamptz not null default now()
);

comment on table practice_questions is 'Mirrors PracticeQuestion in domain.ts. Scoped via practice_sets.user_id (no direct user_id column, matching the TS type).';

-- ----------------------------------------------------------------------------
-- practice_attempts  (mirrors PracticeAttempt)
-- ----------------------------------------------------------------------------
create table if not exists practice_attempts (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references profiles(id) on delete cascade,
  question_id      uuid not null references practice_questions(id) on delete cascade,
  answer_text      text not null,
  is_correct       boolean not null default false,
  feedback         text not null default '',
  first_error_hint text,
  attempt_number   integer not null default 1 check (attempt_number > 0),
  created_at       timestamptz not null default now()
);

comment on table practice_attempts is 'Mirrors PracticeAttempt in domain.ts.';

-- ----------------------------------------------------------------------------
-- study_sessions  (mirrors StudySession)
-- ----------------------------------------------------------------------------
create table if not exists study_sessions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references profiles(id) on delete cascade,
  subject_id  uuid references subjects(id) on delete set null,
  topic_id    uuid references study_topics(id) on delete set null,
  exam_id     uuid references exams(id) on delete set null,
  starts_at   timestamptz not null,
  ends_at     timestamptz not null,
  completed   boolean not null default false,
  constraint study_sessions_ends_after_starts check (ends_at > starts_at)
);

comment on table study_sessions is 'Mirrors StudySession in domain.ts.';
