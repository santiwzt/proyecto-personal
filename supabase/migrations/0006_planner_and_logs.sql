-- ============================================================================
-- 0006_planner_and_logs.sql
-- AI planner output and bookkeeping tables:
-- planner_runs, proposed_time_blocks, activity_log, ai_usage.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- planner_runs  (mirrors PlannerRun)
-- `plan` is jsonb: GeneratedPlan is a full AI-generated structured snapshot
-- (summary, conflicts[], recommendations[], blocks[], unscheduledItems[],
-- assumptions[]) that is shown to the user as-generated and never queried
-- piecemeal by SQL -- a textbook case for jsonb. The `blocks` inside it are
-- ALSO normalized into the `proposed_time_blocks` table below (one row per
-- block) so individual blocks can be approved/queried/joined with real FKs;
-- `plan` keeps the original full snapshot for display/audit purposes.
-- ----------------------------------------------------------------------------
create table if not exists planner_runs (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references profiles(id) on delete cascade,
  week_start          date not null,
  plan                jsonb not null,
  status              planner_run_status not null default 'propuesto',
  approved_block_ids  uuid[] not null default '{}',
  created_at          timestamptz not null default now(),
  constraint planner_runs_plan_is_object check (jsonb_typeof(plan) = 'object')
);

comment on table planner_runs is 'Mirrors PlannerRun in domain.ts. `plan` holds the full GeneratedPlan snapshot.';

-- ----------------------------------------------------------------------------
-- proposed_time_blocks  (mirrors ProposedTimeBlock)
-- No user_id column: ProposedTimeBlock in domain.ts has no userId of its
-- own, it only exists as part of a PlannerRun's plan. Ownership is always
-- resolved by joining through planner_runs.user_id (see RLS in 0009).
-- planner_run_id is not part of the TS interface (which nests these inside
-- GeneratedPlan.blocks) but is required here to store each block as its own
-- row with a real FK back to the run it belongs to.
-- All fields are plain scalars -- no jsonb needed for this table.
-- ----------------------------------------------------------------------------
create table if not exists proposed_time_blocks (
  id               uuid primary key default gen_random_uuid(),
  planner_run_id   uuid not null references planner_runs(id) on delete cascade,
  activity_title   text not null,
  activity_kind    time_block_activity_kind not null,
  date             date not null,
  start_time       time not null,
  end_time         time not null,
  reason           text not null default '',
  priority         task_priority not null default 'media',
  movable          boolean not null default true,
  source_ref_id    uuid,
  source_ref_type  time_block_source_ref_type,
  constraint proposed_time_blocks_end_after_start check (end_time > start_time)
);

comment on table proposed_time_blocks is 'Mirrors ProposedTimeBlock in domain.ts. Scoped via planner_runs.user_id (no direct user_id column, matching the TS type).';

-- ----------------------------------------------------------------------------
-- activity_log  (mirrors ActivityLogEntry)
-- entity_id is intentionally NOT a foreign key: entity_type is polymorphic
-- (points at whichever table `action` refers to), so a real FK constraint
-- can't target a single table. Ownership is via user_id directly.
-- ----------------------------------------------------------------------------
create table if not exists activity_log (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references profiles(id) on delete cascade,
  action       text not null,
  entity_type  text not null,
  entity_id    uuid not null,
  created_at   timestamptz not null default now()
);

comment on table activity_log is 'Mirrors ActivityLogEntry in domain.ts. entity_id is polymorphic (no single-table FK possible).';

-- ----------------------------------------------------------------------------
-- ai_usage  (mirrors AiUsageRecord)
-- ----------------------------------------------------------------------------
create table if not exists ai_usage (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references profiles(id) on delete cascade,
  feature        ai_usage_feature not null,
  provider       ai_usage_provider not null,
  input_tokens   integer not null default 0 check (input_tokens >= 0),
  output_tokens  integer not null default 0 check (output_tokens >= 0),
  created_at     timestamptz not null default now()
);

comment on table ai_usage is 'Mirrors AiUsageRecord in domain.ts.';
