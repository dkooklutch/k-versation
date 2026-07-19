create or replace function public.record_content_event(p_event_type text,p_content_id text,p_content_type content_kind,p_session text) returns void language plpgsql security definer set search_path=public as $$begin if p_event_type not in('open','completion') then raise exception 'invalid event';end if;insert into analytics_events(event_type,content_id,content_type,anonymous_session)values(p_event_type,p_content_id,p_content_type,p_session);end$$;
create or replace view verified_statistics as select
  (select count(*) from analytics_events where event_type='page_view') site_impressions,
  (select count(*) from analytics_events where event_type='open') content_opens,
  (select count(*) from analytics_events where event_type='completion') content_completions,
  (select count(*) from reactions) reactions,
  (select count(*) from comments where not is_hidden) comments,
  (select count(*) from subscribers where unsubscribed_at is null) subscribers,
  (select count(*) from conversations where status='published') conversations,
  (select count(*) from papers where status='published') papers,
  (select count(distinct country) from analytics_events where country is not null) countries;
