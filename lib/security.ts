import { createHash, randomInt, timingSafeEqual } from 'crypto'

const buckets=new Map<string,{count:number;reset:number}>()
export function limited(key:string,limit=8,windowMs=60_000){const now=Date.now();const bucket=buckets.get(key);if(!bucket||bucket.reset<now){buckets.set(key,{count:1,reset:now+windowMs});return false}bucket.count++;return bucket.count>limit}
export function requestKey(headers:Headers,scope:string){const forwarded=headers.get('x-forwarded-for')?.split(',')[0]||headers.get('x-real-ip')||'local';return `${scope}:${createHash('sha256').update(forwarded).digest('hex').slice(0,16)}`}
export function cleanText(value:unknown,max:number){if(typeof value!=='string')return'';return value.replace(/<[^>]*>/g,'').replace(/[\u0000-\u001f]/g,' ').trim().slice(0,max)}
export function validEmail(value:unknown){return typeof value==='string'&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)&&value.length<=254}
export function anonymousName(){return `K-VERSATION Listener ${String(randomInt(1,1000)).padStart(3,'0')}`}
export function hasDatabase(){return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL&&process.env.SUPABASE_SERVICE_ROLE_KEY)}
export function safeEqual(a:string,b:string){const x=Buffer.from(a);const y=Buffer.from(b);return x.length===y.length&&timingSafeEqual(x,y)}
