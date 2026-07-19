'use client'
import { usePathname } from 'next/navigation'
import Nav from './Nav'
import Footer from './Footer'
import OpeningSequence from './OpeningSequence'
import AnalyticsBeacon from './AnalyticsBeacon'

export default function SiteWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isHost = pathname.startsWith('/host') || pathname.startsWith('/admin')
  if (isHost) return <>{children}</>
  return <><OpeningSequence /><Nav /><AnalyticsBeacon path={pathname} /><main id="main-content">{children}</main><Footer /></>
}
