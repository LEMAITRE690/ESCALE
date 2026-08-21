import Link from "next/link";

const parcours = [
  { href: "/demo-voyageur", titre: "Voyageur", texte: "Recherche avancée, filtres, Prix Juste, favoris et préparation du tunnel de réservation." },
  { href: "/demo/hote", titre: "Hôte", texte: "Annonce, tarification, calendrier, réservation, contrat, paiement et CRM." },
  { href: "/demo/conciergerie", titre: "Conciergerie", texte: "Multi-propriétaires, multi-logements, planning, réservations et rétrocommissions." },
];

const controles = ["Cohérence visuelle PR11", "Responsive mobile / tablette / desktop", "États vide / chargement / erreur / succès", "Accessibilité clavier et contraste", "Navigation cohérente entre espaces", "Aucun merge vers main sans validation"];

export default function DemoHub(){
 return <main className="min-h-screen bg-[#F8F4EC] px-5 py-10 text-[#173C3A]"><div className="mx-auto max-w-6xl">
  <p className="text-xs uppercase tracking-[.18em] text-[#A86735]">Pré-production</p><h1 className="mt-2 font-serif text-4xl">Centre de démonstration Escale</h1><p className="mt-4 max-w-3xl leading-7 text-[#6D6258]">Ce centre regroupe les parcours à valider avant production. Chaque scénario doit pouvoir être testé avec des données fictives, sans toucher à la base stable.</p>
  <div className="mt-9 grid gap-5 md:grid-cols-3">{parcours.map(p=><Link href={p.href} key={p.titre} className="rounded-2xl border border-[#E2D6C2] bg-[#FFFDF8] p-6 transition hover:border-[#BFAF92]"><span className="text-xs uppercase tracking-wider text-[#8D5B30]">Démo</span><h2 className="mt-2 font-serif text-2xl">{p.titre}</h2><p className="mt-3 text-sm leading-6 text-[#6D6258]">{p.texte}</p><span className="mt-5 inline-block text-sm font-medium text-[#A86735]">Tester le parcours →</span></Link>)}</div>
  <section className="mt-10 rounded-2xl bg-[#173C3A] p-6 text-white"><h2 className="font-serif text-2xl">Contrôles transversaux</h2><div className="mt-5 grid gap-3 md:grid-cols-2">{controles.map(x=><div key={x} className="rounded-xl bg-white/10 p-4 text-sm text-[#E7F0EE]">{x}</div>)}</div></section>
 </div></main>;
}
