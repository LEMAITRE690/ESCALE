import Link from "next/link";
import { ArrowRight, BadgeEuro, CalendarDays, Check, FileText, Heart, MapPin, Search, ShieldCheck, Sparkles, Star, Users, Wallet } from "lucide-react";

const demoListings = [
  { title: "Villa des Oliviers", place: "Luberon, Provence", guests: 6, beds: 3, rating: "4,9", oldPrice: 210, price: 199, image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=85" },
  { title: "Maison Océan", place: "Guéthary, Pays basque", guests: 5, beds: 3, rating: "4,8", oldPrice: 185, price: 175, image: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=85" },
  { title: "Chalet des Cimes", place: "Chamonix, Haute-Savoie", guests: 8, beds: 4, rating: "5,0", oldPrice: 265, price: 249, image: "https://images.unsplash.com/photo-1544984243-ec57ea16fe25?auto=format&fit=crop&w=1200&q=85" },
  { title: "Bergerie du Maquis", place: "Porto-Vecchio, Corse", guests: 4, beds: 2, rating: "4,9", oldPrice: 230, price: 218, image: "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1200&q=85" },
  { title: "Loft des Quais", place: "Bordeaux centre", guests: 2, beds: 1, rating: "4,7", oldPrice: 145, price: 137, image: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1200&q=85" },
  { title: "Maison du Lac", place: "Annecy, Haute-Savoie", guests: 6, beds: 3, rating: "4,9", oldPrice: 240, price: 228, image: "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?auto=format&fit=crop&w=1200&q=85" },
];

export default function VoyageursPage() {
  return (
    <main className="min-h-screen bg-[#F8F4EC] text-[#173C3A]">
      <header className="sticky top-0 z-40 border-b border-[#E8DECA] bg-[#F8F4EC]/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5">
          <Link href="/" className="flex items-center gap-2 font-serif text-xl"><span className="grid h-9 w-9 place-items-center rounded-xl bg-[#173C3A] text-[#D99054]">E</span>Escale</Link>
          <nav className="hidden gap-6 text-sm text-[#6D6258] md:flex"><a href="#escales">Explorer</a><a href="#prix-juste">Prix Juste</a><a href="#confiance">Comment ça marche</a></nav>
          <div className="flex items-center gap-4 text-sm"><Link href="/" className="hidden sm:block">Je suis hôte</Link><Link href="/connexion" className="rounded-xl bg-[#173C3A] px-4 py-2.5 text-white">Se connecter</Link></div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-5 pb-10 pt-14 md:pt-20">
        <div className="max-w-4xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#DFCDB0] bg-[#F2E9DA] px-3 py-1.5 text-xs font-medium uppercase tracking-[.15em] text-[#8D5B30]"><Sparkles size={13}/> Le Prix Juste Escale</div>
          <h1 className="mt-5 font-serif text-5xl leading-[1.02] md:text-7xl">Trouvez votre prochaine Escale. <span className="text-[#A86735]">Pas les frais qui vont avec.</span></h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-[#6D6258]">De beaux logements, une relation plus directe avec l’hôte et des prix encouragés à être plus attractifs que sur les grandes plateformes, sans renoncer à la sécurité.</p>
        </div>

        <div className="mt-9 grid gap-3 rounded-3xl border border-[#E2D6C2] bg-white p-4 shadow-sm md:grid-cols-[1.3fr_1fr_1fr_auto] md:p-3">
          <div className="rounded-2xl bg-[#F8F4EC] p-4"><p className="text-xs uppercase tracking-wider text-[#8D5B30]">Destination</p><div className="mt-1 flex items-center gap-2"><MapPin size={17}/><span>Où voulez-vous partir ?</span></div></div>
          <div className="rounded-2xl bg-[#F8F4EC] p-4"><p className="text-xs uppercase tracking-wider text-[#8D5B30]">Dates</p><div className="mt-1 flex items-center gap-2"><CalendarDays size={17}/><span>Ajouter des dates</span></div></div>
          <div className="rounded-2xl bg-[#F8F4EC] p-4"><p className="text-xs uppercase tracking-wider text-[#8D5B30]">Voyageurs</p><div className="mt-1 flex items-center gap-2"><Users size={17}/><span>2 voyageurs</span></div></div>
          <Link href="/recherche" className="flex items-center justify-center gap-2 rounded-2xl bg-[#173C3A] px-6 py-4 font-medium text-white"><Search size={18}/> Rechercher</Link>
        </div>
        <div className="mt-5 flex flex-wrap gap-5 text-sm text-[#6D6258]"><span className="flex gap-2"><ShieldCheck size={16}/> Paiement sécurisé</span><span className="flex gap-2"><FileText size={16}/> Contrat clair</span><span className="flex gap-2"><BadgeEuro size={16}/> Prix Juste Escale</span></div>
      </section>

      <section id="escales" className="mx-auto max-w-7xl px-5 py-12">
        <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end"><div><p className="text-sm font-medium uppercase tracking-[.15em] text-[#A86735]">Nos Escales du moment</p><h2 className="mt-2 font-serif text-4xl">Des lieux qui donnent envie de partir.</h2></div><p className="max-w-lg text-sm leading-6 text-[#6D6258]">Annonces et visuels de démonstration destinés à illustrer l’expérience Escale.</p></div>
        <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {demoListings.map((item) => {
            const saving = item.oldPrice - item.price;
            return <article key={item.title} className="group overflow-hidden rounded-3xl border border-[#E2D6C2] bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
              <div className="relative h-64 overflow-hidden bg-[#E9E1D4]"><img src={item.image} alt={item.title} className="h-full w-full object-cover transition duration-500 group-hover:scale-105"/><span className="absolute left-4 top-4 rounded-full bg-white/95 px-3 py-1.5 text-xs font-semibold text-[#173C3A] shadow">✓ Prix Juste Escale</span><button aria-label="Ajouter aux favoris" className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full bg-white/95"><Heart size={17}/></button></div>
              <div className="p-5"><div className="flex items-start justify-between gap-3"><div><h3 className="text-xl font-semibold">{item.title}</h3><p className="mt-1 text-sm text-[#6D6258]">{item.place}</p></div><div className="flex items-center gap-1 text-sm"><Star size={15} fill="currentColor"/> {item.rating}</div></div><p className="mt-3 text-sm text-[#6D6258]">{item.guests} voyageurs · {item.beds} chambres</p><div className="mt-5 flex items-end justify-between gap-3"><div><p className="text-sm text-[#8A7C70] line-through">{item.oldPrice} €/nuit</p><p className="text-2xl font-semibold">{item.price} € <span className="text-sm font-normal text-[#6D6258]">/ nuit</span></p></div><div className="rounded-xl bg-[#F1E7D6] px-3 py-2 text-right"><p className="text-xs text-[#6D6258]">Vous économisez</p><p className="font-semibold text-[#A86735]">{saving} €/nuit</p></div></div></div>
            </article>;
          })}
        </div>
        <div className="mt-8 text-center"><Link href="/recherche" className="inline-flex items-center gap-2 rounded-xl border border-[#CDBD9E] px-5 py-3 font-medium">Voir tous les logements <ArrowRight size={16}/></Link></div>
      </section>

      <section id="prix-juste" className="border-y border-[#E8DECA] bg-[#F1E7D6] py-16"><div className="mx-auto grid max-w-7xl gap-10 px-5 lg:grid-cols-[1fr_.9fr]"><div><p className="text-sm font-medium uppercase tracking-[.15em] text-[#A86735]">Pourquoi c’est moins cher ?</p><h2 className="mt-3 font-serif text-4xl">Le même séjour. Un prix plus juste.</h2><p className="mt-4 max-w-2xl leading-7 text-[#6D6258]">Escale fonctionne avec un modèle de frais plus léger et encourage les hôtes à partager une partie de cette économie avec leurs voyageurs. Le Prix Juste n’est pas une promesse abstraite : il doit se voir sur le prix affiché.</p><div className="mt-7 grid gap-4 sm:grid-cols-3">{[[BadgeEuro,"Prix plus attractif","Les hôtes sont encouragés à afficher un meilleur tarif sur Escale."],[ShieldCheck,"Toujours sécurisé","Le paiement reste encadré même lorsque le prix baisse."],[Wallet,"Économie partagée","Le voyageur paie moins et l’hôte peut préserver sa marge."]].map(([Icon,t,d])=><div key={t} className="rounded-2xl bg-white/70 p-5"><Icon className="text-[#A86735]"/><h3 className="mt-3 font-semibold">{t}</h3><p className="mt-2 text-sm leading-6 text-[#6D6258]">{d}</p></div>)}</div></div><div className="rounded-3xl bg-[#173C3A] p-7 text-white"><p className="text-sm text-[#C8D8D4]">EXEMPLE PRIX JUSTE</p><div className="mt-6 grid gap-3"><div className="rounded-2xl bg-white/10 p-5"><p className="text-sm text-[#C8D8D4]">Autre plateforme</p><p className="mt-1 text-3xl font-semibold">500 €</p></div><div className="rounded-2xl bg-[#D99054] p-5"><p className="text-sm">Même séjour sur Escale</p><p className="mt-1 text-3xl font-semibold">475 €</p></div></div><p className="mt-5 text-xl font-semibold">25 € restent dans votre budget vacances.</p><p className="mt-3 text-xs leading-5 text-[#C8D8D4]">Exemple pédagogique. Le prix réel dépend de chaque hôte, des dates et des conditions du séjour.</p></div></div></section>

      <section id="confiance" className="mx-auto max-w-7xl px-5 py-16"><div className="grid gap-10 lg:grid-cols-[.9fr_1.1fr]"><div><p className="text-sm font-medium uppercase tracking-[.15em] text-[#A86735]">Réserver sereinement</p><h2 className="mt-3 font-serif text-4xl">Le prix compte. La confiance aussi.</h2><p className="mt-4 leading-7 text-[#6D6258]">Un meilleur prix ne doit pas signifier un parcours au rabais. Escale garde un cadre clair avant, pendant et après la réservation.</p></div><div className="grid gap-3 sm:grid-cols-2">{[[Search,"Choisissez","Trouvez le logement qui correspond vraiment à votre séjour."],[FileText,"Comprenez","Les conditions sont posées dans un contrat lié à la réservation."],[ShieldCheck,"Payez","Le parcours de paiement est conçu pour sécuriser la transaction."],[Check,"Profitez","Vous savez qui vous accueille, ce qui est inclus et ce que vous payez."]].map(([Icon,t,d])=><div key={t} className="rounded-2xl border border-[#E2D6C2] bg-white/50 p-5"><Icon className="text-[#A86735]"/><h3 className="mt-3 font-semibold">{t}</h3><p className="mt-2 text-sm leading-6 text-[#6D6258]">{d}</p></div>)}</div></div></section>

      <section className="bg-[#173C3A] py-16 text-white"><div className="mx-auto max-w-4xl px-5 text-center"><h2 className="font-serif text-4xl">Votre prochaine Escale est peut-être déjà là.</h2><p className="mx-auto mt-4 max-w-2xl leading-7 text-[#C8D8D4]">Explorez les logements, comparez les prix et choisissez une réservation plus directe et plus transparente.</p><Link href="/recherche" className="mt-7 inline-flex items-center gap-2 rounded-xl bg-[#D99054] px-5 py-3 font-medium">Explorer les logements <ArrowRight size={16}/></Link></div></section>
    </main>
  );
}
