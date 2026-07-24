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

test('attached originals are represented by six native media records', async () => {
  const manifest = JSON.parse(await read('data/conversations/native-media-manifest.json'))
  assert.equal(Object.keys(manifest).length, 6)
  assert.equal(new Set(Object.values(manifest).map(record => record.source_sha256)).size, 6)
  for (const [slug, record] of Object.entries(manifest)) {
    assert.match(record.playlist_path, new RegExp(`^video/conversations/${slug}/native-v1/master\\.m3u8$`))
    assert.match(record.poster_path, new RegExp(`^image/conversations/${slug}/native-v1/poster\\.jpg$`))
    assert.match(record.source_sha256, /^[a-f0-9]{64}$/)
  }
})

test('public Conversations support native HLS without exposing source IDs', async () => {
  const [player, detail, publicContent, activation] = await Promise.all([
    read('components/MediaPlayer.tsx'),
    read('app/conversations/[slug]/page.tsx'),
    read('lib/public-content.ts'),
    read('scripts/activate-native-conversations.mjs'),
  ])
  assert.match(player, /Hls\.isSupported/)
  assert.match(player, /application\/vnd\.apple\.mpegurl/)
  assert.match(player, /controls/)
  assert.match(player, /playsInline/)
  assert.match(player, /Playback speed/)
  assert.match(player, /kv-complete-/)
  assert.doesNotMatch(detail, /youtube\.com\/watch/)
  assert.match(publicContent, /provider==='youtube'\?\(row\.external_video_id/)
  assert.match(activation, /external_video_id=null/)
  assert.match(activation, /source_url=null/)
  assert.match(publicContent, /original_publication_date/)
  assert.match(publicContent, /order\('original_publication_date'/)
})

test('Sera Shim and Coach Logan transcripts are complete, structured, and correctly attributed', async () => {
  const transcripts = JSON.parse(await read('data/conversations/structured-transcripts.json'))
  const sera = transcripts['sera-shim']
  const coach = transcripts['coach-logan']
  assert.equal(sera.exchanges.length, 12)
  assert.equal(coach.exchanges.length, 19)
  assert.equal(sera.guest, 'Sera Shim')
  assert.equal(coach.guest, 'Coach Logan, Kim Seung-chan')
  for (const transcript of [sera, coach]) {
    assert.equal(transcript.interviewer, 'Daniel Koo')
    assert.equal(transcript.host, 'Daniel Koo')
    assert.equal(transcript.language, 'English')
    assert.ok(transcript.enabled)
    transcript.exchanges.forEach((exchange, index) => {
      assert.equal(exchange.order, index + 1)
      assert.equal(exchange.question.speaker, 'Daniel Koo')
      assert.equal(exchange.question.role, 'Interviewer')
      assert.equal(exchange.answer.role, 'Guest')
      assert.ok(exchange.question.text)
      assert.ok(exchange.answer.text)
      assert.doesNotMatch(`${exchange.question.text} ${exchange.answer.text}`, /\b\d{1,2}:\d{2}\b/)
    })
  }
  assert.ok(sera.exchanges.every(exchange => exchange.answer.speaker === 'Sera Shim'))
  assert.ok(coach.exchanges.every(exchange => exchange.answer.speaker === 'Coach Logan'))
})

test('transcripts are placed between interaction controls and comments with an accessible expansion control', async () => {
  const [detail, transcript, editor, archive] = await Promise.all([
    read('app/conversations/[slug]/page.tsx'),
    read('components/ConversationTranscript.tsx'),
    read('components/host/TranscriptEditor.tsx'),
    read('app/conversations/page.tsx'),
  ])
  const controls = detail.indexOf('part="controls"')
  const publicTranscript = detail.indexOf('<ConversationTranscript')
  const comments = detail.indexOf('part="comments"')
  assert.ok(controls < publicTranscript && publicTranscript < comments)
  assert.match(transcript, /id="transcript"/)
  assert.match(transcript, /aria-expanded=\{expanded\}/)
  assert.match(transcript, /aria-controls="transcript-exchanges"/)
  assert.match(transcript, /Read Full Transcript/)
  assert.match(transcript, /Collapse Transcript/)
  assert.match(editor, /Add exchange/)
  assert.match(editor, /Preview transcript/)
  assert.match(editor, /Move exchange/)
  assert.match(editor, /Remove exchange/)
  assert.match(archive, /c\.transcript/)
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

test('the editorial refresh has clean professional titles and host-written descriptions', async () => {
  const refresh = JSON.parse(await read('data/conversations/editorial-refresh.json'))
  assert.equal(refresh.conversations.length, 6)
  for (const record of refresh.conversations) {
    assert.doesNotMatch(record.title, /K-?VERSATION/i)
    assert.doesNotMatch(record.title, /[\u3131-\uD79D]/u)
    assert.doesNotMatch(`${record.title} ${record.editorial_description}`, /[—;]/)
    assert.ok(record.editorial_description.startsWith('I had the opportunity to interview '))
    assert.ok(record.editorial_description.endsWith('I hope you enjoy.'))
    assert.ok((record.editorial_description.match(/[.!?](?:\s|$)/g) || []).length >= 3)
    assert.equal(refresh.comments[record.slug].length, 3)
  }
})

test('public and host reaction interfaces expose individual persisted counts', async () => {
  const [interactions, reactions, host, hostPage] = await Promise.all([
    read('components/Interactions.tsx'),
    read('app/api/reactions/route.ts'),
    read('components/HostContentForm.tsx'),
    read('app/host/(dashboard)/dashboard/content/page.tsx'),
  ])
  for (const type of ['appreciate', 'insightful', 'powerful']) {
    assert.match(interactions, new RegExp(type))
    assert.match(reactions, new RegExp(`${type}_adjustment`))
    assert.match(hostPage, new RegExp(`${type}_verified`))
  }
  assert.match(host, /\$\{type\}_adjustment/)
  assert.match(reactions, /export async function GET/)
  assert.match(interactions, /counts\[type\]\.toLocaleString/)
})

test('host passwords remain visible and logout uses a non-JavaScript form', async () => {
  const [login, shell] = await Promise.all([
    read('app/host/login/HostLoginForm.tsx'),
    read('components/HostShell.tsx'),
  ])
  assert.match(login, /type="text" name="password"/)
  assert.doesNotMatch(login, /type="password"/)
  assert.match(shell, /method="post"/)
  assert.match(shell, /action="\/api\/host\/logout"/)
})
