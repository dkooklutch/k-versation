-- Keep verified analytics private; the server service role is the only public-data broker.
alter view public.verified_statistics set (security_invoker = true);
revoke all on public.analytics_events from anon, authenticated;
revoke all on public.statistic_adjustments from anon, authenticated;
revoke all on public.verified_statistics from anon, authenticated;
grant select, insert on public.analytics_events to service_role;
grant select on public.statistic_adjustments, public.verified_statistics to service_role;

-- Analytics records never contain raw IP addresses. Country is an optional ISO alpha-2 value.
alter table public.analytics_events drop constraint if exists analytics_events_country_format;
alter table public.analytics_events add constraint analytics_events_country_format check (country is null or country ~ '^[A-Z]{2}$');
