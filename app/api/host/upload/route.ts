import { NextRequest, NextResponse } from 'next/server'
import { hostAuthorized } from '@/lib/host-api'
import { createAdminClient } from '@/lib/supabase/admin'
import { cleanText, hasDatabase } from '@/lib/security'

const videoTypes = new Set(['video/mp4', 'video/webm', 'video/quicktime'])
const pdfTypes = new Set(['application/pdf'])
const imageTypes = new Set(['image/jpeg','image/png','image/webp','image/avif'])
const audioTypes = new Set(['audio/mpeg','audio/mp4','audio/wav','audio/x-wav'])

export async function POST(req: NextRequest) {
  if (!await hostAuthorized()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!hasDatabase()) return NextResponse.json({ error: 'Configure Supabase before uploading.' }, { status: 503 })
  try {
    const body = await req.json()
    const kind = ['pdf','image','audio'].includes(body.kind) ? body.kind as 'pdf'|'image'|'audio' : 'video'
    const fileName = cleanText(body.fileName, 240)
    const mimeType = cleanText(body.mimeType, 100)
    const size = Number(body.size)
    const allowed = kind === 'pdf' ? pdfTypes.has(mimeType) && /\.pdf$/i.test(fileName) : kind === 'image' ? imageTypes.has(mimeType) && /\.(jpe?g|png|webp|avif)$/i.test(fileName) : kind === 'audio' ? audioTypes.has(mimeType) && /\.(mp3|m4a|wav)$/i.test(fileName) : videoTypes.has(mimeType) && /\.(mp4|webm|mov)$/i.test(fileName)
    const limit = kind === 'video' ? 2 * 1024 * 1024 * 1024 : kind === 'pdf' ? 100 * 1024 * 1024 : kind === 'audio' ? 250 * 1024 * 1024 : 20 * 1024 * 1024
    if (!allowed || !Number.isFinite(size) || size < 1 || size > limit) return NextResponse.json({ error: `Choose a supported ${kind} file within the upload limit.` }, { status: 400 })
    const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, '-')
    const path = `${kind}/${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}-${safeName}`
    const db = createAdminClient()
    const { data, error } = await db.storage.from('kversation-media').createSignedUploadUrl(path)
    if (error) throw error
    const { data: publicData } = db.storage.from('kversation-media').getPublicUrl(path)
    return NextResponse.json({ path, token: data.token, url: publicData.publicUrl })
  } catch { return NextResponse.json({ error: 'The secure upload could not be prepared.' }, { status: 500 }) }
}
