import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { cleanText, hasDatabase, limited, requestKey } from '@/lib/security'

const developmentReactions = new Set<string>()
const types = ['appreciate', 'insightful', 'powerful'] as const
const allowed = new Set<string>(types)
type ReactionType = typeof types[number]
type Counts = Record<ReactionType, number>

function emptyCounts(): Counts {
  return { appreciate: 0, insightful: 0, powerful: 0 }
}

async function snapshot(contentId: string, contentType: 'conversation' | 'paper', visitorId = '') {
  if (!hasDatabase()) {
    const counts = emptyCounts()
    const active: string[] = []
    for (const key of developmentReactions) {
      const [storedContent, storedVisitor, storedType] = key.split(':')
      if (storedContent === contentId && allowed.has(storedType)) counts[storedType as ReactionType] += 1
      if (storedContent === contentId && storedVisitor === visitorId) active.push(storedType)
    }
    return { counts, active }
  }

  const db = createAdminClient()
  const { data: rows, error } = await db
    .from('reactions')
    .select('reaction_type,visitor_id')
    .eq('content_id', contentId)
    .eq('content_type', contentType)
  if (error) throw error
  const counts = emptyCounts()
  const active: string[] = []
  for (const row of rows || []) {
    const type = String(row.reaction_type)
    if (!allowed.has(type)) continue
    counts[type as ReactionType] += 1
    if (visitorId && row.visitor_id === visitorId) active.push(type)
  }

  const table = contentType === 'paper' ? 'papers' : 'conversations'
  const select = 'appreciate_adjustment,insightful_adjustment,powerful_adjustment'
  const query = db.from(table).select(select)
  const content = /^[a-f0-9-]{36}$/i.test(contentId)
    ? await query.eq('id', contentId).maybeSingle()
    : await query.eq('slug', contentId).maybeSingle()
  if (content.error) throw content.error
  const adjustments = content.data as Record<string, unknown> | null
  for (const type of types) {
    counts[type] = Math.max(0, counts[type] + Number(adjustments?.[`${type}_adjustment`] || 0))
  }
  return { counts, active }
}

export async function GET(req: NextRequest) {
  const contentId = cleanText(req.nextUrl.searchParams.get('contentId'), 100)
  const visitorId = cleanText(req.nextUrl.searchParams.get('visitorId'), 100)
  const contentType = req.nextUrl.searchParams.get('contentType') === 'paper' ? 'paper' : 'conversation'
  if (!contentId) return NextResponse.json({ counts: emptyCounts(), active: [] })
  try {
    return NextResponse.json(await snapshot(contentId, contentType, visitorId), {
      headers: { 'Cache-Control': 'no-store, max-age=0' },
    })
  } catch {
    return NextResponse.json({ error: 'Reaction counts could not be loaded.' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  if (limited(requestKey(req.headers, 'reactions'), 20, 60_000)) {
    return NextResponse.json({ error: 'Slow down.' }, { status: 429 })
  }
  try {
    const body = await req.json()
    const contentId = cleanText(body.contentId, 100)
    const visitorId = cleanText(body.visitorId, 100)
    const type = cleanText(body.type, 30)
    const contentType = body.contentType === 'paper' ? 'paper' : 'conversation'
    if (!contentId || !visitorId || !allowed.has(type)) {
      return NextResponse.json({ error: 'Invalid reaction.' }, { status: 400 })
    }
    const key = `${contentId}:${visitorId}:${type}`
    if (hasDatabase()) {
      const db = createAdminClient()
      const { data } = await db
        .from('reactions')
        .select('id')
        .eq('content_id', contentId)
        .eq('visitor_id', visitorId)
        .eq('reaction_type', type)
        .maybeSingle()
      if (data) await db.from('reactions').delete().eq('id', data.id)
      else await db.from('reactions').insert({
        content_id: contentId,
        content_type: contentType,
        visitor_id: visitorId,
        reaction_type: type,
      })
    } else if (developmentReactions.has(key)) {
      developmentReactions.delete(key)
    } else {
      developmentReactions.add(key)
    }
    return NextResponse.json(await snapshot(contentId, contentType, visitorId))
  } catch {
    return NextResponse.json({ error: 'Reaction could not be saved.' }, { status: 500 })
  }
}
