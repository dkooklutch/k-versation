alter table conversations add column if not exists source_video_filename text;
alter table conversations add column if not exists source_video_sha256 text;
alter table conversations add column if not exists interviewer_name text;
alter table conversations add column if not exists host_name text;
alter table conversations add column if not exists transcript_language text;
alter table conversations add column if not exists transcript_enabled boolean not null default false;
alter table conversations add column if not exists transcript_exchanges jsonb not null default '[]'::jsonb;
alter table conversations add column if not exists transcript_updated_at timestamptz;

create index if not exists conversations_transcript_search
on conversations using gin(to_tsvector('english', coalesce(transcript, '')));

comment on column conversations.transcript_exchanges is
'Ordered interview exchanges. Each item contains order plus question and answer speaker, role, and text.';
comment on column conversations.transcript is
'Plain-text transcript projection retained for search and compatibility.';

update storage.buckets
set file_size_limit = 52428800,
    allowed_mime_types = array[
      'video/mp4','video/webm','video/quicktime','video/mp2t',
      'application/vnd.apple.mpegurl','application/x-mpegURL',
      'application/pdf','image/jpeg','image/png','image/webp','image/avif',
      'audio/mpeg','audio/mp4','audio/wav','audio/x-wav'
    ]
where id = 'kversation-media';
