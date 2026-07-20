alter table analytics_events add column if not exists page_load_id text;
create unique index if not exists analytics_page_load_once on analytics_events(page_load_id);

alter table conversations add column if not exists subtitle text;
alter table conversations add column if not exists short_description text;
alter table conversations add column if not exists topic text;
alter table conversations add column if not exists cover_url text;
alter table conversations add column if not exists recording_date timestamptz;
alter table conversations add column if not exists display_date timestamptz;
alter table conversations add column if not exists reaction_adjustment bigint not null default 0;
alter table conversations add column if not exists featured boolean not null default false;
alter table conversations add column if not exists homepage_visible boolean not null default true;
alter table conversations add column if not exists seo_title text;
alter table conversations add column if not exists seo_description text;

alter table papers add column if not exists category text;
alter table papers add column if not exists display_date timestamptz;
alter table papers add column if not exists footnotes jsonb not null default '[]';
alter table papers add column if not exists reaction_adjustment bigint not null default 0;
alter table papers add column if not exists featured boolean not null default false;
alter table papers add column if not exists homepage_visible boolean not null default true;
alter table papers add column if not exists seo_title text;
alter table papers add column if not exists seo_description text;

update conversations set display_date=published_at where display_date is null and published_at is not null;
update papers set display_date=published_at where display_date is null and published_at is not null;
