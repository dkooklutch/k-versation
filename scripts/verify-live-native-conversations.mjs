import { readFile } from 'node:fs/promises'
import process from 'node:process'

const origin = (process.env.KV_SITE_ORIGIN || 'https://k-versation-1.vercel.app').replace(/\/$/, '')
const manifest = JSON.parse(await readFile(new URL('../data/conversations/native-media-manifest.json', import.meta.url), 'utf8'))
const initial = JSON.parse(await readFile(new URL('../data/conversations/initial-six-import.json', import.meta.url), 'utf8'))
const transcripts = JSON.parse(await readFile(new URL('../data/conversations/structured-transcripts.json', import.meta.url), 'utf8'))
const orderedSlugs = ['jamie-gao', 'diane-rosenberg', 'coach-logan', 'sera-shim', 'yoonjong-park', 'lee-seung-yong-codetree']
const dateLabels = new Map([
  ['jamie-gao', 'February 23, 2026'],
  ['diane-rosenberg', 'January 7, 2026'],
  ['coach-logan', 'December 19, 2025'],
  ['sera-shim', 'November 4, 2025'],
  ['yoonjong-park', 'October 31, 2025'],
  ['lee-seung-yong-codetree', 'September 12, 2025'],
])
const forbidden = [
  'youtube.com',
  'youtube-nocookie.com',
  'youtu.be',
  'i.ytimg.com',
  ...initial.map(record => record.external_video_id),
]

async function get(url) {
  const response = await fetch(url, { cache: 'no-store', redirect: 'follow' })
  if (!response.ok) throw new Error(`${response.status} from ${url}`)
  return { response, text: await response.text() }
}

const { text: archive } = await get(`${origin}/conversations`)
let previous = -1
for (const slug of orderedSlugs) {
  const position = archive.indexOf(`/conversations/${slug}`)
  if (position < 0 || position <= previous) throw new Error(`Archive order failed at ${slug}`)
  previous = position
}
for (const term of ['Sera Shim', 'IVE', 'Suno', 'Coach Logan', 'KBL', 'Quantum Skills Lab']) {
  if (!archive.includes(term)) throw new Error(`Search corpus term missing from archive: ${term}`)
}

const results = []
for (const slug of orderedSlugs) {
  const { text: page } = await get(`${origin}/conversations/${slug}`)
  for (const value of forbidden) {
    if (page.toLowerCase().includes(value.toLowerCase())) throw new Error(`Forbidden YouTube source found on ${slug}: ${value}`)
  }
  if (!page.includes('Published') || !page.includes(dateLabels.get(slug))) throw new Error(`Publication label missing for ${slug}`)
  if (!page.includes('K-VERSATION Player')) throw new Error(`Native player missing for ${slug}`)
  if (!page.includes(manifest[slug].playlist_path) || !page.includes(manifest[slug].poster_path)) throw new Error(`Native media paths missing for ${slug}`)

  const playlistUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/kversation-media/${manifest[slug].playlist_path}`
  const { text: playlist } = await get(playlistUrl)
  if (!playlist.startsWith('#EXTM3U') || !playlist.includes('#EXT-X-ENDLIST')) throw new Error(`Invalid HLS playlist for ${slug}`)
  const segments = playlist.split('\n').filter(line => line && !line.startsWith('#'))
  if (!segments.length) throw new Error(`No HLS segments for ${slug}`)
  const segmentUrl = new URL(segments[0], playlistUrl).toString()
  const segment = await fetch(segmentUrl, { headers: { Range: 'bytes=0-1023' } })
  if (!segment.ok || Number(segment.headers.get('content-length') || 0) < 1024) throw new Error(`First media segment failed for ${slug}`)
  results.push({ slug, segments: segments.length, page: 200, playlist: 200, first_segment: segment.status })
}

const transcriptChecks = [
  ['sera-shim', 12, 'Sera Shim'],
  ['coach-logan', 19, 'Coach Logan'],
]
for (const [slug, expected, answerSpeaker] of transcriptChecks) {
  const { text: page } = await get(`${origin}/conversations/${slug}`)
  const transcript = transcripts[slug]
  if (transcript.exchanges.length !== expected) throw new Error(`Source transcript count failed for ${slug}`)
  if (!page.includes('English Transcript') || !page.includes('Read Full Transcript')) throw new Error(`Transcript controls missing for ${slug}`)
  if (!page.includes('Interviewer') || !page.includes('Daniel Koo') || !page.includes('Guest')) throw new Error(`Transcript credits missing for ${slug}`)
  for (const exchange of transcript.exchanges) {
    const paragraphs = [...exchange.question.text.split('\n\n'), ...exchange.answer.text.split('\n\n')]
    if (paragraphs.some(paragraph => !page.includes(paragraph))) throw new Error(`Transcript exchange ${exchange.order} missing for ${slug}`)
    if (exchange.answer.speaker !== answerSpeaker) throw new Error(`Answer speaker mismatch for ${slug}`)
  }
  if (/\b\d{1,2}:\d{2}\b/.test(transcript.exchanges.map(item => `${item.question.text} ${item.answer.text}`).join(' '))) {
    throw new Error(`Timestamp found for ${slug}`)
  }
}

console.log(JSON.stringify({
  origin,
  records: results.length,
  chronological_order: orderedSlugs,
  native_media: results,
  transcripts: { 'sera-shim': 12, 'coach-logan': 19 },
  youtube_public_references: 0,
  search_terms_verified: true,
}, null, 2))
