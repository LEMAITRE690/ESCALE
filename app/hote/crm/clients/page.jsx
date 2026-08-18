import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const euro=c=>new Intl.NumberFormat("fr-FR",{style:"currency",currency:"EUR",maximumFractionDigits:0}).format((c||0)/100);
const fmt=d=>d?new Date(`${d}T12:00:00`).toLocaleDateString("fr-FR"):"—";

export default async function ClientsPage(){
 const supabase=createClient(); const {data:{user}}=await supabase.auth.getUser(); if(!user) redirect("/connexion?suite=/hote/crm/clients");
 await supabase.rpc("crm_refresh_host_contacts",{p_host_id:user.id});
 const {data:contacts}=await supabase.from("crm_contacts").select("id,full_name,email,phone,tags,stays_count,nights_count,lifetime_value_cents,last_stay_at,marketing_consent").eq("host_id",user.id).order("lifetime_value_cents",{ascending:false});
 return <main className="min-h-screen bg-[#F7F5F0] p-5 md:p-8"><div className="mx-auto max-w-6xl"><h1 className="text-3xl font-semibold text-[#1B3A3A]">Clients 360°</h1><p className="text-stone-500">Votre portefeuille client, son historique et sa valeur.</p><section className="mt-6 rounded-2xl border border-stone-200 bg-white p-5"><div className="overflow-x-auto"><table className="w-full text-sm"><thead className="text-left text-stone-500"><tr><th className="pb-3">Client</th><th>Séjours</th><th>Nuits</th><th>CA</th><th>Dernier séjour</th><th>Segment</th></tr></thead><tbody className="divide-y">{(contacts||[]).map(c=>{const segment=c.lifetime_value_cents>=200000?'VIP':c.stays_count>=2?'Fidèle':'Client';return <tr key={c.id}><td className="py-3"><Link href={`/hote/crm/clients/${c.id}`} className="font-semibold text-[#2F6E6E]">{c.full_name}</Link><div className="text-xs text-stone-400">{c.email||c.phone||'—'}</div></td><td>{c.stays_count}</td><td>{c.nights_count}</td><td>{euro(c.lifetime_value_cents)}</td><td>{fmt(c.last_stay_at)}</td><td><span className="rounded-full bg-[#F7F5F0] px-2 py-1 text-xs">{segment}</span></td></tr>})}</tbody></table>{!(contacts||[]).length&&<p className="py-8 text-center text-stone-400">Aucun client CRM pour le moment.</p>}</div></section></div></main>;
}
