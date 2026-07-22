import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { papers } from '@/lib/content'
import Interactions from '@/components/Interactions'
import ContentAnalytics from '@/components/ContentAnalytics'
import PaperArticle from '@/components/PaperArticle'
import { getPaper, getPublishedPapers } from '@/lib/public-content'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export function generateStaticParams() {
  return papers.map(({ slug }) => ({ slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const paper = await getPaper(slug)
  return paper ? {
    title: paper.seoTitle || paper.title,
    description: paper.seoDescription || paper.summary || paper.excerpt,
    authors: [{ name: paper.authorName }],
    openGraph: {
      images: [{ url: paper.image, alt: paper.title }],
      type: 'article',
      publishedTime: paper.publishedAt,
      modifiedTime: paper.revisedAt,
      authors: [paper.authorName],
    },
  } : {}
}

export default async function PaperDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const [paper, published] = await Promise.all([getPaper(slug), getPublishedPapers()])
  if (!paper) notFound()
  const related = published
    .filter(item => item.id !== paper.id)
    .sort((a, b) => Number(b.category === paper.category) - Number(a.category === paper.category))
    .slice(0, 3)

  return <>
    <ContentAnalytics contentId={paper.id} contentType="paper" />
    <PaperArticle paper={paper} related={related} />
    <Interactions
      contentId={paper.id}
      contentType="paper"
      commentsEnabled={paper.commentsEnabled}
      reactionsEnabled={paper.reactionsEnabled}
    />
  </>
}
