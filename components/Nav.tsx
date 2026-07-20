'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { BrandMark } from './BrandMark'

const links = [['Conversations','/conversations'], ['Papers','/papers'], ['About','/about'], ['Questions','/questions'], ['Join','/join']]

export default function Nav() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  useEffect(() => { document.body.style.overflow = open ? 'hidden' : ''; return () => { document.body.style.overflow = '' } }, [open])
  return <header className="site-header">
    <a className="skip-link" href="#main-content">Skip to content</a>
    <span className="nav-edition">Seoul ↔ California</span>
    <span className="nav-centered-logo" onClick={e => { if (pathname === '/') { e.preventDefault(); scrollTo({ top: 0, behavior: 'smooth' }) } }}><span className="nav-logo-full"><BrandMark /></span><span className="nav-logo-compact"><BrandMark compact /></span></span>
    <nav className="nav-desktop" aria-label="Primary">
      {links.slice(0,3).map(([label, href], i) => <Link key={href} href={href} onClick={()=>setOpen(false)} aria-current={pathname.startsWith(href) ? 'page' : undefined}><small>0{i + 1}</small>{label}</Link>)}
    </nav>
    <button className="menu-trigger" aria-expanded={open} aria-controls="mobile-menu" onClick={() => setOpen(v => !v)}><span>{open ? 'Close' : 'Menu'}</span><i /></button>
    <div id="mobile-menu" className={`mobile-menu ${open ? 'is-open' : ''}`} aria-hidden={!open}>
      <nav aria-label="Mobile primary">{links.map(([label, href], i) => <Link key={href} href={href} onClick={()=>setOpen(false)}><small>0{i + 1}</small>{label}<span>↗</span></Link>)}</nav>
      <p>Korea, through people.<br /><a href="mailto:thekversation@gmail.com">thekversation@gmail.com</a></p>
    </div>
  </header>
}
