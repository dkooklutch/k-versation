import 'server-only'
import { createAdminClient } from '@/lib/supabase/admin'
import { hasDatabase } from '@/lib/security'

export const statisticKeys = ['site_impressions','content_views','conversations','papers','reactions','comments','subscribers','countries'] as const
export type StatisticKey = typeof statisticKeys[number]
export type Statistics = Record<StatisticKey, number>
export type StatisticOverrides = Record<StatisticKey, number | null>
export type StatisticsPayload = { verified: Statistics; adjustments: Statistics; overrides: StatisticOverrides; displayed: Statistics; updatedAt: string }

const empty = (): Statistics => Object.fromEntries(statisticKeys.map(k=>[k,0])) as Statistics

export async function getStatistics(): Promise<StatisticsPayload> {
  const verified=empty(),adjustments=empty()
  const overrides=Object.fromEntries(statisticKeys.map(k=>[k,null])) as StatisticOverrides
  if(!hasDatabase()) return {verified,adjustments,overrides,displayed:empty(),updatedAt:new Date().toISOString()}
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
  for(const row of a||[]){const key=String(row.statistic_key) as StatisticKey;if(!statisticKeys.includes(key))continue;adjustments[key]=Number(row.adjustment||0);if(row.manual_override!==null)overrides[key]=Number(row.manual_override)}
  const displayed=empty()
  for(const key of statisticKeys) displayed[key]=overrides[key]!==null?overrides[key]!:Math.max(0,verified[key]+adjustments[key])
  return {verified,adjustments,overrides,displayed,updatedAt:new Date().toISOString()}
}
