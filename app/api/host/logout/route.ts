import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getIronSession } from 'iron-session'
import { AdminSession, sessionOptions } from '@/lib/session'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const session = await getIronSession<AdminSession>(await cookies(), sessionOptions)
  session.destroy()
  return NextResponse.redirect(new URL('/host/login?loggedOut=1', request.url), {
    status: 303,
    headers: {
      'Cache-Control': 'private, no-store, max-age=0, must-revalidate',
      Pragma: 'no-cache',
    },
  })
}
