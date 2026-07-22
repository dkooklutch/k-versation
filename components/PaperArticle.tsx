import Image from 'next/image'
import Link from 'next/link'
import { formatLongEditorialDate } from '@/lib/content'
import type { Paper } from '@/lib/types'

export default function PaperArticle({ paper, related = [], preview = false }: {
  paper: Paper
  related?: Paper[]
  preview?: boolean
}) {
  const firstParagraphIndex = paper.body.findIndex(block => block.type === 'paragraph')
  return <>
    {preview && <div className="paper-preview-notice">Host preview · This view does not add a public view.</div>}
    <article className="paper-article">
      <header className="paper-hero">
        <div className="eyebrow">Paper / {paper.category}</div>
        <div className="paper-hero-main">
          <div>
            <h1>{paper.title}</h1>
            <p className="paper-subtitle">{paper.subtitle}</p>
          </div>
          <dl className="paper-dates">
            <div><dt>Author</dt><dd>{paper.authorName}</dd></div>
            {paper.originalDraftDate && <div><dt>Original draft</dt><dd>{formatLongEditorialDate(paper.originalDraftDate)}</dd></div>}
            {paper.revisedAt && <div><dt>Latest revision</dt><dd>{formatLongEditorialDate(paper.revisedAt)}</dd></div>}
            <div><dt>Published online</dt><dd>{formatLongEditorialDate(paper.publishedAt)}</dd></div>
          </dl>
        </div>
        <div className="paper-meta meta-row">
          <span>{paper.readingTime}</span>
          <span>{paper.views} views</span>
          <span>{paper.reactions} reactions</span>
          {paper.sample && <span>Sample content</span>}
        </div>
      </header>

      <div className="article-content paper-article-content">
        <div className="prose paper-prose">
          {paper.body.map((block, index) => {
            if (block.type === 'heading') {
              return block.level === 3
                ? <h3 key={index}>{block.text}</h3>
                : <h2 key={index}>{block.text}</h2>
            }
            if (block.type === 'quote') return <blockquote key={index}>{block.text}</blockquote>
            if (block.type === 'figure') return <figure className="paper-figure" key={index}>
              <a href={block.url} target="_blank" rel="noreferrer" aria-label="Open paper figure at full size">
                <Image
                  src={block.url}
                  alt={block.alt}
                  width={block.width || 1440}
                  height={block.height || 900}
                  sizes="(max-width: 850px) calc(100vw - 2rem), 760px"
                />
              </a>
              {block.caption && <figcaption>{block.caption}<span>Open full size ↗</span></figcaption>}
            </figure>
            return <p className={index === firstParagraphIndex ? 'paper-lead' : undefined} key={index}>{block.text}</p>
          })}
        </div>
      </div>

      {(paper.collectionPdfUrl || paper.pdfUrl) && <footer className="paper-source-links">
        <div>
          <small>Source documents</small>
          <p>The native article above is the primary reading experience.</p>
        </div>
        <div>
          {paper.pdfUrl && <a href={paper.pdfUrl} target="_blank" rel="noreferrer">Open individual PDF ↗</a>}
          {paper.collectionPdfUrl && <a href={paper.collectionPdfUrl} target="_blank" rel="noreferrer">Open current 23-paper collection ↗</a>}
        </div>
      </footer>}
    </article>

    {related.length > 0 && <section className="related-papers">
      <header><div className="eyebrow">Continue reading</div><h2>Related papers</h2></header>
      <div>{related.map(item => <Link href={`/papers/${item.slug}`} key={item.id}>
        <span>{item.category}</span>
        <h3>{item.title}</h3>
        <p>{item.subtitle}</p>
      </Link>)}</div>
    </section>}
  </>
}
