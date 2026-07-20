'use client'
import { FormEvent, useState } from 'react'
export default function EmailSignup() {
  const [status, setStatus] = useState('')
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); setStatus('Joining…')
    const form = new FormData(e.currentTarget)
    const response = await fetch('/api/subscribe', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(Object.fromEntries(form)) })
    const data = await response.json().catch(() => ({}))
    setStatus(response.ok ? 'You are part of the conversation.' : data.error || 'We could not save that address.')
    if (response.ok) { e.currentTarget.reset(); dispatchEvent(new CustomEvent('kv:stats-changed')) }
  }
  return <form onSubmit={submit}><div className="field-line"><label className="sr-only" htmlFor="home-email">Email address</label><input id="home-email" name="email" type="email" placeholder="Email address" required autoComplete="email" /><button>Join ↗</button></div><label className="consent"><input type="checkbox" name="consent" value="true" required /> I agree to receive K-VERSATION email updates. I can unsubscribe at any time.</label><p className="form-status" role="status">{status}</p></form>
}
