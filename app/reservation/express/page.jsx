import Link from "next/link";
import { CalendarCheck, CreditCard, ShieldCheck, CheckCircle2, ArrowRight } from "lucide-react";

const etapes = [
  { n: 1, titre: "Choisissez vos dates", texte: "Disponibilités, voyageurs et prix total sont réunis au même endroit.", icon: CalendarCheck },
  { n: 2, titre: "Vérifiez les conditions", texte: "Annulation, frais et règles du logement sont visibles avant paiement.", icon: ShieldCheck },
  { n: 3, titre: "Réservez en sécurité", texte: "Paiement sécurisé et confirmation immédiate lorsque l’annonce le permet.", icon: CreditCard },
];

export const metadata = { title: "Réservation simple en 3 étapes | Escale" };

export default function ReservationExpressPage() {
  return (
    <main className="min-h-screen bg-[#F8F4EC] text-[#173C3A]">
      <section className="mx-auto max-w-5xl px-5 py-14">
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#E1EEE9] px-3 py-1 text-sm"><CheckCircle2 size={14}/> Parcours simplifié</span>
          <h1 className="mt-4 font-serif text-4xl">Réserver sans labyrinthe.</h1>
          <p className="mt-3 text-[#6B5B4D]">Escale concentre l’essentiel en trois étapes, avec les informations importantes avant l’engagement.</p>
        </div>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {etapes.map(({n,titre,texte,icon:Icon}) => <article key={n} className="rounded-2xl border border-[#E4DCC8] bg-white p-6"><div className="flex items-center justify-between"><span className="grid h-9 w-9 place-items-center rounded-full bg-[#173C3A] text-white">{n}</span><Icon size={20}/></div><h2 className="mt-5 font-serif text-xl">{titre}</h2><p className="mt-2 text-sm text-[#6B5B4D]">{texte}</p></article>)}
        </div>
        <div className="mt-8 flex flex-col items-center justify-between gap-4 rounded-2xl bg-[#173C3A] p-6 text-white sm:flex-row">
          <div><strong className="font-serif text-xl">Prêt à tester le parcours ?</strong><p className="mt-1 text-sm text-[#D8CCB0]">Commencez par un logement qui vous plaît.</p></div>
          <Link href="/recherche" className="inline-flex items-center gap-2 rounded-lg bg-[#C97B3D] px-5 py-3 text-sm font-medium">Trouver un logement <ArrowRight size={15}/></Link>
        </div>
      </section>
    </main>
  );
}
