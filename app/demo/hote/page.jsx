import Link from "next/link";

const etapes = [
  ["1", "Créer l’annonce", "Photos, capacité, équipements, règles et publication guidée."],
  ["2", "Définir le tarif", "Prix par nuit, remises, frais et activation Prix Juste Escale."],
  ["3", "Piloter le calendrier", "Disponibilités, synchronisation et prévention des chevauchements."],
  ["4", "Recevoir une réservation", "Résumé voyageur, conditions, contrat et messages."],
  ["5", "Suivre le paiement", "Paiement simulé, statut et reversement après séjour."],
  ["6", "Fidéliser", "Le voyageur rejoint le CRM pour le suivi et les prochaines réservations."],
];

export default function DemoHotePage() {
  return <main className="min-h-screen bg-[#F8F4EC] text-[#173C3A] px-5 py-10">
    <div className="mx-auto max-w-6xl">
      <div className="flex items-center justify-between gap-4">
        <div><p className="text-xs uppercase tracking-[.18em] text-[#A86735]">Mode démo</p><h1 className="mt-2 font-serif text-4xl">Parcours hôte complet</h1></div>
        <Link href="/hote" className="rounded-xl bg-[#173C3A] px-4 py-2.5 text-sm font-medium text-white">Ouvrir l’espace hôte</Link>
      </div>
      <p className="mt-4 max-w-3xl leading-7 text-[#6D6258]">Cette page sert de fil conducteur pour tester tout le parcours sans modifier la base stable. Chaque étape doit être vérifiée visuellement et fonctionnellement avant mise en production.</p>
      <div className="mt-9 grid gap-4 md:grid-cols-2 lg:grid-cols-3">{etapes.map(([n,t,d])=><article key={n} className="rounded-2xl border border-[#E2D6C2] bg-[#FFFDF8] p-5"><span className="grid h-8 w-8 place-items-center rounded-full bg-[#F1E7D6] text-sm font-semibold text-[#A86735]">{n}</span><h2 className="mt-4 text-lg font-semibold">{t}</h2><p className="mt-2 text-sm leading-6 text-[#6D6258]">{d}</p></article>)}</div>
      <div className="mt-8 rounded-2xl bg-[#173C3A] p-6 text-white"><p className="text-sm text-[#C8D8D4]">Critère de sortie de démo</p><p className="mt-2 text-xl font-semibold">Un hôte doit comprendre l’état de son activité et atteindre chaque action clé sans chercher où cliquer.</p></div>
    </div>
  </main>;
}
