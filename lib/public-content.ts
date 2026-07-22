import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { hasDatabase } from '@/lib/security'
import { conversations as samplesConversations, papers as samplesPapers } from '@/lib/content'
import type { ContentStatus, Conversation, Paper, PaperBlock } from '@/lib/types'

function configured(){return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL&&process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)}
async function db(){return hasDatabase()?createAdminClient():await createClient()}
async function metrics<T extends Conversation|Paper>(items:T[]){const result=new Map<string,{views:number,reactions:number}>();if(!hasDatabase()||!items.length)return result;const lookup=new Map<string,string>();for(const item of items){result.set(item.id,{views:0,reactions:0});lookup.set(item.id,item.id);lookup.set(item.slug,item.id)}const keys=[...lookup.keys()],client=createAdminClient();const[{data:views},{data:reactions}]=await Promise.all([client.from('analytics_events').select('content_id').eq('event_type','open').in('content_id',keys),client.from('reactions').select('content_id').in('content_id',keys)]);for(const row of views||[]){const m=result.get(lookup.get(String(row.content_id))||'');if(m)m.views++}for(const row of reactions||[]){const m=result.get(lookup.get(String(row.content_id))||'');if(m)m.reactions++}return result}
async function decorate<T extends Conversation|Paper>(items:T[]){const m=await metrics(items);return items.map(item=>{const live=m.get(item.id);return{...item,views:Number(item.views||0)+Number(live?.views||0),reactions:Number(item.reactions||0)+Number(live?.reactions||0)} as T})}
function mapConversation(row:Record<string,unknown>):Conversation{return{id:String(row.id),slug:String(row.slug),title:String(row.title),guestName:String(row.guest_name||''),guestTitle:row.guest_title?String(row.guest_title):undefined,description:String(row.description||''),category:String(row.category||'Conversation'),publishedAt:String(row.display_date||row.published_at||row.created_at||new Date().toISOString()),duration:row.duration_seconds?`${Math.ceil(Number(row.duration_seconds)/60)} min`:'Duration pending',image:String(row.thumbnail_url||row.cover_url||'/editorial/exchange.jpg'),videoUrl:row.video_url?String(row.video_url):undefined,transcript:row.transcript?String(row.transcript):undefined,views:Number(row.view_adjustment||0),reactions:Number(row.reaction_adjustment||0),commentsEnabled:row.comments_enabled!==false,reactionsEnabled:row.reactions_enabled!==false,status:String(row.status)as ContentStatus,sample:Boolean(row.is_sample),homepageVisible:row.homepage_visible!==false,featured:Boolean(row.featured)}}
function normalizePaperBlocks(value: unknown, fallback: string): PaperBlock[] {
  if (!Array.isArray(value)) return fallback ? [{ type: 'paragraph', text: fallback }] : []
  return value.flatMap((candidate): PaperBlock[] => {
    if (!candidate || typeof candidate !== 'object') return []
    const block = candidate as Record<string, unknown>
    const type = String(block.type || '')
    if (type === 'figure' && block.url) return [{
      type: 'figure',
      url: String(block.url),
      alt: String(block.alt || block.caption || 'Paper figure'),
      caption: block.caption ? String(block.caption) : undefined,
      width: Number(block.width) || undefined,
      height: Number(block.height) || undefined,
    }]
    if (type === 'heading' || block.heading) return [{
      type: 'heading',
      text: String(block.text || block.heading || ''),
      level: Number(block.level) === 3 ? 3 : 2,
    }]
    if (type === 'quote' || block.quote) return [{ type: 'quote', text: String(block.text || block.quote || '') }]
    const text = String(block.text || '')
    return text ? [{ type: 'paragraph', text }] : []
  })
}

export function mapPaperRow(row: Record<string, unknown>): Paper {
  const publishedAt = String(row.published_at || row.created_at || new Date().toISOString())
  const originalDraftDate = row.original_draft_date ? String(row.original_draft_date) : undefined
  const summary = String(row.summary || row.excerpt || '')
  const category = String(row.category || row.topic || 'Paper')
  return {
    id: String(row.id),
    slug: String(row.slug),
    title: String(row.title),
    subtitle: String(row.subtitle || ''),
    summary,
    excerpt: String(row.excerpt || summary),
    topic: String(row.topic || category),
    category,
    publishedAt,
    archiveDate: originalDraftDate || publishedAt,
    originalDraftDate,
    revisedAt: row.revised_at ? String(row.revised_at) : row.updated_at ? String(row.updated_at) : undefined,
    authorName: String(row.author_name || 'Daniel Koo'),
    readingTime: row.reading_minutes ? `${row.reading_minutes} min read` : 'Reading time pending',
    audioDuration: row.audio_duration_seconds ? `${Math.ceil(Number(row.audio_duration_seconds) / 60)} min audio` : undefined,
    image: String(row.cover_url || '/editorial/paper-study.jpg'),
    body: normalizePaperBlocks(row.body, summary),
    pdfUrl: row.pdf_url ? String(row.pdf_url) : undefined,
    collectionPdfUrl: row.collection_pdf_url ? String(row.collection_pdf_url) : undefined,
    seoTitle: row.seo_title ? String(row.seo_title) : undefined,
    seoDescription: row.seo_description ? String(row.seo_description) : undefined,
    pdfDownloadEnabled: Boolean(row.pdf_download_enabled),
    views: Number(row.view_adjustment || 0),
    reactions: Number(row.reaction_adjustment || 0),
    commentsEnabled: row.comments_enabled !== false,
    reactionsEnabled: row.reactions_enabled !== false,
    status: String(row.status) as ContentStatus,
    sample: Boolean(row.is_sample),
    homepageVisible: row.homepage_visible !== false,
    featured: Boolean(row.featured),
  }
}
export async function getPublishedConversations(){if(!configured())return samplesConversations;try{const{data,error}=await(await db()).from('conversations').select('*').eq('status','published').lte('published_at',new Date().toISOString()).order('published_at',{ascending:false});if(error)throw error;return decorate((data||[]).map(row=>mapConversation(row as Record<string,unknown>)))}catch{return samplesConversations}}
export async function getPublishedPapers(){if(!configured())return samplesPapers;try{const now=Date.now(),{data,error}=await(await db()).from('papers').select('*').in('status',['published','scheduled']);if(error)throw error;const papers=(data||[]).filter(row=>row.status==='published'?+new Date(row.published_at||0)<=now:Boolean(row.scheduled_for&&+new Date(row.scheduled_for)<=now)).map(row=>mapPaperRow(row as Record<string,unknown>)).sort((a,b)=>+new Date(b.archiveDate)-+new Date(a.archiveDate));return decorate(papers)}catch{return samplesPapers}}
export async function getConversation(slug:string){if(!configured())return samplesConversations.find(item=>item.slug===slug);try{const{data,error}=await(await db()).from('conversations').select('*').eq('slug',slug).eq('status','published').maybeSingle();if(error)throw error;if(!data)return samplesConversations.find(item=>item.slug===slug);return(await decorate([mapConversation(data as Record<string,unknown>)]))[0]}catch{return samplesConversations.find(item=>item.slug===slug)}}
export async function getPaper(slug:string){if(!configured())return samplesPapers.find(item=>item.slug===slug);try{const{data,error}=await(await db()).from('papers').select('*').eq('slug',slug).in('status',['published','scheduled']).maybeSingle();if(error)throw error;if(!data)return samplesPapers.find(item=>item.slug===slug);if(data.status==='published'&&+new Date(data.published_at||0)>Date.now())return undefined;if(data.status==='scheduled'&&(!data.scheduled_for||+new Date(data.scheduled_for)>Date.now()))return undefined;return(await decorate([mapPaperRow(data as Record<string,unknown>)]))[0]}catch{return samplesPapers.find(item=>item.slug===slug)}}
