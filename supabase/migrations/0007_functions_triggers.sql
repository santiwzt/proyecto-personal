-- ============================================================================
-- 0007_functions_triggers.sql
-- Shared trigger function that keeps `updated_at` current, attached to the
-- tables whose rows mutate in place: subjects, tasks, exams, projects,
-- study_topics, files.
-- ============================================================================

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

comment on function set_updated_at() is 'Sets updated_at = now() on every UPDATE. Attached to tables with mutable rows.';

drop trigger if exists set_updated_at on subjects;
create trigger set_updated_at
  before update on subjects
  for each row execute function set_updated_at();

drop trigger if exists set_updated_at on tasks;
create trigger set_updated_at
  before update on tasks
  for each row execute function set_updated_at();

drop trigger if exists set_updated_at on exams;
create trigger set_updated_at
  before update on exams
  for each row execute function set_updated_at();

drop trigger if exists set_updated_at on projects;
create trigger set_updated_at
  before update on projects
  for each row execute function set_updated_at();

drop trigger if exists set_updated_at on study_topics;
create trigger set_updated_at
  before update on study_topics
  for each row execute function set_updated_at();

drop trigger if exists set_updated_at on files;
create trigger set_updated_at
  before update on files
  for each row execute function set_updated_at();
