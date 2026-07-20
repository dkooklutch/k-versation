'use client'
import { useEffect } from 'react'
declare global { interface Window { __kvLastPageLoad?: {path:string;at:number} } }
export default function AnalyticsBeacon({path}:{path:string}){
 useEffect(()=>{if(path.startsWith('/host')||path.startsWith('/admin'))return;const now=Date.now();if(window.__kvLastPageLoad?.path===path&&now-window.__kvLastPageLoad.at<1000)return;window.__kvLastPageLoad={path,at:now};const sessionId=sessionStorage.getItem('kv-analytics-session')||crypto.randomUUID();sessionStorage.setItem('kv-analytics-session',sessionId);fetch('/api/analytics',{method:'POST',cache:'no-store',keepalive:true,headers:{'Content-Type':'application/json'},body:JSON.stringify({eventType:'page_view',path,sessionId})}).then(r=>r.ok?r.json():Promise.reject()).then(detail=>dispatchEvent(new CustomEvent('kv:statistics',{detail}))).catch(()=>{})},[path]);return null
}
