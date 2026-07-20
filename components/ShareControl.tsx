'use client'
import{useState}from'react'

export default function ShareControl({title,url,label='Share',compact=false}:{title?:string;url?:string;label?:string;compact?:boolean}){
 const[status,setStatus]=useState('')
 const share=async()=>{const absolute=url?new URL(url,location.origin).href:location.href,payload={title:title||document.title,url:absolute};try{if(navigator.share){await navigator.share(payload);setStatus('Shared');return}await navigator.clipboard.writeText(absolute);setStatus('Link copied')}catch(error){if(error instanceof DOMException&&error.name==='AbortError')return;const input=document.createElement('textarea');input.value=absolute;input.style.position='fixed';input.style.opacity='0';document.body.appendChild(input);input.select();const copied=document.execCommand('copy');input.remove();setStatus(copied?'Link copied':'Copy the address from your browser')};window.setTimeout(()=>setStatus(''),2400)}
 return <span className={compact?'share-control share-control-compact':'share-control'}><button type="button" onClick={share} aria-label={`${label}: ${title||'K-VERSATION'}`}>{label}<i>↗</i></button><small role="status" aria-live="polite">{status}</small></span>
}
