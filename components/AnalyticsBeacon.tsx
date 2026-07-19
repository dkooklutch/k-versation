'use client'
import { useEffect } from 'react'
export default function AnalyticsBeacon({ path }: { path: string }) {
  useEffect(() => { const sessionId=sessionStorage.getItem('kv-analytics-session')||crypto.randomUUID();sessionStorage.setItem('kv-analytics-session',sessionId);navigator.sendBeacon?.('/api/analytics', JSON.stringify({ eventType: 'page_view', path, sessionId })) }, [path])
  return null
}
