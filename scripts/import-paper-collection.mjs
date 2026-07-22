import fs from 'node:fs'
import { createClient } from '@supabase/supabase-js'

const manifestPath = process.argv[2] || 'data/papers/initial-23-import.json'
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
if (manifest.collection.import_count !== 23 || manifest.papers.length !== 23) throw new Error('The import manifest must contain exactly 23 papers.')

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !key) throw new Error('NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.')
const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
const publishedAt = new Date().toISOString()

const rows = manifest.papers.map(paper => ({ ...paper, published_at: publishedAt, display_date: `${paper.original_draft_date}T12:00:00.000Z` }))
const { error: sampleError } = await db.from('papers').update({ status: 'archived', homepage_visible: false, featured: false }).eq('is_sample', true)
if (sampleError) throw sampleError
const { data, error } = await db.from('papers').upsert(rows, { onConflict: 'slug' }).select('id,slug,title,original_draft_date,collection_position,featured,status')
if (error) throw error

const { data: imported, error: verifyError } = await db.from('papers')
  .select('id,slug,title,subtitle,summary,body,original_draft_date,collection_position,cover_url,collection_pdf_url,featured,status')
  .eq('collection_key', manifest.collection.key)
  .order('collection_position')
if (verifyError) throw verifyError
if (imported.length !== 23) throw new Error(`Production verification found ${imported.length} imported papers instead of 23.`)
for (let index = 0; index < imported.length; index += 1) {
  const expected = manifest.papers[index]
  const actual = imported[index]
  if (actual.title !== expected.title || actual.slug !== expected.slug || actual.original_draft_date !== expected.original_draft_date) throw new Error(`Production metadata mismatch at paper ${index + 1}.`)
  if (actual.body.length !== expected.body.length) throw new Error(`Production body-block mismatch at paper ${index + 1}.`)
  const figures = actual.body.filter(block => block.type === 'figure')
  if (figures.length !== 1 || figures[0].caption !== expected.body.find(block => block.type === 'figure').caption) throw new Error(`Production figure mismatch at paper ${index + 1}.`)
}
if (imported.filter(paper => paper.featured).length !== 1 || imported.at(-1).title !== 'After Midnight in Seoul' || !imported.at(-1).featured) throw new Error('Featured-paper verification failed.')
console.log(`Imported and verified ${data.length} records in the current 23-paper collection.`)
