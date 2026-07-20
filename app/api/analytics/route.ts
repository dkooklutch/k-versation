import { NextRequest,NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { cleanText,hasDatabase,limited,requestKey } from '@/lib/security'
import { getStatistics } from '@/lib/statistics'
export const dynamic='force-dynamic';export const revalidate=0
const events=new Set(['page_view','open','completion'])
const bot=/bot|crawler|spider|headless|preview|lighthouse|vercel-screenshot/i
export async function POST(req:NextRequest){
 const headers={'Cache-Control':'no-store, max-age=0'}
 if(req.headers.get('purpose')==='prefetch'||req.headers.get('next-router-prefetch')||bot.test(req.headers.get('user-agent')||''))return new NextResponse(null,{status:204,headers})
 if(limited(requestKey(req.headers,'analytics'),180,60_000))return NextResponse.json({error:'Rate limited.'},{status:429,headers})
 if(!hasDatabase())return NextResponse.json({error:'Analytics database is not configured.'},{status:503,headers})
 try{
  const b=await req.json(),eventType=cleanText(b.eventType,40),path=cleanText(b.path,300)||'/'
  if(!events.has(eventType)||path.startsWith('/host')||path.startsWith('/admin')||path.startsWith('/api'))return NextResponse.json({error:'Invalid public analytics event.'},{status:400,headers})
  const contentType=b.contentType==='paper'?'paper':b.contentType==='conversation'?'conversation':null,candidateCountry=cleanText(req.headers.get('x-vercel-ip-country'),2).toUpperCase(),country=/^[A-Z]{2}$/.test(candidateCountry)?candidateCountry:null
  if(eventType!=='page_view'&&(!contentType||!cleanText(b.contentId,100)))return NextResponse.json({error:'Content metadata is required.'},{status:400,headers})
  const {error}=await createAdminClient().from('analytics_events').insert({event_type:eventType,page_path:path,content_id:cleanText(b.contentId,100)||null,content_type:contentType,anonymous_session:cleanText(b.sessionId,100)||crypto.randomUUID(),referrer:cleanText(req.headers.get('referer'),500)||null,country})
  if(error)throw error
  return NextResponse.json(await getStatistics(),{headers})
 }catch(error){console.error('analytics write failed',error);return NextResponse.json({error:'The analytics event could not be verified.'},{status:503,headers})}
}
