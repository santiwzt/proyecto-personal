-- ============================================================================
-- supabase/seed.sql
--
-- DEMO / DEVELOPMENT SEED DATA ONLY. Never run this against a production
-- project -- it creates a fake auth user and fixture rows with fixed,
-- well-known UUIDs so the seed is reproducible across resets
-- (`supabase db reset` re-runs this file every time).
--
-- Run with `pnpm db:seed` (see scripts/db-seed.ts) or manually via:
--   supabase db execute --file supabase/seed.sql
--   psql "$DATABASE_URL" -f supabase/seed.sql
-- ============================================================================

begin;

-- ----------------------------------------------------------------------------
-- Demo auth user + profile
-- Supabase's `profiles.id` FK points at auth.users(id), so a local/demo
-- auth.users row is required for the seed to satisfy the constraint. This
-- mirrors what `supabase/seed.sql` examples in the Supabase docs do for
-- local development; it is never meaningful in a hosted/production project.
-- ----------------------------------------------------------------------------
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, last_sign_in_at,
  raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at,
  confirmation_token, recovery_token, email_change_token_new, email_change
) values (
  '00000000-0000-0000-0000-000000000000',
  '11111111-1111-1111-1111-111111111111',
  'authenticated',
  'authenticated',
  'santiago.demo@example.com',
  crypt('demo-password-not-for-prod', gen_salt('bf')),
  now(),
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{"display_name": "Santiago (demo)"}',
  now(),
  now(),
  '', '', '', ''
)
on conflict (id) do nothing;

insert into profiles (id, display_name, role, time_zone, onboarding_completed_at, created_at)
values (
  '11111111-1111-1111-1111-111111111111',
  'Santiago (demo)',
  'estudiante_universitario',
  'America/Argentina/Buenos_Aires',
  now() - interval '30 days',
  now() - interval '30 days'
)
on conflict (id) do nothing;

insert into user_preferences (user_id, locale, date_format, week_starts_on, theme, daily_study_limit_minutes, ai_consent_given)
values (
  '11111111-1111-1111-1111-111111111111',
  'es-AR', 'dd/MM/yyyy', 1, 'system', 180, true
)
on conflict (user_id) do nothing;

-- A couple of general availability windows, used by the planner to detect
-- "fuera_de_disponibilidad" conflicts.
insert into availability_rules (id, user_id, weekday, start_time, end_time, kind, label) values
  ('12121212-1212-1212-1212-121212120001', '11111111-1111-1111-1111-111111111111', 1, '18:00', '22:00', 'disponible', 'Tardes de semana'),
  ('12121212-1212-1212-1212-121212120002', '11111111-1111-1111-1111-111111111111', 6, '10:00', '18:00', 'disponible', 'Sabado')
on conflict (id) do nothing;

-- ----------------------------------------------------------------------------
-- Subjects: Fisica + Matematica
-- ----------------------------------------------------------------------------
insert into subjects (id, user_id, name, color, teacher, course, description, created_at) values
  ('22222222-2222-2222-2222-222222222201', '11111111-1111-1111-1111-111111111111', 'Fisica', 'blue', 'Prof. Gomez', '5to año', 'Cinematica y dinamica basica', now() - interval '60 days'),
  ('22222222-2222-2222-2222-222222222202', '11111111-1111-1111-1111-111111111111', 'Matematica', 'violet', 'Prof. Diaz', '5to año', 'Algebra y funciones', now() - interval '60 days')
on conflict (id) do nothing;

-- Fisica topics: MRU, MRUV, Caida libre, Tiro vertical (tiro vertical is the
-- deliberately weak one -- low self/estimated confidence -- to demonstrate
-- exam readiness / weak-topic detection against real seeded data).
insert into study_topics (id, user_id, subject_id, name, status, self_confidence, estimated_confidence, common_mistakes, notes, last_practiced_at, created_at) values
  ('33333333-3333-3333-3333-333333333301', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222201', 'MRU', 'dominado', 85, 80, '{}', null, now() - interval '5 days', now() - interval '55 days'),
  ('33333333-3333-3333-3333-333333333302', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222201', 'MRUV', 'practicando', 60, 55, '{"Confundir aceleracion con velocidad"}', null, now() - interval '4 days', now() - interval '50 days'),
  ('33333333-3333-3333-3333-333333333303', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222201', 'Caida libre', 'aprendiendo', 45, 40, '{}', null, now() - interval '10 days', now() - interval '45 days'),
  ('33333333-3333-3333-3333-333333333304', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222201', 'Tiro vertical', 'no_iniciado', 20, 15, '{"Ignorar el signo de la gravedad", "Olvidar la velocidad en el punto mas alto"}', 'Tema debil, priorizar antes del examen.', null, now() - interval '40 days')
on conflict (id) do nothing;

-- Matematica topics: Ecuaciones, Funciones.
insert into study_topics (id, user_id, subject_id, name, status, self_confidence, estimated_confidence, common_mistakes, notes, last_practiced_at, created_at) values
  ('33333333-3333-3333-3333-333333333305', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222202', 'Ecuaciones', 'practicando', 70, 65, '{}', null, now() - interval '3 days', now() - interval '55 days'),
  ('33333333-3333-3333-3333-333333333306', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222202', 'Funciones', 'aprendiendo', 50, 45, '{}', null, now() - interval '8 days', now() - interval '50 days')
on conflict (id) do nothing;

-- ----------------------------------------------------------------------------
-- Upcoming Fisica exam covering all four topics, including the weak one.
-- ----------------------------------------------------------------------------
insert into exams (id, user_id, subject_id, title, scheduled_at, duration_minutes, topic_ids, importance, status, file_ids, created_at) values
  (
    '44444444-4444-4444-4444-444444444401',
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222201',
    'Parcial de Cinematica',
    (current_date + interval '8 days' + time '14:00')::timestamptz,
    90,
    array[
      '33333333-3333-3333-3333-333333333301',
      '33333333-3333-3333-3333-333333333302',
      '33333333-3333-3333-3333-333333333303',
      '33333333-3333-3333-3333-333333333304'
    ]::uuid[],
    'alta',
    'preparando',
    '{}',
    now() - interval '10 days'
  )
on conflict (id) do nothing;

-- ----------------------------------------------------------------------------
-- Tasks: one overdue, a couple pending.
-- ----------------------------------------------------------------------------
insert into tasks (id, user_id, title, description, due_at, estimated_minutes, priority, status, subject_id, project_id, is_fixed, completed_at, created_at) values
  (
    '55555555-5555-5555-5555-555555555501',
    '11111111-1111-1111-1111-111111111111',
    'Entregar guia de MRUV',
    'Resolver los 10 ejercicios de la guia y subirla al campus.',
    (current_date - interval '6 days' + time '23:59')::timestamptz,
    60, 'alta', 'vencida',
    '22222222-2222-2222-2222-222222222201', null, false, null,
    now() - interval '15 days'
  ),
  (
    '55555555-5555-5555-5555-555555555502',
    '11111111-1111-1111-1111-111111111111',
    'Resolver practica de ecuaciones',
    'Practica 4: ecuaciones de segundo grado.',
    (current_date + interval '4 days' + time '20:00')::timestamptz,
    45, 'media', 'pendiente',
    '22222222-2222-2222-2222-222222222202', null, false, null,
    now() - interval '3 days'
  ),
  (
    '55555555-5555-5555-5555-555555555503',
    '11111111-1111-1111-1111-111111111111',
    'Leer capitulo 3 - Caida libre',
    null,
    (current_date + interval '6 days' + time '18:00')::timestamptz,
    30, 'baja', 'pendiente',
    '22222222-2222-2222-2222-222222222201', null, false, null,
    now() - interval '2 days'
  )
on conflict (id) do nothing;

-- ----------------------------------------------------------------------------
-- Project: "Juego de terror en Unity"
-- ----------------------------------------------------------------------------
insert into projects (id, user_id, name, description, status, priority, target_date, technologies, links, next_step, progress, created_at) values
  (
    '66666666-6666-6666-6666-666666666601',
    '11111111-1111-1111-1111-111111111111',
    'Juego de terror en Unity',
    'Proyecto personal: juego de terror en primera persona con Unity.',
    'en_progreso',
    'media',
    (current_date + interval '90 days'),
    '{"Unity", "C#", "Blender"}',
    '[{"label": "Repositorio", "url": "https://github.com/santiago/juego-terror-unity"}]'::jsonb,
    'Implementar el sistema de iluminacion dinamica',
    35,
    now() - interval '40 days'
  )
on conflict (id) do nothing;

insert into project_tasks (id, user_id, project_id, title, status, created_at) values
  ('77777777-7777-7777-7777-777777777701', '11111111-1111-1111-1111-111111111111', '66666666-6666-6666-6666-666666666601', 'Disenar el primer nivel', 'en_progreso', now() - interval '20 days'),
  ('77777777-7777-7777-7777-777777777702', '11111111-1111-1111-1111-111111111111', '66666666-6666-6666-6666-666666666601', 'Modelar el monstruo principal', 'pendiente', now() - interval '15 days')
on conflict (id) do nothing;

-- ----------------------------------------------------------------------------
-- Training session + calendar event that OVERLAP (09:30-10:00 on the same
-- day) so the planner's conflict-detection ("solapamiento") has a real,
-- reproducible case to catch against seeded data.
-- ----------------------------------------------------------------------------
insert into training_sessions (id, user_id, activity, starts_at, ends_at, notes) values
  (
    '88888888-8888-8888-8888-888888888801',
    '11111111-1111-1111-1111-111111111111',
    'Entrenamiento de futbol',
    (current_date + interval '2 days' + time '09:30')::timestamptz,
    (current_date + interval '2 days' + time '11:00')::timestamptz,
    'Sesion de resistencia y tactica.'
  )
on conflict (id) do nothing;

insert into events (id, user_id, title, category, starts_at, ends_at, location, is_fixed, related_exam_id, related_task_id, related_project_id, notes, created_at) values
  (
    '99999999-9999-9999-9999-999999999901',
    '11111111-1111-1111-1111-111111111111',
    'Clase de Fisica',
    'clase',
    (current_date + interval '2 days' + time '08:00')::timestamptz,
    (current_date + interval '2 days' + time '10:00')::timestamptz,
    'Aula 12',
    true,
    null, null, null,
    'Overlaps on purpose with the training session (09:30-10:00) to exercise conflict detection.',
    now() - interval '25 days'
  )
on conflict (id) do nothing;

commit;
