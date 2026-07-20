import Link from 'next/link'
import { BrandMark } from './BrandMark'
export default function Footer() {
  return <footer className="site-footer">
    <div className="footer-callout"><p>Keep the question open.</p><Link href="/join">Be part of the conversation <span>↗</span></Link></div>
    <div className="footer-wordmark" aria-hidden="true"><BrandMark href="" /></div>
    <div className="footer-grid">
      <div><small>Platform</small><p>Created by Daniel Koo<br />Bay Area, California</p></div>
      <div><small>Navigate</small><Link href="/conversations">Conversations</Link><Link href="/papers">Papers</Link><Link href="/about">About</Link><Link href="/questions">Questions</Link></div>
      <div><small>Contact</small><a href="mailto:thekversation@gmail.com">thekversation@gmail.com</a><Link href="/privacy">Privacy</Link><Link href="/host/login">Host login</Link></div>
      <div><small>Issue</small><p>Independent cultural publication<br />Conversations / Papers</p></div>
    </div>
    <div className="footer-bottom"><span>© {new Date().getFullYear()} K-VERSATION</span><a href="#main-content">Back to top ↑</a></div>
  </footer>
}
