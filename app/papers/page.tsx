import type { Metadata } from 'next'
import ArchiveClient from '@/components/ArchiveClient'
import { papers } from '@/lib/content'
export const metadata: Metadata={title:'Papers',description:'Original papers and cultural analysis by Daniel Koo.'}
export default function PapersPage(){return <><header className="page-hero"><div className="eyebrow">Archive / Papers</div><h1>PAPERS</h1><div className="page-hero-grid"><span>Written by Daniel Koo.</span><p>Original writing that stays with a question long enough to find what the first answer missed.</p></div></header><ArchiveClient type="papers" items={papers.map(p=>({slug:p.slug,title:p.title,image:p.image,category:p.topic,date:p.publishedAt,metric:p.readingTime,description:p.excerpt,views:p.views,reactions:p.reactions,sample:p.sample}))}/></>}
