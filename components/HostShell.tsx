'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const links = [
  ['Dashboard', '/host/dashboard'],
  ['Content', '/host/dashboard/content'],
  ['Comments', '/host/dashboard/comments'],
  ['Questions', '/host/dashboard/questions'],
  ['Members', '/host/dashboard/members'],
  ['Analytics', '/host/dashboard/analytics'],
  ['Numbers', '/host/dashboard/numbers'],
  ['Settings', '/host/dashboard/settings'],
]

export default function HostShell({ children }: { children: React.ReactNode }) {
  const path = usePathname()
  return <div className="host-shell">
    <aside>
      <Link className="nav-mark" href="/">K<span>—</span>V</Link>
      <nav>
        {links.map(([label, href]) => <Link
          key={href}
          href={href}
          aria-current={path === href.split('?')[0] ? 'page' : undefined}
        >{label}</Link>)}
      </nav>
      <form action="/api/host/logout" method="post">
        <button type="submit">Log Out</button>
      </form>
    </aside>
    <main>{children}</main>
  </div>
}
