import { readFile } from 'node:fs/promises'
import process from 'node:process'
import pg from 'pg'

const { Client } = pg
const expected = new Map([
  ['EI8vW4Lc35A', '2026-02-23'],
  ['csPYU9I3mCc', '2026-01-07'],
  ['0KUO4gRBbTM', '2025-12-19'],
  ['VbzP4ujlyNI', '2025-11-04'],
  ['kt7GEm3capY', '2025-10-31'],
  ['zjwDzBFXZTE', '2025-09-12'],
])
const rawConnectionString = process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL
if (!rawConnectionString) throw new Error('POSTGRES_URL_NON_POOLING or POSTGRES_URL is required.')
const connectionUrl = new URL(rawConnectionString)
connectionUrl.searchParams.delete('sslmode')
const connectionString = connectionUrl.toString()

const migration = await readFile(new URL('../supabase/migrations/009_native_conversations.sql', import.meta.url), 'utf8')
const records = JSON.parse(await readFile(new URL('../data/conversations/initial-six-import.json', import.meta.url), 'utf8'))
if (!Array.isArray(records) || records.length !== 6) throw new Error('The initial Conversation batch must contain exactly six records.')
if (new Set(records.map(record => record.external_video_id)).size !== 6) throw new Error('The initial Conversation batch contains a duplicate video ID.')
for (const record of records) {
  if (expected.get(record.external_video_id) !== record.original_publication_date) {
    throw new Error(`Unexpected date or video ID: ${record.external_video_id}`)
  }
}

const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } })
await client.connect()

try {
  await client.query('begin')
  await client.query(migration)
  await client.query(`
    update conversations
    set status = 'archived', featured = false, homepage_visible = false, updated_at = now()
    where is_sample = true and status <> 'archived'
  `)
  await client.query('update conversations set featured = false where featured = true')

  for (const record of records) {
    const values = [
      record.slug, record.title, record.source_title, record.guest_name, record.guest_title,
      record.subtitle, record.short_description, record.description, record.editorial_description,
      record.source_description, record.category, record.topic, record.video_provider,
      record.external_video_id, record.source_url, record.media_source, record.duration_seconds,
      record.original_publication_date, record.thumbnail_url, record.captions_available,
      JSON.stringify(record.caption_tracks), record.video_width, record.video_height, record.featured,
      record.title, record.short_description,
    ]
    await client.query(`
      insert into conversations (
        slug, title, source_title, guest_name, guest_title, subtitle, short_description,
        description, editorial_description, source_description, category, topic, video_provider,
        external_video_id, source_url, media_source, duration_seconds, original_publication_date,
        display_date, thumbnail_url, captions_available, caption_tracks, video_width, video_height,
        featured, homepage_visible, comments_enabled, reactions_enabled, status, published_at,
        seo_title, seo_description, is_sample, video_url
      ) values (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,
        ($18::date + time '12:00') at time zone 'America/Los_Angeles',$19,$20,$21::jsonb,$22,$23,
        $24,true,true,true,'published',now(),$25,$26,false,null
      )
      on conflict (slug) do update set
        title=excluded.title, source_title=excluded.source_title, guest_name=excluded.guest_name,
        guest_title=excluded.guest_title, subtitle=excluded.subtitle,
        short_description=excluded.short_description, description=excluded.description,
        editorial_description=excluded.editorial_description,
        source_description=excluded.source_description, category=excluded.category, topic=excluded.topic,
        video_provider=excluded.video_provider, external_video_id=excluded.external_video_id,
        source_url=excluded.source_url, media_source=excluded.media_source,
        duration_seconds=excluded.duration_seconds,
        original_publication_date=excluded.original_publication_date, display_date=excluded.display_date,
        thumbnail_url=excluded.thumbnail_url, captions_available=excluded.captions_available,
        caption_tracks=excluded.caption_tracks, video_width=excluded.video_width,
        video_height=excluded.video_height, featured=excluded.featured, homepage_visible=true,
        comments_enabled=true, reactions_enabled=true, status='published',
        seo_title=excluded.seo_title, seo_description=excluded.seo_description,
        is_sample=false, video_url=null, updated_at=now()
    `, values)
  }

  await client.query(`
    insert into audit_logs(action, entity_type, details)
    values('conversation.initial_six_import', 'conversation', $1::jsonb)
  `, [JSON.stringify({ count: records.length, external_video_ids: [...expected.keys()] })])
  await client.query('commit')

  const { rows } = await client.query(`
    select slug, title, external_video_id, original_publication_date::text as original_publication_date,
      video_provider, featured, status, thumbnail_url
    from conversations
    where external_video_id = any($1::text[])
    order by original_publication_date desc
  `, [[...expected.keys()]])
  const verified = rows.length === 6 &&
    new Set(rows.map(row => row.external_video_id)).size === 6 &&
    rows.every(row => expected.get(row.external_video_id) === row.original_publication_date) &&
    rows[0]?.external_video_id === 'EI8vW4Lc35A' &&
    rows.filter(row => row.featured).length === 1 &&
    rows.find(row => row.featured)?.external_video_id === 'EI8vW4Lc35A'
  if (!verified) throw new Error(`Post-import verification failed: ${JSON.stringify(rows)}`)
  console.log(JSON.stringify({ imported: rows.length, order: rows.map(row => row.external_video_id), latest: rows[0].external_video_id, featured: rows.find(row => row.featured)?.external_video_id }, null, 2))
} catch (error) {
  try { await client.query('rollback') } catch {}
  throw error
} finally {
  await client.end()
}
