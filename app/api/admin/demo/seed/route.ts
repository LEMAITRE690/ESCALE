import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import demoListings from "@/lib/demo/listings.json";

const HOST_EMAIL="demo.hote@escale.local";
const GUESTS=[['demo.camille@escale.local','Camille Martin'],['demo.thomas@escale.local','Thomas Renard'],['demo.julie@escale.local','Julie Bernard'],['demo.nora@escale.local','Nora Petit']] as const;
const iso=(n:number)=>{const d=new Date();d.setHours(12,0,0,0);d.setDate(d.getDate()+n);return d.toISOString().slice(0,10)};

type DemoUser={id:string;email?:string|null};
async function ensureUser(email:string,fullName:string,role='voyageur',password?:string):Promise<DemoUser>{
 const {data,error}=await supabaseAdmin.auth.admin.listUsers({perPage:1000}); if(error) throw error;
 const users=(data?.users??[]) as DemoUser[];
 let user:DemoUser|undefined=users.find((u:DemoUser)=>u.email===email);
 if(!user){const made=await supabaseAdmin.auth.admin.createUser({email,password:password||crypto.randomUUID()+"Aa1!",email_confirm:true,user_metadata:{full_name:fullName,role}});if(made.error)throw made.error;user=made.data.user as DemoUser;}
 await supabaseAdmin.from('profiles').update({full_name:fullName,role}).eq('id',user.id); return user;
}

export async function POST(){
 try{
  const session=createClient(); const {data:{user}}=await session.auth.getUser();
  const adminEmail=process.env.DEMO_ADMIN_EMAIL?.toLowerCase();
  if(!user?.email||!adminEmail||user.email.toLowerCase()!==adminEmail) return NextResponse.json({error:"Accès administrateur requis."},{status:403});
  const password=process.env.DEMO_PASSWORD; if(!password) return NextResponse.json({error:"DEMO_PASSWORD n'est pas configuré côté serveur."},{status:503});
  const host=await ensureUser(HOST_EMAIL,'Alexandre Démo','hote',password); const guests:DemoUser[]=[];
  for(const [e,n] of GUESTS) guests.push(await ensureUser(e,n));
  const {data:old}=await supabaseAdmin.from('listings').select('id').eq('host_id',host.id).like('title','[DEMO]%'); const oldIds=(old||[]).map(x=>x.id);
  if(oldIds.length) await supabaseAdmin.from('listings').delete().in('id',oldIds);
  await supabaseAdmin.from('host_expenses').delete().eq('host_id',host.id).eq('notes','ESCALE_DEMO');
  await supabaseAdmin.from('crm_contacts').delete().eq('host_id',host.id).contains('tags',['DEMO']);

  const {data:listings,error:le}=await supabaseAdmin.from('listings').insert(
    demoListings.map((listing)=>({ ...listing, host_id:host.id }))
  ).select();
  if(le)throw le;

  const villa=listings!.find((l)=>l.title==='[DEMO] Villa des Embruns')!;
  const loft=listings!.find((l)=>l.title==='[DEMO] Loft Vieux-Port')!;
  const studio=listings!.find((l)=>l.title==='[DEMO] Appartement Bellecour')!;

  const {data:resas,error:re}=await supabaseAdmin.from('reservations').insert([
   {listing_id:villa.id,guest_id:guests[0].id,guest_first_name:'Camille',start_date:iso(-120),end_date:iso(-113),guests:4,amount_total:196000,status:'terminee'},
   {listing_id:villa.id,guest_id:guests[0].id,guest_first_name:'Camille',start_date:iso(-35),end_date:iso(-29),guests:4,amount_total:168000,status:'terminee'},
   {listing_id:villa.id,guest_id:guests[0].id,guest_first_name:'Camille',start_date:iso(18),end_date:iso(25),guests:4,amount_total:201500,status:'confirmee'},
   {listing_id:loft.id,guest_id:guests[1].id,guest_first_name:'Thomas',start_date:iso(-72),end_date:iso(-68),guests:2,amount_total:76500,status:'terminee'},
   {listing_id:loft.id,guest_id:guests[1].id,guest_first_name:'Thomas',start_date:iso(4),end_date:iso(8),guests:2,amount_total:79000,status:'confirmee'},
   {listing_id:studio.id,guest_id:guests[2].id,guest_first_name:'Julie',start_date:iso(1),end_date:iso(5),guests:1,amount_total:52500,status:'confirmee'},
   {listing_id:studio.id,guest_id:guests[3].id,guest_first_name:'Nora',start_date:iso(12),end_date:iso(15),guests:2,amount_total:40500,status:'en_attente'}
  ]).select(); if(re)throw re;
  const pays=resas!.filter(r=>r.status!=='en_attente').map((r,i)=>{const fee=Math.round(r.amount_total*(i%2===0?.05:.08)),tax=Math.round(r.amount_total*.025);return {reservation_id:r.id,host_id:host.id,stripe_payment_intent_id:`pi_demo_${r.id}`,provider_payment_id:`demo_${r.id}`,payment_provider:i%2===0?'lemonway':'stripe',payment_channel:i%2===0?'pay_by_bank':'card',amount_total:r.amount_total,platform_fee:fee,amount_host:r.amount_total-fee-tax,tourist_tax_held:tax,status:'succeeded',transferred_at:r.status==='terminee'?new Date().toISOString():null}});
  const {error:pe}=await supabaseAdmin.from('payments').insert(pays);if(pe)throw pe;
  await supabaseAdmin.from('host_expenses').insert([{host_id:host.id,listing_id:villa.id,category:'Ménage',label:'Prestataire ménage',amount_cents:42000,expense_date:iso(-5),recurring:true,recurrence:'mensuel',notes:'ESCALE_DEMO'},{host_id:host.id,listing_id:loft.id,category:'Énergie',label:'Électricité',amount_cents:18500,expense_date:iso(-8),recurring:true,recurrence:'mensuel',notes:'ESCALE_DEMO'},{host_id:host.id,listing_id:studio.id,category:'Assurance',label:'Assurance location',amount_cents:9600,expense_date:iso(-11),recurring:true,recurrence:'mensuel',notes:'ESCALE_DEMO'}]);
  await supabaseAdmin.rpc('crm_refresh_host_contacts',{p_host_id:host.id});
  await supabaseAdmin.from('crm_contacts').update({tags:['DEMO','VIP','Famille'],private_notes:'Cliente fidèle. Préfère les arrivées après 17h.',marketing_consent:true}).eq('host_id',host.id).eq('guest_id',guests[0].id);
  await supabaseAdmin.from('crm_contacts').update({tags:['DEMO','Fidèle'],private_notes:'Voyage régulièrement pour le travail.',marketing_consent:true}).eq('host_id',host.id).eq('guest_id',guests[1].id);
  await supabaseAdmin.from('crm_contacts').update({tags:['DEMO','Nouveau client']}).eq('host_id',host.id).eq('guest_id',guests[2].id);
  await supabaseAdmin.from('crm_contacts').update({tags:['DEMO','Prospect']}).eq('host_id',host.id).eq('guest_id',guests[3].id);
  await supabaseAdmin.from('reservation_documents').insert(resas!.slice(0,4).map((r,i)=>({reservation_id:r.id,host_id:host.id,document_type:i%2?'facture':'contrat',title:`${i%2?'Facture':'Contrat'} démo ${r.guest_first_name}`,status:'disponible'})));
  return NextResponse.json({ok:true,email:HOST_EMAIL,logements:listings!.length,reservations:resas!.length,paiements:pays.length});
 }catch(e:any){return NextResponse.json({error:e?.message||"Erreur pendant la création de la démo."},{status:500})}
}
