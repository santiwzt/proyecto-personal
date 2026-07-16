-- ============================================================================
-- 0004_projects_goals_habits.sql
-- Projects, goals, habits and the smaller personal-tracking tables:
-- projects, project_tasks, goals, habits, habit_logs, training_sessions,
-- expenses, ideas.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- projects  (mirrors Project)
-- `links` is jsonb: a genuinely small, flexible {label,url} array with no
-- independent lifecycle of its own -- a join table would be overkill.
-- ----------------------------------------------------------------------------
create table if not exists projects (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references profiles(id) on delete cascade,
  name          text not null,
  description   text,
  status        project_status not null default 'idea',
  priority      task_priority not null default 'media',
  target_date   date,
  technologies  text[] not null default '{}',
  links         jsonb not null default '[]',
  next_step     text,
  progress      smallint not null default 0 check (progress between 0 and 100),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  constraint projects_links_is_array check (jsonb_typeof(links) = 'array')
);

comment on table projects is 'Mirrors Project in domain.ts.';

-- Now that `projects` exists, wire up the deferred FKs from 0003.
-- ON DELETE SET NULL: deleting a project must not delete unrelated tasks or
-- calendar events that merely reference it.
alter table tasks
  add constraint tasks_project_id_fkey
  foreign key (project_id) references projects(id) on delete set null;

alter table events
  add constraint events_related_project_id_fkey
  foreign key (related_project_id) references projects(id) on delete set null;

-- ----------------------------------------------------------------------------
-- project_tasks  (mirrors ProjectTask)
-- Unlike `tasks`, these belong exclusively to one project, so cascade.
-- ----------------------------------------------------------------------------
create table if not exists project_tasks (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references profiles(id) on delete cascade,
  project_id  uuid not null references projects(id) on delete cascade,
  title       text not null,
  status      task_status not null default 'pendiente',
  created_at  timestamptz not null default now()
);

comment on table project_tasks is 'Mirrors ProjectTask in domain.ts.';

-- ----------------------------------------------------------------------------
-- goals  (mirrors Goal)
-- ----------------------------------------------------------------------------
create table if not exists goals (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references profiles(id) on delete cascade,
  title         text not null,
  description   text,
  target_date   date,
  progress      smallint not null default 0 check (progress between 0 and 100),
  created_at    timestamptz not null default now()
);

comment on table goals is 'Mirrors Goal in domain.ts.';

-- ----------------------------------------------------------------------------
-- habits  (mirrors Habit)
-- ----------------------------------------------------------------------------
create table if not exists habits (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references profiles(id) on delete cascade,
  name              text not null,
  target_per_week   smallint not null default 1 check (target_per_week between 0 and 7),
  created_at        timestamptz not null default now(),
  archived_at       timestamptz
);

comment on table habits is 'Mirrors Habit in domain.ts.';

-- ----------------------------------------------------------------------------
-- habit_logs  (mirrors HabitLog)
-- One log row per habit per day; unique constraint prevents duplicates.
-- ----------------------------------------------------------------------------
create table if not exists habit_logs (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references profiles(id) on delete cascade,
  habit_id    uuid not null references habits(id) on delete cascade,
  date        date not null,
  completed   boolean not null default true,
  constraint habit_logs_unique_per_day unique (habit_id, date)
);

comment on table habit_logs is 'Mirrors HabitLog in domain.ts.';

-- ----------------------------------------------------------------------------
-- training_sessions  (mirrors TrainingSession)
-- ----------------------------------------------------------------------------
create table if not exists training_sessions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references profiles(id) on delete cascade,
  activity    text not null,
  starts_at   timestamptz not null,
  ends_at     timestamptz not null,
  notes       text,
  constraint training_sessions_ends_after_starts check (ends_at > starts_at)
);

comment on table training_sessions is 'Mirrors TrainingSession in domain.ts.';

-- ----------------------------------------------------------------------------
-- expenses  (mirrors Expense)
-- ----------------------------------------------------------------------------
create table if not exists expenses (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references profiles(id) on delete cascade,
  amount        numeric(12, 2) not null check (amount >= 0),
  currency      text not null default 'ARS',
  category      text not null,
  description   text,
  spent_at      date not null,
  created_at    timestamptz not null default now()
);

comment on table expenses is 'Mirrors Expense in domain.ts.';

-- ----------------------------------------------------------------------------
-- ideas  (mirrors Idea)
-- ON DELETE SET NULL: an idea keeps existing as a record even if the
-- project/task it was converted into is later deleted.
-- ----------------------------------------------------------------------------
create table if not exists ideas (
  id                       uuid primary key default gen_random_uuid(),
  user_id                  uuid not null references profiles(id) on delete cascade,
  content                  text not null,
  tags                     text[] not null default '{}',
  converted_to_project_id  uuid references projects(id) on delete set null,
  converted_to_task_id     uuid references tasks(id) on delete set null,
  created_at               timestamptz not null default now()
);

comment on table ideas is 'Mirrors Idea in domain.ts.';
