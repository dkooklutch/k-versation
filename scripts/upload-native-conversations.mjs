import { createHash } from 'node:crypto'
import { createReadStream } from 'node:fs'
import { readFile, readdir, stat } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { createClient } from '@supabase/supabase-js'

const localRoot = process.env.KV_HLS_ROOT || '/private/tmp/kv-native-hls30-20260723'
const bucket = 'kversation-media'
const version = 'native-v1'
const sourceFiles = {
  'sera-shim': '/Users/dankoo/Desktop/K-VERSATION_ Interview with Starship Manager Sera Shim!.mp4',
  'diane-rosenberg': '/Users/dankoo/Desktop/K-VERSATION_ Interview with Diane Rosenberg.mp4',
  'jamie-gao': '/Users/dankoo/Desktop/K-VERSATION_ Interview with Jamie Gao!.mp4',
  'lee-seung-yong-codetree': '/Users/dankoo/Desktop/K-VERSATION_ Interview with CodeTree CEO, Lee Seung Yong _ 이승용.mp4',
  'yoonjong-park': '/Users/dankoo/Desktop/K-VERSATION_ Interview with Yoonjong Park!.mp4',
  'coach-logan': '/Users/dankoo/Desktop/K-VERSATION_ Interview with former KBL player, Coach Logan!.mp4',
}
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
})

async function sha256(file) {
  const hash = createHash('sha256')
  for await (const chunk of createReadStream(file)) hash.update(chunk)
  return hash.digest('hex')
}

async function retry(action, label) {
  let last
  for (let attempt = 1; attempt <= 4; attempt += 1) {
    try { return await action() } catch (error) {
      last = error
      if (attempt < 4) await new Promise(resolve => setTimeout(resolve, 500 * attempt))
    }
  }
  throw new Error(`${label}: ${last instanceof Error ? last.message : String(last)}`)
}

const uploads = []
for (const slug of Object.keys(sourceFiles)) {
  const directory = path.join(localRoot, slug)
  const files = (await readdir(directory)).sort()
  for (const file of files) {
    const local = path.join(directory, file)
    const remote = `video/conversations/${slug}/${version}/${file}`
    uploads.push({
      slug,
      local,
      remote,
      contentType: file.endsWith('.m3u8') ? 'application/vnd.apple.mpegurl' : 'video/mp2t',
    })
  }
  const thumbnail = path.join(localRoot, `${slug}-poster.jpg`)
  uploads.push({
    slug,
    local: thumbnail,
    remote: `image/conversations/${slug}/${version}/poster.jpg`,
    contentType: 'image/jpeg',
  })
}

let completed = 0
const queue = [...uploads]
async function worker() {
  while (queue.length) {
    const item = queue.shift()
    if (!item) return
    const body = await readFile(item.local)
    await retry(async () => {
      const { error } = await db.storage.from(bucket).upload(item.remote, body, {
        contentType: item.contentType,
        cacheControl: item.contentType.includes('mpegurl') ? '60' : '31536000',
        upsert: true,
      })
      if (error) throw error
    }, item.remote)
    completed += 1
    if (completed % 20 === 0 || completed === uploads.length) {
      console.log(`Uploaded ${completed}/${uploads.length}`)
    }
  }
}
await Promise.all(Array.from({ length: 6 }, () => worker()))

const manifest = {}
for (const [slug, sourceFile] of Object.entries(sourceFiles)) {
  const source = await stat(sourceFile)
  const playlistPath = `video/conversations/${slug}/${version}/master.m3u8`
  const posterPath = `image/conversations/${slug}/${version}/poster.jpg`
  const playlistUrl = db.storage.from(bucket).getPublicUrl(playlistPath).data.publicUrl
  const posterUrl = db.storage.from(bucket).getPublicUrl(posterPath).data.publicUrl
  const response = await fetch(playlistUrl, { cache: 'no-store' })
  if (!response.ok || !(await response.text()).includes('#EXTM3U')) throw new Error(`Playlist verification failed for ${slug}`)
  manifest[slug] = {
    source_file: path.basename(sourceFile),
    source_bytes: source.size,
    source_sha256: await sha256(sourceFile),
    storage_provider: 'supabase',
    media_source: 'supabase',
    video_provider: 'hosted',
    video_url: playlistUrl,
    thumbnail_url: posterUrl,
  }
}
console.log(JSON.stringify(manifest, null, 2))
