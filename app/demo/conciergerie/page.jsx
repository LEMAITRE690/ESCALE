import Link from "next/link";

const cartes = [
  ["Propriétaires", "4", "Mandats et coordonnées centralisés"],
  ["Logements", "12", "Disponibilités et performances"],
  ["Arrivées aujourd’hui", "3", "Check-in à préparer"],
  ["Rétrocommissions", "1 284 €", "Montant démo du mois"],
];

const actions = ["Voir le planning multi-logements", "Contrôler les réservations", "Suivre les propriétaires", "Vérifier les rétrocommissions", "Ouvrir les accès partenaire"];

export default function DemoConciergeriePage(){
  return <main className="min-h-screen bg-[#F8F4EC] text-[#173C3A] px-5 py-10"><div className="mx-auto max-w-6xl">
    <div className="flex flex-wrap items-center justify-between gap-4"><div><p className="text-xs uppercase tracking-[.18em] text-[#A86735]">Mode démo</p><h1 className="mt-2 font-serif text-4xl">Pilotage conciergerie</h1></div><Link href="/partenaire" className="rounded-xl bg-[#173C3A] px-4 py-2.5 text-sm font-medium text-white">Ouvrir l’espace partenaire</Link></div>
    <p className="mt-4 max-w-3xl leading-7 text-[#6D6258]">Vue de validation pour tester la gestion multi-propriétaires, multi-logements et les opérations quotidiennes sans toucher aux données réelles.</p>
    <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{cartes.map(([t,v,d])=><article key={t} className="rounded-2xl border border-[#E2D6C2] bg-[#FFFDF8] p-5"><p className="text-xs uppercase tracking-wider text-[#8D5B30]">{t}</p><p className="mt-2 text-3xl font-semibold">{v}</p><p className="mt-2 text-sm text-[#6D6258]">{d}</p></article>)}</div>
    <section className="mt-8 rounded-2xl border border-[#E2D6C2] bg-[#FFFDF8] p-6"><h2 className="font-serif text-2xl">Checklist opérationnelle</h2><div className="mt-5 grid gap-3 md:grid-cols-2">{actions.map((x,i)=><div key={x} className="flex items-center gap-3 rounded-xl bg-[#F8F4EC] p-4"><span className="grid h-7 w-7 place-items-center rounded-full bg-[#F1E7D6] text-xs font-semibold text-[#A86735]">{i+1}</span><span className="text-sm font-medium">{x}</span></div>)}</div></section>
  </div></main>;
}
