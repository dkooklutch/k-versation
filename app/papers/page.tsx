import type { Metadata } from 'next'
import ArchiveClient from '@/components/ArchiveClient'
import { getPublishedPapers } from '@/lib/public-content'
export const metadata: Metadata={title:'Papers',description:'Original papers and cultural analysis by Daniel Koo.'}
export const dynamic='force-dynamic';export const revalidate=0
export default async function PapersPage(){const papers=await getPublishedPapers(),collectionPdf=papers.find(p=>p.collectionPdfUrl)?.collectionPdfUrl;return <><header className="page-hero"><div className="eyebrow">Archive / Papers</div><h1>PAPERS</h1><div className="page-hero-grid"><span>Written by Daniel Koo.</span><div><p>Original writing that stays with a question long enough to find what the first answer missed.</p>{collectionPdf&&<a className="text-link" href={collectionPdf} target="_blank" rel="noreferrer">Current 23-paper collection <span>↗</span></a>}</div></div></header><ArchiveClient type="papers" items={papers.map(p=>({slug:p.slug,title:p.title,image:p.image,category:p.category,date:p.archiveDate,metric:p.readingTime,description:p.subtitle||p.summary,views:p.views,reactions:p.reactions,sample:p.sample}))}/></>}
