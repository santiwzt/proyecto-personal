-- ============================================================================
-- 0010_handle_new_user.sql
-- Auto-provisions a `profiles` row (and default `user_preferences`) the
-- moment a new user signs up via Supabase Auth, so the app never has to
-- special-case "authenticated but no profile row yet".
-- ============================================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, role, time_zone)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)),
    'estudiante_secundario',
    'America/Argentina/Buenos_Aires'
  )
  on conflict (id) do nothing;

  insert into public.user_preferences (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

comment on function public.handle_new_user() is
  'Creates a profiles + user_preferences row for every new auth.users signup.';

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
