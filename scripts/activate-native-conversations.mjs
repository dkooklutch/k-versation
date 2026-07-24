import { readFile } from 'node:fs/promises'
import process from 'node:process'
import pg from 'pg'

const { Client } = pg
const slugs = [
  'jamie-gao',
  'diane-rosenberg',
  'coach-logan',
  'sera-shim',
  'yoonjong-park',
  'lee-seung-yong-codetree',
]
const dates = new Map([
  ['jamie-gao', '2026-02-23'],
  ['diane-rosenberg', '2026-01-07'],
  ['coach-logan', '2025-12-19'],
  ['sera-shim', '2025-11-04'],
  ['yoonjong-park', '2025-10-31'],
  ['lee-seung-yong-codetree', '2025-09-12'],
])
const durations = new Map([
  ['sera-shim', 949],
  ['diane-rosenberg', 2528],
  ['jamie-gao', 1191],
  ['lee-seung-yong-codetree', 2125],
  ['yoonjong-park', 784],
  ['coach-logan', 1314],
])

const rawConnectionString = process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
if (!rawConnectionString || !supabaseUrl) {
  throw new Error('POSTGRES_URL_NON_POOLING (or POSTGRES_URL) and NEXT_PUBLIC_SUPABASE_URL are required.')
}
const connectionUrl = new URL(rawConnectionString)
connectionUrl.searchParams.delete('sslmode')
const migration = await readFile(new URL('../supabase/migrations/010_native_media_and_transcripts.sql', import.meta.url), 'utf8')
const manifest = JSON.parse(await readFile(new URL('../data/conversations/native-media-manifest.json', import.meta.url), 'utf8'))
const transcripts = JSON.parse(await readFile(new URL('../data/conversations/structured-transcripts.json', import.meta.url), 'utf8'))
const publicBase = `${supabaseUrl.replace(/\/$/, '')}/storage/v1/object/public/kversation-media`

if (Object.keys(manifest).length !== 6 || slugs.some(slug => !manifest[slug])) {
  throw new Error('The native media manifest must contain exactly the six expected Conversations.')
}
if (transcripts['sera-shim']?.exchanges?.length !== 12 || transcripts['coach-logan']?.exchanges?.length !== 19) {
  throw new Error('The structured transcript batch must contain 12 Sera and 19 Coach Logan exchanges.')
}

function plainTranscript(transcript) {
  return transcript.exchanges.map(exchange => [
    `${exchange.question.speaker}:`,
    exchange.question.text,
    `${exchange.answer.speaker}:`,
    exchange.answer.text,
  ].join('\n\n')).join('\n\n')
}

function engagementSnapshot(rows) {
  return Object.fromEntries(rows.map(row => [row.slug, {
    id: row.id,
    views: Number(row.views),
    completions: Number(row.completions),
    reactions: Number(row.reactions),
    comments: Number(row.comments),
    view_adjustment: Number(row.view_adjustment),
    completion_adjustment: Number(row.completion_adjustment),
    reaction_adjustment: Number(row.reaction_adjustment),
  }]))
}

const client = new Client({
  connectionString: connectionUrl.toString(),
  ssl: { rejectUnauthorized: false },
})
await client.connect()

try {
  await client.query('begin')
  await client.query(migration)
  if (process.argv.includes('--schema-only')) {
    await client.query('commit')
    console.log(JSON.stringify({ migration: '010_native_media_and_transcripts', applied: true }, null, 2))
  } else {
    const beforeResult = await client.query(`
    select c.id, c.slug, c.original_publication_date::text as original_publication_date,
      c.view_adjustment, c.completion_adjustment, c.reaction_adjustment,
      (select count(*) from analytics_events a where a.content_type='conversation' and a.event_type='open'
        and a.content_id in (c.id::text, c.slug)) as views,
      (select count(*) from analytics_events a where a.content_type='conversation' and a.event_type='completion'
        and a.content_id in (c.id::text, c.slug)) as completions,
      (select count(*) from reactions r where r.content_type='conversation'
        and r.content_id in (c.id::text, c.slug)) as reactions,
      (select count(*) from comments m where m.content_type='conversation'
        and m.content_id in (c.id::text, c.slug)) as comments
    from conversations c where c.slug = any($1::text[])
    order by c.slug
  `, [slugs])
  if (beforeResult.rows.length !== 6) {
    throw new Error(`Expected six existing Conversation records; found ${beforeResult.rows.length}.`)
  }
  for (const row of beforeResult.rows) {
    if (row.original_publication_date !== dates.get(row.slug)) {
      throw new Error(`Publication date mismatch before activation for ${row.slug}.`)
    }
  }
  const before = engagementSnapshot(beforeResult.rows)

  for (const slug of slugs) {
    const media = manifest[slug]
    await client.query(`
      update conversations set
        media_source='supabase',
        video_provider='hosted',
        video_url=$2,
        thumbnail_url=$3,
        external_video_id=null,
        source_url=null,
        source_video_filename=$4,
        source_video_sha256=$5,
        duration_seconds=$6,
        video_width=1280,
        video_height=720,
        interviewer_name='Daniel Koo',
        host_name='Daniel Koo',
        updated_at=now()
      where slug=$1
    `, [
      slug,
      `${publicBase}/${media.playlist_path}`,
      `${publicBase}/${media.poster_path}`,
      media.source_file,
      media.source_sha256,
      durations.get(slug),
    ])
  }

  for (const slug of ['sera-shim', 'coach-logan']) {
    const transcript = transcripts[slug]
    const isSera = slug === 'sera-shim'
    await client.query(`
      update conversations set
        title=$2,
        guest_name=$3,
        guest_title=$4,
        category=$5,
        topic=$6,
        transcript=$7,
        transcript_language='English',
        transcript_enabled=true,
        transcript_exchanges=$8::jsonb,
        transcript_updated_at=now(),
        seo_title=$9,
        seo_description=$10,
        updated_at=now()
      where slug=$1
    `, [
      slug,
      isSera ? 'IVE, Global K-pop, and the Age of AI' : 'Coach Logan on the Future of Korean Basketball',
      isSera ? 'Sera Shim' : 'Coach Logan, Kim Seung-chan',
      isSera ? 'Director of Strategic Planning, Starship Entertainment' : 'Former KBL player and Head Coach, Quantum Basketball',
      isSera ? 'Music' : 'Sports',
      isSera ? 'K-pop industry' : 'Korean basketball',
      plainTranscript(transcript),
      JSON.stringify(transcript.exchanges),
      isSera ? 'IVE, Global K-pop, and the Age of AI | K-VERSATION' : 'Coach Logan on the Future of Korean Basketball | K-VERSATION',
      isSera
        ? 'Daniel Koo speaks with Sera Shim about IVE, K-pop’s global growth, artist protection, and the opportunities and limits of AI in music.'
        : 'Daniel Koo speaks with Coach Logan, Kim Seung-chan, about the KBL, youth coaching, player development, and the future of Korean basketball.',
    ])
  }

  await client.query(`
    insert into audit_logs(action, entity_type, details)
    values('conversation.native_media_transcript_activation', 'conversation', $1::jsonb)
  `, [JSON.stringify({
    count: 6,
    slugs,
    transcripts: { 'sera-shim': 12, 'coach-logan': 19 },
    engagement_before: before,
  })])

  const afterResult = await client.query(`
    select c.id, c.slug, c.original_publication_date::text as original_publication_date,
      c.video_provider, c.video_url, c.thumbnail_url, c.external_video_id, c.source_url,
      c.source_video_filename, c.source_video_sha256, c.interviewer_name, c.host_name,
      c.transcript_language, c.transcript_enabled,
      jsonb_array_length(c.transcript_exchanges) as transcript_exchange_count,
      c.view_adjustment, c.completion_adjustment, c.reaction_adjustment,
      (select count(*) from analytics_events a where a.content_type='conversation' and a.event_type='open'
        and a.content_id in (c.id::text, c.slug)) as views,
      (select count(*) from analytics_events a where a.content_type='conversation' and a.event_type='completion'
        and a.content_id in (c.id::text, c.slug)) as completions,
      (select count(*) from reactions r where r.content_type='conversation'
        and r.content_id in (c.id::text, c.slug)) as reactions,
      (select count(*) from comments m where m.content_type='conversation'
        and m.content_id in (c.id::text, c.slug)) as comments
    from conversations c where c.slug = any($1::text[])
    order by c.original_publication_date desc
  `, [slugs])
  const after = engagementSnapshot(afterResult.rows)
  if (JSON.stringify(before) !== JSON.stringify(after)) throw new Error('Engagement verification failed; transaction will be rolled back.')
  if (
    afterResult.rows.length !== 6 ||
    afterResult.rows[0]?.slug !== 'jamie-gao' ||
    afterResult.rows.some(row =>
      row.video_provider !== 'hosted' ||
      row.external_video_id !== null ||
      row.source_url !== null ||
      !String(row.video_url).includes('/kversation-media/video/conversations/') ||
      !String(row.thumbnail_url).includes('/kversation-media/image/conversations/') ||
      row.interviewer_name !== 'Daniel Koo' ||
      row.host_name !== 'Daniel Koo' ||
      row.original_publication_date !== dates.get(row.slug)
    ) ||
    Number(afterResult.rows.find(row => row.slug === 'sera-shim')?.transcript_exchange_count) !== 12 ||
    Number(afterResult.rows.find(row => row.slug === 'coach-logan')?.transcript_exchange_count) !== 19
  ) {
    throw new Error(`Native activation verification failed: ${JSON.stringify(afterResult.rows)}`)
  }

  await client.query('commit')
  console.log(JSON.stringify({
    updated: afterResult.rows.length,
    chronological_order: afterResult.rows.map(row => row.slug),
    transcripts: { 'sera-shim': 12, 'coach-logan': 19 },
    engagement_preserved: true,
    engagement: after,
  }, null, 2))
  }
} catch (error) {
  try { await client.query('rollback') } catch {}
  throw error
} finally {
  await client.end()
}
