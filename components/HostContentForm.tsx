'use client'

import { FormEvent, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type UploadResult = { url: string; path: string }

async function uploadFile(file: File, kind: 'video' | 'pdf', onStatus: (value: string) => void): Promise<UploadResult> {
  onStatus(`Preparing ${kind === 'video' ? 'video' : 'PDF'} upload…`)
  const signed = await fetch('/api/host/upload', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fileName: file.name, mimeType: file.type, size: file.size, kind })
  })
  const upload = await signed.json()
  if (!signed.ok) throw new Error(upload.error || 'The upload could not be prepared.')
  onStatus(`Uploading ${file.name} directly to secure storage…`)
  const { error } = await createClient().storage.from('kversation-media').uploadToSignedUrl(upload.path, upload.token, file, { contentType: file.type })
  if (error) throw error
  await fetch('/api/host/upload/complete', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path: upload.path, url: upload.url, mimeType: file.type, size: file.size })
  })
  return { url: upload.url, path: upload.path }
}

export default function HostContentForm() {
  const [status, setStatus] = useState('')
  const [type, setType] = useState<'conversation' | 'paper'>('conversation')
  const [videoSource, setVideoSource] = useState<'upload' | 'external'>('upload')
  const [saving, setSaving] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true)
    const form = event.currentTarget
    const formData = new FormData(form)
    const payload: Record<string, string> = {}
    formData.forEach((value, key) => { if (typeof value === 'string') payload[key] = value })
    try {
      if (type === 'conversation' && videoSource === 'upload') {
        const file = formData.get('videoFile')
        if (!(file instanceof File) || !file.size) throw new Error('Choose an MP4 or supported video file.')
        const result = await uploadFile(file, 'video', setStatus)
        payload.mediaUrl = result.url; payload.mediaSource = 'upload'
      } else if (type === 'conversation') {
        if (!payload.mediaUrl) throw new Error('Paste a Google Drive, YouTube, Vimeo, or direct video URL.')
        payload.mediaSource = 'external'
      } else {
        const file = formData.get('pdfFile')
        if (!(file instanceof File) || !file.size) throw new Error('Choose the PDF for this paper.')
        const result = await uploadFile(file, 'pdf', setStatus)
        payload.pdfUrl = result.url
      }
      setStatus('Saving content…')
      const response = await fetch('/api/host/content', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error || 'Content could not be saved.')
      setStatus(type === 'paper' ? 'Paper and PDF saved.' : 'Conversation and video saved.')
      form.reset(); setVideoSource('upload')
    } catch (error) { setStatus(error instanceof Error ? error.message : 'Upload failed.') }
    finally { setSaving(false) }
  }

  return <form className="host-form" onSubmit={submit}>
    <label>Content type<select name="type" value={type} onChange={e => setType(e.target.value as 'conversation' | 'paper')}><option value="conversation">Conversation</option><option value="paper">Paper</option></select></label>
    <label>Title<input name="title" required maxLength={180}/></label>
    <label>Slug<input name="slug" required pattern="[a-z0-9-]+" placeholder="lowercase-with-hyphens"/></label>
    {type === 'conversation' ? <>
      <label>Guest name<input name="guestName" required/></label><label>Category<input name="category"/></label>
      <fieldset className="host-fieldset"><legend>Video</legend><label>Video source<select value={videoSource} onChange={e => setVideoSource(e.target.value as 'upload' | 'external')}><option value="upload">Upload from this device</option><option value="external">Google Drive or video URL</option></select></label>
      {videoSource === 'upload' ? <label>Choose video file<input name="videoFile" type="file" accept="video/mp4,.mp4,video/webm,.webm,video/quicktime,.mov" required/><small>Choose from Desktop, Downloads, an external drive, or any folder available to this browser. MP4 is recommended.</small></label> : <label>Google Drive, YouTube, Vimeo, or direct URL<input name="mediaUrl" type="url" required placeholder="https://drive.google.com/file/d/…/view"/><small>For Google Drive, set the file to “Anyone with the link” so visitors can play it.</small></label>}</fieldset>
    </> : <>
      <label>Subtitle<input name="subtitle"/></label><label>Topic<input name="topic"/></label>
      <fieldset className="host-fieldset"><legend>Required paper file</legend><label>Upload PDF<input name="pdfFile" type="file" accept="application/pdf,.pdf" required/><small>Every paper requires a PDF. The uploaded file becomes the embedded reader and optional download.</small></label><label className="host-check"><input name="pdfDownloadEnabled" type="checkbox" value="true"/> Allow visitors to download the PDF</label></fieldset>
      <label>Optional audio narration URL<input name="audioUrl" type="url"/></label>
    </>}
    <label>Description / body<textarea name="description" required/></label>
    <label>Status<select name="status"><option>draft</option><option>scheduled</option><option>published</option><option>unpublished</option><option>archived</option></select></label>
    <label>Publish or schedule date<input name="publishedAt" type="datetime-local"/></label>
    <label>Cover asset URL<input name="imageUrl" placeholder="/editorial/bridge.jpg"/></label>
    <div><button className="button" disabled={saving}>{saving ? 'Working…' : 'Upload and save'}</button> <a className="button secondary" href="/" target="_blank">Preview site</a></div><p role="status" aria-live="polite">{status}</p>
  </form>
}
