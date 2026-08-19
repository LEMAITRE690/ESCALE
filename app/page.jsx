"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight, BarChart3, Check, ChevronDown, FileText,
  LayoutDashboard, Lock, Menu, MessageCircle, ShieldCheck,
  Sparkles, Users, Wallet, X, Zap
} from "lucide-react";
import {
  COMMISSION_RATE_TTC,
  SUBSCRIPTION_FEE_TTC,
  SUBSCRIPTION_RATE_TTC,
  formatEuros,
  formatTaux,
} from "@/lib/pricing";

const proTools = [
  "CRM voyageurs et historique client 360°",
  "Tableau de bord chiffre d’affaires et rentabilité",
  "Gestion des charges par logement",
  "Calendrier et réservations centralisés",
  "Documents, contrats et factures regroupés",
  "Suivi des paiements et reversements",
  "Automatisations et relances voyageurs",
  "Segmentation clients et fidélisation",
];

const essentielTools = [
  "Publication et gestion des annonces",
  "Réservations sécurisées",
  "Paiement protégé",
  "Messagerie hôte-voyageur",
  "Calendrier de base",
  "Contrats et documents essentiels",
];

const faq = [
  {
    q: "Puis-je commencer sans abonnement ?",
    r: `Oui. Escale Essentiel fonctionne sans abonnement avec ${formatTaux(COMMISSION_RATE_TTC)} TTC prélevés uniquement sur les réservations confirmées.`,
  },
  {
    q: "À quoi sert vraiment Escale Pro ?",
    r: `Escale Pro ne se limite pas à une commission réduite à ${formatTaux(SUBSCRIPTION_RATE_TTC)} TTC. Il ajoute le CRM, le pilotage financier, les outils de gestion, les automatisations, le suivi client et les fonctions avancées destinées aux propriétaires qui veulent structurer leur activité.`,
  },
  {
    q: "Pourquoi proposer un tarif plus bas sur Escale ?",
    r: "Une partie de l’économie réalisée sur les frais de plateforme peut être partagée avec le voyageur. Vous pouvez ainsi afficher un tarif plus attractif tout en vérifiant, grâce au simulateur, que votre revenu net reste supérieur.",
  },
  {
    q: "Quand l’hôte reçoit-il son argent ?",
    r: "Le système est conçu pour déclencher le reversement après le séjour selon les règles de sécurité prévues et en l’absence de litige bloquant.",
  },
  {
    q: "Puis-je gérer plusieurs logements ?",
    r: "Oui. Le CRM et les tableaux de bord sont pensés pour filtrer et comparer l’activité par logement, avec une vision consolidée de l’ensemble du portefeuille.",
  },
];

const euros = (value) => new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
}).format(value);

export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [faqOpen, setFaqOpen] = useState(0);
  const [annualBookings, setAnnualBookings] = useState(30000);
  const [competitorRate, setCompetitorRate] = useState(15);
  const [travelerDiscount, setTravelerDiscount] = useState(5);
  const [formula, setFormula] = useState("pro");

  const simulation = useMemo(() => {
    const competitorRateDecimal = competitorRate / 100;
    const discountDecimal = travelerDiscount / 100;
    const escaleBookings = annualBookings * (1 - discountDecimal);
    const competitorFees = annualBookings * competitorRateDecimal;
    const competitorNet = annualBookings - competitorFees;

    const essentielFees = escaleBookings * COMMISSION_RATE_TTC;
    const essentielNet = escaleBookings - essentielFees;
    const proFees = escaleBookings * SUBSCRIPTION_RATE_TTC + SUBSCRIPTION_FEE_TTC * 12;
    const proNet = escaleBookings - proFees;

    const selectedFees = formula === "pro" ? proFees : essentielFees;
    const selectedNet = formula === "pro" ? proNet : essentielNet;
    const travelerSaving = annualBookings - escaleBookings;
    const hostGain = selectedNet - competitorNet;
    const proExtraGain = proNet - essentielNet;

    return {
      escaleBookings,
      competitorFees,
      competitorNet,
      essentielFees,
      essentielNet,
      proFees,
      proNet,
      selectedFees,
      selectedNet,
      travelerSaving,
      hostGain,
      proExtraGain,
    };
  }, [annualBookings, competitorRate, travelerDiscount, formula]);

  return (
    <main className="min-h-screen bg-[#F8F4EC] text-[#173C3A]">
      <header className="sticky top-0 z-40 border-b border-[#E8DECA] bg-[#F8F4EC]/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5">
          <Link href="/" className="flex items-center gap-2 font-serif text-xl">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#173C3A] text-[#D99054]">E</span>
            Escale
          </Link>
          <nav className="hidden items-center gap-7 text-sm text-[#6D6258] md:flex">
            <a href="#offres">Nos offres</a>
            <a href="#pro">Escale Pro</a>
            <a href="#simulateur">Simulateur</a>
            <a href="#securite">Sécurité</a>
          </nav>
          <div className="hidden items-center gap-3 md:flex">
            <Link href="/connexion" className="text-sm text-[#6D6258]">Se connecter</Link>
            <Link href="/hote" className="rounded-xl bg-[#173C3A] px-4 py-2.5 text-sm font-medium text-white">Devenir hôte</Link>
          </div>
          <button className="md:hidden" onClick={() => setMenuOpen(v => !v)} aria-label="Menu">
            {menuOpen ? <X size={22}/> : <Menu size={22}/>} 
          </button>
        </div>
        {menuOpen && (
          <div className="border-t border-[#E8DECA] px-5 py-4 md:hidden">
            <div className="flex flex-col gap-3 text-sm">
              <a href="#offres" onClick={() => setMenuOpen(false)}>Nos offres</a>
              <a href="#pro" onClick={() => setMenuOpen(false)}>Escale Pro</a>
              <a href="#simulateur" onClick={() => setMenuOpen(false)}>Simulateur</a>
              <a href="#securite" onClick={() => setMenuOpen(false)}>Sécurité</a>
              <Link href="/hote" className="mt-2 rounded-xl bg-[#173C3A] px-4 py-3 text-center text-white">Devenir hôte</Link>
            </div>
          </div>
        )}
      </header>

      <section className="mx-auto grid max-w-7xl gap-12 px-5 py-16 md:grid-cols-[1.1fr_.9fr] md:py-24">
        <div>
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#DFCDB0] bg-[#F2E9DA] px-3 py-1.5 text-xs font-medium uppercase tracking-[.15em] text-[#8D5B30]">
            <Sparkles size={13}/> Plateforme + outils de gestion
          </div>
          <h1 className="max-w-3xl font-serif text-5xl leading-[1.04] md:text-6xl">
            Louez en direct. Gardez le contrôle. <span className="text-[#A86735]">Escale s’occupe du reste.</span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-[#6D6258]">
            Une plateforme de réservation sécurisée pour vos voyageurs, et un véritable poste de pilotage pour vos locations. Commencez sans abonnement, puis passez à Pro quand votre activité grandit.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href="#offres" className="inline-flex items-center gap-2 rounded-xl bg-[#173C3A] px-5 py-3 font-medium text-white">Comparer les offres <ArrowRight size={16}/></a>
            <a href="#simulateur" className="rounded-xl border border-[#CCB999] px-5 py-3 font-medium">Simuler mes économies</a>
          </div>
          <div className="mt-8 flex flex-wrap gap-5 text-sm text-[#6D6258]">
            <span className="flex items-center gap-2"><ShieldCheck size={16}/> Paiement sécurisé</span>
            <span className="flex items-center gap-2"><MessageCircle size={16}/> Relation directe</span>
            <span className="flex items-center gap-2"><Wallet size={16}/> Reversement automatisable</span>
          </div>
        </div>

        <div className="rounded-3xl bg-[#173C3A] p-6 text-white md:p-8">
          <div className="flex items-center justify-between">
            <div><p className="text-sm text-[#C8D8D4]">Cockpit propriétaire</p><h2 className="mt-1 text-2xl font-semibold">Votre activité en un coup d’œil</h2></div>
            <LayoutDashboard className="text-[#D99054]"/>
          </div>
          <div className="mt-8 grid grid-cols-2 gap-3">
            {[['CA du mois','8 420 €'],['À recevoir','2 180 €'],['Arrivées','3 aujourd’hui'],['Clients CRM','148']].map(([l,v]) => (
              <div key={l} className="rounded-2xl bg-white/10 p-4"><p className="text-xs text-[#BFD0CD]">{l}</p><p className="mt-2 text-xl font-semibold">{v}</p></div>
            ))}
          </div>
          <div className="mt-4 rounded-2xl bg-[#244E4B] p-4">
            <p className="text-xs uppercase tracking-wider text-[#BFD0CD]">À faire</p>
            <div className="mt-3 space-y-2 text-sm">
              <p>✓ 2 contrats signés</p><p>• 1 paiement en attente de reversement</p><p>• 3 voyageurs à relancer pour septembre</p>
            </div>
          </div>
        </div>
      </section>

      <section id="offres" className="border-y border-[#E8DECA] bg-white/45 py-16">
        <div className="mx-auto max-w-7xl px-5">
          <div className="max-w-3xl">
            <p className="text-sm font-medium uppercase tracking-[.15em] text-[#A86735]">Deux façons de travailler avec Escale</p>
            <h2 className="mt-3 font-serif text-4xl">Démarrez simplement. Équipez-vous quand cela devient rentable.</h2>
          </div>
          <div className="mt-10 grid gap-6 lg:grid-cols-2">
            <article className="rounded-3xl border border-[#DCCFB8] bg-[#FBF8F2] p-7">
              <p className="text-sm font-medium text-[#6D6258]">ESCALE ESSENTIEL</p>
              <div className="mt-3 flex items-end gap-2"><span className="text-5xl font-semibold">{formatTaux(COMMISSION_RATE_TTC)}</span><span className="pb-1 text-[#6D6258]">TTC / réservation</span></div>
              <p className="mt-3 text-[#6D6258]">Sans abonnement. Idéal pour tester Escale ou louer occasionnellement.</p>
              <ul className="mt-6 space-y-3">{essentielTools.map(x => <li key={x} className="flex gap-2"><Check size={18} className="mt-0.5 text-[#A86735]"/>{x}</li>)}</ul>
              <Link href="/hote" className="mt-8 block rounded-xl border border-[#BFAF92] px-4 py-3 text-center font-medium">Commencer sans abonnement</Link>
            </article>

            <article id="pro" className="relative rounded-3xl bg-[#173C3A] p-7 text-white">
              <span className="absolute right-5 top-5 rounded-full bg-[#D99054] px-3 py-1 text-xs font-semibold text-white">Le choix des hôtes actifs</span>
              <p className="text-sm font-medium text-[#C8D8D4]">ESCALE PRO</p>
              <div className="mt-3 flex flex-wrap items-end gap-x-2 gap-y-1"><span className="text-5xl font-semibold">{formatTaux(SUBSCRIPTION_RATE_TTC)}</span><span className="pb-1 text-[#C8D8D4]">TTC / réservation</span></div>
              <p className="mt-1 text-sm text-[#C8D8D4]">+ {formatEuros(SUBSCRIPTION_FEE_TTC)} / mois</p>
              <p className="mt-4 text-[#DCE7E4]">La suite de gestion complète pour piloter, automatiser et développer votre activité.</p>
              <ul className="mt-6 grid gap-3 sm:grid-cols-2">{proTools.map(x => <li key={x} className="flex gap-2 text-sm"><Check size={17} className="mt-0.5 shrink-0 text-[#D99054]"/>{x}</li>)}</ul>
              <Link href="/hote" className="mt-8 block rounded-xl bg-white px-4 py-3 text-center font-semibold text-[#173C3A]">Passer à Escale Pro</Link>
            </article>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-16">
        <div className="grid gap-5 md:grid-cols-3">
          {[
            [Users,"Transformez vos voyageurs en clients","Historique, segmentation, notes et fidélisation : vous construisez votre propre capital client."],
            [BarChart3,"Pilotez la vraie rentabilité","CA, charges, montants à recevoir et performance par logement dans un même tableau de bord."],
            [Zap,"Automatisez le quotidien","Relances, documents, paiements et tâches récurrentes sont progressivement automatisés pour réduire l’administratif."],
          ].map(([Icon,t,d]) => <div key={t} className="rounded-2xl border border-[#E2D6C2] p-6"><Icon className="text-[#A86735]"/><h3 className="mt-4 text-xl font-semibold">{t}</h3><p className="mt-2 leading-7 text-[#6D6258]">{d}</p></div>)}
        </div>
      </section>

      <section id="simulateur" className="bg-[#EFE6D7] py-16">
        <div className="mx-auto max-w-7xl px-5">
          <div className="max-w-3xl">
            <p className="text-sm font-medium uppercase tracking-[.15em] text-[#A86735]">Simulateur commercial</p>
            <h2 className="mt-3 font-serif text-4xl">Soyez moins cher pour le voyageur, sans sacrifier votre revenu.</h2>
            <p className="mt-4 leading-7 text-[#6D6258]">Comparez votre plateforme actuelle à Escale. Par défaut, le simulateur applique un tarif Escale inférieur de 5 % pour rendre votre offre plus attractive, puis mesure ce qu’il vous reste réellement.</p>
          </div>

          <div className="mt-9 grid gap-6 lg:grid-cols-[.9fr_1.1fr]">
            <div className="rounded-3xl bg-white p-6 md:p-7">
              <p className="text-sm font-semibold">1. Choisissez votre formule Escale</p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <button type="button" onClick={() => setFormula("essentiel")} className={`rounded-xl border px-4 py-3 text-left ${formula === "essentiel" ? "border-[#173C3A] bg-[#E8F0ED]" : "border-[#DDD1BC]"}`}>
                  <span className="block text-sm font-semibold">Essentiel</span>
                  <span className="text-xs text-[#6D6258]">{formatTaux(COMMISSION_RATE_TTC)} TTC, sans abonnement</span>
                </button>
                <button type="button" onClick={() => setFormula("pro")} className={`rounded-xl border px-4 py-3 text-left ${formula === "pro" ? "border-[#173C3A] bg-[#E8F0ED]" : "border-[#DDD1BC]"}`}>
                  <span className="block text-sm font-semibold">Pro</span>
                  <span className="text-xs text-[#6D6258]">{formatTaux(SUBSCRIPTION_RATE_TTC)} TTC + {formatEuros(SUBSCRIPTION_FEE_TTC)}/mois</span>
                </button>
              </div>

              <label className="mt-6 block text-sm font-medium" htmlFor="annualBookings">Votre volume annuel actuel : {euros(annualBookings)}</label>
              <input id="annualBookings" type="range" min="5000" max="200000" step="1000" value={annualBookings} onChange={e => setAnnualBookings(Number(e.target.value))} className="mt-3 w-full"/>

              <label className="mt-6 block text-sm font-medium" htmlFor="competitorRate">Frais de votre plateforme actuelle : {competitorRate} %</label>
              <input id="competitorRate" type="range" min="5" max="25" step="0.5" value={competitorRate} onChange={e => setCompetitorRate(Number(e.target.value))} className="mt-3 w-full"/>

              <label className="mt-6 block text-sm font-medium" htmlFor="travelerDiscount">Tarif Escale moins cher pour le voyageur : {travelerDiscount} %</label>
              <input id="travelerDiscount" type="range" min="0" max="10" step="0.5" value={travelerDiscount} onChange={e => setTravelerDiscount(Number(e.target.value))} className="mt-3 w-full"/>
              <p className="mt-2 text-xs leading-5 text-[#7B7066]">5 % est notre hypothèse commerciale de départ. Le curseur reste libre pour tester votre propre stratégie tarifaire.</p>
            </div>

            <div className="rounded-3xl bg-[#173C3A] p-6 text-white md:p-7">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div><p className="text-sm text-[#C8D8D4]">Résultat annuel estimé</p><h3 className="mt-1 text-2xl font-semibold">Votre marge, après partage de l’économie</h3></div>
                <span className="rounded-full bg-white/10 px-3 py-1 text-xs">Escale {formula === "pro" ? "Pro" : "Essentiel"}</span>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl bg-white/10 p-4"><p className="text-xs text-[#C8D8D4]">Revenu net plateforme actuelle</p><p className="mt-1 text-2xl font-semibold">{euros(simulation.competitorNet)}</p><p className="mt-1 text-xs text-[#C8D8D4]">Frais estimés : {euros(simulation.competitorFees)}</p></div>
                <div className="rounded-2xl bg-white p-4 text-[#173C3A]"><p className="text-xs text-[#6D6258]">Revenu net avec Escale</p><p className="mt-1 text-2xl font-semibold">{euros(simulation.selectedNet)}</p><p className="mt-1 text-xs text-[#6D6258]">Frais Escale : {euros(simulation.selectedFees)}</p></div>
                <div className="rounded-2xl bg-[#244E4B] p-4"><p className="text-xs text-[#C8D8D4]">Économie offerte aux voyageurs</p><p className="mt-1 text-2xl font-semibold">{euros(simulation.travelerSaving)}</p><p className="mt-1 text-xs text-[#C8D8D4]">sur le volume annuel simulé</p></div>
                <div className={`rounded-2xl p-4 ${simulation.hostGain >= 0 ? "bg-[#D99054]" : "bg-[#6E4438]"}`}><p className="text-xs text-white/80">Gain net pour l’hôte</p><p className="mt-1 text-2xl font-semibold">{simulation.hostGain >= 0 ? "+" : ""}{euros(simulation.hostGain)}</p><p className="mt-1 text-xs text-white/80">après la remise voyageur</p></div>
              </div>

              <div className="mt-5 rounded-2xl border border-white/15 p-4 text-sm leading-6">
                {simulation.hostGain >= 0 ? (
                  <p><strong>Le voyageur paie moins et vous conservez plus.</strong> Dans cette simulation, vous baissez votre prix de {travelerDiscount} % tout en améliorant votre revenu net annuel de {euros(simulation.hostGain)}.</p>
                ) : (
                  <p><strong>Cette remise est trop forte pour ces paramètres.</strong> Réduisez légèrement la remise voyageur, choisissez Pro ou ajustez le taux de frais de votre plateforme actuelle.</p>
                )}
                {formula === "essentiel" && simulation.proExtraGain > 0 && (
                  <p className="mt-3 text-[#F7D5B8]">À ce niveau d’activité, passer à <strong>Escale Pro</strong> ajouterait encore environ {euros(simulation.proExtraGain)} de revenu net par an, avec les outils CRM et de pilotage inclus.</p>
                )}
              </div>
              <p className="mt-4 text-xs leading-5 text-[#BFD0CD]">Simulation indicative fondée sur les paramètres renseignés. Les frais et modèles tarifaires des plateformes concurrentes peuvent varier. Les coûts spécifiques de moyens de paiement ou options ne sont pas inclus dans cette comparaison.</p>
            </div>
          </div>
        </div>
      </section>

      <section id="securite" className="mx-auto max-w-7xl px-5 py-16">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div><p className="text-sm font-medium uppercase tracking-[.15em] text-[#A86735]">Paiement & confiance</p><h2 className="mt-3 font-serif text-4xl">La simplicité devant. La plomberie financière derrière.</h2><p className="mt-4 leading-7 text-[#6D6258]">Le voyageur bénéficie d’un parcours lisible. Côté hôte, Escale orchestre le suivi du paiement, des fonds sécurisés, des reversements et des exceptions, sans transformer le propriétaire en comptable ou technicien.</p></div>
          <div className="grid gap-3 sm:grid-cols-2">
            {[[Lock,"Paiement sécurisé"],[ShieldCheck,"Contrôles avant reversement"],[Wallet,"Suivi des fonds"],[FileText,"Traçabilité documentaire"]].map(([Icon,l]) => <div key={l} className="rounded-2xl border border-[#E2D6C2] p-5"><Icon className="text-[#A86735]"/><p className="mt-3 font-medium">{l}</p></div>)}
          </div>
        </div>
      </section>

      <section className="border-y border-[#E8DECA] bg-white/40 py-16">
        <div className="mx-auto max-w-4xl px-5">
          <h2 className="text-center font-serif text-4xl">Questions fréquentes</h2>
          <div className="mt-8 divide-y divide-[#E1D5C2]">
            {faq.map((item,i)=><div key={item.q} className="py-4"><button className="flex w-full items-center justify-between gap-4 text-left font-medium" onClick={()=>setFaqOpen(faqOpen===i?-1:i)}>{item.q}<ChevronDown size={18} className={faqOpen===i?"rotate-180 transition":"transition"}/></button>{faqOpen===i&&<p className="mt-3 max-w-3xl leading-7 text-[#6D6258]">{item.r}</p>}</div>)}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-16 text-center">
        <h2 className="font-serif text-4xl">Votre activité peut rester simple, même quand elle grandit.</h2>
        <p className="mx-auto mt-4 max-w-2xl leading-7 text-[#6D6258]">Commencez avec Escale Essentiel. Passez à Pro lorsque vous voulez transformer votre location en activité réellement pilotée.</p>
        <div className="mt-7 flex justify-center gap-3"><Link href="/hote" className="rounded-xl bg-[#173C3A] px-5 py-3 font-medium text-white">Créer mon espace hôte</Link><Link href="/recherche" className="rounded-xl border border-[#CDBB9B] px-5 py-3 font-medium">Voir les logements</Link></div>
      </section>

      <footer className="border-t border-[#E8DECA] px-5 py-8 text-center text-sm text-[#746A61]">© Escale · Location directe, gestion maîtrisée.</footer>
    </main>
  );
}
