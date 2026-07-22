import fs from 'node:fs'
import path from 'node:path'

const [sourcePath, destinationPath] = process.argv.slice(2)
if (!sourcePath || !destinationPath) {
  throw new Error('Usage: node scripts/build-paper-import.mjs SOURCE.json DESTINATION.json')
}

const source = JSON.parse(fs.readFileSync(sourcePath, 'utf8'))
const expectedTitles = [
  'When Folk Painting Enters Pop Fantasy',
  'A Kitchen Divided by Status',
  'The Athlete as Cultural Ambassador',
  'After Move 78',
  'The Store That Became a Living Room',
  'Beyond a Number',
  'How K-Beauty Became an Export System',
  'Interdependence as Power',
  'The Education Miracle and Its Price',
  'Why Gyeongju Hosted the Future',
  'From Dubai Chocolate to Dujjonku',
  'An Alphabet Designed for Access',
  'The Long Shadow of Confucianism',
  "Seoul's Common Ground",
  'Pay for What You Throw Away',
  'One Day, One Score, One Country',
  'The War That Never Formally Ended',
  'What BTS Changed',
  'Engineering Against Boarding',
  'Small Dishes, Shared Table',
  'The Summer South Korea Became a Football Nation',
  'The Vertical Page',
  'After Midnight in Seoul',
]
const dates = [
  '2025-07-08', '2025-07-19', '2025-07-31', '2025-08-12', '2025-08-28', '2025-09-06',
  '2025-09-21', '2025-10-03', '2025-10-17', '2025-10-29', '2025-11-05', '2025-11-18',
  '2025-11-30', '2025-12-09', '2025-12-20', '2025-12-31', '2026-01-05', '2026-01-12',
  '2026-01-19', '2026-01-24', '2026-01-28', '2026-01-30', '2026-01-31',
]
const categories = [
  'Visual Culture', 'Food', 'Sport', 'Technology', 'Daily Life', 'Society', 'Beauty',
  'Disability Justice', 'Education', 'Diplomacy', 'Food', 'Language', 'Society', 'Urban Life',
  'Environment', 'Education', 'History', 'Music', 'History', 'Food', 'Sport', 'Media', 'Urban Life',
]
const altText = [
  'Three-stage diagram linking late Joseon folk painting to a pop fantasy character.',
  'Horizontal bar chart comparing 80 Black Spoon chefs with 20 White Spoon chefs.',
  'Timeline of Son Heung-min’s club career from Hamburg through Los Angeles FC.',
  'Five-game AlphaGo match chart highlighting AlphaGo’s Move 37 and Lee Sedol’s Move 78.',
  'Daylong timeline of convenience-store uses from breakfast to a late-night gathering.',
  'Line chart of South Korea’s total fertility rate from 2015 through 2024.',
  'Bar chart of South Korean cosmetics exports from 2021 through 2025.',
  'Timeline of Stacey Park Milbern’s life and disability justice organizing.',
  'Timeline showing a high-pressure school day continuing from morning to midnight.',
  'Diagram of the Connect, Innovate, and Prosper themes of APEC 2025.',
  'Timeline tracing Dubai chocolate into the Korean dujjonku dessert trend.',
  'Diagram of five basic Hangul consonants and their articulatory logic.',
  'Timeline of Confucian influence across changing Korean institutions from 1392 to 2025.',
  'Diagram of the Han River’s infrastructure, ecology, recreation, and cultural functions.',
  'Flow diagram connecting priced household waste disposal to processing and reuse.',
  'Timeline of a full Suneung examination day from arrival through the finish.',
  'Timeline of Korea’s division, war, armistice, and unfinished present.',
  'Timeline of BTS’s global audience, service period, and return to group activity.',
  'Labeled side-view diagram of a turtle ship designed to resist boarding.',
  'Overhead diagram of rice, soup, kimchi, and shared banchan arranged on a table.',
  'Match-by-match chart of South Korea’s path through the 2002 World Cup.',
  'Comparison diagram of a printed comic page and a vertical webtoon scroll.',
  'Line chart showing the contraction in Seoul noraebang businesses from 2020 to 2024.',
]

function slugify(value) {
  return value.toLowerCase().replace(/[’']/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

if (source.pageCount !== 75) throw new Error(`Expected 75 PDF pages; found ${source.pageCount}`)
if (!Array.isArray(source.papers) || source.papers.length !== 23) throw new Error(`Expected 23 papers; found ${source.papers?.length}`)

const papers = source.papers.map((paper, index) => {
  if (paper.number !== index + 1) throw new Error(`Paper position mismatch at ${index + 1}`)
  if (paper.title !== expectedTitles[index]) throw new Error(`Title mismatch at ${index + 1}: ${paper.title}`)
  const sourceDate = new Date(`${paper.sourceDate} 12:00:00 UTC`).toISOString().slice(0, 10)
  if (sourceDate !== dates[index]) throw new Error(`Date mismatch at ${index + 1}: ${paper.sourceDate}`)
  if (!Array.isArray(paper.paragraphs) || paper.paragraphs.length < 1) throw new Error(`Paper ${index + 1} has no paragraphs`)
  if (paper.figure.number !== index + 1) throw new Error(`Figure mismatch at ${index + 1}`)

  const figureBlock = {
    type: 'figure',
    url: `/papers/initial-23/${paper.figure.asset}`,
    alt: altText[index],
    caption: paper.figure.caption,
    width: paper.figure.width,
    height: paper.figure.height,
  }
  const body = paper.paragraphs.map(text => ({ type: 'paragraph', text }))
  body.splice(paper.figure.afterParagraph, 0, figureBlock)
  const words = paper.paragraphs.join(' ').trim().split(/\s+/).length

  return {
    slug: slugify(paper.title),
    title: paper.title,
    subtitle: paper.subtitle,
    summary: paper.paragraphs[0],
    excerpt: paper.paragraphs[0],
    topic: categories[index],
    category: categories[index],
    body,
    original_draft_date: dates[index],
    reading_minutes: Math.max(1, Math.ceil(words / 225)),
    cover_url: figureBlock.url,
    collection_key: 'papers-july-2025-january-2026',
    collection_position: index + 1,
    collection_pdf_url: '/papers/collections/k-versation-papers-july-2025-january-2026.pdf',
    author_name: 'Daniel Koo',
    revised_at: '2026-07-21T12:00:00.000Z',
    status: 'published',
    featured: index === 22,
    homepage_visible: true,
    comments_enabled: true,
    reactions_enabled: true,
    pdf_download_enabled: false,
    seo_title: paper.title,
    seo_description: paper.paragraphs[0],
    is_sample: false,
    source_metadata: {
      source_file: source.sourceFile,
      source_sha256: source.sourceSha256,
      source_pages: paper.sourcePages,
      figure_source_page: paper.figure.page,
      source_date_text: paper.sourceDate,
      word_count: words,
      reading_time_method: 'Computed at 225 words per minute because the source PDF has no reading-time field.',
      category_method: 'Editorial import taxonomy because the source PDF has no category field.',
      slug_method: 'Deterministic title slug because the source PDF has no slug field.',
    },
  }
})

const slugs = papers.map(paper => paper.slug)
if (new Set(slugs).size !== 23) throw new Error('Generated slugs are not unique')

const manifest = {
  collection: {
    key: 'papers-july-2025-january-2026',
    label: 'The current 23-paper collection',
    source_file: source.sourceFile,
    source_sha256: source.sourceSha256,
    source_page_count: source.pageCount,
    import_count: 23,
    permanent_library_limit: null,
  },
  papers,
}

fs.mkdirSync(path.dirname(destinationPath), { recursive: true })
fs.writeFileSync(destinationPath, `${JSON.stringify(manifest, null, 2)}\n`)
console.log(`Built an audited ${papers.length}-paper import manifest.`)
