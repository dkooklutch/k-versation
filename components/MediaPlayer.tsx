'use client'

import { useEffect, useRef, useState } from 'react'

type Provider = 'youtube' | 'vimeo' | 'upload' | 'hosted'
type YouTubePlayer = {
  destroy(): void
}

declare global {
  interface Window {
    YT?: {
      Player: new (
        element: HTMLIFrameElement,
        options: {
          events: {
            onReady(): void
            onStateChange(event: { data: number }): void
            onError(): void
          }
        }
      ) => YouTubePlayer
      PlayerState: { ENDED: number }
    }
  }
}

function recordCompletion(contentId: string) {
  const sessionId = sessionStorage.getItem('kv-analytics-session') || crypto.randomUUID()
  sessionStorage.setItem('kv-analytics-session', sessionId)
  if (sessionStorage.getItem(`kv-complete-${contentId}`)) return
  sessionStorage.setItem(`kv-complete-${contentId}`, '1')
  const payload = JSON.stringify({
    eventType: 'completion',
    contentId,
    contentType: 'conversation',
    path: location.pathname,
    sessionId,
  })
  if (!navigator.sendBeacon?.('/api/analytics', new Blob([payload], { type: 'application/json' }))) {
    void fetch('/api/analytics', {
      method: 'POST',
      cache: 'no-store',
      keepalive: true,
      headers: { 'Content-Type': 'application/json' },
      body: payload,
    })
  }
}

function YouTubePlayer({
  videoId,
  title,
  contentId,
  trackCompletion,
}: {
  videoId: string
  title: string
  contentId: string
  trackCompletion: boolean
}) {
  const frame = useRef<HTMLIFrameElement>(null)
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading')

  useEffect(() => {
    let player: YouTubePlayer | undefined
    let cancelled = false
    let attempts = 0

    if (!document.querySelector('script[data-kv-youtube-api]')) {
      const script = document.createElement('script')
      script.src = 'https://www.youtube.com/iframe_api'
      script.async = true
      script.dataset.kvYoutubeApi = 'true'
      document.head.appendChild(script)
    }

    const timer = window.setInterval(() => {
      attempts += 1
      if (cancelled || !frame.current) return
      if (window.YT?.Player) {
        window.clearInterval(timer)
        player = new window.YT.Player(frame.current, {
          events: {
            onReady: () => setState('ready'),
            onStateChange: event => {
              if (trackCompletion && event.data === window.YT?.PlayerState.ENDED) recordCompletion(contentId)
            },
            onError: () => setState('error'),
          },
        })
      } else if (attempts > 80) {
        window.clearInterval(timer)
        setState('error')
      }
    }, 125)

    return () => {
      cancelled = true
      window.clearInterval(timer)
      player?.destroy()
    }
  }, [contentId, trackCompletion])

  return (
    <div className="kv-player-stage">
      <iframe
        ref={frame}
        title={title}
        src={`https://www.youtube-nocookie.com/embed/${videoId}?enablejsapi=1&controls=1&rel=0&playsinline=1&modestbranding=1`}
        allow="accelerometer; autoplay; encrypted-media; picture-in-picture; fullscreen"
        allowFullScreen
      />
      {state === 'loading' && <span className="kv-player-status">Loading Conversation…</span>}
      {state === 'error' && <span className="kv-player-status error">The Conversation player could not load. Please try again.</span>}
    </div>
  )
}

export default function MediaPlayer({
  url,
  title,
  contentId,
  provider,
  externalVideoId,
  captionsAvailable = false,
  trackCompletion = true,
}: {
  url?: string
  title: string
  contentId: string
  provider?: Provider
  externalVideoId?: string
  captionsAvailable?: boolean
  trackCompletion?: boolean
}) {
  const [speed, setSpeed] = useState(1)
  const youtubeId =
    externalVideoId ||
    (provider === 'youtube' || /youtu(?:\.be|be\.com)/.test(url || '')
      ? url?.match(/(?:v=|youtu\.be\/|embed\/)([\w-]{11})/)?.[1]
      : undefined)

  if (provider === 'youtube' && !youtubeId) {
    return <div className="media-player"><p className="kv-player-error">This Conversation has an invalid video ID.</p></div>
  }

  if (youtubeId) {
    return (
      <section className="media-player kv-player" aria-label={`${title} video player`}>
        <header><span>K-VERSATION Player</span><small>{captionsAvailable ? 'Captions available' : 'Conversation video'}</small></header>
        <YouTubePlayer videoId={youtubeId} title={title} contentId={contentId} trackCompletion={trackCompletion} />
      </section>
    )
  }

  if (!url) return <div className="media-player"><p className="kv-player-error">Video is not available for this Conversation.</p></div>
  if (/drive\.google\.com/.test(url)){const id=url.match(/\/d\/([^/]+)/)?.[1]||new URL(url).searchParams.get('id');return id?<div className="media-player"><iframe title={title} src={`https://drive.google.com/file/d/${id}/preview`} allow="autoplay; fullscreen" allowFullScreen/></div>:<div className="media-player"><p>The hosted video link is not in a supported format.</p></div>}
  if (provider === 'vimeo' || /vimeo\.com/.test(url)){const id=externalVideoId||url.match(/vimeo\.com\/(?:video\/)?(\d+)/)?.[1];return id?<div className="media-player"><iframe title={title} src={`https://player.vimeo.com/video/${id}`} allow="autoplay; fullscreen; picture-in-picture" allowFullScreen/></div>:<div className="media-player"><p>The Vimeo video ID is not in a supported format.</p></div>}

  return <section className="media-player kv-player" aria-label={`${title} video player`}><header><span>K-VERSATION Player</span><small>{captionsAvailable?'Captions available':'Conversation video'}</small></header><video controls playsInline preload="metadata" onEnded={()=>{if(trackCompletion)recordCompletion(contentId)}} onLoadedMetadata={e=>{e.currentTarget.playbackRate=speed}}><source src={url}/><track kind="captions" label="English"/>Your browser cannot play this video.</video><label>Playback speed <select value={speed} onChange={e=>{const next=Number(e.target.value);setSpeed(next);const video=e.currentTarget.parentElement?.querySelector('video');if(video)video.playbackRate=next}}><option value="0.75">0.75×</option><option value="1">1×</option><option value="1.25">1.25×</option><option value="1.5">1.5×</option><option value="2">2×</option></select></label></section>
}
