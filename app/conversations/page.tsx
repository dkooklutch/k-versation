import type { Metadata } from 'next'
import ArchiveClient from '@/components/ArchiveClient'
import { getPublishedConversations } from '@/lib/public-content'
export const metadata: Metadata={title:'Conversations',description:'Firsthand stories and considered exchanges about Korean culture, identity, and society.'}
export default async function ConversationsPage(){const conversations=await getPublishedConversations();return <><header className="page-hero"><div className="eyebrow">Archive / Conversations</div><h1>CONVERSATIONS</h1><div className="page-hero-grid"><span>People before headlines.</span><p>Patient exchanges about culture, identity, society, and the realities that resist a simple summary.</p></div></header><ArchiveClient type="conversations" items={conversations.map(c=>({slug:c.slug,title:c.title,image:c.image,category:c.category,date:c.publishedAt,metric:c.duration,description:`${c.guestName}. ${c.description}`,views:c.views,reactions:c.reactions,sample:c.sample}))}/></>}
