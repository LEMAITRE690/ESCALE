import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const fmt=d=>new Date(`${d}T12:00:00`).toLocaleDateString("fr-FR",{day:"numeric",month:"short",year:"numeric"});

export default async function CalendrierCrmPage(){
 const supabase=createClient(); const {data:{user}}=await supabase.auth.getUser(); if(!user) redirect("/connexion?suite=/hote/crm/calendrier");
 const {data:listings}=await supabase.from("listings").select("id,title,city").eq("host_id",user.id).order("title"); const ids=(listings||[]).map(x=>x.id);
 const {data:reservations}=ids.length?await supabase.from("reservations").select("id,listing_id,start_date,end_date,status,guest_first_name").in("listing_id",ids).gte("end_date",new Date().toISOString().slice(0,10)).order("start_date"): {data:[]};
 const map=Object.fromEntries((listings||[]).map(l=>[l.id,l]));
 return <main className="min-h-screen bg-[#F7F5F0] p-5 md:p-8"><div className="mx-auto max-w-6xl"><Link href="/hote/crm" className="text-sm text-[#2F6E6E]">← CRM</Link><h1 className="mt-2 text-3xl font-semibold text-[#1B3A3A]">Calendrier opérationnel</h1><p className="text-stone-500">Vue multi-logements des séjours à venir.</p><div className="mt-6 space-y-4">{(listings||[]).map(l=>{const rows=(reservations||[]).filter(r=>r.listing_id===l.id);return <section key={l.id} className="rounded-2xl border border-stone-200 bg-white p-5"><div className="flex justify-between"><div><h2 className="font-semibold">{l.title}</h2><p className="text-sm text-stone-500">{l.city||''}</p></div><span className="text-sm text-stone-400">{rows.length} séjour{rows.length>1?'s':''}</span></div><div className="mt-3 divide-y">{rows.map(r=><Link key={r.id} href={`/hote/crm/reservations/${r.id}`} className="grid gap-2 py-3 sm:grid-cols-[180px_1fr_auto]"><b>{fmt(r.start_date)} → {fmt(r.end_date)}</b><span>{r.guest_first_name||'Voyageur'}</span><span className="text-sm text-stone-500">{r.status}</span></Link>)}{!rows.length&&<p className="py-4 text-sm text-stone-400">Aucune réservation à venir.</p>}</div></section>})}</div></div></main>;
}
