import Link from'next/link'
import{getStatistics}from'@/lib/statistics'
import ByNumbersEditor from'@/components/ByNumbersEditor'
import{hasDatabase}from'@/lib/security'
import{createAdminClient}from'@/lib/supabase/admin'
export const dynamic='force-dynamic'
export default async function NumbersPage(){const stats=await getStatistics();let history:Record<string,unknown>[]=[];if(hasDatabase()){const{data}=await createAdminClient().from('audit_logs').select('entity_id,new_value,created_at').eq('action','statistics.update').order('created_at',{ascending:false}).limit(12);history=data||[]}return <><header className="host-head"><div><small>Homepage / Statistics</small><h1>Edit By the Numbers</h1><p>Verified activity stays untouched. Add an adjustment, or temporarily display an exact custom number.</p></div><Link className="button secondary" href="/" target="_blank">Preview public homepage ↗</Link></header><ByNumbersEditor initial={stats}/><section className="host-history"><h2>Recent changes</h2>{history.length?history.map((entry,index)=><p key={`${entry.created_at}-${index}`}><strong>{String(entry.entity_id).replaceAll('_',' ')}</strong><span>{new Date(String(entry.created_at)).toLocaleString()}</span></p>):<p>No manual changes have been made yet.</p>}</section></>}
