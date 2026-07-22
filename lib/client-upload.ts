'use client'

import { createClient } from '@/lib/supabase/client'

export type UploadKind = 'video' | 'pdf' | 'image' | 'audio'

export async function uploadMediaFile(file: File, kind: UploadKind, onStatus: (value: string) => void) {
  onStatus(`Preparing ${file.name}…`)
  const signed = await fetch('/api/host/upload', {
    method: 'POST',
    cache: 'no-store',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fileName: file.name, mimeType: file.type, size: file.size, kind }),
  })
  const upload = await signed.json()
  if (!signed.ok) throw new Error(upload.error || 'Upload could not be prepared.')

  onStatus(`Uploading ${file.name}…`)
  const { error } = await createClient().storage
    .from('kversation-media')
    .uploadToSignedUrl(upload.path, upload.token, file, { contentType: file.type })
  if (error) throw error

  const completed = await fetch('/api/host/upload/complete', {
    method: 'POST',
    cache: 'no-store',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path: upload.path, url: upload.url, mimeType: file.type, size: file.size }),
  })
  if (!completed.ok) throw new Error('The upload completed, but the media record could not be saved.')
  return upload.url as string
}
