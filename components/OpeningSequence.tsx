'use client'
import { useEffect, useState } from 'react'

export default function OpeningSequence() {
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced || sessionStorage.getItem('kv-intro-seen')) return
    const frame = requestAnimationFrame(() => setVisible(true))
    const timer = window.setTimeout(() => { sessionStorage.setItem('kv-intro-seen', '1'); setVisible(false) }, 1900)
    return () => { cancelAnimationFrame(frame); window.clearTimeout(timer) }
  }, [])
  if (!visible) return null
  return <div className="opening" role="dialog" aria-label="K-VERSATION opening sequence">
    <button className="opening-skip" onClick={() => { sessionStorage.setItem('kv-intro-seen', '1'); setVisible(false) }}>Skip</button>
    <div className="orbit" aria-hidden="true"><i /><i /><i /><span /></div>
    <p>K<span>—</span>VERSATION</p>
  </div>
}
