import { randomBytes } from 'crypto'
import type { SessionOptions } from 'iron-session'
export interface AdminSession { isAdmin:boolean; authenticatedAt?:number }
const developmentSecret=randomBytes(32).toString('hex')
export const sessionOptions:SessionOptions={password:process.env.SESSION_SECRET||developmentSecret,cookieName:'kv_host_session',ttl:60*60*8,cookieOptions:{secure:process.env.NODE_ENV==='production',httpOnly:true,sameSite:'strict',path:'/'}}
