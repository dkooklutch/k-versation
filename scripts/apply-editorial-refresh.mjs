import { readFile } from 'node:fs/promises'
import process from 'node:process'
import pg from 'pg'

const { Client } = pg
const rawConnectionString = process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL
if (!rawConnectionString) throw new Error('POSTGRES_URL_NON_POOLING or POSTGRES_URL is required.')
const connectionUrl = new URL(rawConnectionString)
connectionUrl.searchParams.delete('sslmode')

const migration = await readFile(new URL('../supabase/migrations/011_reaction_breakdown.sql', import.meta.url), 'utf8')
const refresh = JSON.parse(await readFile(new URL('../data/conversations/editorial-refresh.json', import.meta.url), 'utf8'))
if (refresh.conversations?.length !== 6) throw new Error('The editorial refresh must contain exactly six Conversations.')
for (const record of refresh.conversations) {
  if (/K-?VERSATION/i.test(record.title) || /[\u3131-\uD79D]/u.test(record.title)) {
    throw new Error(`Public title is not clean: ${record.slug}`)
  }
  if (/[—;]/.test(`${record.title} ${record.editorial_description}`)) {
    throw new Error(`Em dash or semicolon found in public copy: ${record.slug}`)
  }
  if (!record.editorial_description.startsWith('I had the opportunity to interview ')) {
    throw new Error(`Host introduction missing for ${record.slug}`)
  }
  if (!record.editorial_description.endsWith('I hope you enjoy.')) {
    throw new Error(`Closing sentence missing for ${record.slug}`)
  }
  if ((record.editorial_description.match(/[.!?](?:\s|$)/g) || []).length < 3) {
    throw new Error(`Description is shorter than three sentences: ${record.slug}`)
  }
  if (refresh.comments?.[record.slug]?.length !== 3) {
    throw new Error(`Exactly three seeded comments are required for ${record.slug}`)
  }
}

const commentNames = [
  'K-VERSATION Listener 104',
  'K-VERSATION Listener 287',
  'K-VERSATION Listener 641',
]
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
    console.log(JSON.stringify({ migration: '011_reaction_breakdown', applied: true }, null, 2))
  } else {
    const slugs = refresh.conversations.map(record => record.slug)
    const { rows: before } = await client.query(`
      select c.id, c.slug,
        (select count(*) from analytics_events a where a.content_type='conversation'
          and a.content_id in (c.id::text,c.slug))::int as analytics,
        (select count(*) from reactions r where r.content_type='conversation'
          and r.content_id in (c.id::text,c.slug))::int as reactions,
        (select count(*) from comments m where m.content_type='conversation'
          and m.content_id in (c.id::text,c.slug))::int as comments
      from conversations c where c.slug=any($1::text[]) order by c.slug
    `, [slugs])
    if (before.length !== 6) throw new Error(`Expected six existing records, found ${before.length}.`)
    const beforeBySlug = new Map(before.map(row => [row.slug, row]))

    for (const record of refresh.conversations) {
      await client.query(`
        update conversations set
          title=$2,
          subtitle=$3,
          short_description=$4,
          description=$5,
          editorial_description=$5,
          seo_title=$2,
          seo_description=$6,
          updated_at=now()
        where slug=$1
      `, [
        record.slug,
        record.title,
        record.subtitle,
        record.short_description,
        record.editorial_description,
        record.seo_description,
      ])
      for (const [index, body] of refresh.comments[record.slug].entries()) {
        await client.query(`
          insert into comments (
            content_id,content_type,anonymous_name,body,is_hidden,is_pinned,is_official,created_at,updated_at
          )
          select c.id::text,'conversation',$2,$3,false,false,false,
            now() - (($4::int + 1) * interval '7 hours'),
            now() - (($4::int + 1) * interval '7 hours')
          from conversations c
          where c.slug=$1
            and not exists (
              select 1 from comments existing
              where existing.content_type='conversation'
                and existing.content_id in (c.id::text,c.slug)
                and existing.body=$3
            )
        `, [record.slug, commentNames[index], body, index])
      }
    }

    const { rowCount: paperCount } = await client.query(`
      update papers
      set cover_url='/papers/after-midnight-seoul-editorial.jpg',updated_at=now()
      where slug='after-midnight-in-seoul'
    `)
    if (paperCount !== 1) throw new Error('After Midnight in Seoul paper record was not found.')

    const { rows: after } = await client.query(`
      select c.id, c.slug, c.title, c.editorial_description,
        (select count(*) from analytics_events a where a.content_type='conversation'
          and a.content_id in (c.id::text,c.slug))::int as analytics,
        (select count(*) from reactions r where r.content_type='conversation'
          and r.content_id in (c.id::text,c.slug))::int as reactions,
        (select count(*) from comments m where m.content_type='conversation'
          and m.content_id in (c.id::text,c.slug))::int as comments
      from conversations c where c.slug=any($1::text[]) order by c.slug
    `, [slugs])
    for (const row of after) {
      const previous = beforeBySlug.get(row.slug)
      if (!previous || row.analytics !== previous.analytics || row.reactions !== previous.reactions) {
        throw new Error(`Existing engagement changed for ${row.slug}.`)
      }
      if (row.comments !== previous.comments + 3) {
        throw new Error(`Seeded comment verification failed for ${row.slug}.`)
      }
      if (/K-?VERSATION/i.test(row.title) || /[\u3131-\uD79D]/u.test(row.title)) {
        throw new Error(`Public title verification failed for ${row.slug}.`)
      }
    }
    await client.query(`
      insert into audit_logs(action,entity_type,details)
      values('conversation.editorial_refresh','conversation',$1::jsonb)
    `, [JSON.stringify({
      records: 6,
      seeded_comments: 18,
      paper_cover: 'after-midnight-seoul-editorial.jpg',
      engagement_preserved: true,
    })])
    await client.query('commit')
    console.log(JSON.stringify({
      updated_conversations: 6,
      seeded_comments: 18,
      paper_cover_updated: true,
      engagement_preserved: true,
      titles: after.map(row => ({ slug: row.slug, title: row.title })),
    }, null, 2))
  }
} catch (error) {
  try { await client.query('rollback') } catch {}
  throw error
} finally {
  await client.end()
}
