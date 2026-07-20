'use client'
import Image from'next/image'
import{useCallback,useEffect,useRef,useState,type CSSProperties}from'react'
import{useSculptureRotation}from'@/hooks/useSculptureRotation'

export const OPENING_TIMING={durationMs:4400,reducedDurationMs:1200,exitMs:720,rotationSeconds:15}as const
const koreaPath='M135.2,25 L188.2,102.2 L185.8,153.5 L196.1,154.7 L189.5,179.8 L184.8,187.7 L166.9,203 L151.9,200.5 L147,194.7 L149.5,202.3 L135.6,204.6 L138.7,213.1 L119.8,208.7 L111.7,208 L95.9,209.6 L105.9,212.8 L99.2,224.3 L93.3,210.8 L85.5,214.1 L92.4,225.7 L84.7,225.9 L89.2,228.2 L84.4,232.9 L73.5,228.2 L85.1,220.3 L79.7,216.9 L62.2,234.3 L56.3,225.9 L43.5,240.4 L40.8,231.6 L44.4,227.1 L32.3,225.8 L32,217.8 L40.7,226 L36.4,219.7 L48.6,223.7 L35.7,217.8 L50.7,214.9 L43.1,216.2 L36.2,215.7 L39.3,206.2 L33.3,208.4 L36.2,204.5 L30.2,199.2 L34.6,197.5 L38.7,204.3 L32.9,193.7 L42.1,179.2 L52,178.7 L40.8,173.5 L50.5,165.9 L56.5,167.5 L52.6,163.1 L59.2,160.9 L43.5,157 L60.9,152.5 L42.1,149.1 L47.6,147 L42.4,134.7 L48.3,132 L42.3,133.3 L41.4,118.4 L38.7,125.4 L34.6,118.7 L32.3,126.6 L31.2,119.8 L23.9,117.7 L32.9,107.5 L31.6,115.6 L35.3,116.3 L38.4,109.7 L35.1,105.8 L39.7,105.6 L41.6,113.7 L43.4,108.4 L46.6,110.9 L42.5,103.1 L49,110.2 L51.5,106.1 L57.2,108 L59.9,118.1 L60.4,112.3 L69.4,106.1 L58.6,105.7 L62.9,105.1 L55.1,103.4 L60.6,96.9 L51.7,99.3 L50.3,93.2 L60.9,92.5 L48.2,86.9 L44.2,67.6 L55.1,74.1 L50.7,59.2 L71.8,41.8 L119.1,40.9 Z M64.6,281 L59.4,289.4 L47.8,292.9 L31,295 L25.6,289.9 L41.7,278.9 L57,276.8 Z'
const frames=[
 {src:'/history/01-joseon-family.jpg',year:'c. 1890',caption:'A Korean family · late Joseon'},
 {src:'/history/02-namdaemun-1905.jpg',year:'1905',caption:'Namdaemun · Korean Empire'},
 {src:'/history/03-seoul-1950.jpg',year:'1950',caption:'A Seoul street · reconstruction'},
 {src:'/history/04-seoul-present.jpg',year:'Now',caption:'Seoul · a living archive'}
]

export default function OpeningSequence(){
 const[visible,setVisible]=useState(false),[reduced,setReduced]=useState(false),[progress,setProgress]=useState(1),[entering,setEntering]=useState(false),screenRef=useRef<HTMLDivElement>(null),{elementRef,handlers}=useSculptureRotation({autoDegreesPerSecond:360/OPENING_TIMING.rotationSeconds,reducedMotion:reduced})
 const finish=useCallback(()=>{if(entering)return;setEntering(true);setProgress(100);try{sessionStorage.setItem('kv-intro-seen','1')}catch{}window.setTimeout(()=>setVisible(false),reduced?250:OPENING_TIMING.exitMs)},[entering,reduced])
 useEffect(()=>{let isReduced=false;try{isReduced=matchMedia('(prefers-reduced-motion: reduce)').matches;if(sessionStorage.getItem('kv-intro-seen'))return}catch{isReduced=true}const frame=requestAnimationFrame(()=>{setReduced(isReduced);setVisible(true)});return()=>cancelAnimationFrame(frame)},[])
 useEffect(()=>{if(!visible||entering)return;const duration=reduced?OPENING_TIMING.reducedDurationMs:OPENING_TIMING.durationMs,start=performance.now();let frame=0;const tick=(now:number)=>{const next=Math.min(100,Math.max(1,Math.round((now-start)/duration*100)));setProgress(next);if(next>=100){finish();return}frame=requestAnimationFrame(tick)};frame=requestAnimationFrame(tick);return()=>cancelAnimationFrame(frame)},[visible,reduced,entering,finish])
 useEffect(()=>{if(!visible)return;const frame=requestAnimationFrame(()=>screenRef.current?.focus());return()=>cancelAnimationFrame(frame)},[visible])
 if(!visible)return null
 const active=Math.min(frames.length-1,Math.floor((progress-1)/(100/frames.length)))
 return <div ref={screenRef} className={`opening opening-archive ${reduced?'is-reduced':''} ${entering?'is-entering':''}`} role="status" aria-label={`K-VERSATION opening archive, ${progress} percent loaded`} tabIndex={0} onKeyDown={event=>{if(event.key==='Enter'||event.key===' '||event.key==='Escape'){event.preventDefault();finish()}}}>
  <div className="opening-history" aria-hidden="true">{frames.map((item,index)=><figure key={item.src} className={index===active?'is-active':''}><Image src={item.src} alt="" fill sizes="(max-width: 700px) 84vw, 43vw" priority/><figcaption><b>{item.year}</b><span>{item.caption}</span></figcaption></figure>)}</div>
  <span className="opening-count">K-V / ARCHIVE 001—004</span>
  <button className="opening-skip" onClick={finish}>Skip <span>↗</span></button>
  <div className="korea-stage interactive-sculpture" {...handlers} aria-hidden="true"><div ref={elementRef} className="korea-object">{Array.from({length:10},(_,i)=><svg key={i} className="korea-layer" style={{'--depth':`${i*2-9}px`}as CSSProperties} viewBox="0 0 220 320"><path d={koreaPath}/></svg>)}</div></div>
  <div className="opening-progress" role="progressbar" aria-valuemin={1} aria-valuemax={100} aria-valuenow={progress}><span style={{'--progress':`${progress}%`}as CSSProperties}/><strong>{String(progress).padStart(3,'0')}%</strong><small>Loading the conversation</small></div>
  <p>K<span>—</span>VERSATION <small>Seoul ↔ California</small></p>
 </div>
}
