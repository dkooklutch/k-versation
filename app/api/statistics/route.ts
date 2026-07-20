import { NextResponse } from 'next/server'
import { getStatistics } from '@/lib/statistics'
import { hasDatabase } from '@/lib/security'
export const dynamic='force-dynamic'
export const revalidate=0
export async function GET(){if(!hasDatabase())return NextResponse.json({error:'Statistics database is not configured.'},{status:503,headers:{'Cache-Control':'no-store'}});try{return NextResponse.json(await getStatistics(),{headers:{'Cache-Control':'no-store, max-age=0'}})}catch(error){console.error('statistics query failed',error);return NextResponse.json({error:'Statistics are temporarily unavailable.'},{status:503,headers:{'Cache-Control':'no-store'}})}}
