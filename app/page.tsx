import Link from 'next/link'
import Image from 'next/image'
import EmailSignup from '@/components/EmailSignup'
import { conversations, papers, formatEditorialDate, sampleTotals } from '@/lib/content'

export default function Home() {
  const conversation = conversations[0]
  const paper = papers[0]
  const numbers = [
    [sampleTotals.impressions, 'Site impressions'], [sampleTotals.contentViews, 'Content views'],
    [sampleTotals.conversations, 'Conversations'], [sampleTotals.papers, 'Papers'],
    [sampleTotals.reactions, 'Reactions'], [sampleTotals.comments, 'Comments'],
    [sampleTotals.subscribers, 'Subscribers'], [sampleTotals.countries, 'Countries reached']
  ]
  return <>
    <section className="hero">
      <div className="eyebrow">Independent cultural publication · Bay Area / Korea</div>
      <p className="hero-copy">K-VERSATION explores Korea through the people shaping, questioning, and living its culture. Conversations and original writing move beyond headlines and inherited assumptions.</p>
      <div className="hero-word" aria-label="K-VERSATION">K<span>—</span>VERSATION</div>
      <div className="hero-meta"><span>Founded by Daniel Koo</span><span>Conversation / Culture / Identity</span><span>Scroll to read ↓</span></div>
    </section>

    <section className="section section-dark">
      <header className="section-head"><div className="eyebrow">01 / Latest conversation</div><h2>Listen past<br />the first answer.</h2></header>
      <article className="feature">
        <Link href={`/conversations/${conversation.slug}`} className="feature-media"><Image src={conversation.image} alt="Abstract paper forms facing one another" fill sizes="(max-width: 850px) 100vw, 65vw" priority /><span className="sample-tag">Sample content</span></Link>
        <div className="feature-copy"><div className="meta-row"><span>{conversation.category}</span><span>{formatEditorialDate(conversation.publishedAt)}</span><span>{conversation.duration}</span><span>{conversation.views} views</span></div><h3>{conversation.title}</h3><p>With {conversation.guestName}. {conversation.description}</p><Link className="text-link" href={`/conversations/${conversation.slug}`}>Watch conversation <span>↗</span></Link></div>
      </article>
    </section>

    <section className="section">
      <header className="section-head"><div className="eyebrow">02 / Latest paper</div><h2>Writing that<br />holds its ground.</h2></header>
      <article className="feature paper-feature">
        <Link href={`/papers/${paper.slug}`} className="feature-media"><Image src={paper.image} alt="Sculptural arrangement of layered paper" fill sizes="(max-width: 850px) 100vw, 40vw" /><span className="sample-tag">Sample content</span></Link>
        <div className="feature-copy"><div className="meta-row"><span>{paper.topic}</span><span>{formatEditorialDate(paper.publishedAt)}</span><span>{paper.readingTime}</span><span>{paper.views} views</span></div><h3>{paper.title}</h3><p>{paper.subtitle} {paper.excerpt}</p><Link className="text-link" href={`/papers/${paper.slug}`}>Read paper <span>↗</span></Link></div>
      </article>
    </section>

    <section className="section section-dark">
      <header className="section-head"><div className="eyebrow">03 / By the numbers</div><h2>Measured reach.<br />Human scale.</h2></header>
      <div className="numbers">{numbers.map(([value,label]) => <div className="number" key={label}><strong>{Number(value).toLocaleString()}</strong><span>{label}</span><small>{label === 'Conversations' || label === 'Papers' ? 'Includes labelled sample content' : 'Verified total'}</small></div>)}</div>
    </section>

    <section className="section join-band">
      <h2>Be part of the<br />conversation.</h2>
      <div><p>New conversations, papers, and occasional milestones. Sent with restraint and only with your consent.</p><EmailSignup /></div>
    </section>
  </>
}
