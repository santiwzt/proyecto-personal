-- ============================================================================
-- 0003_core_tables.sql
-- Profile, preferences and the main academic-planning tables:
-- profiles, user_preferences, subjects, study_topics, exams, tasks, events,
-- availability_rules.
--
-- Column names are the snake_case mirror of the camelCase fields on the
-- matching interface in src/types/domain.ts, so `db:generate` output lines
-- up with the hand-written domain types.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- profiles  (mirrors Profile)
-- One row per Supabase auth user. id is NOT auto-generated: it must equal
-- the auth.users.id it belongs to (set by the signup trigger/handler at the
-- application layer).
-- ----------------------------------------------------------------------------
create table if not exists profiles (
  id                       uuid primary key references auth.users(id) on delete cascade,
  display_name             text not null,
  role                     profile_role not null default 'otro',
  time_zone                text not null default 'America/Argentina/Buenos_Aires',
  onboarding_completed_at  timestamptz,
  created_at               timestamptz not null default now()
);

comment on table profiles is 'One row per authenticated user; mirrors Profile in domain.ts.';

-- ----------------------------------------------------------------------------
-- user_preferences  (mirrors UserPreferences)
-- 1:1 with profiles. `preferredStudyWindows` is NOT duplicated here: it is
-- the AvailabilityRule[] rows in `availability_rules` for this user (see
-- below) -- storing it twice would let the two go out of sync.
-- ----------------------------------------------------------------------------
create table if not exists user_preferences (
  user_id                   uuid primary key references profiles(id) on delete cascade,
  locale                    text not null default 'es-AR',
  date_format               text not null default 'dd/MM/yyyy',
  week_starts_on            smallint not null default 1 check (week_starts_on in (0, 1)),
  theme                     theme_mode not null default 'system',
  daily_study_limit_minutes integer not null default 180 check (daily_study_limit_minutes > 0),
  ai_consent_given          boolean not null default false,
  created_at                timestamptz not null default now()
);

comment on table user_preferences is 'Mirrors UserPreferences in domain.ts. preferredStudyWindows is derived by joining availability_rules on user_id, not stored here.';

-- ----------------------------------------------------------------------------
-- subjects  (mirrors Subject)
-- ----------------------------------------------------------------------------
create table if not exists subjects (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references profiles(id) on delete cascade,
  name         text not null,
  color        subject_color not null default 'blue',
  teacher      text,
  course       text,
  description  text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  archived_at  timestamptz
);

comment on table subjects is 'Mirrors Subject in domain.ts.';

-- ----------------------------------------------------------------------------
-- study_topics  (mirrors StudyTopic)
-- ----------------------------------------------------------------------------
create table if not exists study_topics (
  id                    uuid primary key default gen_random_uuid(),
  user_id               uuid not null references profiles(id) on delete cascade,
  subject_id            uuid not null references subjects(id) on delete cascade,
  name                  text not null,
  status                topic_status not null default 'no_iniciado',
  self_confidence       smallint not null default 0 check (self_confidence between 0 and 100),
  estimated_confidence  smallint not null default 0 check (estimated_confidence between 0 and 100),
  common_mistakes       text[] not null default '{}',
  notes                 text,
  last_practiced_at     timestamptz,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

comment on table study_topics is 'Mirrors StudyTopic in domain.ts.';

-- ----------------------------------------------------------------------------
-- exams  (mirrors Exam)
-- topic_ids / file_ids are plain uuid[] references (not jsonb): they are
-- genuinely id lists, not flexible structures, and array membership is easy
-- to query/filter on directly (`topic_id = any(topic_ids)`).
-- ----------------------------------------------------------------------------
create table if not exists exams (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references profiles(id) on delete cascade,
  subject_id        uuid not null references subjects(id) on delete cascade,
  title             text not null,
  scheduled_at      timestamptz not null,
  duration_minutes  integer not null check (duration_minutes > 0),
  topic_ids         uuid[] not null default '{}',
  importance        exam_importance not null default 'media',
  status            exam_status not null default 'programado',
  file_ids          uuid[] not null default '{}',
  result_score      smallint check (result_score is null or result_score between 0 and 100),
  result_notes      text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

comment on table exams is 'Mirrors Exam in domain.ts.';

-- ----------------------------------------------------------------------------
-- tasks  (mirrors Task)
-- subject_id/project_id use ON DELETE SET NULL: removing a subject or
-- project should not delete unrelated standalone tasks tied to it.
-- ----------------------------------------------------------------------------
create table if not exists tasks (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references profiles(id) on delete cascade,
  title               text not null,
  description         text,
  due_at              timestamptz,
  estimated_minutes   integer check (estimated_minutes is null or estimated_minutes > 0),
  priority            task_priority not null default 'media',
  status              task_status not null default 'pendiente',
  subject_id          uuid references subjects(id) on delete set null,
  project_id          uuid, -- FK added in 0004_projects_goals_habits.sql once `projects` exists.
  is_fixed            boolean not null default false,
  completed_at        timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

comment on table tasks is 'Mirrors Task in domain.ts. project_id FK is added later (set null on project delete) once the projects table exists.';

-- ----------------------------------------------------------------------------
-- events  (calendar events, mirrors CalendarEvent)
-- related_* are ON DELETE SET NULL: an event survives deletion of the
-- exam/task/project it was originally linked to.
-- ----------------------------------------------------------------------------
create table if not exists events (
  id                    uuid primary key default gen_random_uuid(),
  user_id               uuid not null references profiles(id) on delete cascade,
  title                 text not null,
  category              event_category not null default 'otro',
  starts_at             timestamptz not null,
  ends_at               timestamptz not null,
  location              text,
  is_fixed              boolean not null default false,
  related_exam_id       uuid references exams(id) on delete set null,
  related_task_id       uuid references tasks(id) on delete set null,
  related_project_id    uuid, -- FK added in 0004 once `projects` exists.
  notes                 text,
  created_at            timestamptz not null default now(),
  constraint events_ends_after_starts check (ends_at > starts_at)
);

comment on table events is 'Calendar events; mirrors CalendarEvent in domain.ts.';

-- ----------------------------------------------------------------------------
-- availability_rules  (mirrors AvailabilityRule)
-- domain.ts has no createdAt field on AvailabilityRule, but every table in
-- this schema gets one for bookkeeping/auditing consistency; the app layer
-- can simply ignore the column.
-- ----------------------------------------------------------------------------
create table if not exists availability_rules (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references profiles(id) on delete cascade,
  weekday     smallint not null check (weekday between 0 and 6),
  start_time  time not null,
  end_time    time not null,
  kind        availability_kind not null default 'disponible',
  label       text,
  created_at  timestamptz not null default now(),
  constraint availability_rules_end_after_start check (end_time > start_time)
);

comment on table availability_rules is 'Mirrors AvailabilityRule in domain.ts. created_at is schema bookkeeping only, not part of the TS type.';
