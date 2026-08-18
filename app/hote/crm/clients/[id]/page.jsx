import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ContactEditor from "@/components/crm/ContactEditor";

const euro=c=>new Intl.NumberFormat("fr-FR",{style:"currency",currency:"EUR"}).format((c||0)/100);
const fmt=d=>d?new Date(`${d}T12:00:00`).toLocaleDateString("fr-FR",{day:"numeric",month:"long",year:"numeric"}):"—";

export default async function ClientPage({params}){
 const supabase=createClient(); const {data:{user}}=await supabase.auth.getUser(); if(!user) redirect(`/connexion?suite=/hote/crm/clients/${params.id}`);
 const {data:contact}=await supabase.from("crm_contacts").select("*").eq("id",params.id).eq("host_id",user.id).maybeSingle(); if(!contact) notFound();
 const {data:listings}=await supabase.from("listings").select("id,title").eq("host_id",user.id); const ids=(listings||[]).map(x=>x.id);
 const {data:reservations}=contact.guest_id&&ids.length?await supabase.from("reservations").select("id,listing_id,start_date,end_date,status,amount_total").eq("guest_id",contact.guest_id).in("listing_id",ids).order("start_date",{ascending:false}):{data:[]};
 const map=Object.fromEntries((listings||[]).map(x=>[x.id,x.title]));
 return <main className="min-h-screen bg-[#F7F5F0] p-5 md:p-8"><div className="mx-auto max-w-5xl"><Link href="/hote/crm" className="text-sm text-[#2F6E6E]">← CRM</Link><div className="mt-3 flex flex-wrap justify-between gap-4"><div><h1 className="text-3xl font-semibold text-[#1B3A3A]">{contact.full_name}</h1><p className="text-stone-500">{contact.email||"Aucun email"}</p></div><div className="rounded-2xl bg-white border border-stone-200 p-4"><p className="text-xs text-stone-500 uppercase">Valeur client</p><p className="text-2xl font-semibold text-[#1B3A3A]">{euro(contact.lifetime_value_cents)}</p></div></div>
 <section className="mt-6 grid gap-4 md:grid-cols-4">{[["Séjours",contact.stays_count],["Nuits",contact.nights_count],["Premier séjour",fmt(contact.first_stay_at)],["Dernier séjour",fmt(contact.last_stay_at)]].map(([a,b])=><div key={a} className="rounded-2xl bg-white border border-stone-200 p-4"><p className="text-xs uppercase text-stone-500">{a}</p><p className="mt-2 font-semibold text-[#1B3A3A]">{b}</p></div>)}</section>
 <section className="mt-6 grid gap-5 lg:grid-cols-2"><div className="rounded-2xl bg-white border border-stone-200 p-5"><h2 className="text-lg font-semibold">Fiche client</h2><div className="mt-4"><ContactEditor contact={contact}/></div></div><div className="rounded-2xl bg-white border border-stone-200 p-5"><h2 className="text-lg font-semibold">Historique des séjours</h2><div className="mt-3 divide-y">{(reservations||[]).map(r=><Link key={r.id} href={`/hote/crm/reservations/${r.id}`} className="block py-3 hover:bg-stone-50"><div className="flex justify-between"><b>{map[r.listing_id]||"Logement"}</b><span>{euro(r.amount_total)}</span></div><p className="text-sm text-stone-500">{fmt(r.start_date)} → {fmt(r.end_date)} • {r.status}</p></Link>)}{!(reservations||[]).length&&<p className="text-sm text-stone-400 py-4">Aucun séjour lié.</p>}</div></div></section></div></main>;
}
