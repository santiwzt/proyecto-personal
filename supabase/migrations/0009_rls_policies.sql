-- ============================================================================
-- 0009_rls_policies.sql
-- Row Level Security for every table in this schema.
--
-- Pattern:
--   1. `alter table ... enable row level security;`
--   2. One `for all` policy granting select/insert/update/delete only on
--      rows the caller owns. `using` gates which existing rows are visible
--      (SELECT/UPDATE/DELETE); `with check` gates what a new/updated row is
--      allowed to look like (INSERT/UPDATE). For plain owned tables both
--      clauses are the same `user_id = auth.uid()` predicate.
--
-- Three tables don't carry a user_id column of their own and must be scoped
-- through a join to their parent (this matches domain.ts exactly):
--   - practice_questions  -> owned via practice_sets.user_id (PracticeQuestion
--                            only has setId, no userId, in domain.ts)
--   - proposed_time_blocks -> owned via planner_runs.user_id (ProposedTimeBlock
--                            only belongs to a PlannerRun, no userId, in domain.ts)
--   - profiles / user_preferences -> owned via id/user_id = auth.uid() directly
--                            (profiles.id IS the auth user id)
--
-- All other tables (including file_chunks, messages, conversations,
-- practice_attempts) DO carry user_id directly per domain.ts, so they use
-- the plain pattern even though they also have a parent row.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- profiles
-- ----------------------------------------------------------------------------
alter table profiles enable row level security;

create policy profiles_owner_all on profiles
  for all
  using (id = auth.uid())
  with check (id = auth.uid());

-- ----------------------------------------------------------------------------
-- user_preferences
-- ----------------------------------------------------------------------------
alter table user_preferences enable row level security;

create policy user_preferences_owner_all on user_preferences
  for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ----------------------------------------------------------------------------
-- subjects
-- ----------------------------------------------------------------------------
alter table subjects enable row level security;

create policy subjects_owner_all on subjects
  for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ----------------------------------------------------------------------------
-- study_topics
-- ----------------------------------------------------------------------------
alter table study_topics enable row level security;

create policy study_topics_owner_all on study_topics
  for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ----------------------------------------------------------------------------
-- exams
-- ----------------------------------------------------------------------------
alter table exams enable row level security;

create policy exams_owner_all on exams
  for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ----------------------------------------------------------------------------
-- tasks
-- ----------------------------------------------------------------------------
alter table tasks enable row level security;

create policy tasks_owner_all on tasks
  for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ----------------------------------------------------------------------------
-- events
-- ----------------------------------------------------------------------------
alter table events enable row level security;

create policy events_owner_all on events
  for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ----------------------------------------------------------------------------
-- availability_rules
-- ----------------------------------------------------------------------------
alter table availability_rules enable row level security;

create policy availability_rules_owner_all on availability_rules
  for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ----------------------------------------------------------------------------
-- projects
-- ----------------------------------------------------------------------------
alter table projects enable row level security;

create policy projects_owner_all on projects
  for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ----------------------------------------------------------------------------
-- project_tasks
-- ----------------------------------------------------------------------------
alter table project_tasks enable row level security;

create policy project_tasks_owner_all on project_tasks
  for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ----------------------------------------------------------------------------
-- goals
-- ----------------------------------------------------------------------------
alter table goals enable row level security;

create policy goals_owner_all on goals
  for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ----------------------------------------------------------------------------
-- habits
-- ----------------------------------------------------------------------------
alter table habits enable row level security;

create policy habits_owner_all on habits
  for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ----------------------------------------------------------------------------
-- habit_logs
-- ----------------------------------------------------------------------------
alter table habit_logs enable row level security;

create policy habit_logs_owner_all on habit_logs
  for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ----------------------------------------------------------------------------
-- training_sessions
-- ----------------------------------------------------------------------------
alter table training_sessions enable row level security;

create policy training_sessions_owner_all on training_sessions
  for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ----------------------------------------------------------------------------
-- expenses
-- ----------------------------------------------------------------------------
alter table expenses enable row level security;

create policy expenses_owner_all on expenses
  for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ----------------------------------------------------------------------------
-- ideas
-- ----------------------------------------------------------------------------
alter table ideas enable row level security;

create policy ideas_owner_all on ideas
  for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ----------------------------------------------------------------------------
-- files
-- ----------------------------------------------------------------------------
alter table files enable row level security;

create policy files_owner_all on files
  for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ----------------------------------------------------------------------------
-- file_chunks (carries user_id directly per domain.ts FileChunk.userId)
-- ----------------------------------------------------------------------------
alter table file_chunks enable row level security;

create policy file_chunks_owner_all on file_chunks
  for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ----------------------------------------------------------------------------
-- conversations
-- ----------------------------------------------------------------------------
alter table conversations enable row level security;

create policy conversations_owner_all on conversations
  for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ----------------------------------------------------------------------------
-- messages (carries user_id directly per domain.ts Message.userId)
-- ----------------------------------------------------------------------------
alter table messages enable row level security;

create policy messages_owner_all on messages
  for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ----------------------------------------------------------------------------
-- practice_sets
-- ----------------------------------------------------------------------------
alter table practice_sets enable row level security;

create policy practice_sets_owner_all on practice_sets
  for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ----------------------------------------------------------------------------
-- practice_questions -- no user_id column (matches PracticeQuestion in
-- domain.ts, which only has setId). Scope through practice_sets.user_id.
-- ----------------------------------------------------------------------------
alter table practice_questions enable row level security;

create policy practice_questions_owner_all on practice_questions
  for all
  using (
    exists (
      select 1 from practice_sets ps
      where ps.id = practice_questions.set_id
        and ps.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from practice_sets ps
      where ps.id = practice_questions.set_id
        and ps.user_id = auth.uid()
    )
  );

-- ----------------------------------------------------------------------------
-- practice_attempts
-- ----------------------------------------------------------------------------
alter table practice_attempts enable row level security;

create policy practice_attempts_owner_all on practice_attempts
  for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ----------------------------------------------------------------------------
-- study_sessions
-- ----------------------------------------------------------------------------
alter table study_sessions enable row level security;

create policy study_sessions_owner_all on study_sessions
  for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ----------------------------------------------------------------------------
-- planner_runs
-- ----------------------------------------------------------------------------
alter table planner_runs enable row level security;

create policy planner_runs_owner_all on planner_runs
  for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ----------------------------------------------------------------------------
-- proposed_time_blocks -- no user_id column (matches ProposedTimeBlock in
-- domain.ts, which has no userId -- it only belongs to a PlannerRun). Scope
-- through planner_runs.user_id.
-- ----------------------------------------------------------------------------
alter table proposed_time_blocks enable row level security;

create policy proposed_time_blocks_owner_all on proposed_time_blocks
  for all
  using (
    exists (
      select 1 from planner_runs pr
      where pr.id = proposed_time_blocks.planner_run_id
        and pr.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from planner_runs pr
      where pr.id = proposed_time_blocks.planner_run_id
        and pr.user_id = auth.uid()
    )
  );

-- ----------------------------------------------------------------------------
-- activity_log
-- ----------------------------------------------------------------------------
alter table activity_log enable row level security;

create policy activity_log_owner_all on activity_log
  for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ----------------------------------------------------------------------------
-- ai_usage
-- ----------------------------------------------------------------------------
alter table ai_usage enable row level security;

create policy ai_usage_owner_all on ai_usage
  for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
