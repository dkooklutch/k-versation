import Link from 'next/link'
import type { Paper } from '@/lib/types'

export default function RelatedPapers({ papers }: { papers: Paper[] }) {
  if (!papers.length) return null
  return <section className="related-papers">
    <header><div className="eyebrow">Continue reading</div><h2>Related papers</h2></header>
    <div>{papers.map(item => <Link href={`/papers/${item.slug}`} key={item.id}>
      <span>{item.category}</span>
      <h3>{item.title}</h3>
      <p>{item.subtitle}</p>
    </Link>)}</div>
  </section>
}
