-- Host-entered country activity supplements privacy-safe automatic geography.
create table if not exists public.manual_country_activity (
  country_code text primary key check (country_code ~ '^[A-Z]{2}$'),
  content_views bigint not null default 0 check (content_views >= 0),
  updated_at timestamptz not null default now()
);

alter table public.manual_country_activity enable row level security;
revoke all on public.manual_country_activity from anon, authenticated;
grant select, insert, update, delete on public.manual_country_activity to service_role;
