import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Image from 'next/image'
import { conversations, formatLongEditorialDate } from '@/lib/content'
import MediaPlayer from '@/components/MediaPlayer'
import Interactions from '@/components/Interactions'
import ContentAnalytics from '@/components/ContentAnalytics'
import RelatedConversations from '@/components/RelatedConversations'
import { getConversation, getPublishedConversations } from '@/lib/public-content'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export function generateStaticParams() {
  return conversations.map(({ slug }) => ({ slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const conversation = await getConversation(slug)
  return conversation ? {
    title: conversation.seoTitle || conversation.title,
    description: conversation.seoDescription || conversation.shortDescription || conversation.description,
    openGraph: { images: [conversation.image], type: 'video.other' },
  } : {}
}

export default async function ConversationDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const [conversation, published] = await Promise.all([getConversation(slug), getPublishedConversations()])
  if (!conversation) notFound()
  const related = published
    .filter(item => item.id !== conversation.id)
    .sort((a, b) => Number(b.category === conversation.category) - Number(a.category === conversation.category))
    .slice(0, 3)

  return <>
    <ContentAnalytics contentId={conversation.id} contentType="conversation" />
    <article>
      <header className="article-hero">
        <div className="article-hero-copy">
          <div className="eyebrow">Conversation / {conversation.category}</div>
          <div>
            <div className="meta-row">
              <span>Published {formatLongEditorialDate(conversation.publishedAt)}</span>
              <span>{conversation.duration}</span>
              <span>{conversation.views.toLocaleString()} views</span>
            </div>
            <h1>{conversation.title}</h1>
            <p>With {conversation.guestName}{conversation.guestTitle ? `, ${conversation.guestTitle}` : ''}</p>
          </div>
          <p>{conversation.shortDescription || conversation.description}</p>
        </div>
        <div className="article-hero-media">
          <Image src={conversation.image} alt={`${conversation.title} thumbnail`} width={1400} height={1600} priority />
        </div>
      </header>

      <MediaPlayer
        url={conversation.videoUrl}
        title={conversation.title}
        contentId={conversation.id}
        provider={conversation.videoProvider}
        externalVideoId={conversation.externalVideoId}
        captionsAvailable={conversation.captionsAvailable}
      />

      <div className="article-content conversation-content">
        <div className="prose">
          <div className="eyebrow">About this conversation</div>
          {conversation.subtitle && <h2>{conversation.subtitle}</h2>}
          <p>{conversation.description}</p>
          {conversation.chapters?.length ? <section className="conversation-chapters"><h2>Chapters</h2><ol>{conversation.chapters.map(chapter => <li key={`${chapter.startsAtSeconds}-${chapter.title}`}><time>{Math.floor(chapter.startsAtSeconds / 60)}:{String(chapter.startsAtSeconds % 60).padStart(2, '0')}</time><span>{chapter.title}</span></li>)}</ol></section> : null}
          {conversation.transcript && <section><h2>Transcript</h2><p className="conversation-transcript">{conversation.transcript}</p></section>}
          {conversation.sourceDescription && <details className="source-description"><summary>Source description</summary><p>{conversation.sourceDescription}</p></details>}
        </div>
      </div>
    </article>
    <Interactions contentId={conversation.id} contentType="conversation" commentsEnabled={conversation.commentsEnabled} reactionsEnabled={conversation.reactionsEnabled} />
    <RelatedConversations conversations={related} />
  </>
}
