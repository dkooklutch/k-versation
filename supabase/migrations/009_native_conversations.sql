-- Native source and editorial metadata for the Conversation archive.
-- Source facts stay independent from host-editable public presentation.
alter table conversations add column if not exists source_title text;
alter table conversations add column if not exists source_description text;
alter table conversations add column if not exists editorial_description text;
alter table conversations add column if not exists video_provider text
  check (video_provider is null or video_provider in ('youtube', 'vimeo', 'upload', 'hosted'));
alter table conversations add column if not exists external_video_id text;
alter table conversations add column if not exists source_url text;
alter table conversations add column if not exists original_publication_date date;
alter table conversations add column if not exists captions_available boolean not null default false;
alter table conversations add column if not exists caption_tracks jsonb not null default '[]'::jsonb;
alter table conversations add column if not exists video_width integer
  check (video_width is null or video_width > 0);
alter table conversations add column if not exists video_height integer
  check (video_height is null or video_height > 0);
alter table conversations add column if not exists completion_adjustment bigint not null default 0;

create unique index if not exists conversations_provider_external_id
on conversations(video_provider, external_video_id)
where external_video_id is not null;

create index if not exists conversations_original_publication
on conversations(original_publication_date desc nulls last, published_at desc);

comment on column conversations.original_publication_date is
'The source publication date supplied by the host. Public Conversation chronology uses this field.';
comment on column conversations.published_at is
'The website publication timestamp. It remains independent of the source publication date.';
comment on column conversations.source_title is
'Unmodified title retrieved from the source provider.';
comment on column conversations.title is
'Host-editable K-VERSATION display title.';
comment on column conversations.source_description is
'Unmodified description retrieved from the source provider.';
comment on column conversations.editorial_description is
'Host-written public description. Falls back to description for older records.';

