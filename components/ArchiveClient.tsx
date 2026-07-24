'use client'
import Image from 'next/image'
import Link from 'next/link'
import { useMemo, useState } from 'react'
import { formatEditorialDate } from '@/lib/content'

type Item = { slug:string; title:string; image:string; category:string; date:string; metric:string; description:string; searchText?:string; views:number; reactions:number; sample:boolean }
export default function ArchiveClient({ items, type }: { items: Item[]; type: 'conversations' | 'papers' }) {
  const [query,setQuery]=useState(''); const [category,setCategory]=useState('all'); const [sort,setSort]=useState('newest')
  const categories=[...new Set(items.map(i=>i.category))]
  const filtered=useMemo(()=>items.filter(i=>(category==='all'||i.category===category)&&`${i.title} ${i.description} ${i.category} ${i.searchText||''}`.toLowerCase().includes(query.toLowerCase())).sort((a,b)=>sort==='oldest'?+new Date(a.date)-+new Date(b.date):sort==='viewed'?b.views-a.views:sort==='reacted'?b.reactions-a.reactions:sort==='alphabetical'?a.title.localeCompare(b.title):+new Date(b.date)-+new Date(a.date)),[items,query,category,sort])
  return <><div className="archive-controls"><label className="sr-only" htmlFor={`${type}-search`}>Search {type}</label><input id={`${type}-search`} value={query} onChange={e=>setQuery(e.target.value)} placeholder={`Search ${type} or topics`} /><label className="sr-only" htmlFor={`${type}-filter`}>Filter by topic</label><select id={`${type}-filter`} value={category} onChange={e=>setCategory(e.target.value)}><option value="all">All topics</option>{categories.map(c=><option key={c}>{c}</option>)}</select><label className="sr-only" htmlFor={`${type}-sort`}>Sort</label><select id={`${type}-sort`} value={sort} onChange={e=>setSort(e.target.value)}><option value="newest">Newest first</option><option value="oldest">Oldest first</option><option value="viewed">Most viewed</option><option value="reacted">Most reacted</option><option value="alphabetical">Alphabetical</option></select></div>
    {filtered.length ? type==='papers' ? <div className="paper-archive-grid">{filtered.map((item,index)=><Link className="paper-archive-tile" href={`/papers/${item.slug}`} key={item.slug}>
      <header><span>{String(index+1).padStart(2,'0')}</span><small>{item.sample?'Sample · ':''}{item.category}</small></header>
      <div><h2>{item.title}</h2><p>{item.description}</p></div>
      <footer><span>{formatEditorialDate(item.date)}</span><span>{item.metric}</span><span>{item.views} views</span><span>{item.reactions} reactions</span><b>Read ↗</b></footer>
    </Link>)}</div> : <div className="archive-list">{filtered.map((item,index)=><Link className="archive-item" href={`/conversations/${item.slug}`} key={item.slug}><small>{String(index+1).padStart(2,'0')}</small><Image src={item.image} alt="" width={640} height={400}/><div><small>{item.sample?'Sample · ':''}{item.category}</small><h2>{item.title}</h2><p>{item.description}</p></div><div className="archive-end">{formatEditorialDate(item.date)}<br/>{item.metric}<br/>{item.views} views<br/>{item.reactions} reactions</div></Link>)}</div> : <div className="empty-state">No pieces match that search.</div>}
  </>
}
