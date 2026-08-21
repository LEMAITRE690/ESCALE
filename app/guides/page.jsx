import Link from "next/link";
import { CalendarDays, MapPinned, BookOpen } from "lucide-react";

const guides = [
  { slug:"bordeaux", ville:"Bordeaux", saison:"Septembre–octobre", idee:"Vignobles, quais et week-ends gastronomiques." },
  { slug:"biarritz", ville:"Biarritz", saison:"Mai–juin", idee:"Océan, surf et escapades sur la côte basque." },
  { slug:"annecy", ville:"Annecy", saison:"Juin–septembre", idee:"Lac, vélo et randonnées entre eau et montagne." },
  { slug:"marseille", ville:"Marseille", saison:"Avril–octobre", idee:"Calanques, marchés et Méditerranée." },
  { slug:"strasbourg", ville:"Strasbourg", saison:"Novembre–décembre", idee:"Marchés de Noël, patrimoine et gastronomie alsacienne." },
  { slug:"la-rochelle", ville:"La Rochelle", saison:"Mai–septembre", idee:"Port, îles et séjours en famille." },
];

export const metadata={title:"Guides de voyage en France | Escale",description:"Guides destinations, meilleures périodes et idées locales pour préparer un séjour Escale."};

export default function GuidesPage(){return <main className="min-h-screen bg-[#F8F4EC] text-[#173C3A]"><section className="mx-auto max-w-6xl px-5 py-14"><div className="flex items-center gap-2 text-sm text-[#2F6E6E]"><BookOpen size={16}/> Guides Escale</div><h1 className="mt-3 max-w-3xl font-serif text-4xl">Choisir une destination avec un peu plus qu’un simple point sur une carte.</h1><p className="mt-4 max-w-2xl text-[#6B5B4D]">Des pages éditoriales courtes, utiles et reliées directement aux logements disponibles.</p><div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{guides.map(g=><article key={g.slug} className="rounded-2xl border border-[#E4DCC8] bg-white p-6"><MapPinned size={20}/><h2 className="mt-3 font-serif text-2xl">{g.ville}</h2><p className="mt-2 text-sm text-[#6B5B4D]">{g.idee}</p><p className="mt-4 flex items-center gap-2 text-xs text-[#8C7A66]"><CalendarDays size={13}/> Période idéale : {g.saison}</p><Link className="mt-5 inline-block text-sm font-medium text-[#2F6E6E]" href={`/recherche?destination=${encodeURIComponent(g.ville)}`}>Voir les logements →</Link></article>)}</div><section className="mt-12 rounded-2xl bg-[#173C3A] p-7 text-white"><h2 className="font-serif text-2xl">Calendrier local</h2><p className="mt-2 text-sm text-[#D8CCB0]">Le socle est prêt pour relier chaque destination à des événements saisonniers, fêtes locales et temps forts éditoriaux sans mélanger ces contenus au moteur de réservation.</p></section></section></main>}
