'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import dynamic from'next/dynamic'
import type { StatisticsPayload } from '@/lib/statistics'
const StatisticsGlobe=dynamic(()=>import('./StatisticsGlobe'),{ssr:false,loading:()=> <div className="globe-shell globe-static" aria-hidden="true"><div className="globe-stage"><div className="globe-orb"><div className="globe-surface"/></div></div></div>})
const labels=[['site_impressions','Site impressions'],['content_views','Content views'],['conversations','Conversations'],['papers','Papers'],['reactions','Reactions'],['comments','Comments'],['subscribers','Subscribers'],['countries','Countries reached']] as const
export default function LiveStatistics(){
 const [stats,setStats]=useState<StatisticsPayload|null>(null)
 const [near,setNear]=useState(false)
 const sectionRef=useRef<HTMLDivElement>(null)
 const refresh=useCallback(()=>fetch('/api/statistics',{cache:'no-store'}).then(r=>r.ok?r.json():Promise.reject()).then(setStats).catch(()=>{}),[])
 useEffect(()=>{const node=sectionRef.current;if(!node)return;const observer=new IntersectionObserver(([entry])=>{if(entry.isIntersecting){setNear(true);observer.disconnect()}},{rootMargin:'350px'});observer.observe(node);return()=>observer.disconnect()},[])
 useEffect(()=>{refresh();const update=(event:Event)=>{const detail=(event as CustomEvent<StatisticsPayload>).detail;if(detail?.displayed)setStats(detail);else refresh()};addEventListener('kv:statistics',update);addEventListener('kv:stats-changed',update);return()=>{removeEventListener('kv:statistics',update);removeEventListener('kv:stats-changed',update)}},[refresh])
 return <div ref={sectionRef} className="statistics-experience">{near?<StatisticsGlobe/>:<div className="globe-shell globe-static" aria-hidden="true"><div className="globe-stage"><div className="globe-orb"><div className="globe-surface"/></div></div></div>}<div className="numbers" aria-live="polite">{labels.map(([key,label])=><div className="number" key={key}><strong>{stats?stats.displayed[key].toLocaleString():'—'}</strong><span>{label}</span><small>{stats?'Verified live total':'Loading verified total'}</small></div>)}</div></div>
}
