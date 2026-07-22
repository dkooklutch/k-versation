import assert from 'node:assert/strict'
import crypto from 'node:crypto'
import fs from 'node:fs'

const base = process.argv[2] || 'https://k-versation-1.vercel.app'
const manifest = JSON.parse(fs.readFileSync(process.argv[3] || 'data/papers/initial-23-import.json', 'utf8'))

function textFromHtml(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/g, ' ')
    .replace(/<style[\s\S]*?<\/style>/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&rsquo;/g, '’')
    .replace(/\s+/g, ' ')
}

async function get(path) {
  const response = await fetch(`${base}${path}`, { headers: { 'user-agent': 'K-VERSATION release verification' } })
  assert.equal(response.status, 200, `${path} returned ${response.status}`)
  return response
}

const archiveText = textFromHtml(await (await get('/papers')).text())
for (const paper of manifest.papers) assert.ok(archiveText.includes(paper.title), `Archive omitted ${paper.title}`)
assert.ok(archiveText.includes('Alphabetical'))
assert.ok(archiveText.includes('Current 23-paper collection'))

for (const paper of manifest.papers) {
  const articleText = textFromHtml(await (await get(`/papers/${paper.slug}`)).text())
  assert.ok(articleText.includes(paper.title), `Title missing from ${paper.slug}`)
  assert.ok(articleText.includes(paper.subtitle), `Subtitle missing from ${paper.slug}`)
  assert.ok(articleText.includes('Original draft'), `Original-draft label missing from ${paper.slug}`)
  for (const block of paper.body) {
    if (block.type === 'paragraph') assert.ok(articleText.includes(block.text), `Paragraph missing from ${paper.slug}`)
    if (block.type === 'figure') assert.ok(articleText.includes(block.caption), `Caption missing from ${paper.slug}`)
  }
}

const homepageText = textFromHtml(await (await get('/')).text())
assert.ok(homepageText.includes('After Midnight in Seoul'))
assert.ok(homepageText.includes('Featured paper'))

for (const paper of manifest.papers) {
  const response = await get(paper.cover_url)
  assert.match(response.headers.get('content-type') || '', /^image\/jpeg/)
  assert.ok((await response.arrayBuffer()).byteLength > 50_000)
}

const pdf = Buffer.from(await (await get('/papers/collections/k-versation-papers-july-2025-january-2026.pdf')).arrayBuffer())
assert.equal(crypto.createHash('sha256').update(pdf).digest('hex'), manifest.collection.source_sha256)
console.log('Verified all 23 native live articles, all 23 figure assets, the archive, homepage feature, and collection PDF.')
