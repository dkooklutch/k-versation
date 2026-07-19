import { getIronSession } from 'iron-session'
import { cookies } from 'next/headers'
import { sessionOptions, AdminSession } from './session'
import { redirect } from 'next/navigation'

export async function requireAdmin() {
  const cookieStore = await cookies()
  const session = await getIronSession<AdminSession>(cookieStore, sessionOptions)
  if (!session.isAdmin || !session.authenticatedAt || Date.now() - session.authenticatedAt > 8 * 60 * 60 * 1000) redirect('/host/login')
  return session
}
