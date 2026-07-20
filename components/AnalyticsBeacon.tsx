'use client'
import { useEffect } from 'react'
declare global { interface Window { __kvPageLoad?: {path:string;token:string;sent:boolean} } }
export default function AnalyticsBeacon({path}:{path:string}){
 useEffect(()=>{if(path.startsWith('/host')||path.startsWith('/admin'))return;if(!window.__kvPageLoad||window.__kvPageLoad.path!==path)window.__kvPageLoad={path,token:crypto.randomUUID(),sent:false};if(window.__kvPageLoad.sent)return;window.__kvPageLoad.sent=true;const pageLoadId=window.__kvPageLoad.token;const sessionId=sessionStorage.getItem('kv-analytics-session')||crypto.randomUUID();sessionStorage.setItem('kv-analytics-session',sessionId);fetch('/api/analytics',{method:'POST',cache:'no-store',keepalive:true,headers:{'Content-Type':'application/json'},body:JSON.stringify({eventType:'page_view',path,sessionId,pageLoadId})}).then(r=>r.ok?r.json():Promise.reject()).then(detail=>dispatchEvent(new CustomEvent('kv:statistics',{detail}))).catch(()=>{})},[path]);return null
}
