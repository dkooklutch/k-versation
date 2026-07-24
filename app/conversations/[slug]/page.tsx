import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { conversations, formatLongEditorialDate } from '@/lib/content'
import MediaPlayer from '@/components/MediaPlayer'
import Interactions from '@/components/Interactions'
import ContentAnalytics from '@/components/ContentAnalytics'
import ConversationTranscript from '@/components/ConversationTranscript'
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
    authors: conversation.hostName ? [{ name: conversation.hostName }] : undefined,
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
  const showTranscript = Boolean(conversation.transcriptEnabled && conversation.transcriptExchanges?.length)
  const interviewer = conversation.interviewerName || 'Daniel Koo'
  const host = conversation.hostName || 'Daniel Koo'
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'VideoObject',
    name: conversation.title,
    description: conversation.seoDescription || conversation.shortDescription || conversation.description,
    thumbnailUrl: [conversation.image],
    uploadDate: conversation.publishedAt,
    contentUrl: conversation.videoProvider === 'hosted' ? conversation.videoUrl : undefined,
    actor: { '@type': 'Person', name: conversation.guestName },
    director: { '@type': 'Person', name: interviewer },
    creator: { '@type': 'Person', name: host },
  }

  return <>
    <ContentAnalytics contentId={conversation.id} contentType="conversation" />
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, '\\u003c') }} />
    <article className="conversation-article">
      <MediaPlayer
        url={conversation.videoUrl}
        title={conversation.title}
        contentId={conversation.id}
        provider={conversation.videoProvider}
        externalVideoId={conversation.externalVideoId}
        captionsAvailable={conversation.captionsAvailable}
        poster={conversation.image}
      />

      <header className="conversation-masthead">
        <div className="eyebrow">Conversation / {conversation.category}</div>
        <div className="conversation-title-grid">
          <div>
            <div className="meta-row">
              <span>Published {formatLongEditorialDate(conversation.publishedAt)}</span>
              <span>{conversation.duration}</span>
              <span>{conversation.views.toLocaleString()} views</span>
            </div>
            <h1>{conversation.title}</h1>
          </div>
          <dl className="conversation-credits">
            <div><dt>Guest</dt><dd>{conversation.guestName}</dd></div>
            <div><dt>Interviewer</dt><dd>{interviewer}</dd></div>
            <div><dt>Host</dt><dd>{host}</dd></div>
          </dl>
        </div>
        <div className="conversation-description">
          {conversation.subtitle && <h2>{conversation.subtitle}</h2>}
          <p>{conversation.description}</p>
        </div>
      </header>
    </article>

    <Interactions contentId={conversation.id} contentType="conversation" commentsEnabled={conversation.commentsEnabled} reactionsEnabled={conversation.reactionsEnabled} part="controls" />
    {showTranscript && <ConversationTranscript
      exchanges={conversation.transcriptExchanges || []}
      interviewer={interviewer}
      guest={conversation.guestName}
      language={conversation.transcriptLanguage || 'English'}
    />}
    <Interactions contentId={conversation.id} contentType="conversation" commentsEnabled={conversation.commentsEnabled} reactionsEnabled={conversation.reactionsEnabled} part="comments" />
    <RelatedConversations conversations={related} />
  </>
}
