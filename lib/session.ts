import { createHash } from 'crypto'
import type { SessionOptions } from 'iron-session'
export interface AdminSession { isAdmin:boolean; authenticatedAt?:number }
const deterministicFallback=createHash('sha256').update(process.env.HOST_PASSWORD_HASH||'kversation-development-session-only').digest('hex')
export function authSecretsConfigured(){return Boolean(process.env.HOST_PASSWORD_HASH&&process.env.SESSION_SECRET)}
export const sessionOptions:SessionOptions={password:process.env.SESSION_SECRET||deterministicFallback,cookieName:'kv_host_session',ttl:60*60*8,cookieOptions:{secure:process.env.NODE_ENV==='production',httpOnly:true,sameSite:'strict',path:'/'}}
