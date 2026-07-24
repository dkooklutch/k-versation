import { notFound } from 'next/navigation'
import Image from 'next/image'
import { requireAdmin } from '@/lib/admin-auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { mapConversation } from '@/lib/public-content'
import { formatLongEditorialDate } from '@/lib/content'
import MediaPlayer from '@/components/MediaPlayer'
import ConversationTranscript from '@/components/ConversationTranscript'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function HostConversationPreview({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin()
  const { id } = await params
  const { data } = await createAdminClient().from('conversations').select('*').eq('id', id).maybeSingle()
  if (!data) notFound()
  const conversation = mapConversation(data as Record<string, unknown>)
  return <main>
    <p className="paper-preview-notice">Host preview — views, completions, comments, and reactions are not recorded</p>
    <article>
      <header className="article-hero">
        <div className="article-hero-copy">
          <div className="eyebrow">Conversation preview / {conversation.category}</div>
          <div><div className="meta-row"><span>Published {formatLongEditorialDate(conversation.publishedAt)}</span><span>{conversation.duration}</span></div><h1>{conversation.title}</h1><p>With {conversation.guestName}{conversation.guestTitle ? `, ${conversation.guestTitle}` : ''}</p></div>
          <p>{conversation.shortDescription || conversation.description}</p>
        </div>
        <div className="article-hero-media"><Image src={conversation.image} alt="" width={1400} height={1600} priority /></div>
      </header>
      <MediaPlayer url={conversation.videoUrl} title={conversation.title} contentId={conversation.id} provider={conversation.videoProvider} externalVideoId={conversation.externalVideoId} captionsAvailable={conversation.captionsAvailable} trackCompletion={false} poster={conversation.image} />
      <div className="article-content"><div className="prose"><div className="eyebrow">About this conversation</div><p>{conversation.description}</p></div></div>
    </article>
    {conversation.transcriptEnabled&&conversation.transcriptExchanges?.length?<ConversationTranscript exchanges={conversation.transcriptExchanges} interviewer={conversation.interviewerName||'Daniel Koo'} guest={conversation.guestName} language={conversation.transcriptLanguage||'English'}/>:null}
  </main>
}
