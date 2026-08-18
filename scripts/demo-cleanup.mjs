import { createClient } from '@supabase/supabase-js';

const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRole=process.env.SUPABASE_SERVICE_ROLE_KEY;
if(!url||!serviceRole) throw new Error('NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sont requis.');
if(process.env.ALLOW_DEMO_SEED!=='true') throw new Error('Refus sans ALLOW_DEMO_SEED=true.');
const supabase=createClient(url,serviceRole,{auth:{autoRefreshToken:false,persistSession:false}});
const hostEmail=process.env.DEMO_HOST_EMAIL||'demo.hote@escale.local';
const {data:users,error:listError}=await supabase.auth.admin.listUsers({perPage:1000}); if(listError) throw listError;
const host=users.users.find(u=>u.email===hostEmail);
if(!host){ console.log('Aucun compte démo à nettoyer.'); process.exit(0); }
const {data:listings}=await supabase.from('listings').select('id').eq('host_id',host.id).like('title','[DEMO]%');
const ids=(listings||[]).map(x=>x.id);
if(ids.length) await supabase.from('listings').delete().in('id',ids);
await supabase.from('host_expenses').delete().eq('host_id',host.id).eq('notes','ESCALE_DEMO');
await supabase.from('crm_contacts').delete().eq('host_id',host.id).contains('tags',['DEMO']);
for(const email of ['demo.camille@escale.local','demo.thomas@escale.local','demo.julie@escale.local','demo.nora@escale.local']){
 const u=users.users.find(x=>x.email===email); if(u) await supabase.auth.admin.deleteUser(u.id);
}
await supabase.auth.admin.deleteUser(host.id);
console.log('✅ Données de démonstration ESCALE supprimées.');
