import type { Metadata, Viewport } from 'next'
import localFont from 'next/font/local'
import './globals.css'
import SiteWrapper from '@/components/SiteWrapper'

const display = localFont({ src: './fonts/syne-variable.ttf', variable: '--font-display', display: 'swap', weight: '400 800' })
const editorial = localFont({ src: [{ path: './fonts/cormorant-regular.ttf', weight: '400' }, { path: './fonts/cormorant-semibold.ttf', weight: '600' }], variable: '--font-editorial', display: 'swap' })
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: 'K-VERSATION — Korea, through people', template: '%s | K-VERSATION' },
  description: 'Conversations and original writing that explore Korea through the people shaping, questioning, and living its culture.',
  alternates: { canonical: '/' },
  openGraph: { type: 'website', siteName: 'K-VERSATION', title: 'K-VERSATION — Korea, through people', description: 'Conversations and original writing beyond headlines and inherited assumptions.', images: ['/editorial/bridge.jpg'] },
  twitter: { card: 'summary_large_image' },
  icons: { icon: '/brand/bridge-symbol.svg', shortcut: '/brand/bridge-symbol.svg', apple: '/brand/bridge-symbol.svg' },
  robots: { index: true, follow: true }
}

export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#151814' }

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en" className={`${display.variable} ${editorial.variable}`}><body><SiteWrapper>{children}</SiteWrapper></body></html>
}
