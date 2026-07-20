import'server-only'
import{createAdminClient}from'@/lib/supabase/admin'
import{hasDatabase}from'@/lib/security'
export type SiteSettings={eyebrow:string;intro:string;conversationHeading:string;paperHeading:string;numbersHeading:string;contactEmail:string;instagramUrl:string;footerNote:string}
export const defaultSiteSettings:SiteSettings={eyebrow:'Independent cultural publication · Bay Area / Korea',intro:'K-VERSATION explores Korea through the people shaping, questioning, and living its culture. Conversations and original writing move beyond headlines and inherited assumptions.',conversationHeading:'Listen past\nthe first answer.',paperHeading:'Writing that\nholds its ground.',numbersHeading:'Measured reach.\nHuman scale.',contactEmail:'',instagramUrl:'',footerNote:'Founded by Daniel Koo'}
export async function getSiteSettings(){if(!hasDatabase())return defaultSiteSettings;const{data}=await createAdminClient().from('site_settings').select('value').eq('key','public_site').maybeSingle();return{...defaultSiteSettings,...(data?.value as Partial<SiteSettings>||{})}}
