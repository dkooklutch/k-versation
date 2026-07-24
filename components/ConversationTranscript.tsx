'use client'

import { useState } from 'react'
import type { TranscriptExchange } from '@/lib/types'

export default function ConversationTranscript({
  exchanges,
  interviewer,
  guest,
  language = 'English',
}: {
  exchanges: TranscriptExchange[]
  interviewer: string
  guest: string
  language?: string
}) {
  const [expanded, setExpanded] = useState(false)
  if (!exchanges.length) return null
  return <section className="conversation-transcript-section" id="transcript" aria-labelledby="transcript-title">
    <header>
      <div className="eyebrow">{language} / Transcript</div>
      <h2 id="transcript-title">English Transcript</h2>
      <dl><div><dt>Interviewer</dt><dd>{interviewer}</dd></div><div><dt>Guest</dt><dd>{guest}</dd></div></dl>
    </header>
    <div className={`transcript-exchanges ${expanded ? 'expanded' : 'collapsed'}`} id="transcript-exchanges">
      {exchanges.map(exchange => <article key={exchange.order}>
        <div className="transcript-turn transcript-question"><strong>{exchange.question.speaker}:</strong>{exchange.question.text.split('\n\n').map((paragraph, p) => <p key={p}>{paragraph}</p>)}</div>
        <div className="transcript-turn"><strong>{exchange.answer.speaker}:</strong>{exchange.answer.text.split('\n\n').map((paragraph, p) => <p key={p}>{paragraph}</p>)}</div>
      </article>)}
    </div>
    {exchanges.length > 3 && <button
      className="transcript-toggle"
      type="button"
      aria-expanded={expanded}
      aria-controls="transcript-exchanges"
      onClick={() => setExpanded(value => !value)}
    >{expanded ? 'Collapse Transcript' : 'Read Full Transcript'} <span aria-hidden="true">{expanded ? '↑' : '↓'}</span></button>}
  </section>
}
