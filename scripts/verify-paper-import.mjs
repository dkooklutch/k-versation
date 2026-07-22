import assert from 'node:assert/strict'
import fs from 'node:fs'
import { createClient } from '@supabase/supabase-js'

const manifest = JSON.parse(fs.readFileSync(process.argv[2] || 'data/papers/initial-23-import.json', 'utf8'))
const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !key) throw new Error('Production Supabase credentials are required.')
const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })

const { data: imported, error } = await db.from('papers').select('*').eq('collection_key', manifest.collection.key).order('collection_position')
if (error) throw error
assert.equal(imported.length, 23)

for (let index = 0; index < 23; index += 1) {
  const expected = manifest.papers[index]
  const actual = imported[index]
  for (const field of ['slug', 'title', 'subtitle', 'summary', 'excerpt', 'topic', 'category', 'original_draft_date', 'reading_minutes', 'cover_url', 'collection_key', 'collection_position', 'collection_pdf_url', 'author_name']) {
    assert.deepEqual(actual[field], expected[field], `${field} mismatch at paper ${index + 1}`)
  }
  assert.deepEqual(actual.body, expected.body, `body mismatch at paper ${index + 1}`)
  assert.equal(actual.status, 'published')
  assert.equal(actual.is_sample, false)
  assert.notEqual(actual.published_at.slice(0, 10), actual.original_draft_date)
}

assert.equal(new Set(imported.map(paper => paper.slug)).size, 23)
assert.equal(imported.filter(paper => paper.featured).length, 1)
assert.equal(imported.find(paper => paper.featured)?.title, 'After Midnight in Seoul')
assert.equal(imported.at(-1).original_draft_date, '2026-01-31')

const { count: publishedCount, error: countError } = await db.from('papers').select('*', { count: 'exact', head: true }).eq('status', 'published')
if (countError) throw countError
assert.equal(publishedCount, 23)

const probeSlug = `future-paper-schema-probe-${Date.now()}`
try {
  const { error: probeError } = await db.from('papers').insert({
    slug: probeSlug,
    title: 'Future paper schema probe',
    subtitle: 'Temporary unpublished verification record',
    summary: 'This temporary draft verifies that the archive can grow beyond the current import batch.',
    category: 'Verification',
    body: [{ type: 'paragraph', text: 'Temporary verification content.' }],
    status: 'draft',
    author_name: 'Daniel Koo',
  })
  if (probeError) throw probeError
} finally {
  await db.from('papers').delete().eq('slug', probeSlug)
}

console.log('Verified the 23-paper production import and a temporary future-paper insert beyond the current batch.')
