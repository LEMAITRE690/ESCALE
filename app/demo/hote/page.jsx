"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, ChevronRight, Home, BadgeEuro, CalendarDays, FileText, CreditCard, Users } from "lucide-react";

const etapes = [
  { titre: "Créer l’annonce", detail: "Villa des Pins · Arcachon · 6 voyageurs", icon: Home },
  { titre: "Définir le tarif", detail: "149 € / nuit · Prix Juste Escale activé", icon: BadgeEuro },
  { titre: "Piloter le calendrier", detail: "12–15 septembre disponibles", icon: CalendarDays },
  { titre: "Recevoir une réservation", detail: "Camille Martin · 3 nuits · 447 €", icon: Users },
  { titre: "Générer le contrat", detail: "Contrat de réservation prêt à valider", icon: FileText },
  { titre: "Suivre le paiement", detail: "Paiement démo sécurisé · reversement simulé", icon: CreditCard },
];

export default function DemoHotePage() {
  const [etape, setEtape] = useState(0);
  const [termine, setTermine] = useState(false);
  const active = etapes[etape];
  const Icon = active.icon;

  function suivant() {
    if (etape < etapes.length - 1) setEtape((v) => v + 1);
    else setTermine(true);
  }

  return <main className="min-h-screen bg-[#F8F4EC] px-5 py-10 text-[#173C3A]">
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div><p className="text-xs uppercase tracking-[.18em] text-[#A86735]">Mode démo · données fictives</p><h1 className="mt-2 font-serif text-4xl">Parcours hôte complet</h1></div>
        <div className="flex gap-2"><Link href="/demo" className="rounded-xl border border-[#CCB999] px-4 py-2.5 text-sm">Centre démo</Link><Link href="/hote" className="rounded-xl bg-[#173C3A] px-4 py-2.5 text-sm font-medium text-white">Espace hôte réel</Link></div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[320px_1fr]">
        <aside className="rounded-2xl border border-[#E2D6C2] bg-[#FFFDF8] p-4">
          {etapes.map((x,i)=>{ const I=x.icon; const done=i<etape||termine; return <button key={x.titre} onClick={()=>{setEtape(i);setTermine(false)}} className={`mb-2 flex w-full items-center gap-3 rounded-xl p-3 text-left ${i===etape&&!termine?"bg-[#E1EEE9]":"hover:bg-[#F8F4EC]"}`}><span className={`grid h-9 w-9 place-items-center rounded-full ${done?"bg-[#173C3A] text-white":"bg-[#F1E7D6] text-[#A86735]"}`}>{done?<Check size={16}/>:<I size={16}/>}</span><div><p className="text-xs text-[#8D5B30]">Étape {i+1}</p><p className="text-sm font-medium">{x.titre}</p></div></button>})}
        </aside>

        <section className="rounded-3xl border border-[#E2D6C2] bg-[#FFFDF8] p-7">
          {termine ? <div className="py-12 text-center"><span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-[#E1EEE9]"><Check/></span><h2 className="mt-5 font-serif text-3xl">Parcours hôte validé</h2><p className="mx-auto mt-3 max-w-xl text-[#6D6258]">La réservation fictive est maintenant visible comme payée et le voyageur peut rejoindre le CRM. Aucune donnée réelle n’a été modifiée.</p><button onClick={()=>{setEtape(0);setTermine(false)}} className="mt-6 rounded-xl bg-[#173C3A] px-5 py-3 text-sm font-medium text-white">Rejouer le scénario</button></div> : <>
            <div className="flex items-start gap-4"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#F1E7D6] text-[#A86735]"><Icon/></span><div><p className="text-sm text-[#8D5B30]">Étape {etape+1} sur {etapes.length}</p><h2 className="mt-1 font-serif text-3xl">{active.titre}</h2><p className="mt-2 text-[#6D6258]">{active.detail}</p></div></div>
            <div className="mt-8 rounded-2xl bg-[#F8F4EC] p-5"><p className="text-xs uppercase tracking-wider text-[#8D5B30]">Contrôle démo</p><p className="mt-2 text-sm leading-6">Vérifiez que l’action principale est évidente, que le statut est compréhensible et que l’étape suivante peut être atteinte sans quitter le fil du parcours.</p></div>
            <div className="mt-8 flex items-center justify-between"><button disabled={etape===0} onClick={()=>setEtape(v=>Math.max(0,v-1))} className="rounded-xl border border-[#CCB999] px-4 py-2.5 text-sm disabled:opacity-40">Précédent</button><button onClick={suivant} className="inline-flex items-center gap-2 rounded-xl bg-[#173C3A] px-5 py-3 text-sm font-medium text-white">{etape===etapes.length-1?"Valider le parcours":"Continuer"}<ChevronRight size={16}/></button></div>
          </>}
        </section>
      </div>
    </div>
  </main>;
}
