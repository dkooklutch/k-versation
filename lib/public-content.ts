import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { hasDatabase } from '@/lib/security'
import { conversations as samplesConversations, papers as samplesPapers } from '@/lib/content'
import type { ContentStatus, Conversation, Paper, PaperBlock, TranscriptExchange } from '@/lib/types'

function configured(){return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL&&process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)}
async function db(){return hasDatabase()?createAdminClient():await createClient()}
async function metrics<T extends Conversation|Paper>(items:T[]){const result=new Map<string,{views:number;completions:number;reactions:number}>();if(!hasDatabase()||!items.length)return result;const lookup=new Map<string,string>();for(const item of items){result.set(item.id,{views:0,completions:0,reactions:0});lookup.set(item.id,item.id);lookup.set(item.slug,item.id)}const keys=[...lookup.keys()],client=createAdminClient();const[{data:events},{data:reactions}]=await Promise.all([client.from('analytics_events').select('content_id,event_type').in('event_type',['open','completion']).in('content_id',keys),client.from('reactions').select('content_id').in('content_id',keys)]);for(const row of events||[]){const m=result.get(lookup.get(String(row.content_id))||'');if(m){if(row.event_type==='completion')m.completions++;else m.views++}}for(const row of reactions||[]){const m=result.get(lookup.get(String(row.content_id))||'');if(m)m.reactions++}return result}
async function decorate<T extends Conversation|Paper>(items:T[]){const m=await metrics(items);return items.map(item=>{const live=m.get(item.id);return{...item,views:Number(item.views||0)+Number(live?.views||0),...('completions'in item?{completions:Number(item.completions||0)+Number(live?.completions||0)}:{}),reactions:Number(item.reactions||0)+Number(live?.reactions||0)} as T})}
function normalizeCaptionTracks(value:unknown):NonNullable<Conversation['captionTracks']>{if(!Array.isArray(value))return[];return value.flatMap(candidate=>{if(!candidate||typeof candidate!=='object')return[];const row=candidate as Record<string,unknown>,languageCode=String(row.language_code||row.languageCode||''),name=String(row.name||languageCode);return languageCode?[{languageCode,name,kind:row.kind?String(row.kind):undefined}]:[]})}
function normalizeChapters(value:unknown):NonNullable<Conversation['chapters']>{if(!Array.isArray(value))return[];return value.flatMap((candidate,index)=>{if(typeof candidate==='string'){const match=candidate.match(/^(?:(\d+):)?(\d+):(\d+)\s+(.+)$/);if(!match)return[];return[{title:match[4],startsAtSeconds:Number(match[1]||0)*3600+Number(match[2])*60+Number(match[3])}]}if(!candidate||typeof candidate!=='object')return[];const row=candidate as Record<string,unknown>,startsAtSeconds=Number(row.starts_at_seconds??row.startsAtSeconds??0);return[{title:String(row.title||`Chapter ${index+1}`),startsAtSeconds:Number.isFinite(startsAtSeconds)?startsAtSeconds:0}]})}
function normalizeTranscriptExchanges(value:unknown):TranscriptExchange[]{if(!Array.isArray(value))return[];return value.flatMap((candidate,index)=>{if(!candidate||typeof candidate!=='object')return[];const row=candidate as Record<string,unknown>,question=row.question as Record<string,unknown>|undefined,answer=row.answer as Record<string,unknown>|undefined;if(!question?.text||!answer?.text)return[];return[{order:Number(row.order)||index+1,question:{speaker:String(question.speaker||'Daniel Koo'),role:String(question.role||'Interviewer'),text:String(question.text)},answer:{speaker:String(answer.speaker||''),role:String(answer.role||'Guest'),text:String(answer.text)}}]})}
export function mapConversation(row:Record<string,unknown>):Conversation{
  const originalDate=String(row.original_publication_date||row.display_date||row.published_at||row.created_at||new Date().toISOString())
  const provider=String(row.video_provider||row.media_source||'') as Conversation['videoProvider']
  const reactionCounts={appreciate:Number(row.appreciate_adjustment||0),insightful:Number(row.insightful_adjustment||0),powerful:Number(row.powerful_adjustment||0)}
  return{id:String(row.id),slug:String(row.slug),title:String(row.title),sourceTitle:row.source_title?String(row.source_title):undefined,guestName:String(row.guest_name||''),guestTitle:row.guest_title?String(row.guest_title):undefined,subtitle:row.subtitle?String(row.subtitle):undefined,shortDescription:row.short_description?String(row.short_description):undefined,description:String(row.editorial_description||row.description||''),sourceDescription:row.source_description?String(row.source_description):undefined,category:String(row.category||'Conversation'),topic:row.topic?String(row.topic):undefined,publishedAt:originalDate,websitePublishedAt:row.published_at?String(row.published_at):undefined,duration:row.duration_seconds?`${Math.ceil(Number(row.duration_seconds)/60)} min`:'Duration pending',image:String(row.thumbnail_url||row.cover_url||'/editorial/exchange.jpg'),videoUrl:provider==='youtube'?undefined:row.video_url?String(row.video_url):undefined,videoProvider:provider||undefined,externalVideoId:provider==='youtube'?(row.external_video_id?String(row.external_video_id):row.video_url?String(row.video_url).match(/(?:v=|youtu\.be\/|embed\/)([\w-]{11})/)?.[1]:undefined):undefined,captionsAvailable:Boolean(row.captions_available||row.captions_url),captionTracks:normalizeCaptionTracks(row.caption_tracks),chapters:normalizeChapters(row.chapters),relatedLinks:Array.isArray(row.related_links)?row.related_links.map(String):[],transcript:row.transcript?String(row.transcript):undefined,transcriptLanguage:row.transcript_language?String(row.transcript_language):undefined,transcriptEnabled:Boolean(row.transcript_enabled),transcriptExchanges:normalizeTranscriptExchanges(row.transcript_exchanges),interviewerName:row.interviewer_name?String(row.interviewer_name):undefined,hostName:row.host_name?String(row.host_name):undefined,seoTitle:row.seo_title?String(row.seo_title):undefined,seoDescription:row.seo_description?String(row.seo_description):undefined,views:Number(row.view_adjustment||0),completions:Number(row.completion_adjustment||0),reactions:Number(row.reaction_adjustment||0)+reactionCounts.appreciate+reactionCounts.insightful+reactionCounts.powerful,reactionCounts,commentsEnabled:row.comments_enabled!==false,reactionsEnabled:row.reactions_enabled!==false,status:String(row.status)as ContentStatus,sample:Boolean(row.is_sample),homepageVisible:row.homepage_visible!==false,featured:Boolean(row.featured)}
}
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
    reactions: Number(row.reaction_adjustment || 0) + Number(row.appreciate_adjustment || 0) + Number(row.insightful_adjustment || 0) + Number(row.powerful_adjustment || 0),
    reactionCounts: {
      appreciate: Number(row.appreciate_adjustment || 0),
      insightful: Number(row.insightful_adjustment || 0),
      powerful: Number(row.powerful_adjustment || 0),
    },
    commentsEnabled: row.comments_enabled !== false,
    reactionsEnabled: row.reactions_enabled !== false,
    status: String(row.status) as ContentStatus,
    sample: Boolean(row.is_sample),
    homepageVisible: row.homepage_visible !== false,
    featured: Boolean(row.featured),
  }
}
export async function getPublishedConversations(){if(!configured())return samplesConversations;try{const{data,error}=await(await db()).from('conversations').select('*').eq('status','published').lte('published_at',new Date().toISOString()).order('original_publication_date',{ascending:false,nullsFirst:false}).order('published_at',{ascending:false});if(error)throw error;return decorate((data||[]).map(row=>mapConversation(row as Record<string,unknown>)))}catch{return samplesConversations}}
export async function getPublishedPapers(){if(!configured())return samplesPapers;try{const now=Date.now(),{data,error}=await(await db()).from('papers').select('*').in('status',['published','scheduled']);if(error)throw error;const papers=(data||[]).filter(row=>row.status==='published'?+new Date(row.published_at||0)<=now:Boolean(row.scheduled_for&&+new Date(row.scheduled_for)<=now)).map(row=>mapPaperRow(row as Record<string,unknown>)).sort((a,b)=>+new Date(b.archiveDate)-+new Date(a.archiveDate));return decorate(papers)}catch{return samplesPapers}}
export async function getConversation(slug:string){if(!configured())return samplesConversations.find(item=>item.slug===slug);try{const{data,error}=await(await db()).from('conversations').select('*').eq('slug',slug).eq('status','published').maybeSingle();if(error)throw error;if(!data)return samplesConversations.find(item=>item.slug===slug);return(await decorate([mapConversation(data as Record<string,unknown>)]))[0]}catch{return samplesConversations.find(item=>item.slug===slug)}}
export async function getPaper(slug:string){if(!configured())return samplesPapers.find(item=>item.slug===slug);try{const{data,error}=await(await db()).from('papers').select('*').eq('slug',slug).in('status',['published','scheduled']).maybeSingle();if(error)throw error;if(!data)return samplesPapers.find(item=>item.slug===slug);if(data.status==='published'&&+new Date(data.published_at||0)>Date.now())return undefined;if(data.status==='scheduled'&&(!data.scheduled_for||+new Date(data.scheduled_for)>Date.now()))return undefined;return(await decorate([mapPaperRow(data as Record<string,unknown>)]))[0]}catch{return samplesPapers.find(item=>item.slug===slug)}}
