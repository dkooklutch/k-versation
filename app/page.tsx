import Link from 'next/link'
import Image from 'next/image'
import EmailSignup from '@/components/EmailSignup'
import { conversations, papers, formatEditorialDate } from '@/lib/content'
import { getPublishedConversations, getPublishedPapers } from '@/lib/public-content'
import LiveStatistics from '@/components/LiveStatistics'
import { BrandMark } from '@/components/BrandMark'
import PublicationLogo from '@/components/PublicationLogo'
import ShareControl from '@/components/ShareControl'
import { getSiteSettings } from '@/lib/site-settings'
export const dynamic='force-dynamic';export const revalidate=0

export default async function Home() {
  const [publishedConversations,publishedPapers,settings]=await Promise.all([getPublishedConversations(),getPublishedPapers(),getSiteSettings()])
  const conversation = publishedConversations.filter(item=>item.homepageVisible!==false).sort((a,b)=>Number(b.featured)-Number(a.featured))[0]||conversations[0]
  const paper = publishedPapers.filter(item=>item.homepageVisible!==false).sort((a,b)=>Number(b.featured)-Number(a.featured))[0]||papers[0]
  return <>
    <section className="hero">
      <div className="eyebrow">{settings.eyebrow}</div>
      <p className="hero-copy">{settings.intro}</p>
      <div className="hero-word"><BrandMark href="" /></div>
      <div className="hero-logo-lockup"><PublicationLogo/><span>Independent conversations and writing</span></div>
      <div className="hero-meta"><span>Founded by Daniel Koo</span><span>Conversation / Culture / Identity</span><span>Scroll to read ↓</span></div>
    </section>

    <section className="section section-dark">
      <header className="section-head"><div className="eyebrow">01 / Latest conversation</div><h2 className="preserve-lines">{settings.conversationHeading}</h2></header>
      <article className="feature">
        <Link href={`/conversations/${conversation.slug}`} className="feature-media"><Image src={conversation.image} alt="Abstract paper forms facing one another" fill sizes="(max-width: 850px) 100vw, 65vw" priority />{conversation.sample&&<span className="sample-tag">Sample content</span>}</Link>
        <div className="feature-copy"><div className="meta-row"><span>{conversation.category}</span><span>{formatEditorialDate(conversation.publishedAt)}</span><span>{conversation.duration}</span><span>{conversation.views} views</span></div><h3>{conversation.title}</h3><p>With {conversation.guestName}. {conversation.description}</p><div className="feature-actions"><Link className="text-link" href={`/conversations/${conversation.slug}`}>Watch conversation <span>↗</span></Link><ShareControl compact title={conversation.title} url={`/conversations/${conversation.slug}`}/></div></div>
      </article>
    </section>

    <section className="section">
      <header className="section-head"><div className="eyebrow">02 / Latest paper</div><h2 className="preserve-lines">{settings.paperHeading}</h2></header>
      <article className="feature paper-feature">
        <Link href={`/papers/${paper.slug}`} className="feature-media"><Image src={paper.image} alt="Sculptural arrangement of layered paper" fill sizes="(max-width: 850px) 100vw, 40vw" />{paper.sample&&<span className="sample-tag">Sample content</span>}</Link>
        <div className="feature-copy"><div className="meta-row"><span>{paper.topic}</span><span>{formatEditorialDate(paper.publishedAt)}</span><span>{paper.readingTime}</span><span>{paper.views} views</span></div><h3>{paper.title}</h3><p>{paper.subtitle} {paper.excerpt}</p><div className="feature-actions"><Link className="text-link" href={`/papers/${paper.slug}`}>Read paper <span>↗</span></Link><ShareControl compact title={paper.title} url={`/papers/${paper.slug}`}/></div></div>
      </article>
    </section>

    <section className="section section-dark">
      <header className="section-head"><div className="eyebrow">03 / By the numbers</div><h2 className="preserve-lines">{settings.numbersHeading}</h2></header>
      <LiveStatistics />
    </section>

    <section className="share-band"><div><span>Pass it on</span><p>Every conversation grows when it moves between people.</p></div><ShareControl title="K-VERSATION — Korea, through people" label="Share K-VERSATION"/></section>

    <section className="section join-band">
      <h2>Be part of the<br />conversation.</h2>
      <div><p>New conversations, papers, and occasional milestones. Sent with restraint and only with your consent.</p><EmailSignup /></div>
    </section>
  </>
}
