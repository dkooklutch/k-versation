import 'server-only'
import { createAdminClient } from '@/lib/supabase/admin'
import { hasDatabase } from '@/lib/security'

export const statisticKeys = ['site_impressions','content_views','conversations','papers','reactions','comments','subscribers','countries'] as const
export type StatisticKey = typeof statisticKeys[number]
export type Statistics = Record<StatisticKey, number>
export type StatisticsPayload = { verified: Statistics; adjustments: Statistics; displayed: Statistics; updatedAt: string }

const empty = (): Statistics => Object.fromEntries(statisticKeys.map(k=>[k,0])) as Statistics

export async function getStatistics(): Promise<StatisticsPayload> {
  const verified=empty(),adjustments=empty()
  if(!hasDatabase()) return {verified,adjustments,displayed:empty(),updatedAt:new Date().toISOString()}
  const db=createAdminClient()
  const [{data:v,error:vError},{data:a,error:aError}]=await Promise.all([
    db.from('verified_statistics').select('*').single(),
    db.from('statistic_adjustments').select('statistic_key,adjustment,manual_override')
  ])
  if(vError) throw vError
  if(aError) throw aError
  const source=v as Record<string,unknown>
  verified.site_impressions=Number(source.site_impressions||0)
  verified.content_views=Number(source.content_opens||0)
  for(const key of ['conversations','papers','reactions','comments','subscribers','countries'] as StatisticKey[]) verified[key]=Number(source[key]||0)
  const overrides=new Map<string,number>()
  for(const row of a||[]){const key=String(row.statistic_key) as StatisticKey;if(!statisticKeys.includes(key))continue;adjustments[key]=Number(row.adjustment||0);if(row.manual_override!==null)overrides.set(key,Number(row.manual_override))}
  const displayed=empty()
  for(const key of statisticKeys) displayed[key]=overrides.has(key)?overrides.get(key)!:Math.max(0,verified[key]+adjustments[key])
  return {verified,adjustments,displayed,updatedAt:new Date().toISOString()}
}
