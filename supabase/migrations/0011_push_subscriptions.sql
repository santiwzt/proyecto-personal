-- ============================================================================
-- 0011_push_subscriptions.sql
-- Web Push subscriptions, one row per browser/device a user has enabled
-- notifications on. Mirrors PushSubscriptionRecord in domain.ts.
-- ============================================================================

create table if not exists push_subscriptions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references profiles(id) on delete cascade,
  endpoint    text not null,
  p256dh      text not null,
  auth        text not null,
  created_at  timestamptz not null default now(),
  constraint push_subscriptions_user_endpoint_unique unique (user_id, endpoint)
);

comment on table push_subscriptions is 'Mirrors PushSubscriptionRecord in domain.ts. One row per subscribed browser/device.';

create index if not exists idx_push_subscriptions_user_id on push_subscriptions (user_id);

alter table push_subscriptions enable row level security;

create policy push_subscriptions_owner_all on push_subscriptions
  for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
