import Image from 'next/image'
import Link from 'next/link'
import { formatEditorialDate } from '@/lib/content'
import type { Conversation } from '@/lib/types'

export default function RelatedConversations({ conversations }: { conversations: Conversation[] }) {
  if (!conversations.length) return null
  return (
    <section className="related-conversations">
      <header>
        <div className="eyebrow">Continue watching</div>
        <h2>Related Conversations</h2>
      </header>
      <div>
        {conversations.map(conversation => (
          <Link href={`/conversations/${conversation.slug}`} key={conversation.id}>
            <Image src={conversation.image} alt="" width={640} height={360} />
            <span>{conversation.category} / {formatEditorialDate(conversation.publishedAt)}</span>
            <h3>{conversation.title}</h3>
            <p>With {conversation.guestName} · {conversation.duration}</p>
          </Link>
        ))}
      </div>
    </section>
  )
}
