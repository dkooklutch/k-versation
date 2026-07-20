'use client'
import Link from 'next/link'
import { BrandMark } from './BrandMark'
import { useEffect,useState } from 'react'
export default function Footer() {
  const[settings,setSettings]=useState({footerNote:'Founded by Daniel Koo',contactEmail:'thekversation@gmail.com',instagramUrl:''})
  useEffect(()=>{fetch('/api/site-settings',{cache:'no-store'}).then(r=>r.ok?r.json():Promise.reject()).then(setSettings).catch(()=>{})},[])
  return <footer className="site-footer">
    <div className="footer-callout"><p>Keep the question open.</p><Link href="/join">Be part of the conversation <span>↗</span></Link></div>
    <div className="footer-wordmark" aria-hidden="true"><BrandMark href="" /></div>
    <div className="footer-grid">
      <div><small>Platform</small><p>{settings.footerNote}<br />Bay Area, California</p></div>
      <div><small>Navigate</small><Link href="/conversations">Conversations</Link><Link href="/papers">Papers</Link><Link href="/about">About</Link><Link href="/questions">Questions</Link></div>
      <div><small>Contact</small><a href={`mailto:${settings.contactEmail}`}>{settings.contactEmail}</a>{settings.instagramUrl&&<a href={settings.instagramUrl} rel="noreferrer" target="_blank">Instagram</a>}<Link href="/privacy">Privacy</Link><Link href="/host/login">Host login</Link></div>
      <div><small>Issue</small><p>Independent cultural publication<br />Conversations / Papers</p></div>
    </div>
    <div className="footer-bottom"><span>© {new Date().getFullYear()} K-VERSATION</span><a href="#main-content">Back to top ↑</a></div>
  </footer>
}
