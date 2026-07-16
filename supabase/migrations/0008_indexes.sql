-- ============================================================================
-- 0008_indexes.sql
-- Indexes for user_id ownership lookups (every RLS policy filters on these),
-- foreign keys (Postgres does not auto-index FK columns), date/status
-- columns used in dashboards and the planner, and the two file_chunks
-- search paths (full-text tsvector + vector similarity).
-- ============================================================================

-- subjects
create index if not exists idx_subjects_user_id on subjects (user_id);

-- study_topics
create index if not exists idx_study_topics_user_id on study_topics (user_id);
create index if not exists idx_study_topics_subject_id on study_topics (subject_id);
create index if not exists idx_study_topics_status on study_topics (status);

-- exams
create index if not exists idx_exams_user_id on exams (user_id);
create index if not exists idx_exams_subject_id on exams (subject_id);
create index if not exists idx_exams_scheduled_at on exams (scheduled_at);
create index if not exists idx_exams_status on exams (status);

-- tasks
create index if not exists idx_tasks_user_id on tasks (user_id);
create index if not exists idx_tasks_subject_id on tasks (subject_id);
create index if not exists idx_tasks_project_id on tasks (project_id);
create index if not exists idx_tasks_due_at on tasks (due_at);
create index if not exists idx_tasks_status on tasks (status);

-- events
create index if not exists idx_events_user_id on events (user_id);
create index if not exists idx_events_starts_at on events (starts_at);
create index if not exists idx_events_ends_at on events (ends_at);
create index if not exists idx_events_related_exam_id on events (related_exam_id);
create index if not exists idx_events_related_task_id on events (related_task_id);
create index if not exists idx_events_related_project_id on events (related_project_id);

-- availability_rules
create index if not exists idx_availability_rules_user_id on availability_rules (user_id);
create index if not exists idx_availability_rules_weekday on availability_rules (weekday);

-- projects
create index if not exists idx_projects_user_id on projects (user_id);
create index if not exists idx_projects_status on projects (status);
create index if not exists idx_projects_target_date on projects (target_date);

-- project_tasks
create index if not exists idx_project_tasks_user_id on project_tasks (user_id);
create index if not exists idx_project_tasks_project_id on project_tasks (project_id);
create index if not exists idx_project_tasks_status on project_tasks (status);

-- goals
create index if not exists idx_goals_user_id on goals (user_id);
create index if not exists idx_goals_target_date on goals (target_date);

-- habits / habit_logs
create index if not exists idx_habits_user_id on habits (user_id);
create index if not exists idx_habit_logs_user_id on habit_logs (user_id);
create index if not exists idx_habit_logs_habit_id on habit_logs (habit_id);
create index if not exists idx_habit_logs_date on habit_logs (date);

-- training_sessions
create index if not exists idx_training_sessions_user_id on training_sessions (user_id);
create index if not exists idx_training_sessions_starts_at on training_sessions (starts_at);

-- expenses
create index if not exists idx_expenses_user_id on expenses (user_id);
create index if not exists idx_expenses_spent_at on expenses (spent_at);

-- ideas
create index if not exists idx_ideas_user_id on ideas (user_id);

-- files
create index if not exists idx_files_user_id on files (user_id);
create index if not exists idx_files_subject_id on files (subject_id);
create index if not exists idx_files_project_id on files (project_id);
create index if not exists idx_files_status on files (status);

-- file_chunks: ownership + FK + both search paths.
create index if not exists idx_file_chunks_user_id on file_chunks (user_id);
create index if not exists idx_file_chunks_file_id on file_chunks (file_id);

-- Full-text search fallback (used whenever EMBEDDING_PROVIDER is unset).
create index if not exists idx_file_chunks_content_tsvector
  on file_chunks using gin (content_tsvector);

-- Vector similarity search (used only for chunks that have an embedding).
create index if not exists idx_file_chunks_embedding
  on file_chunks using ivfflat (embedding vector_cosine_ops) with (lists = 100)
  where embedding is not null;

-- conversations / messages
create index if not exists idx_conversations_user_id on conversations (user_id);
create index if not exists idx_conversations_scope_subject_id on conversations (scope_subject_id);
create index if not exists idx_messages_conversation_id on messages (conversation_id);
create index if not exists idx_messages_user_id on messages (user_id);

-- practice_sets / practice_questions / practice_attempts
create index if not exists idx_practice_sets_user_id on practice_sets (user_id);
create index if not exists idx_practice_sets_subject_id on practice_sets (subject_id);
create index if not exists idx_practice_sets_topic_id on practice_sets (topic_id);
create index if not exists idx_practice_questions_set_id on practice_questions (set_id);
create index if not exists idx_practice_attempts_user_id on practice_attempts (user_id);
create index if not exists idx_practice_attempts_question_id on practice_attempts (question_id);

-- study_sessions
create index if not exists idx_study_sessions_user_id on study_sessions (user_id);
create index if not exists idx_study_sessions_subject_id on study_sessions (subject_id);
create index if not exists idx_study_sessions_topic_id on study_sessions (topic_id);
create index if not exists idx_study_sessions_exam_id on study_sessions (exam_id);
create index if not exists idx_study_sessions_starts_at on study_sessions (starts_at);

-- planner_runs / proposed_time_blocks
create index if not exists idx_planner_runs_user_id on planner_runs (user_id);
create index if not exists idx_planner_runs_week_start on planner_runs (week_start);
create index if not exists idx_planner_runs_status on planner_runs (status);
create index if not exists idx_proposed_time_blocks_planner_run_id on proposed_time_blocks (planner_run_id);
create index if not exists idx_proposed_time_blocks_date on proposed_time_blocks (date);

-- activity_log
create index if not exists idx_activity_log_user_id on activity_log (user_id);
create index if not exists idx_activity_log_created_at on activity_log (created_at);
create index if not exists idx_activity_log_entity on activity_log (entity_type, entity_id);

-- ai_usage
create index if not exists idx_ai_usage_user_id on ai_usage (user_id);
create index if not exists idx_ai_usage_created_at on ai_usage (created_at);
