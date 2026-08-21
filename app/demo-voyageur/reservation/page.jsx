"use client";
import { useState } from "react";
import Link from "next/link";
import { Check, ChevronRight, CreditCard, CalendarDays, Users } from "lucide-react";

export default function DemoReservationVoyageur(){
 const [etape,setEtape]=useState(0);
 const total=447;
 return <main className="min-h-screen bg-[#F8F4EC] px-5 py-10 text-[#173C3A]"><div className="mx-auto max-w-3xl">
  <Link href="/demo-voyageur" className="text-sm text-[#8D5B30]">← Retour à la recherche</Link>
  <p className="mt-8 text-xs uppercase tracking-[.18em] text-[#A86735]">Démo voyageur · aucun débit réel</p><h1 className="mt-2 font-serif text-4xl">Réserver la Villa des Pins</h1>
  <div className="mt-7 flex gap-2">{["Séjour","Paiement","Confirmation"].map((x,i)=><div key={x} className={`flex-1 rounded-xl p-3 text-center text-xs font-medium ${i<=etape?"bg-[#173C3A] text-white":"bg-[#EDE4D4] text-[#6D6258]"}`}>{i+1}. {x}</div>)}</div>
  <section className="mt-6 rounded-3xl border border-[#E2D6C2] bg-[#FFFDF8] p-6">
   {etape===0&&<><h2 className="font-serif text-2xl">Votre séjour</h2><div className="mt-5 space-y-3 rounded-2xl bg-[#F8F4EC] p-5 text-sm"><p className="flex gap-2"><CalendarDays size={17}/>12 au 15 septembre · 3 nuits</p><p className="flex gap-2"><Users size={17}/>2 voyageurs</p><p className="border-t border-[#E2D6C2] pt-3">149 € × 3 nuits <b className="float-right">447 €</b></p><p>Frais de service Escale <b className="float-right">0 € en démo</b></p><p className="border-t border-[#E2D6C2] pt-3 text-base">Total <b className="float-right">{total} €</b></p></div><button onClick={()=>setEtape(1)} className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[#173C3A] py-3 font-medium text-white">Continuer <ChevronRight size={17}/></button></>}
   {etape===1&&<><h2 className="font-serif text-2xl">Paiement simulé</h2><div className="mt-5 rounded-2xl border border-[#E2D6C2] p-5"><p className="flex items-center gap-2 font-medium"><CreditCard size={18}/>Carte de démonstration</p><p className="mt-3 text-sm text-[#6D6258]">•••• •••• •••• 4242 · 12/30 · 123</p><p className="mt-3 text-xs font-medium text-[#A86735]">Simulation uniquement. Aucune transaction bancaire.</p></div><button onClick={()=>setEtape(2)} className="mt-6 w-full rounded-xl bg-[#173C3A] py-3 font-medium text-white">Simuler le paiement de {total} €</button></>}
   {etape===2&&<div className="py-8 text-center"><span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-[#E1EEE9]"><Check/></span><h2 className="mt-5 font-serif text-3xl">Réservation confirmée</h2><p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-[#6D6258]">Le scénario voyageur est terminé. La réservation fictive peut maintenant être suivie dans la démonstration hôte.</p><div className="mt-6 grid gap-2 sm:grid-cols-2"><Link href="/demo-voyageur" className="rounded-xl border border-[#CCB999] py-3 text-sm">Nouvelle recherche</Link><Link href="/demo/hote" className="rounded-xl bg-[#173C3A] py-3 text-sm font-medium text-white">Voir côté hôte</Link></div></div>}
  </section>
 </div></main>;
}
