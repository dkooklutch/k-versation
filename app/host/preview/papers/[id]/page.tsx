import { notFound } from 'next/navigation'
import { requireAdmin } from '@/lib/admin-auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { mapPaperRow } from '@/lib/public-content'
import PaperArticle from '@/components/PaperArticle'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function HostPaperPreview({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin()
  const { id } = await params
  const { data } = await createAdminClient().from('papers').select('*').eq('id', id).maybeSingle()
  if (!data) notFound()
  return <main><PaperArticle paper={mapPaperRow(data as Record<string, unknown>)} preview /></main>
}
