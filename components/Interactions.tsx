'use client'

import { FormEvent, useEffect, useState } from 'react'
import ShareControl from './ShareControl'

const reactionTypes = [
  ['appreciate', 'M6 13h12M12 7v12'],
  ['insightful', 'M9 18h6M10 22h4M8 11a4 4 0 1 1 8 0c0 2-1 3-2 4H10c-1-1-2-2-2-4Z'],
  ['powerful', 'm13 2-9 12h7l-1 8 9-12h-7z'],
] as const
type ReactionType = typeof reactionTypes[number][0]
type Counts = Record<ReactionType, number>
const emptyCounts = (): Counts => ({ appreciate: 0, insightful: 0, powerful: 0 })

export default function Interactions({
  contentId,
  contentType,
  commentsEnabled = true,
  reactionsEnabled = true,
  part = 'all',
}: {
  contentId: string
  contentType: 'conversation' | 'paper'
  commentsEnabled?: boolean
  reactionsEnabled?: boolean
  part?: 'all' | 'controls' | 'comments'
}) {
  const [active, setActive] = useState<string[]>([])
  const [counts, setCounts] = useState<Counts>(emptyCounts)
  const [status, setStatus] = useState('')
  const [comments, setComments] = useState<Array<{ id: string; anonymous_name: string; body: string; created_at: string }>>([])
  const showControls = part === 'all' || part === 'controls'
  const showComments = part === 'all' || part === 'comments'

  useEffect(() => {
    if (!showControls || !reactionsEnabled) return
    const visitorId = localStorage.getItem('kv-visitor') || crypto.randomUUID()
    localStorage.setItem('kv-visitor', visitorId)
    const params = new URLSearchParams({ contentId, contentType, visitorId })
    fetch(`/api/reactions?${params}`, { cache: 'no-store' })
      .then(response => response.ok ? response.json() : Promise.reject())
      .then(data => {
        setActive(Array.isArray(data.active) ? data.active : [])
        setCounts({ ...emptyCounts(), ...(data.counts || {}) })
      })
      .catch(() => {})
  }, [contentId, contentType, reactionsEnabled, showControls])

  useEffect(() => {
    if (!showComments) return
    fetch(`/api/comments?contentId=${contentId}`)
      .then(response => response.ok ? response.json() : [])
      .then(setComments)
      .catch(() => {})
  }, [contentId, showComments])

  async function react(type: ReactionType) {
    const visitorId = localStorage.getItem('kv-visitor') || crypto.randomUUID()
    localStorage.setItem('kv-visitor', visitorId)
    const response = await fetch('/api/reactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contentId, contentType, type, visitorId }),
    })
    if (!response.ok) return
    const data = await response.json()
    setActive(Array.isArray(data.active) ? data.active : [])
    setCounts({ ...emptyCounts(), ...(data.counts || {}) })
    dispatchEvent(new CustomEvent('kv:stats-changed'))
  }

  async function comment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setStatus('Sending…')
    const body = new FormData(event.currentTarget).get('body')
    const response = await fetch('/api/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contentId, contentType, body }),
    })
    const data = await response.json().catch(() => ({}))
    if (response.ok) {
      setComments(current => [...current, data])
      event.currentTarget.reset()
      setStatus('Comment published.')
      dispatchEvent(new CustomEvent('kv:stats-changed'))
    } else {
      setStatus(data.error || 'Comment could not be published.')
    }
  }

  return <>
    {showControls && <div className="interactions">
      {reactionsEnabled && <div>
        <div className="eyebrow">React to this piece</div>
        <div className="reaction-set">
          {reactionTypes.map(([type, path]) => <button
            key={type}
            aria-pressed={active.includes(type)}
            aria-label={`${type}, ${counts[type]} reactions`}
            onClick={() => react(type)}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true"><path d={path} /></svg>
            <span>{type}</span>
            <strong>{counts[type].toLocaleString()}</strong>
          </button>)}
        </div>
      </div>}
      <ShareControl label={contentType === 'conversation' ? 'Share conversation' : 'Share paper'} />
    </div>}
    {showComments && commentsEnabled && <section className="comment-form">
      <div className="eyebrow">Comments / {comments.length}</div>
      {comments.map(comment => <article key={comment.id}>
        <strong>{comment.anonymous_name}</strong>
        <p>{comment.body}</p>
      </article>)}
      <form onSubmit={comment}>
        <label className="sr-only" htmlFor="comment-body">Comment</label>
        <textarea id="comment-body" name="body" required maxLength={1800} placeholder="Add to the conversation" />
        <button>Publish comment</button>
        <p className="form-status" role="status">{status}</p>
      </form>
    </section>}
  </>
}
