import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const euro = (c=0) => new Intl.NumberFormat("fr-FR", { style:"currency", currency:"EUR", maximumFractionDigits:0 }).format(c/100);
const date = (d) => d ? new Date(`${d}T12:00:00`).toLocaleDateString("fr-FR",{day:"numeric",month:"short"}) : "—";

export default async function CrmHotePage(){
  const supabase=createClient();
  const {data:{user}}=await supabase.auth.getUser();
  if(!user) redirect("/connexion?suite=/hote/crm");

  await supabase.rpc("crm_refresh_host_contacts",{p_host_id:user.id});
  const {data:listings}=await supabase.from("listings").select("id,title,city").eq("host_id",user.id);
  const ids=(listings??[]).map(x=>x.id);
  const [{data:contacts},{data:reservations},{data:payments},{data:expenses},{data:documents}]=await Promise.all([
    supabase.from("crm_contacts").select("id,full_name,email,tags,stays_count,nights_count,lifetime_value_cents,last_stay_at").eq("host_id",user.id).order("lifetime_value_cents",{ascending:false}).limit(12),
    ids.length?supabase.from("reservations").select("id,start_date,end_date,status,guest_first_name,amount_total,listing_id").in("listing_id",ids).order("start_date",{ascending:true}):Promise.resolve({data:[]}),
    supabase.from("payments").select("id,amount_host,status,transferred_at,created_at").eq("host_id",user.id),
    supabase.from("host_expenses").select("amount_cents,expense_date,category").eq("host_id",user.id),
    supabase.from("reservation_documents").select("id,title,document_type,status,created_at").eq("host_id",user.id).order("created_at",{ascending:false}).limit(6),
  ]);

  const now=new Date(), month=now.getMonth(), year=now.getFullYear();
  const res=reservations??[];
  const confirmed=res.filter(r=>["confirmee","terminee"].includes(r.status));
  const ca=confirmed.filter(r=>{const d=new Date(r.start_date);return d.getMonth()===month&&d.getFullYear()===year}).reduce((s,r)=>s+(r.amount_total||0),0);
  const dep=(expenses??[]).filter(e=>{const d=new Date(e.expense_date);return d.getMonth()===month&&d.getFullYear()===year}).reduce((s,e)=>s+(e.amount_cents||0),0);
  const aRecevoir=(payments??[]).filter(p=>p.status==="succeeded"&&!p.transferred_at).reduce((s,p)=>s+(p.amount_host||0),0);
  const today=now.toISOString().slice(0,10);
  const arrivees=res.filter(r=>r.start_date===today&&r.status!=="annulee");
  const departs=res.filter(r=>r.end_date===today&&r.status!=="annulee");
  const upcoming=res.filter(r=>r.start_date>=today&&r.status!=="annulee").slice(0,8);
  const lmap=Object.fromEntries((listings??[]).map(l=>[l.id,l]));

  const Card=({label,value,sub})=><div className="rounded-2xl border border-stone-200 bg-white p-5"><p className="text-xs uppercase tracking-wider text-stone-500">{label}</p><p className="mt-2 text-2xl font-semibold text-[#1B3A3A]">{value}</p>{sub&&<p className="mt-1 text-xs text-stone-500">{sub}</p>}</div>;
  return <main className="min-h-screen bg-[#F7F5F0] p-5 md:p-8 text-stone-800">
    <div className="mx-auto max-w-7xl">
      <div className="flex flex-wrap items-end justify-between gap-4"><div><Link href="/hote" className="text-sm text-[#2F6E6E]">← Espace hôte</Link><h1 className="mt-2 text-3xl font-semibold text-[#1B3A3A]">CRM ESCALE</h1><p className="text-stone-500">Votre activité, vos clients et votre argent au même endroit.</p></div><div className="rounded-full bg-[#E1EEE9] px-4 py-2 text-sm font-medium text-[#1B3A3A]">V1 • Cockpit propriétaire</div></div>

      <section className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-5"><Card label="CA du mois" value={euro(ca)}/><Card label="À recevoir" value={euro(aRecevoir)} sub="Paiements sécurisés non reversés"/><Card label="Charges du mois" value={euro(dep)}/><Card label="Clients CRM" value={(contacts??[]).length}/><Card label="Aujourd’hui" value={`${arrivees.length} arrivée${arrivees.length>1?'s':''}`} sub={`${departs.length} départ${departs.length>1?'s':''}`}/></section>

      <section className="mt-6 grid gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-2xl border border-stone-200 bg-white p-5"><div className="flex justify-between"><h2 className="font-semibold text-lg">Prochains séjours</h2><span className="text-sm text-stone-400">Calendrier opérationnel</span></div><div className="mt-4 divide-y">{upcoming.length?upcoming.map(r=><div key={r.id} className="grid grid-cols-[1fr_auto] gap-3 py-3"><div><p className="font-medium">{r.guest_first_name||"Voyageur"}</p><p className="text-sm text-stone-500">{lmap[r.listing_id]?.title||"Logement"} • {date(r.start_date)} → {date(r.end_date)}</p></div><div className="text-right"><p className="font-medium">{euro(r.amount_total)}</p><p className="text-xs text-stone-500">{r.status}</p></div></div>):<p className="py-8 text-center text-stone-400">Aucun séjour à venir.</p>}</div></div>
        <div className="rounded-2xl border border-stone-200 bg-white p-5"><h2 className="font-semibold text-lg">À faire</h2><div className="mt-4 space-y-3">{arrivees.map(r=><div key={r.id} className="rounded-xl bg-[#F7F5F0] p-3"><b>Arrivée aujourd’hui</b><p className="text-sm text-stone-500">{r.guest_first_name||"Voyageur"}</p></div>)}{departs.map(r=><div key={r.id} className="rounded-xl bg-[#F7F5F0] p-3"><b>Départ aujourd’hui</b><p className="text-sm text-stone-500">{r.guest_first_name||"Voyageur"}</p></div>)}{aRecevoir>0&&<div className="rounded-xl bg-[#E1EEE9] p-3"><b>{euro(aRecevoir)} en attente de reversement</b><p className="text-sm text-stone-600">Suivi automatique du prestataire de paiement.</p></div>}{!arrivees.length&&!departs.length&&!aRecevoir&&<p className="text-sm text-stone-400">Rien d’urgent. La machine ronronne.</p>}</div></div>
      </section>

      <section className="mt-6 rounded-2xl border border-stone-200 bg-white p-5"><div className="flex justify-between"><div><h2 className="font-semibold text-lg">Clients 360°</h2><p className="text-sm text-stone-500">Historique et valeur client issus des réservations.</p></div></div><div className="mt-4 overflow-x-auto"><table className="w-full text-sm"><thead className="text-left text-stone-500"><tr><th className="pb-3">Client</th><th>Séjours</th><th>Nuits</th><th>CA généré</th><th>Dernier séjour</th><th>Segment</th></tr></thead><tbody className="divide-y">{(contacts??[]).map(c=><tr key={c.id}><td className="py-3"><b>{c.full_name}</b><div className="text-xs text-stone-400">{c.email}</div></td><td>{c.stays_count}</td><td>{c.nights_count}</td><td>{euro(c.lifetime_value_cents)}</td><td>{date(c.last_stay_at)}</td><td><span className="rounded-full bg-[#F7F5F0] px-2 py-1 text-xs">{c.lifetime_value_cents>=200000?"VIP":c.stays_count>=2?"Fidèle":"Client"}</span></td></tr>)}</tbody></table>{!(contacts??[]).length&&<p className="py-8 text-center text-stone-400">Les clients apparaîtront ici après les premières réservations.</p>}</div></section>

      <section className="mt-6 grid gap-5 md:grid-cols-2"><div className="rounded-2xl border border-stone-200 bg-white p-5"><h2 className="font-semibold text-lg">Rentabilité</h2><p className="mt-4 text-sm text-stone-500">Mois en cours</p><div className="mt-3 space-y-2"><div className="flex justify-between"><span>Chiffre d’affaires</span><b>{euro(ca)}</b></div><div className="flex justify-between"><span>Charges renseignées</span><b>− {euro(dep)}</b></div><div className="border-t pt-2 flex justify-between text-[#1B3A3A]"><b>Résultat avant autres charges</b><b>{euro(ca-dep)}</b></div></div></div><div className="rounded-2xl border border-stone-200 bg-white p-5"><h2 className="font-semibold text-lg">Documents récents</h2><div className="mt-3 space-y-2">{(documents??[]).map(d=><div key={d.id} className="flex justify-between rounded-xl bg-[#F7F5F0] p-3"><span>{d.title}</span><span className="text-xs text-stone-500">{d.document_type}</span></div>)}{!(documents??[]).length&&<p className="text-sm text-stone-400">Contrats et factures liés aux réservations apparaîtront ici.</p>}</div></div></section>
    </div>
  </main>;
}
