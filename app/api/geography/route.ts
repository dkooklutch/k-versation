import{NextResponse}from'next/server'
import{createAdminClient}from'@/lib/supabase/admin'
import{hasDatabase}from'@/lib/security'
import centroids from'@/lib/country-centroids.json'

export const dynamic='force-dynamic';export const revalidate=0
type Row={country:string|null;event_type:string}
type ManualRow={country_code:string;content_views:number}

export async function GET(){
 const headers={'Cache-Control':'no-store, max-age=0'}
 if(!hasDatabase())return NextResponse.json({countries:[],totalLocatedViews:0},{headers})
 try{
  const db=createAdminClient(),rows:Row[]=[]
  for(let from=0;;from+=1000){const{data,error}=await db.from('analytics_events').select('country,event_type').not('country','is',null).in('event_type',['page_view','open']).range(from,from+999);if(error)throw error;rows.push(...((data||[])as Row[]));if((data||[]).length<1000)break}
  const{data:manual,error:manualError}=await db.from('manual_country_activity').select('country_code,content_views');if(manualError)throw manualError
  const grouped=new Map<string,{impressions:number;contentViews:number;hostAdded:number}>()
  for(const row of rows){const code=String(row.country||'').toUpperCase();if(!/^[A-Z]{2}$/.test(code))continue;const item=grouped.get(code)||{impressions:0,contentViews:0,hostAdded:0};if(row.event_type==='page_view')item.impressions++;else if(row.event_type==='open')item.contentViews++;grouped.set(code,item)}
  for(const row of (manual||[])as ManualRow[]){const code=String(row.country_code||'').toUpperCase(),count=Number(row.content_views||0);if(!/^[A-Z]{2}$/.test(code)||count<=0)continue;const item=grouped.get(code)||{impressions:0,contentViews:0,hostAdded:0};item.contentViews+=count;item.hostAdded+=count;grouped.set(code,item)}
  const totalLocatedViews=[...grouped.values()].reduce((sum,item)=>sum+item.impressions+item.contentViews,0),names=new Intl.DisplayNames(['en'],{type:'region'}),locations=centroids as Record<string,number[]>
  const countries=[...grouped].map(([code,item])=>{const total=item.impressions+item.contentViews,[lat,lon]=locations[code]||[null,null];return{code,name:names.of(code)||code,lat,lon,impressions:item.impressions,contentViews:item.contentViews,hostAdded:item.hostAdded,total,share:totalLocatedViews?total/totalLocatedViews:0}}).sort((a,b)=>b.total-a.total)
  return NextResponse.json({countries,totalLocatedViews},{headers})
 }catch{return NextResponse.json({countries:[],totalLocatedViews:0},{status:503,headers})}
}
