import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ExpenseForm from "@/components/crm/ExpenseForm";

const euro=c=>new Intl.NumberFormat("fr-FR",{style:"currency",currency:"EUR"}).format((c||0)/100);

export default async function FinancesPage(){
 const supabase=createClient(); const {data:{user}}=await supabase.auth.getUser(); if(!user) redirect("/connexion?suite=/hote/crm/finances");
 const {data:listings}=await supabase.from("listings").select("id,title").eq("host_id",user.id);
 const [{data:expenses},{data:payments}]=await Promise.all([
  supabase.from("host_expenses").select("id,listing_id,category,label,amount_cents,expense_date,recurring,recurrence,notes").eq("host_id",user.id).order("expense_date",{ascending:false}).limit(100),
  supabase.from("payments").select("amount_host,platform_fee,status,transferred_at,created_at").eq("host_id",user.id).eq("status","succeeded")
 ]);
 const lmap=Object.fromEntries((listings||[]).map(l=>[l.id,l.title]));
 const revenue=(payments||[]).reduce((s,p)=>s+(p.amount_host||0),0), costs=(expenses||[]).reduce((s,e)=>s+(e.amount_cents||0),0), pending=(payments||[]).filter(p=>!p.transferred_at).reduce((s,p)=>s+(p.amount_host||0),0);
 return <main className="min-h-screen bg-[#F7F5F0] p-5 md:p-8"><div className="mx-auto max-w-6xl"><Link href="/hote/crm" className="text-sm text-[#2F6E6E]">← CRM</Link><h1 className="mt-2 text-3xl font-semibold text-[#1B3A3A]">Finances & rentabilité</h1><p className="text-stone-500">Suivez les revenus, les charges et le net estimé de votre activité.</p>
 <section className="mt-6 grid gap-3 md:grid-cols-3">{[["Revenus hôte",euro(revenue)],["Charges renseignées",euro(costs)],["À recevoir",euro(pending)]].map(([a,b])=><div key={a} className="rounded-2xl bg-white border border-stone-200 p-5"><p className="text-xs uppercase text-stone-500">{a}</p><p className="mt-2 text-2xl font-semibold text-[#1B3A3A]">{b}</p></div>)}</section>
 <section className="mt-6 rounded-2xl bg-white border border-stone-200 p-5"><h2 className="font-semibold text-lg">Ajouter une charge</h2><div className="mt-4"><ExpenseForm listings={listings||[]}/></div></section>
 <section className="mt-6 rounded-2xl bg-white border border-stone-200 p-5"><h2 className="font-semibold text-lg">Dernières charges</h2><div className="mt-3 divide-y">{(expenses||[]).map(e=><div key={e.id} className="grid gap-2 py-3 sm:grid-cols-[1fr_auto]"><div><b>{e.label}</b><p className="text-sm text-stone-500">{e.category} • {lmap[e.listing_id]||"Global"} • {new Date(`${e.expense_date}T12:00:00`).toLocaleDateString("fr-FR")}{e.recurring?` • ${e.recurrence||"récurrente"}`:""}</p></div><b>{euro(e.amount_cents)}</b></div>)}{!(expenses||[]).length&&<p className="py-6 text-sm text-stone-400">Aucune charge enregistrée.</p>}</div></section>
 </div></main>;
}
