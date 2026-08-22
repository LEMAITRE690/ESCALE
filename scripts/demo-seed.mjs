import { createClient } from '@supabase/supabase-js';
import { readFile } from 'node:fs/promises';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
const password = process.env.DEMO_PASSWORD;
if (!url || !serviceRole || !password) {
  throw new Error('NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY et DEMO_PASSWORD sont requis.');
}
if (process.env.ALLOW_DEMO_SEED !== 'true') {
  throw new Error('Refus de charger les données de démo sans ALLOW_DEMO_SEED=true.');
}

const demoListings = JSON.parse(await readFile(new URL('../lib/demo/listings.json', import.meta.url), 'utf8'));
const supabase = createClient(url, serviceRole, { auth: { autoRefreshToken: false, persistSession: false } });
const HOST_EMAIL = process.env.DEMO_HOST_EMAIL || 'demo.hote@escale.local';
const GUESTS = [
  ['demo.camille@escale.local','Camille Martin'],
  ['demo.thomas@escale.local','Thomas Renard'],
  ['demo.julie@escale.local','Julie Bernard'],
  ['demo.nora@escale.local','Nora Petit'],
];

function iso(deltaDays) {
  const d = new Date(); d.setHours(12,0,0,0); d.setDate(d.getDate()+deltaDays); return d.toISOString().slice(0,10);
}
async function ensureUser(email, fullName, role='voyageur') {
  const { data: listed, error: listError } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  if (listError) throw listError;
  let user = listed.users.find(u => u.email === email);
  if (!user) {
    const { data, error } = await supabase.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { full_name: fullName, role } });
    if (error) throw error; user = data.user;
  }
  await supabase.from('profiles').update({ full_name: fullName, role }).eq('id', user.id);
  return user;
}

const host = await ensureUser(HOST_EMAIL, 'Alexandre Démo', 'hote');
const guests = [];
for (const [email,name] of GUESTS) guests.push(await ensureUser(email,name));

const { data: oldListings } = await supabase.from('listings').select('id').eq('host_id',host.id).like('title','[DEMO]%');
const oldIds=(oldListings||[]).map(x=>x.id);
if (oldIds.length) await supabase.from('listings').delete().in('id',oldIds);
await supabase.from('host_expenses').delete().eq('host_id',host.id).eq('notes','ESCALE_DEMO');
await supabase.from('crm_contacts').delete().eq('host_id',host.id).contains('tags',['DEMO']);

const {data:listings,error:listErr}=await supabase.from('listings').insert(
  demoListings.map((listing)=>({ ...listing, host_id:host.id }))
).select();
if(listErr) throw listErr;

const villa=listings.find((l)=>l.title==='[DEMO] Villa des Embruns');
const loft=listings.find((l)=>l.title==='[DEMO] Loft Vieux-Port');
const studio=listings.find((l)=>l.title==='[DEMO] Appartement Bellecour');

const reservations=[
 {listing_id:villa.id,guest_id:guests[0].id,guest_first_name:'Camille',start_date:iso(-120),end_date:iso(-113),guests:4,amount_total:196000,status:'terminee'},
 {listing_id:villa.id,guest_id:guests[0].id,guest_first_name:'Camille',start_date:iso(-35),end_date:iso(-29),guests:4,amount_total:168000,status:'terminee'},
 {listing_id:villa.id,guest_id:guests[0].id,guest_first_name:'Camille',start_date:iso(18),end_date:iso(25),guests:4,amount_total:201500,status:'confirmee'},
 {listing_id:loft.id,guest_id:guests[1].id,guest_first_name:'Thomas',start_date:iso(-72),end_date:iso(-68),guests:2,amount_total:76500,status:'terminee'},
 {listing_id:loft.id,guest_id:guests[1].id,guest_first_name:'Thomas',start_date:iso(4),end_date:iso(8),guests:2,amount_total:79000,status:'confirmee'},
 {listing_id:studio.id,guest_id:guests[2].id,guest_first_name:'Julie',start_date:iso(1),end_date:iso(5),guests:1,amount_total:52500,status:'confirmee'},
 {listing_id:studio.id,guest_id:guests[3].id,guest_first_name:'Nora',start_date:iso(12),end_date:iso(15),guests:2,amount_total:40500,status:'en_attente'},
];
const {data:resas,error:resaErr}=await supabase.from('reservations').insert(reservations).select();
if(resaErr) throw resaErr;

const paymentRows = resas.filter(r=>r.status!=='en_attente').map((r,i)=>{
  const rate=i%2===0?0.05:0.08; const fee=Math.round(r.amount_total*rate); const tax=Math.round(r.amount_total*0.025); const hostNet=r.amount_total-fee-tax;
  return {reservation_id:r.id,host_id:host.id,stripe_payment_intent_id:`pi_demo_${r.id}`,provider_payment_id:`demo_${r.id}`,payment_provider:i%2===0?'lemonway':'stripe',payment_channel:i%2===0?'pay_by_bank':'card',amount_total:r.amount_total,platform_fee:fee,amount_host:hostNet,tourist_tax_held:tax,status:'succeeded',transferred_at:r.status==='terminee'?new Date().toISOString():null};
});
const {error:payErr}=await supabase.from('payments').insert(paymentRows); if(payErr) throw payErr;

await supabase.from('host_expenses').insert([
 {host_id:host.id,listing_id:villa.id,category:'Ménage',label:'Prestataire ménage',amount_cents:42000,expense_date:iso(-5),recurring:true,recurrence:'mensuel',notes:'ESCALE_DEMO'},
 {host_id:host.id,listing_id:loft.id,category:'Énergie',label:'Électricité',amount_cents:18500,expense_date:iso(-8),recurring:true,recurrence:'mensuel',notes:'ESCALE_DEMO'},
 {host_id:host.id,listing_id:studio.id,category:'Assurance',label:'Assurance location',amount_cents:9600,expense_date:iso(-11),recurring:true,recurrence:'mensuel',notes:'ESCALE_DEMO'},
]);

await supabase.rpc('crm_refresh_host_contacts',{p_host_id:host.id});
await supabase.from('crm_contacts').update({tags:['DEMO','VIP','Famille'],private_notes:'Cliente fidèle. Préfère les arrivées après 17h.',marketing_consent:true}).eq('host_id',host.id).eq('guest_id',guests[0].id);
await supabase.from('crm_contacts').update({tags:['DEMO','Fidèle'],private_notes:'Voyage régulièrement pour le travail.',marketing_consent:true}).eq('host_id',host.id).eq('guest_id',guests[1].id);
await supabase.from('crm_contacts').update({tags:['DEMO','Nouveau client']}).eq('host_id',host.id).eq('guest_id',guests[2].id);
await supabase.from('crm_contacts').update({tags:['DEMO','Prospect']}).eq('host_id',host.id).eq('guest_id',guests[3].id);

const docs = resas.slice(0,4).map((r,i)=>({reservation_id:r.id,host_id:host.id,document_type:i%2?'facture':'contrat',title:`${i%2?'Facture':'Contrat'} démo ${r.guest_first_name}`,status:'disponible'}));
await supabase.from('reservation_documents').insert(docs);

console.log('\n✅ Démo ESCALE créée');
console.log(`Hôte : ${HOST_EMAIL}`);
console.log('Mot de passe : valeur de DEMO_PASSWORD');
console.log(`${listings.length} logements, ${resas.length} réservations, ${paymentRows.length} paiements et ${GUESTS.length} voyageurs.`);
console.log('Ouvrir /recherche pour tester la carte puis /hote/crm après connexion.\n');
