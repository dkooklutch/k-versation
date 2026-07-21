'use client'
import { FormEvent, useEffect, useMemo, useState } from 'react'
import centroids from '@/lib/country-centroids.json'

type Row = { country_code: string; content_views: number; updated_at: string }
const displayNames = new Intl.DisplayNames(['en'], { type: 'region' })
const choices = Object.keys(centroids).map(code => ({ code, name: displayNames.of(code) || code })).sort((a, b) => a.name.localeCompare(b.name))

export default function CountryReachEditor() {
  const [rows, setRows] = useState<Row[]>([]), [country, setCountry] = useState(''), [amount, setAmount] = useState(1), [status, setStatus] = useState('')
  const lookup = useMemo(() => new Map(choices.flatMap(item => [[item.name.toLowerCase(), item.code], [item.code.toLowerCase(), item.code]])), [])
  const load = () => fetch('/api/host/geography', { cache: 'no-store' }).then(r => r.ok ? r.json() : Promise.reject()).then(data => setRows(data.countries || [])).catch(() => setStatus('Host-added country data could not be loaded.'))
  useEffect(() => { void load() }, [])
  async function request(method: 'PATCH' | 'DELETE', body: Record<string, unknown>, query = '') {
    const response = await fetch(`/api/host/geography${query}`, { method, cache: 'no-store', headers: { 'Content-Type': 'application/json' }, ...(method === 'PATCH' ? { body: JSON.stringify(body) } : {}) })
    const data = await response.json(); if (!response.ok) throw new Error(data.error || 'Country data could not be saved.'); return data
  }
  async function add(event: FormEvent) {
    event.preventDefault(); const code = lookup.get(country.trim().toLowerCase())
    if (!code) { setStatus('Choose a country from the list.'); return }
    setStatus(`Adding ${amount} ${amount === 1 ? 'listen' : 'listens'} from ${displayNames.of(code)}…`)
    try { await request('PATCH', { countryCode: code, delta: amount }); setCountry(''); setAmount(1); await load(); setStatus(`${displayNames.of(code)} now appears in public country reach.`); dispatchEvent(new CustomEvent('kv:stats-changed')) } catch (error) { setStatus(error instanceof Error ? error.message : 'Country data could not be saved.') }
  }
  async function save(code: string, contentViews: number) {
    setStatus(`Saving ${displayNames.of(code)}…`); try { await request('PATCH', { countryCode: code, contentViews }); await load(); setStatus(`${displayNames.of(code)} updated publicly.`); dispatchEvent(new CustomEvent('kv:stats-changed')) } catch (error) { setStatus(error instanceof Error ? error.message : 'Country data could not be saved.') }
  }
  async function remove(code: string) {
    if (!confirm(`Remove all host-added listens from ${displayNames.of(code)}?`)) return
    setStatus(`Removing ${displayNames.of(code)}…`); try { await request('DELETE', {}, `?countryCode=${encodeURIComponent(code)}`); await load(); setStatus(`${displayNames.of(code)} removed from host-added reach.`); dispatchEvent(new CustomEvent('kv:stats-changed')) } catch (error) { setStatus(error instanceof Error ? error.message : 'Country data could not be removed.') }
  }
  return <section className="country-editor"><header><div><small>Public geography</small><h2>Add listener locations</h2><p>Type a country such as South Korea, then add the number of known listens. These entries join automatically detected locations on the globe and remain labeled as host-added data here.</p></div><strong>{rows.length}</strong></header><form onSubmit={add} className="country-add"><label>Country<input list="country-options" value={country} onChange={event => setCountry(event.target.value)} placeholder="South Korea" required/><datalist id="country-options">{choices.map(item => <option value={item.name} key={item.code}>{item.code}</option>)}</datalist></label><label>Listens to add<input type="number" min="1" step="1" value={amount} onChange={event => setAmount(Number(event.target.value))} required/></label><button className="button">Add to public map</button></form>{rows.length ? <div className="country-editor-list">{rows.map(row => <CountryRow key={`${row.country_code}-${row.content_views}`} row={row} save={save} remove={remove}/>)}</div> : <p className="host-help">No locations have been added manually yet.</p>}<p className="host-save-status" role="status" aria-live="polite">{status}</p></section>
}

function CountryRow({ row, save, remove }: { row: Row; save: (code: string, value: number) => void; remove: (code: string) => void }) {
  const [value, setValue] = useState(row.content_views)
  return <div><span><b>{displayNames.of(row.country_code)}</b><small>{row.country_code} · Host-added listens</small></span><input aria-label={`Host-added listens from ${displayNames.of(row.country_code)}`} type="number" min="0" step="1" value={value} onChange={event => setValue(Number(event.target.value))}/><button className="button secondary" onClick={() => save(row.country_code, value)}>Save</button><button className="country-remove" onClick={() => remove(row.country_code)}>Remove</button></div>
}
