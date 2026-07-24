import process from 'node:process'
import { createClient } from '@supabase/supabase-js'

const origin = (process.env.KV_SITE_ORIGIN || 'https://k-versation-1.vercel.app').replace(/\/$/, '')
const slug = 'sera-shim'
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
})
const { data: conversation, error: conversationError } = await db.from('conversations').select('id').eq('slug', slug).single()
if (conversationError || !conversation) throw conversationError || new Error('Conversation not found.')

async function countViews() {
  const { count, error } = await db
    .from('analytics_events')
    .select('id', { count: 'exact', head: true })
    .eq('event_type', 'open')
    .eq('content_type', 'conversation')
    .in('content_id', [slug, conversation.id])
  if (error) throw error
  return count || 0
}

async function send(pageLoadId, headers = {}) {
  return fetch(`${origin}/api/analytics`, {
    method: 'POST',
    cache: 'no-store',
    headers: { 'Content-Type': 'application/json', 'User-Agent': 'K-VERSATION verification', ...headers },
    body: JSON.stringify({
      eventType: 'open',
      contentId: slug,
      contentType: 'conversation',
      path: `/conversations/${slug}`,
      pageLoadId,
      sessionId: crypto.randomUUID(),
    }),
  })
}

const before = await countViews()
const firstLoad = crypto.randomUUID()
const first = await send(firstLoad)
const duplicate = await send(firstLoad)
const afterFirst = await countViews()
if (!first.ok || !duplicate.ok || afterFirst !== before + 1) {
  throw new Error(`One page load did not add exactly one view: ${before} -> ${afterFirst}`)
}

const reload = await send(crypto.randomUUID())
const afterReload = await countViews()
if (!reload.ok || afterReload !== afterFirst + 1) {
  throw new Error(`Reload did not add exactly one view: ${afterFirst} -> ${afterReload}`)
}

const prefetchBefore = await countViews()
const prefetch = await send(crypto.randomUUID(), { Purpose: 'prefetch' })
const prefetchAfter = await countViews()
if (prefetch.status !== 204 || prefetchAfter !== prefetchBefore) {
  throw new Error(`Prefetch changed views: ${prefetchBefore} -> ${prefetchAfter}`)
}

const hostPreviewPayload = {
  eventType: 'open',
  contentId: slug,
  contentType: 'conversation',
  path: `/host/preview/conversations/${conversation.id}`,
  pageLoadId: crypto.randomUUID(),
  sessionId: crypto.randomUUID(),
}
const hostResponse = await fetch(`${origin}/api/analytics`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'User-Agent': 'K-VERSATION verification' },
  body: JSON.stringify(hostPreviewPayload),
})
const hostAfter = await countViews()
if (hostResponse.status !== 400 || hostAfter !== prefetchAfter) {
  throw new Error('Host-preview exclusion verification failed.')
}

console.log(JSON.stringify({
  conversation: slug,
  before,
  initial_open: afterFirst,
  duplicate_same_load_ignored: true,
  reload_open: afterReload,
  prefetch_ignored: true,
  host_preview_ignored: true,
}, null, 2))
