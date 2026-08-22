import Link from "next/link";
import { MapPin, Sparkles, Users, BookOpen } from "lucide-react";

const destinations = ["Paris", "Bordeaux", "La Rochelle", "Biarritz", "Lyon", "Annecy", "Marseille", "Nice"];
const envies = ["Bord de mer", "Week-end en ville", "Montagne", "Piscine", "Animaux acceptés", "Séjour en famille"];

export const metadata = {
  title: "Découvrir la France avec Escale",
  description: "Idées de séjours, destinations et logements en direct avec des hôtes Escale.",
};

export default function DecouvrirPage() {
  return (
    <main className="min-h-screen bg-[#F8F4EC] text-[#173C3A]">
      <section className="mx-auto max-w-6xl px-5 py-14">
        <div className="max-w-3xl">
          <span className="inline-flex items-center gap-2 rounded-full bg-[#E1EEE9] px-3 py-1 text-sm"><Sparkles size={14}/> Trouver l’inspiration</span>
          <h1 className="mt-4 font-serif text-4xl sm:text-5xl">Des séjours qui commencent avant même la recherche.</h1>
          <p className="mt-4 text-[#6B5B4D]">Explorez les destinations, les styles de séjour et les logements Escale. Chaque lien mène vers une recherche prête à affiner.</p>
        </div>

        <section className="mt-12">
          <div className="flex items-center gap-2"><MapPin size={18}/><h2 className="font-serif text-2xl">Destinations populaires</h2></div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {destinations.map((ville) => <Link key={ville} href={`/recherche?destination=${encodeURIComponent(ville)}`} className="rounded-xl border border-[#E4DCC8] bg-white p-5 hover:border-[#2F6E6E]"><strong>{ville}</strong><p className="mt-1 text-sm text-[#8C7A66]">Voir les logements</p></Link>)}
          </div>
        </section>

        <section className="mt-12">
          <div className="flex items-center gap-2"><BookOpen size={18}/><h2 className="font-serif text-2xl">Choisir selon votre envie</h2></div>
          <div className="mt-5 flex flex-wrap gap-2">{envies.map((envie) => <Link key={envie} href={`/recherche?envie=${encodeURIComponent(envie)}`} className="rounded-full border border-[#D7CCB9] bg-[#FFFDF8] px-4 py-2 text-sm">{envie}</Link>)}</div>
        </section>

        <section className="mt-12 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl bg-[#173C3A] p-7 text-white"><Users size={22}/><h2 className="mt-3 font-serif text-2xl">Voyagez, puis recommandez</h2><p className="mt-2 text-sm text-[#D8CCB0]">Le bouche-à-oreille Escale devient un canal d’acquisition mesurable.</p><Link href="/parrainage" className="mt-5 inline-block rounded-lg bg-[#C97B3D] px-4 py-2 text-sm font-medium">Découvrir le parrainage</Link></div>
          <div className="rounded-2xl border border-[#E4DCC8] bg-white p-7"><Sparkles size={22}/><h2 className="mt-3 font-serif text-2xl">Recherche intelligente</h2><p className="mt-2 text-sm text-[#6B5B4D]">Décrivez simplement le séjour que vous imaginez et laissez la recherche IA traduire votre envie en critères.</p><Link href="/recherche" className="mt-5 inline-block text-sm font-medium text-[#2F6E6E]">Essayer la recherche →</Link></div>
        </section>
      </section>
    </main>
  );
}
