alter table papers add column if not exists summary text;
alter table papers add column if not exists author_name text not null default 'Daniel Koo';
alter table papers add column if not exists original_draft_date date;
alter table papers add column if not exists revised_at timestamptz;
alter table papers add column if not exists collection_key text;
alter table papers add column if not exists collection_position integer check(collection_position is null or collection_position > 0);
alter table papers add column if not exists collection_pdf_url text;
alter table papers add column if not exists source_metadata jsonb not null default '{}'::jsonb;

create index if not exists papers_archive_date
on papers(original_draft_date desc nulls last, published_at desc);

create unique index if not exists papers_collection_position
on papers(collection_key, collection_position)
where collection_key is not null and collection_position is not null;

comment on column papers.body is
'Ordered, extensible article blocks. Supported blocks include paragraph, heading, quote, and figure; future block types remain valid JSON.';

comment on column papers.original_draft_date is
'The author-supplied date of the original draft. Public archive chronology uses this before published_at.';

comment on column papers.published_at is
'The actual website publication timestamp, independent of original_draft_date.';

update papers
set original_draft_date = display_date::date
where original_draft_date is null and display_date is not null;

drop policy if exists public_papers on papers;
create policy public_papers on papers for select using(
  (status = 'published' and coalesce(published_at, now()) <= now())
  or (status = 'scheduled' and scheduled_for is not null and scheduled_for <= now())
);
