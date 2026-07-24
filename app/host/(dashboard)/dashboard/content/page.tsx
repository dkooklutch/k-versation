import Link from 'next/link'
import HostContentForm from '@/components/HostContentForm'
import { hasDatabase } from '@/lib/security'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function Content({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; edit?: string; new?: string }>
}) {
  const query = await searchParams
  const type = query.type === 'paper' ? 'paper' : 'conversation'
  const table = type === 'paper' ? 'papers' : 'conversations'
  let items: Record<string, unknown>[] = []
  let error = ''
  const database = hasDatabase() ? createAdminClient() : null
  if (database) {
    const result = await database.from(table).select('*').order('updated_at', { ascending: false })
    items = (result.data || []) as Record<string, unknown>[]
    if (result.error) error = result.error.message
  } else {
    error = 'Connect the production database to create or edit content.'
  }

  let selected = query.edit ? items.find(item => item.id === query.edit) : undefined
  if (database && selected && type === 'conversation') {
    const { data: reactions } = await database
      .from('reactions')
      .select('reaction_type')
      .eq('content_type', 'conversation')
      .in('content_id', [String(selected.id), String(selected.slug)])
    const verified = { appreciate: 0, insightful: 0, powerful: 0 }
    for (const reaction of reactions || []) {
      const key = reaction.reaction_type as keyof typeof verified
      if (key in verified) verified[key] += 1
    }
    selected = {
      ...selected,
      appreciate_verified: verified.appreciate,
      insightful_verified: verified.insightful,
      powerful_verified: verified.powerful,
    }
  }

  const showEditor = Boolean(query.new || query.edit)
  return <>
    <header className="host-head">
      <div>
        <small>Manage / {type === 'paper' ? 'Papers' : 'Conversations'}</small>
        <h1>{type === 'paper' ? 'Papers' : 'Conversations'}</h1>
      </div>
      <Link className="button" href={`/host/dashboard/content?type=${type}&new=1`}>Create new</Link>
    </header>
    {error && <p className="host-alert">{error}</p>}
    {showEditor ? <>
      <Link className="host-back" href={`/host/dashboard/content?type=${type}`}>
        ← Back to all {type === 'paper' ? 'papers' : 'conversations'}
      </Link>
      <HostContentForm kind={type} initial={selected} />
    </> : <section className="host-content-list">
      {items.length ? items.map(item => {
        const itemDate = type === 'paper'
          ? item.original_draft_date || item.published_at
          : item.display_date || item.published_at
        return <Link key={String(item.id)} href={`/host/dashboard/content?type=${type}&edit=${item.id}`}>
          <span>
            <strong>{String(item.title)}</strong>
            <small>{String(item.status)} · {itemDate ? new Date(String(itemDate)).toLocaleDateString() : 'No date'}</small>
          </span>
          <b>Edit →</b>
        </Link>
      }) : <div className="host-empty">
        <h2>No {type === 'paper' ? 'papers' : 'conversations'} yet</h2>
        <p>Create the first one with the guided editor. You will never need to enter a database ID.</p>
      </div>}
    </section>}
  </>
}
