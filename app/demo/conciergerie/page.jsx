"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Building2, CalendarDays, Check, Euro, Home, Users } from "lucide-react";

const LOGEMENTS = [
  { nom:"Villa des Pins", proprietaire:"Sophie Bernard", ville:"Arcachon", arrivees:2, statut:"À préparer", retro:184 },
  { nom:"Maison du Bassin", proprietaire:"Marc Leroy", ville:"Cap Ferret", arrivees:1, statut:"Prêt", retro:236 },
  { nom:"Loft du Vieux-Port", proprietaire:"Claire Robert", ville:"Marseille", arrivees:0, statut:"Occupé", retro:128 },
  { nom:"Mas des Oliviers", proprietaire:"Julien Moreau", ville:"Gordes", arrivees:0, statut:"Disponible", retro:310 },
];

export default function DemoConciergeriePage(){
  const [filtre,setFiltre]=useState("Tous");
  const [valides,setValides]=useState([]);
  const visibles=useMemo(()=>filtre==="Tous"?LOGEMENTS:LOGEMENTS.filter(x=>x.statut===filtre),[filtre]);
  const retro=LOGEMENTS.reduce((s,x)=>s+x.retro,0);
  const toggle=(nom)=>setValides(v=>v.includes(nom)?v.filter(x=>x!==nom):[...v,nom]);

  return <main className="min-h-screen bg-[#F8F4EC] px-5 py-10 text-[#173C3A]"><div className="mx-auto max-w-6xl">
    <div className="flex flex-wrap items-center justify-between gap-4"><div><p className="text-xs uppercase tracking-[.18em] text-[#A86735]">Mode démo · données fictives</p><h1 className="mt-2 font-serif text-4xl">Pilotage conciergerie</h1></div><div className="flex gap-2"><Link href="/demo" className="rounded-xl border border-[#CCB999] px-4 py-2.5 text-sm">Centre démo</Link><Link href="/partenaire" className="rounded-xl bg-[#173C3A] px-4 py-2.5 text-sm font-medium text-white">Espace partenaire réel</Link></div></div>

    <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {[[Users,"Propriétaires","4"],[Home,"Logements","12"],[CalendarDays,"Arrivées aujourd’hui","3"],[Euro,"Rétrocommissions",`${retro} €`]].map(([I,t,v])=><article key={t} className="rounded-2xl border border-[#E2D6C2] bg-[#FFFDF8] p-5"><I size={18} className="text-[#A86735]"/><p className="mt-4 text-xs uppercase tracking-wider text-[#8D5B30]">{t}</p><p className="mt-2 text-3xl font-semibold">{v}</p></article>)}
    </div>

    <section className="mt-8 rounded-3xl border border-[#E2D6C2] bg-[#FFFDF8] p-6">
      <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs uppercase tracking-wider text-[#8D5B30]">Planning multi-logements</p><h2 className="mt-1 font-serif text-2xl">Opérations du jour</h2></div><div className="flex flex-wrap gap-2">{["Tous","À préparer","Prêt","Occupé","Disponible"].map(x=><button key={x} onClick={()=>setFiltre(x)} className={`rounded-full border px-3 py-1.5 text-xs ${filtre===x?"border-[#173C3A] bg-[#173C3A] text-white":"border-[#E2D6C2] bg-[#F8F4EC]"}`}>{x}</button>)}</div></div>
      <div className="mt-6 space-y-3">{visibles.map(x=><article key={x.nom} className="grid gap-4 rounded-2xl bg-[#F8F4EC] p-4 md:grid-cols-[1.4fr_1fr_.7fr_auto] md:items-center"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#F1E7D6] text-[#A86735]"><Building2 size={17}/></span><div><p className="font-medium">{x.nom}</p><p className="text-xs text-[#6D6258]">{x.ville} · {x.proprietaire}</p></div></div><div><p className="text-xs text-[#6D6258]">Statut</p><p className="text-sm font-medium">{x.statut}</p></div><div><p className="text-xs text-[#6D6258]">Rétro.</p><p className="text-sm font-semibold">{x.retro} €</p></div><button onClick={()=>toggle(x.nom)} className={`rounded-xl px-3 py-2 text-xs font-medium ${valides.includes(x.nom)?"bg-[#E1EEE9] text-[#173C3A]":"bg-[#173C3A] text-white"}`}>{valides.includes(x.nom)?<><Check size={13} className="mr-1 inline"/>Contrôlé</>:"Marquer contrôlé"}</button></article>)}</div>
    </section>

    <div className="mt-6 rounded-2xl bg-[#173C3A] p-5 text-white"><p className="text-sm text-[#C8D8D4]">Progression de la revue quotidienne</p><p className="mt-1 text-xl font-semibold">{valides.length} logement{valides.length>1?"s":""} contrôlé{valides.length>1?"s":""} sur {LOGEMENTS.length}</p></div>
  </div></main>;
}
