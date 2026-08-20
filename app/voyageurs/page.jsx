import Link from "next/link";
import { ArrowRight, BadgeEuro, Check, FileText, Search, ShieldCheck, Sparkles, Wallet } from "lucide-react";

export default function VoyageursPage() {
  return (
    <main className="min-h-screen bg-[#F8F4EC] text-[#173C3A]">
      <header className="border-b border-[#E8DECA] bg-[#F8F4EC]">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5">
          <Link href="/" className="flex items-center gap-2 font-serif text-xl"><span className="grid h-9 w-9 place-items-center rounded-xl bg-[#173C3A] text-[#D99054]">E</span>Escale</Link>
          <div className="flex items-center gap-4 text-sm"><Link href="/">Vous êtes hôte ?</Link><Link href="/connexion" className="rounded-xl bg-[#173C3A] px-4 py-2.5 text-white">Se connecter</Link></div>
        </div>
      </header>

      <section className="mx-auto grid max-w-7xl gap-12 px-5 py-20 lg:grid-cols-[1.08fr_.92fr]">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-[#DFCDB0] bg-[#F2E9DA] px-3 py-1.5 text-xs font-medium uppercase tracking-[.15em] text-[#8D5B30]"><Sparkles size={13}/> Le Prix Juste Escale</div>
          <h1 className="mt-5 max-w-3xl font-serif text-5xl leading-[1.04] md:text-6xl">Le même séjour. <span className="text-[#A86735]">Un prix plus juste.</span></h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-[#6D6258]">Escale réduit les frais qui pèsent sur la réservation et encourage les hôtes à partager une partie de cette économie avec vous. Vous profitez ainsi d’un prix plus attractif, sans renoncer au paiement sécurisé ni au cadre de réservation.</p>
          <div className="mt-8 flex flex-wrap gap-3"><Link href="/recherche" className="inline-flex items-center gap-2 rounded-xl bg-[#173C3A] px-5 py-3 font-medium text-white">Découvrir les logements <ArrowRight size={16}/></Link><a href="#prix-juste" className="rounded-xl border border-[#CCB999] px-5 py-3 font-medium">Comprendre le Prix Juste</a></div>
        </div>
        <div className="rounded-3xl bg-[#173C3A] p-7 text-white">
          <p className="text-sm text-[#C8D8D4]">EXEMPLE DE PRIX JUSTE</p><h2 className="mt-2 text-2xl font-semibold">Une économie visible dès la réservation.</h2>
          <div className="mt-7 space-y-3"><div className="rounded-2xl bg-white/10 p-5"><p className="text-sm text-[#BFD0CD]">Prix du séjour sur un autre canal</p><p className="mt-1 text-3xl font-semibold">500 €</p></div><div className="rounded-2xl bg-[#D99054] p-5"><p className="text-sm">Prix indicatif avec -5 % sur Escale</p><p className="mt-1 text-3xl font-semibold">475 €</p></div></div>
          <p className="mt-5 text-lg font-semibold">Vous économisez 25 €.</p><p className="mt-2 text-sm leading-6 text-[#C8D8D4]">Exemple pédagogique, sous réserve du tarif réellement choisi par l’hôte et des conditions du séjour.</p>
        </div>
      </section>

      <section id="prix-juste" className="border-y border-[#E8DECA] bg-white/45 py-16"><div className="mx-auto max-w-7xl px-5"><p className="text-sm font-medium uppercase tracking-[.15em] text-[#A86735]">Notre philosophie</p><h2 className="mt-3 max-w-3xl font-serif text-4xl">Moins de frais pour l’hôte. Un meilleur prix pour le voyageur.</h2><p className="mt-4 max-w-3xl leading-7 text-[#6D6258]">Nous ne voulons pas que l’économie créée par Escale profite à un seul côté de la réservation. Notre modèle encourage un partage : l’hôte peut préserver sa marge et le voyageur peut bénéficier d’un tarif plus compétitif.</p><div className="mt-9 grid gap-4 md:grid-cols-3">{[[BadgeEuro,"Un tarif plus compétitif","Les hôtes sont encouragés à proposer sur Escale un prix inférieur à celui qu’ils pratiquent sur les plateformes traditionnelles."],[ShieldCheck,"La sécurité reste là","Un meilleur prix ne signifie pas moins de protection : paiement sécurisé et cadre de réservation restent au cœur du parcours."],[Wallet,"Une économie partagée","L’objectif est simple : que le voyageur paie moins tout en permettant à l’hôte de conserver davantage de son revenu."]].map(([Icon,t,d])=><article key={t} className="rounded-2xl border border-[#E2D6C2] bg-[#FBF8F2] p-6"><Icon className="text-[#A86735]"/><h3 className="mt-4 text-lg font-semibold">{t}</h3><p className="mt-2 text-sm leading-6 text-[#6D6258]">{d}</p></article>)}</div></div></section>

      <section className="mx-auto max-w-7xl px-5 py-16"><div className="grid gap-10 lg:grid-cols-2"><div><p className="text-sm font-medium uppercase tracking-[.15em] text-[#A86735]">Une réservation simple et encadrée</p><h2 className="mt-3 font-serif text-4xl">Le prix compte. La confiance aussi.</h2><p className="mt-4 leading-7 text-[#6D6258]">Escale ne se résume pas à une réduction de prix. La plateforme accompagne la relation entre vous et l’hôte avec les outils essentiels à une réservation claire.</p></div><div className="grid gap-3">{[[Search,"Trouvez un logement et échangez avec l’hôte."],[FileText,"Retrouvez les conditions du séjour dans un contrat personnalisable."],[ShieldCheck,"Réglez votre réservation dans un parcours de paiement sécurisé."],[Check,"Profitez du séjour avec des conditions définies clairement avant votre arrivée."]].map(([Icon,t])=><div key={t} className="flex gap-3 rounded-2xl border border-[#E2D6C2] bg-white/50 p-5"><Icon className="shrink-0 text-[#A86735]"/><p>{t}</p></div>)}</div></div></section>

      <section className="bg-[#173C3A] py-16 text-white"><div className="mx-auto max-w-4xl px-5 text-center"><h2 className="font-serif text-4xl">Cherchez votre prochaine Escale au prix juste.</h2><p className="mx-auto mt-4 max-w-2xl leading-7 text-[#C8D8D4]">Comparez, choisissez votre logement et profitez d’une relation plus directe avec votre hôte.</p><Link href="/recherche" className="mt-7 inline-flex items-center gap-2 rounded-xl bg-[#D99054] px-5 py-3 font-medium">Rechercher un séjour <ArrowRight size={16}/></Link></div></section>
    </main>
  );
}
