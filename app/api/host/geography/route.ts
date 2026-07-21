import { NextRequest, NextResponse } from 'next/server'
import { hostAuthorized } from '@/lib/host-api'
import { createAdminClient } from '@/lib/supabase/admin'
import { hasDatabase } from '@/lib/security'

export const dynamic = 'force-dynamic'
const headers = { 'Cache-Control': 'no-store' }
const validCode = (value: unknown) => /^[A-Z]{2}$/.test(String(value).toUpperCase())

export async function GET() {
  if (!await hostAuthorized()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers })
  if (!hasDatabase()) return NextResponse.json({ error: 'Connect the production database first.' }, { status: 503, headers })
  const { data, error } = await createAdminClient().from('manual_country_activity').select('country_code,content_views,updated_at').order('country_code')
  if (error) return NextResponse.json({ error: 'Host-added country data could not be loaded.' }, { status: 500, headers })
  return NextResponse.json({ countries: data || [] }, { headers })
}

export async function PATCH(req: NextRequest) {
  if (!await hostAuthorized()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers })
  if (!hasDatabase()) return NextResponse.json({ error: 'Connect the production database first.' }, { status: 503, headers })
  try {
    const body = await req.json(), countryCode = String(body.countryCode || '').toUpperCase()
    if (!validCode(countryCode)) return NextResponse.json({ error: 'Choose a valid country.' }, { status: 400, headers })
    const db = createAdminClient()
    const { data: previous } = await db.from('manual_country_activity').select('*').eq('country_code', countryCode).maybeSingle()
    const current = Number(previous?.content_views || 0)
    const contentViews = body.delta === undefined ? Number(body.contentViews) : current + Number(body.delta)
    if (!Number.isSafeInteger(contentViews) || contentViews < 0 || contentViews > 1_000_000_000) return NextResponse.json({ error: 'Enter a valid whole number of listens.' }, { status: 400, headers })
    const next = { country_code: countryCode, content_views: contentViews, updated_at: new Date().toISOString() }
    const { error } = await db.from('manual_country_activity').upsert(next, { onConflict: 'country_code' })
    if (error) throw error
    await db.from('audit_logs').insert({ action: 'geography.update', entity_type: 'country', entity_id: countryCode, previous_value: previous || null, new_value: next })
    return NextResponse.json({ country: next }, { headers })
  } catch (error) {
    console.error('host geography update failed', error)
    return NextResponse.json({ error: 'The country activity could not be saved.' }, { status: 500, headers })
  }
}

export async function DELETE(req: NextRequest) {
  if (!await hostAuthorized()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers })
  if (!hasDatabase()) return NextResponse.json({ error: 'Connect the production database first.' }, { status: 503, headers })
  const countryCode = String(new URL(req.url).searchParams.get('countryCode') || '').toUpperCase()
  if (!validCode(countryCode)) return NextResponse.json({ error: 'Choose a valid country.' }, { status: 400, headers })
  const db = createAdminClient(), { data: previous } = await db.from('manual_country_activity').select('*').eq('country_code', countryCode).maybeSingle()
  const { error } = await db.from('manual_country_activity').delete().eq('country_code', countryCode)
  if (error) return NextResponse.json({ error: 'The host-added country could not be removed.' }, { status: 500, headers })
  await db.from('audit_logs').insert({ action: 'geography.delete', entity_type: 'country', entity_id: countryCode, previous_value: previous || null, new_value: null })
  return NextResponse.json({ ok: true }, { headers })
}
