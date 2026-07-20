import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Image from 'next/image'
import { conversations, formatEditorialDate } from '@/lib/content'
import MediaPlayer from '@/components/MediaPlayer'
import Interactions from '@/components/Interactions'
import ContentAnalytics from '@/components/ContentAnalytics'
import { getConversation } from '@/lib/public-content'
export const dynamic='force-dynamic';export const revalidate=0
export function generateStaticParams(){return conversations.map(({slug})=>({slug}))}
export async function generateMetadata({params}:{params:Promise<{slug:string}>}):Promise<Metadata>{const {slug}=await params;const c=await getConversation(slug);return c?{title:c.title,description:c.description,openGraph:{images:[c.image],type:'video.other'}}:{}}
export default async function ConversationDetail({params}:{params:Promise<{slug:string}>}){const {slug}=await params;const c=await getConversation(slug);if(!c)notFound();return <><ContentAnalytics contentId={c.id} contentType="conversation"/><article><header className="article-hero"><div className="article-hero-copy"><div className="eyebrow">Conversation / {c.category}</div><div><div className="meta-row"><span>{c.sample?'Sample content':''}</span><span>{formatEditorialDate(c.publishedAt)}</span><span>{c.duration}</span><span>{c.views} views</span></div><h1>{c.title}</h1><p>With {c.guestName}{c.guestTitle?`, ${c.guestTitle}`:''}</p></div><p>{c.description}</p></div><div className="article-hero-media"><Image src={c.image} alt="Abstract paper forms in dialogue" width={1400} height={1600} priority/></div></header><MediaPlayer url={c.videoUrl} title={c.title} contentId={c.id}/><div className="article-content"><div className="prose"><div className="eyebrow">About this conversation</div><p>{c.description}</p>{c.transcript&&<><h2>Transcript</h2><p>{c.transcript}</p></>}</div></div></article><Interactions contentId={c.id} contentType="conversation"/></>}
