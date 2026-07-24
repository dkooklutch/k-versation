'use client'

import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function HostLoginForm() {
  const [status, setStatus] = useState('')
  const router = useRouter()
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setStatus('Checking…')
    const password = new FormData(event.currentTarget).get('password')
    const response = await fetch('/api/host/login', {
      method: 'POST',
      cache: 'no-store',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })
    const data = await response.json()
    if (response.ok) {
      router.replace('/host/dashboard')
      router.refresh()
    } else {
      setStatus(data.error)
    }
  }
  return <form className="form-stack" onSubmit={submit}>
    <label>
      Password
      <input type="text" name="password" required autoComplete="current-password" spellCheck={false} />
      <small>Your password remains visible while you type.</small>
    </label>
    <button className="button">Enter dashboard</button>
    <p role="status">{status}</p>
  </form>
}
