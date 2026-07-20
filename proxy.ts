import { NextRequest,NextResponse } from 'next/server'
import { unsealData } from 'iron-session'
import type { AdminSession } from '@/lib/session'

export async function proxy(request:NextRequest){
 const login=new URL('/host/login',request.url)
 const noStore={'Cache-Control':'private, no-store, max-age=0, must-revalidate','Pragma':'no-cache'}
 const sealed=request.cookies.get('kv_host_session')?.value
 const password=process.env.SESSION_SECRET
 if(!sealed||!password)return NextResponse.redirect(login,{headers:noStore})
 try{const session=await unsealData<AdminSession>(sealed,{password});if(!session.isAdmin||!session.authenticatedAt||Date.now()-session.authenticatedAt>8*60*60*1000)return NextResponse.redirect(login,{headers:noStore});return NextResponse.next({headers:noStore})}catch{return NextResponse.redirect(login,{headers:noStore})}
}
export const config={matcher:['/host/dashboard/:path*']}
