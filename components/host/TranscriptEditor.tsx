'use client'

import { useMemo, useState } from 'react'
import type { TranscriptExchange } from '@/lib/types'

const blank = (order: number, interviewer: string, guest: string): TranscriptExchange => ({
  order,
  question: { speaker: interviewer, role: 'Interviewer', text: '' },
  answer: { speaker: guest, role: 'Guest', text: '' },
})

function initialExchanges(value: unknown, interviewer: string, guest: string) {
  if (!Array.isArray(value)) return []
  return value.flatMap((candidate, index): TranscriptExchange[] => {
    if (!candidate || typeof candidate !== 'object') return []
    const row = candidate as Record<string, unknown>
    const question = row.question as Record<string, unknown> | undefined
    const answer = row.answer as Record<string, unknown> | undefined
    if (!question || !answer) return []
    return [{
      order: index + 1,
      question: {
        speaker: String(question.speaker || interviewer),
        role: String(question.role || 'Interviewer'),
        text: String(question.text || ''),
      },
      answer: {
        speaker: String(answer.speaker || guest),
        role: String(answer.role || 'Guest'),
        text: String(answer.text || ''),
      },
    }]
  })
}

export default function TranscriptEditor({
  initial,
  interviewer,
  guest,
  onDirty,
}: {
  initial: unknown
  interviewer: string
  guest: string
  onDirty(): void
}) {
  const seeded = useMemo(() => initialExchanges(initial, interviewer, guest), [initial, interviewer, guest])
  const [exchanges, setExchanges] = useState(seeded)
  const [preview, setPreview] = useState(false)

  const change = (index: number, side: 'question' | 'answer', key: 'speaker' | 'role' | 'text', value: string) => {
    setExchanges(current => current.map((exchange, position) => position === index
      ? { ...exchange, [side]: { ...exchange[side], [key]: value } }
      : exchange))
    onDirty()
  }
  const move = (index: number, direction: -1 | 1) => {
    setExchanges(current => {
      const target = index + direction
      if (target < 0 || target >= current.length) return current
      const next = [...current]
      ;[next[index], next[target]] = [next[target], next[index]]
      return next.map((exchange, order) => ({ ...exchange, order: order + 1 }))
    })
    onDirty()
  }
  const remove = (index: number) => {
    setExchanges(current => current.filter((_, position) => position !== index).map((exchange, order) => ({ ...exchange, order: order + 1 })))
    onDirty()
  }
  const add = () => {
    setExchanges(current => [...current, blank(current.length + 1, interviewer || 'Daniel Koo', guest)])
    onDirty()
  }

  return <section className="transcript-editor">
    <input name="transcript_exchanges_json" type="hidden" value={JSON.stringify(exchanges)} />
    <header>
      <div><strong>Interview exchanges</strong><small>{exchanges.length} {exchanges.length === 1 ? 'exchange' : 'exchanges'}</small></div>
      <div><button type="button" className="button secondary" onClick={() => setPreview(value => !value)}>{preview ? 'Edit transcript' : 'Preview transcript'}</button><button type="button" className="button" onClick={add}>Add exchange</button></div>
    </header>
    {preview ? <div className="transcript-editor-preview">
      {exchanges.length ? exchanges.map(exchange => <article key={exchange.order}>
        <p><strong>{exchange.question.speaker}:</strong> {exchange.question.text || 'Question not entered'}</p>
        <p><strong>{exchange.answer.speaker}:</strong> {exchange.answer.text || 'Answer not entered'}</p>
      </article>) : <p>No transcript exchanges yet.</p>}
    </div> : <div className="transcript-editor-list">
      {exchanges.map((exchange, index) => <fieldset key={index}>
        <legend>Exchange {index + 1}</legend>
        <div className="transcript-editor-actions">
          <button type="button" onClick={() => move(index, -1)} disabled={index === 0} aria-label={`Move exchange ${index + 1} up`}>↑</button>
          <button type="button" onClick={() => move(index, 1)} disabled={index === exchanges.length - 1} aria-label={`Move exchange ${index + 1} down`}>↓</button>
          <button type="button" onClick={() => remove(index)} aria-label={`Remove exchange ${index + 1}`}>Remove</button>
        </div>
        <div className="host-form-grid">
          <label>Question speaker<input value={exchange.question.speaker} onChange={event => change(index, 'question', 'speaker', event.target.value)} /></label>
          <label>Question role<input value={exchange.question.role} onChange={event => change(index, 'question', 'role', event.target.value)} /></label>
        </div>
        <label>Question<textarea value={exchange.question.text} onChange={event => change(index, 'question', 'text', event.target.value)} /></label>
        <div className="host-form-grid">
          <label>Answer speaker<input value={exchange.answer.speaker} onChange={event => change(index, 'answer', 'speaker', event.target.value)} /></label>
          <label>Answer role<input value={exchange.answer.role} onChange={event => change(index, 'answer', 'role', event.target.value)} /></label>
        </div>
        <label>Answer<textarea value={exchange.answer.text} onChange={event => change(index, 'answer', 'text', event.target.value)} /></label>
      </fieldset>)}
      {!exchanges.length && <p className="host-help">No exchanges yet. Add one to begin the transcript.</p>}
    </div>}
  </section>
}
