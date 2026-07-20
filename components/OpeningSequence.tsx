'use client'
import{useEffect,useRef,useState,type CSSProperties}from'react'
import{useSculptureRotation}from'@/hooks/useSculptureRotation'
export const OPENING_TIMING={promptDelayMs:1300,exitMs:800,rotationSeconds:15}as const
const koreaPath='M135.2,25 L188.2,102.2 L185.8,153.5 L196.1,154.7 L189.5,179.8 L184.8,187.7 L166.9,203 L151.9,200.5 L147,194.7 L149.5,202.3 L135.6,204.6 L138.7,213.1 L119.8,208.7 L111.7,208 L95.9,209.6 L105.9,212.8 L99.2,224.3 L93.3,210.8 L85.5,214.1 L92.4,225.7 L84.7,225.9 L89.2,228.2 L84.4,232.9 L73.5,228.2 L85.1,220.3 L79.7,216.9 L62.2,234.3 L56.3,225.9 L43.5,240.4 L40.8,231.6 L44.4,227.1 L32.3,225.8 L32,217.8 L40.7,226 L36.4,219.7 L48.6,223.7 L35.7,217.8 L50.7,214.9 L43.1,216.2 L36.2,215.7 L39.3,206.2 L33.3,208.4 L36.2,204.5 L30.2,199.2 L34.6,197.5 L38.7,204.3 L32.9,193.7 L42.1,179.2 L52,178.7 L40.8,173.5 L50.5,165.9 L56.5,167.5 L52.6,163.1 L59.2,160.9 L43.5,157 L60.9,152.5 L42.1,149.1 L47.6,147 L42.4,134.7 L48.3,132 L42.3,133.3 L41.4,118.4 L38.7,125.4 L34.6,118.7 L32.3,126.6 L31.2,119.8 L23.9,117.7 L32.9,107.5 L31.6,115.6 L35.3,116.3 L38.4,109.7 L35.1,105.8 L39.7,105.6 L41.6,113.7 L43.4,108.4 L46.6,110.9 L42.5,103.1 L49,110.2 L51.5,106.1 L57.2,108 L59.9,118.1 L60.4,112.3 L69.4,106.1 L58.6,105.7 L62.9,105.1 L55.1,103.4 L60.6,96.9 L51.7,99.3 L50.3,93.2 L60.9,92.5 L48.2,86.9 L44.2,67.6 L55.1,74.1 L50.7,59.2 L71.8,41.8 L119.1,40.9 Z M64.6,281 L59.4,289.4 L47.8,292.9 L31,295 L25.6,289.9 L41.7,278.9 L57,276.8 Z'
export default function OpeningSequence(){
 const[visible,setVisible]=useState(false),[reduced,setReduced]=useState(false),[prompt,setPrompt]=useState(false),[entering,setEntering]=useState(false),screenRef=useRef<HTMLDivElement>(null),{elementRef,handlers,consumeDrag}=useSculptureRotation({autoDegreesPerSecond:360/OPENING_TIMING.rotationSeconds,reducedMotion:reduced})
 useEffect(()=>{let isReduced=false;try{isReduced=matchMedia('(prefers-reduced-motion: reduce)').matches;if(sessionStorage.getItem('kv-intro-seen'))return}catch{isReduced=true}const frame=requestAnimationFrame(()=>{setReduced(isReduced);setVisible(true)});const promptTimer=window.setTimeout(()=>setPrompt(true),isReduced?250:OPENING_TIMING.promptDelayMs);return()=>{cancelAnimationFrame(frame);clearTimeout(promptTimer)}},[])
 useEffect(()=>{if(!visible)return;const frame=requestAnimationFrame(()=>screenRef.current?.focus());return()=>cancelAnimationFrame(frame)},[visible])
 if(!visible)return null
 const enter=()=>{if(entering||consumeDrag())return;setEntering(true);try{sessionStorage.setItem('kv-intro-seen','1')}catch{}window.setTimeout(()=>setVisible(false),reduced?350:OPENING_TIMING.exitMs)}
 return <div ref={screenRef} className={`opening opening-interactive ${reduced?'is-reduced':''} ${entering?'is-entering':''}`} role="dialog" aria-modal="true" aria-label="K-VERSATION opening. Click, tap, or press Enter to start." tabIndex={0} onClick={enter} onKeyDown={event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();enter()}}}>
  <span className="opening-count">K-V / 001</span>
  <div className="korea-stage interactive-sculpture" {...handlers} aria-hidden="true"><div ref={elementRef} className="korea-object">{Array.from({length:10},(_,i)=><svg key={i} className="korea-layer" style={{'--depth':`${i*2-9}px`}as CSSProperties} viewBox="0 0 220 320"><path d={koreaPath}/></svg>)}</div></div>
  <div className={`opening-start ${prompt?'is-ready':''}`} aria-hidden={!prompt}><i/><span>Click to Start</span></div>
  <p>K<span>—</span>VERSATION <small>Seoul ↔ California</small></p>
 </div>
}
