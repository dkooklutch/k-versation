'use client'
/* eslint-disable @next/next/no-img-element -- the host previews newly uploaded and pasted image URLs */

import { useMemo, useState } from 'react'
import { uploadMediaFile } from '@/lib/client-upload'
import type { PaperBlock } from '@/lib/types'

type EditableBlock = PaperBlock & { editorKey: string }

function normalize(value: unknown): EditableBlock[] {
  if (!Array.isArray(value)) return []
  return value.flatMap((candidate, index): EditableBlock[] => {
    if (!candidate || typeof candidate !== 'object') return []
    const block = candidate as Record<string, unknown>
    const editorKey = `${index}-${crypto.randomUUID()}`
    if (block.type === 'figure' && block.url) return [{
      type: 'figure', editorKey, url: String(block.url), alt: String(block.alt || ''),
      caption: block.caption ? String(block.caption) : undefined,
      width: Number(block.width) || undefined, height: Number(block.height) || undefined,
    }]
    if (block.type === 'heading' || block.heading) return [{ type: 'heading', editorKey, text: String(block.text || block.heading || ''), level: Number(block.level) === 3 ? 3 : 2 }]
    if (block.type === 'quote' || block.quote) return [{ type: 'quote', editorKey, text: String(block.text || block.quote || '') }]
    const text = String(block.text || '')
    return text ? [{ type: 'paragraph', editorKey, text }] : []
  })
}

function clean(block: EditableBlock): PaperBlock {
  const { editorKey: _editorKey, ...value } = block
  void _editorKey
  return value
}

export default function PaperBodyEditor({ initial, onDirty }: { initial: unknown; onDirty: () => void }) {
  const [blocks, setBlocks] = useState<EditableBlock[]>(() => normalize(initial))
  const [pasted, setPasted] = useState('')
  const [status, setStatus] = useState('')
  const serialized = useMemo(() => JSON.stringify(blocks.map(clean)), [blocks])

  function change(index: number, patch: Partial<PaperBlock>) {
    setBlocks(items => items.map((block, position) => position === index ? ({ ...block, ...patch } as EditableBlock) : block))
    onDirty()
  }
  function add(type: PaperBlock['type']) {
    const editorKey = crypto.randomUUID()
    const block: EditableBlock = type === 'figure'
      ? { type, editorKey, url: '', alt: '', caption: '' }
      : type === 'heading'
        ? { type, editorKey, text: '', level: 2 }
        : { type, editorKey, text: '' }
    setBlocks(items => [...items, block])
    onDirty()
  }
  function move(index: number, offset: number) {
    const target = index + offset
    if (target < 0 || target >= blocks.length) return
    setBlocks(items => {
      const next = [...items]
      ;[next[index], next[target]] = [next[target], next[index]]
      return next
    })
    onDirty()
  }
  function remove(index: number) {
    if (!confirm('Remove this block from the paper?')) return
    setBlocks(items => items.filter((_, position) => position !== index))
    onDirty()
  }
  function pasteParagraphs() {
    const paragraphs = pasted.split(/\n\s*\n/).map(text => text.replace(/\s*\n\s*/g, ' ').trim()).filter(Boolean)
    if (!paragraphs.length) return
    setBlocks(items => [...items, ...paragraphs.map((text): EditableBlock => ({ type: 'paragraph', text, editorKey: crypto.randomUUID() }))])
    setPasted('')
    setStatus(`${paragraphs.length} paragraph${paragraphs.length === 1 ? '' : 's'} added. Review the order before saving.`)
    onDirty()
  }
  async function uploadFigure(index: number, file?: File) {
    if (!file?.size) return
    try {
      const url = await uploadMediaFile(file, 'image', setStatus)
      change(index, { url })
      setStatus('Figure uploaded. Add alternative text and a caption, then save the paper.')
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Figure upload failed.')
    }
  }

  return <div className="paper-body-editor">
    <input type="hidden" name="body_json" value={serialized} />
    <section className="paper-paste">
      <label>Paste paper text<textarea value={pasted} onChange={event => setPasted(event.target.value)} placeholder="Paste paragraphs from Google Docs here. Leave a blank line between paragraphs." /></label>
      <button type="button" className="button secondary" onClick={pasteParagraphs}>Add pasted paragraphs</button>
    </section>
    <div className="paper-block-toolbar"><span>Add a block</span><button type="button" onClick={() => add('paragraph')}>Paragraph</button><button type="button" onClick={() => add('heading')}>Heading</button><button type="button" onClick={() => add('quote')}>Quotation</button><button type="button" onClick={() => add('figure')}>Figure</button></div>
    <ol className="paper-block-list">
      {blocks.map((block, index) => <li key={block.editorKey}>
        <header><strong>{index + 1}. {block.type}</strong><div><button type="button" onClick={() => move(index, -1)} disabled={index === 0}>Move up</button><button type="button" onClick={() => move(index, 1)} disabled={index === blocks.length - 1}>Move down</button><button type="button" onClick={() => remove(index)}>Remove</button></div></header>
        {block.type === 'figure' ? <div className="paper-figure-fields">
          {block.url && <img src={block.url} alt="Current figure preview" />}
          <label>Image URL<input value={block.url} onChange={event => change(index, { url: event.target.value })} /></label>
          <label>Or upload image<input type="file" accept="image/jpeg,image/png,image/webp,image/avif" onChange={event => uploadFigure(index, event.target.files?.[0])} /></label>
          <label>Alternative text<input value={block.alt} onChange={event => change(index, { alt: event.target.value })} required /></label>
          <label>Figure caption<textarea value={block.caption || ''} onChange={event => change(index, { caption: event.target.value })} /></label>
        </div> : <label>{block.type === 'heading' ? 'Heading text' : block.type === 'quote' ? 'Quotation' : 'Paragraph'}<textarea value={block.text} onChange={event => change(index, { text: event.target.value })} required /></label>}
      </li>)}
    </ol>
    {!blocks.length && <p className="host-alert">This paper has no content blocks yet. Paste text or add a paragraph before publishing.</p>}
    <p role="status" aria-live="polite">{status}</p>
  </div>
}
