create or replace view verified_statistics as select
  (select count(*) from analytics_events where event_type = 'page_view') site_impressions,
  (select count(*) from analytics_events where event_type = 'open') content_opens,
  (select count(*) from analytics_events where event_type = 'completion') content_completions,
  (select count(*) from reactions) reactions,
  (select count(*) from comments where not is_hidden) comments,
  (select count(*) from subscribers where unsubscribed_at is null) subscribers,
  (select count(*) from conversations where status = 'published') conversations,
  (
    select count(*) from papers
    where status = 'published'
       or (status = 'scheduled' and scheduled_for is not null and scheduled_for <= now())
  ) papers,
  (select count(distinct country) from analytics_events where country is not null) countries;

create index if not exists papers_scheduled_publication
on papers(status, scheduled_for)
where status = 'scheduled';
