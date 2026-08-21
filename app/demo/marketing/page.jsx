import Link from "next/link";
import { Instagram, Facebook, Youtube, Search, Share2, MapPin, BookOpen, BadgeCheck } from "lucide-react";

const videos=[
 {titre:"Découvrir Escale en 90 secondes",public:"Voyageurs & hôtes",duree:"1:30"},
 {titre:"Pourquoi devenir hôte Escale ?",public:"Propriétaires",duree:"2:10"},
 {titre:"Le Prix Juste Escale expliqué",public:"Voyageurs",duree:"1:45"},
];
const contenus=[
 [MapPin,"Guides destinations","Pages locales reliées aux logements, activités et bonnes adresses."],
 [BookOpen,"Conseils & inspirations","Contenus éditoriaux utiles pour capter des recherches longue traîne."],
 [BadgeCheck,"Confiance Escale","Charte, Prix Juste, transparence et preuves de valeur visibles."],
 [Share2,"Partage des annonces","Cartes sociales Open Graph pensées pour Instagram, Facebook et messageries."],
];

export const metadata={title:"Escale TV & acquisition | Démonstration",description:"Démonstration de la stratégie SEO, contenus, réseaux sociaux et vidéo d’Escale."};

export default function DemoMarketing(){return <main className="min-h-screen bg-[#F8F4EC] px-5 py-10 text-[#173C3A]"><div className="mx-auto max-w-6xl">
 <div className="flex flex-wrap items-center justify-between gap-4"><div><p className="text-xs uppercase tracking-[.18em] text-[#A86735]">PR13 · marketing & visibilité</p><h1 className="mt-2 font-serif text-4xl">Faire découvrir Escale.</h1><p className="mt-3 max-w-3xl leading-7 text-[#6D6258]">Une démonstration de la couche acquisition : SEO, contenus locaux, partage social et vidéo, sans modifier l’identité graphique de référence.</p></div><Link href="/demo" className="rounded-xl border border-[#CCB999] px-4 py-2.5 text-sm">Centre démo</Link></div>

 <section className="mt-9 grid gap-4 md:grid-cols-2 lg:grid-cols-4">{contenus.map(([I,t,d])=><article key={t} className="rounded-2xl border border-[#E2D6C2] bg-[#FFFDF8] p-5"><I size={19} className="text-[#A86735]"/><h2 className="mt-4 font-semibold">{t}</h2><p className="mt-2 text-sm leading-6 text-[#6D6258]">{d}</p></article>)}</section>

 <section className="mt-8 rounded-3xl border border-[#E2D6C2] bg-[#FFFDF8] p-6"><div className="flex items-start gap-4"><span className="grid h-11 w-11 place-items-center rounded-xl bg-[#F1E7D6] text-[#A86735]"><Search size={19}/></span><div><p className="text-xs uppercase tracking-wider text-[#8D5B30]">SEO</p><h2 className="mt-1 font-serif text-2xl">Socle de référencement à valider</h2></div></div><div className="mt-5 grid gap-3 md:grid-cols-2">{["Titres et descriptions uniques par page","URLs propres et maillage interne","Sitemap et robots.txt","Données structurées logement / FAQ / organisation","Open Graph et cartes de partage","Pages destinations et contenus longue traîne"].map(x=><div key={x} className="rounded-xl bg-[#F8F4EC] p-4 text-sm">✓ {x}</div>)}</div></section>

 <section className="mt-8"><div className="flex items-end justify-between gap-4"><div><p className="text-xs uppercase tracking-wider text-[#8D5B30]">Escale TV</p><h2 className="mt-1 font-serif text-3xl">La vidéo au service de la confiance</h2></div><Youtube className="text-[#A86735]"/></div><div className="mt-5 grid gap-4 md:grid-cols-3">{videos.map(v=><article key={v.titre} className="overflow-hidden rounded-2xl border border-[#E2D6C2] bg-[#FFFDF8]"><div className="grid aspect-video place-items-center bg-[#173C3A] text-white"><span className="grid h-14 w-14 place-items-center rounded-full bg-[#D99054]"><Youtube/></span></div><div className="p-5"><p className="text-xs text-[#8D5B30]">{v.public} · {v.duree}</p><h3 className="mt-2 font-semibold">{v.titre}</h3><p className="mt-2 text-xs leading-5 text-[#6D6258]">Emplacement de démonstration. La vidéo définitive sera reliée à la chaîne officielle Escale après validation.</p></div></article>)}</div></section>

 <section className="mt-8 rounded-3xl bg-[#173C3A] p-6 text-white"><h2 className="font-serif text-2xl">Réseaux sociaux</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-[#C8D8D4]">Les boutons sont préparés visuellement mais restent volontairement sans URL tant que les comptes officiels Escale ne sont pas confirmés. Aucun faux lien n’est publié.</p><div className="mt-5 flex flex-wrap gap-3">{[[Instagram,"Instagram"],[Facebook,"Facebook"],[Youtube,"YouTube"]].map(([I,t])=><span key={t} className="inline-flex items-center gap-2 rounded-xl border border-white/20 px-4 py-2.5 text-sm"><I size={17}/>{t}</span>)}</div></section>
 </div></main>}
