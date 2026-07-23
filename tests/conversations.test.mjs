import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const read = path => readFile(new URL(`../${path}`, import.meta.url), 'utf8')

test('the initial Conversation batch contains exactly the six supplied IDs and dates', async () => {
  const records = JSON.parse(await read('data/conversations/initial-six-import.json'))
  const expected = [
    ['EI8vW4Lc35A', '2026-02-23'],
    ['csPYU9I3mCc', '2026-01-07'],
    ['0KUO4gRBbTM', '2025-12-19'],
    ['VbzP4ujlyNI', '2025-11-04'],
    ['kt7GEm3capY', '2025-10-31'],
    ['zjwDzBFXZTE', '2025-09-12'],
  ]
  assert.equal(records.length, 6)
  assert.equal(new Set(records.map(record => record.external_video_id)).size, 6)
  assert.deepEqual(records.map(record => [record.external_video_id, record.original_publication_date]), expected)
  assert.equal(records.filter(record => record.featured).length, 1)
  assert.equal(records.find(record => record.featured).external_video_id, 'EI8vW4Lc35A')
  assert.ok(records.every(record => record.video_provider === 'youtube'))
  assert.ok(records.every(record => record.thumbnail_url.includes(`/vi/${record.external_video_id}/`)))
})

test('public Conversations use private IDs with the privacy-enhanced player', async () => {
  const [player, detail, publicContent] = await Promise.all([
    read('components/MediaPlayer.tsx'),
    read('app/conversations/[slug]/page.tsx'),
    read('lib/public-content.ts'),
  ])
  assert.match(player, /youtube-nocookie\.com\/embed/)
  assert.match(player, /enablejsapi=1/)
  assert.match(player, /PlayerState\.ENDED/)
  assert.match(player, /kv-complete-/)
  assert.doesNotMatch(detail, /youtube\.com\/watch/)
  assert.match(publicContent, /external_video_id/)
  assert.match(publicContent, /original_publication_date/)
  assert.match(publicContent, /order\('original_publication_date'/)
})

test('Conversation views are page-load based and prefetch safe', async () => {
  const [beacon, route] = await Promise.all([
    read('components/AnalyticsBeacon.tsx'),
    read('app/api/analytics/route.ts'),
  ])
  assert.match(beacon, /pageLoadId:crypto\.randomUUID\(\)/)
  assert.match(route, /purpose'\)==='prefetch'/)
  assert.match(route, /onConflict:'page_load_id'/)
  assert.match(route, /ignoreDuplicates:true/)
})
