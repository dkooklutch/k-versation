import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Image from 'next/image'
import { papers, formatEditorialDate } from '@/lib/content'
import Interactions from '@/components/Interactions'
import ContentAnalytics from '@/components/ContentAnalytics'
import PdfReader from '@/components/PdfReader'
import { getPaper } from '@/lib/public-content'
export function generateStaticParams(){return papers.map(({slug})=>({slug}))}
export async function generateMetadata({params}:{params:Promise<{slug:string}>}):Promise<Metadata>{const {slug}=await params;const p=await getPaper(slug);return p?{title:p.title,description:p.excerpt,openGraph:{images:[p.image],type:'article'}}:{}}
export default async function PaperDetail({params}:{params:Promise<{slug:string}>}){const {slug}=await params;const p=await getPaper(slug);if(!p)notFound();return <><ContentAnalytics contentId={p.id} contentType="paper"/><article><header className="article-hero"><div className="article-hero-copy"><div className="eyebrow">Paper / {p.topic}</div><div><div className="meta-row"><span>{p.sample?'Sample content':''}</span><span>{formatEditorialDate(p.publishedAt)}</span><span>{p.readingTime}</span>{p.audioDuration&&<span>{p.audioDuration}</span>}</div><h1>{p.title}</h1><p>{p.subtitle}</p></div><p>Written by Daniel Koo</p></div><div className="article-hero-media"><Image src={p.image} alt="Sculptural paper study" width={1400} height={1800} priority/></div></header>{p.pdfUrl&&<PdfReader url={p.pdfUrl} title={p.title} downloadEnabled={p.pdfDownloadEnabled}/>}<div className="article-content"><div className="prose">{p.body.map((block,i)=>block.heading?<h2 key={i}>{block.heading}</h2>:block.quote?<blockquote key={i}>“{block.quote}”</blockquote>:<p key={i}>{block.text}</p>)}</div></div></article><Interactions contentId={p.id} contentType="paper"/></>}
