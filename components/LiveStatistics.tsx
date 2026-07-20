'use client'
import { useCallback, useEffect, useState } from 'react'
import type { StatisticsPayload } from '@/lib/statistics'
const labels=[['site_impressions','Site impressions'],['content_views','Content views'],['conversations','Conversations'],['papers','Papers'],['reactions','Reactions'],['comments','Comments'],['subscribers','Subscribers'],['countries','Countries reached']] as const
export default function LiveStatistics(){
 const [stats,setStats]=useState<StatisticsPayload|null>(null)
 const refresh=useCallback(()=>fetch('/api/statistics',{cache:'no-store'}).then(r=>r.ok?r.json():Promise.reject()).then(setStats).catch(()=>{}),[])
 useEffect(()=>{refresh();const update=(event:Event)=>{const detail=(event as CustomEvent<StatisticsPayload>).detail;if(detail?.displayed)setStats(detail);else refresh()};addEventListener('kv:statistics',update);addEventListener('kv:stats-changed',update);return()=>{removeEventListener('kv:statistics',update);removeEventListener('kv:stats-changed',update)}},[refresh])
 return <div className="numbers" aria-live="polite">{labels.map(([key,label])=><div className="number" key={key}><strong>{stats?stats.displayed[key].toLocaleString():'—'}</strong><span>{label}</span><small>{stats?'Verified live total':'Loading verified total'}</small></div>)}</div>
}
