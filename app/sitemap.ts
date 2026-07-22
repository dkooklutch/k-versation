import type { MetadataRoute } from 'next'
import { getPublishedConversations, getPublishedPapers } from '@/lib/public-content'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  const [conversations, papers] = await Promise.all([getPublishedConversations(), getPublishedPapers()])
  const routes = ['', '/conversations', '/papers', '/about', '/questions', '/join', '/privacy']
  return [
    ...routes.map(url => ({ url: `${base}${url}`, lastModified: new Date(), changeFrequency: 'weekly' as const, priority: url === '' ? 1 : .7 })),
    ...conversations.map(item => ({ url: `${base}/conversations/${item.slug}`, lastModified: new Date(item.publishedAt), changeFrequency: 'monthly' as const, priority: .8 })),
    ...papers.map(item => ({ url: `${base}/papers/${item.slug}`, lastModified: new Date(item.revisedAt || item.publishedAt), changeFrequency: 'monthly' as const, priority: .8 })),
  ]
}
