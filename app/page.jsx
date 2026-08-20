"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight, BarChart3, Check, ChevronDown, FileText, LayoutDashboard,
  Lock, Menu, MessageCircle, ShieldCheck, Sparkles, Users, Wallet, X, Zap,
  UserPlus, Send, Tags, BadgePercent, RefreshCw
} from "lucide-react";
import {
  COMMISSION_RATE_TTC,
  SUBSCRIPTION_FEE_TTC,
  SUBSCRIPTION_RATE_TTC,
  formatEuros,
  formatTaux,
} from "@/lib/pricing";

const essentielTools = [
  "Publication et gestion des annonces",
  "Paiement sécurisé et suivi des reversements",
  "Contrat personnalisable généré automatiquement",
  "Calendrier et synchronisation des disponibilités",
  "Messagerie directe avec le voyageur",
  "Options, caution et règles définies par l’hôte",
  "Tableau de bord de réservation essentiel",
];

const proTools = [
  "Tout Escale Essentiel",
  "CRM voyageurs et historique client 360°",
  "Import de contacts issus d’autres canaux",
  "Segmentation clients : fidèle, VIP, famille, pro…",
  "Campagnes et offres promotionnelles",
  "Relances et scénarios de fidélisation",
  "Codes promotionnels et offres ciblées",
  "Pilotage du chiffre d’affaires et de la rentabilité",
  "Automatisations avancées et contrats conditionnels",
];

const faq = [
  {
    q: "Quelle est la vraie différence entre Essentiel et Pro ?",
    r: "Essentiel sert à louer en direct simplement et proprement. Pro ajoute les outils qui permettent de construire, connaître et fidéliser sa propre clientèle dans le temps.",
  },
  {
    q: "Le contrat personnalisable est-il réservé à Pro ?",
    r: "Non. Le contrat personnalisable fait partie du cœur d’Escale et est disponible dans les deux offres. Pro ajoute surtout des modèles multiples, des clauses conditionnelles et davantage d’automatisation.",
  },
  {
    q: "Puis-je ajouter dans le CRM des voyageurs connus ailleurs ?",
    r: "L’objectif de Pro est de centraliser votre portefeuille client. Le CRM est pensé pour accueillir vos voyageurs Escale mais aussi les contacts que vous souhaitez gérer dans le cadre de votre activité directe, sous réserve de respecter leurs consentements et les règles applicables.",
  },
  {
    q: "Pourquoi proposer un tarif plus bas sur Escale ?",
    r: "Une partie de l’économie réalisée sur les frais de plateforme peut être partagée avec le voyageur. Vous pouvez donc améliorer votre prix public tout en comparant votre revenu net grâce au simulateur.",
  },
];

const euros = (value) => new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 2,
}).format(value);

export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [faqOpen, setFaqOpen] = useState(0);
  const [nightlyRate, setNightlyRate] = useState(150);
  const [nights, setNights] = useState(1);
  const [competitorRate, setCompetitorRate] = useState(15);
  const [travelerDiscount, setTravelerDiscount] = useState(5);
  const [formula, setFormula] = useState("essentiel");

  const simulation = useMemo(() => {
    const competitorGross = nightlyRate * nights;
    const escaleGross = competitorGross * (1 - travelerDiscount / 100);
    const competitorNet = competitorGross * (1 - competitorRate / 100);
    const essentielNet = escaleGross * (1 - COMMISSION_RATE_TTC);
    const proNetBeforeSubscription = escaleGross * (1 - SUBSCRIPTION_RATE_TTC);
    const selectedNet = formula === "pro" ? proNetBeforeSubscription : essentielNet;
    const travelerSaving = competitorGross - escaleGross;
    const hostGain = selectedNet - competitorNet;
    const monthlyVolume = escaleGross * 10;
    const proMonthlyNet = monthlyVolume * (1 - SUBSCRIPTION_RATE_TTC) - SUBSCRIPTION_FEE_TTC;
    const essentielMonthlyNet = monthlyVolume * (1 - COMMISSION_RATE_TTC);
    const proMonthlyAdvantage = proMonthlyNet - essentielMonthlyNet;

    return {
      competitorGross,
      escaleGross,
      competitorNet,
      essentielNet,
      proNetBeforeSubscription,
      selectedNet,
      travelerSaving,
      hostGain,
      proMonthlyAdvantage,
    };
  }, [nightlyRate, nights, competitorRate, travelerDiscount, formula]);

  return (
    <main className="min-h-screen bg-[#F8F4EC] text-[#173C3A]">
      <header className="sticky top-0 z-40 border-b border-[#E8DECA] bg-[#F8F4EC]/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5">
          <Link href="/" className="flex items-center gap-2 font-serif text-xl">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#173C3A] text-[#D99054]">E</span>
            Escale
          </Link>
          <nav className="hidden items-center gap-7 text-sm text-[#6D6258] md:flex">
            <a href="#pourquoi">Pourquoi Escale ?</a>
            <a href="#offres">Nos offres</a>
            <a href="#pro">Escale Pro</a>
            <a href="#simulateur">Simulateur</a>
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
              <a href="#pourquoi" onClick={() => setMenuOpen(false)}>Pourquoi Escale ?</a>
              <a href="#offres" onClick={() => setMenuOpen(false)}>Nos offres</a>
              <a href="#pro" onClick={() => setMenuOpen(false)}>Escale Pro</a>
              <a href="#simulateur" onClick={() => setMenuOpen(false)}>Simulateur</a>
              <Link href="/hote" className="mt-2 rounded-xl bg-[#173C3A] px-4 py-3 text-center text-white">Devenir hôte</Link>
            </div>
          </div>
        )}
      </header>

      <section className="mx-auto grid max-w-7xl gap-12 px-5 py-16 md:grid-cols-[1.08fr_.92fr] md:py-24">
        <div>
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#DFCDB0] bg-[#F2E9DA] px-3 py-1.5 text-xs font-medium uppercase tracking-[.15em] text-[#8D5B30]">
            <Sparkles size={13}/> Deux façons de louer en direct
          </div>
          <h1 className="max-w-3xl font-serif text-5xl leading-[1.04] md:text-6xl">
            Louez en direct aujourd’hui. <span className="text-[#A86735]">Développez votre clientèle demain.</span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-[#6D6258]">
            Escale vous permet soit de gérer simplement vos réservations directes avec moins de frais, soit d’aller plus loin avec une suite Pro dédiée à la fidélisation et au développement de votre activité.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href="#essentiel" className="inline-flex items-center gap-2 rounded-xl bg-[#173C3A] px-5 py-3 font-medium text-white">Je veux louer en direct <ArrowRight size={16}/></a>
            <a href="#pro" className="rounded-xl border border-[#CCB999] px-5 py-3 font-medium">Je veux développer mon activité</a>
          </div>
          <div className="mt-8 flex flex-wrap gap-5 text-sm text-[#6D6258]">
            <span className="flex items-center gap-2"><ShieldCheck size={16}/> Paiement sécurisé</span>
            <span className="flex items-center gap-2"><FileText size={16}/> Contrat personnalisable</span>
            <span className="flex items-center gap-2"><MessageCircle size={16}/> Relation directe</span>
          </div>
        </div>

        <div className="rounded-3xl bg-[#173C3A] p-6 text-white md:p-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[#C8D8D4]">Escale Pro</p>
              <h2 className="mt-1 text-2xl font-semibold">Chaque séjour peut devenir un futur client.</h2>
            </div>
            <LayoutDashboard className="text-[#D99054]"/>
          </div>
          <div className="mt-8 grid grid-cols-2 gap-3">
            {[
              ["Clients CRM", "148"],
              ["Voyageurs fidèles", "37"],
              ["Offres à relancer", "12"],
              ["CA direct", "8 420 €"],
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl bg-white/10 p-4">
                <p className="text-xs text-[#BFD0CD]">{label}</p>
                <p className="mt-2 text-xl font-semibold">{value}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 rounded-2xl bg-[#244E4B] p-4 text-sm">
            <p className="text-xs uppercase tracking-wider text-[#BFD0CD]">Exemples d’actions</p>
            <div className="mt-3 space-y-2">
              <p>• Relancer les familles venues l’été dernier</p>
              <p>• Envoyer une offre -10 % aux voyageurs fidèles</p>
              <p>• Identifier les meilleurs clients par logement</p>
            </div>
          </div>
        </div>
      </section>

      <section id="pourquoi" className="border-y border-[#E8DECA] bg-white/45 py-16">
        <div className="mx-auto max-w-7xl px-5">
          <div className="grid gap-10 lg:grid-cols-[.8fr_1.2fr]">
            <div>
              <p className="text-sm font-medium uppercase tracking-[.15em] text-[#A86735]">Pourquoi Escale ?</p>
              <h2 className="mt-3 font-serif text-4xl">La mise en relation directe, avec le cadre qui sécurise la transaction.</h2>
              <p className="mt-4 leading-7 text-[#6D6258]">Escale ne cherche pas à confisquer la relation entre l’hôte et le voyageur. L’objectif est de fournir le paiement sécurisé, les contrats, les outils de gestion et le cadre nécessaire pour permettre une relation plus directe et plus autonome.</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              {[
                [ShieldCheck, "Sécuriser", "Paiement, suivi des fonds et cadre de réservation."],
                [FileText, "Personnaliser", "Contrat adapté aux règles et options propres à chaque hôte."],
                [Users, "Rester libre", "La relation voyageur reste au cœur de votre activité."],
              ].map(([Icon, title, text]) => (
                <article key={title} className="rounded-2xl border border-[#E2D6C2] bg-[#FBF8F2] p-5">
                  <Icon className="text-[#A86735]"/>
                  <h3 className="mt-4 text-lg font-semibold">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-[#6D6258]">{text}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="offres" className="mx-auto max-w-7xl px-5 py-16">
        <div className="max-w-3xl">
          <p className="text-sm font-medium uppercase tracking-[.15em] text-[#A86735]">Choisissez selon votre objectif</p>
          <h2 className="mt-3 font-serif text-4xl">Deux offres. Deux besoins clairement différents.</h2>
          <p className="mt-4 leading-7 text-[#6D6258]">Vous pouvez commencer simplement avec Essentiel, puis passer à Pro lorsque vous souhaitez structurer votre acquisition, votre fidélisation et votre activité directe.</p>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          <article id="essentiel" className="rounded-3xl border border-[#DCCFB8] bg-[#FBF8F2] p-7">
            <p className="text-sm font-medium text-[#6D6258]">ESCALE ESSENTIEL</p>
            <p className="mt-3 text-2xl font-semibold">Louer en direct, simplement.</p>
            <div className="mt-4 flex items-end gap-2">
              <span className="text-5xl font-semibold">{formatTaux(COMMISSION_RATE_TTC)}</span>
              <span className="pb-1 text-[#6D6258]">TTC / réservation</span>
            </div>
            <p className="mt-3 text-[#6D6258]">Sans abonnement. Une solution complète pour réserver, sécuriser, contractualiser et encaisser.</p>
            <ul className="mt-6 space-y-3">
              {essentielTools.map(item => <li key={item} className="flex gap-2"><Check size={18} className="mt-0.5 shrink-0 text-[#A86735]"/>{item}</li>)}
            </ul>
            <Link href="/hote" className="mt-8 block rounded-xl border border-[#BFAF92] px-4 py-3 text-center font-medium">Commencer sans abonnement</Link>
          </article>

          <article id="pro" className="relative rounded-3xl bg-[#173C3A] p-7 text-white">
            <span className="absolute right-5 top-5 rounded-full bg-[#D99054] px-3 py-1 text-xs font-semibold text-white">Développer sa clientèle</span>
            <p className="text-sm font-medium text-[#C8D8D4]">ESCALE PRO</p>
            <p className="mt-3 text-2xl font-semibold">Construire une activité directe qui grandit.</p>
            <div className="mt-4 flex flex-wrap items-end gap-x-2 gap-y-1">
              <span className="text-5xl font-semibold">{formatTaux(SUBSCRIPTION_RATE_TTC)}</span>
              <span className="pb-1 text-[#C8D8D4]">TTC / réservation</span>
            </div>
            <p className="mt-1 text-sm text-[#C8D8D4]">+ {formatEuros(SUBSCRIPTION_FEE_TTC)} / mois</p>
            <p className="mt-4 text-[#DCE7E4]">Le CRM et les outils marketing transforment chaque réservation en opportunité de fidélisation.</p>
            <ul className="mt-6 grid gap-3 sm:grid-cols-2">
              {proTools.map(item => <li key={item} className="flex gap-2 text-sm"><Check size={17} className="mt-0.5 shrink-0 text-[#D99054]"/>{item}</li>)}
            </ul>
            <Link href="/hote" className="mt-8 block rounded-xl bg-white px-4 py-3 text-center font-semibold text-[#173C3A]">Choisir Escale Pro</Link>
          </article>
        </div>
      </section>

      <section className="bg-[#173C3A] py-16 text-white">
        <div className="mx-auto max-w-7xl px-5">
          <div className="max-w-3xl">
            <p className="text-sm font-medium uppercase tracking-[.15em] text-[#D99054]">Le cœur de Pro</p>
            <h2 className="mt-3 font-serif text-4xl">Ne gérez plus seulement des réservations. Construisez votre portefeuille clients.</h2>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              [UserPlus, "Centraliser", "Ajoutez vos voyageurs Escale et vos contacts issus d’autres canaux."],
              [Tags, "Segmenter", "Classez vos clients par profil, valeur, fréquence ou type de séjour."],
              [Send, "Relancer", "Préparez des campagnes et des offres adaptées aux bons voyageurs."],
              [BadgePercent, "Fidéliser", "Codes promo, avantages et offres directes pour provoquer le prochain séjour."],
            ].map(([Icon, title, text]) => (
              <article key={title} className="rounded-2xl bg-white/8 p-5">
                <Icon className="text-[#D99054]"/>
                <h3 className="mt-4 text-lg font-semibold">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-[#C8D8D4]">{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-16">
        <div className="grid gap-10 lg:grid-cols-[.8fr_1.2fr]">
          <div>
            <p className="text-sm font-medium uppercase tracking-[.15em] text-[#A86735]">Contrats automatiques</p>
            <h2 className="mt-3 font-serif text-4xl">Vos règles, dans le bon contrat, à chaque réservation.</h2>
            <p className="mt-4 leading-7 text-[#6D6258]">Le contrat personnalisable est disponible pour tous les hôtes. Vous définissez vos prérequis et Escale réutilise les informations de la réservation pour générer un document adapté.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-[#E2D6C2] p-6">
              <FileText className="text-[#A86735]"/>
              <h3 className="mt-4 text-xl font-semibold">Essentiel</h3>
              <p className="mt-2 leading-7 text-[#6D6258]">Contrat personnalisable par l’hôte, généré automatiquement avec les informations du logement, du séjour, du voyageur, des options et des règles choisies.</p>
            </div>
            <div className="rounded-2xl bg-[#F1E7D7] p-6">
              <RefreshCw className="text-[#A86735]"/>
              <h3 className="mt-4 text-xl font-semibold">Pro</h3>
              <p className="mt-2 leading-7 text-[#6D6258]">Modèles multiples et clauses conditionnelles : animal, arrivée tardive, linge, ménage, caution, profil de séjour ou règles spécifiques au logement.</p>
            </div>
          </div>
        </div>
      </section>

      <section id="simulateur" className="bg-[#EFE6D7] py-16">
        <div className="mx-auto max-w-7xl px-5">
          <div className="max-w-3xl">
            <p className="text-sm font-medium uppercase tracking-[.15em] text-[#A86735]">Simulateur commercial</p>
            <h2 className="mt-3 font-serif text-4xl">Voyez l’impact dès une seule nuitée.</h2>
            <p className="mt-4 leading-7 text-[#6D6258]">Comparez votre revenu net à celui d’une plateforme plus coûteuse et mesurez immédiatement ce que vous pouvez rendre au voyageur tout en préservant votre marge.</p>
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-[.85fr_1.15fr]">
            <div className="rounded-3xl bg-white p-6">
              <div className="grid gap-5">
                <div>
                  <label htmlFor="nightly" className="text-sm font-medium">Prix actuel par nuit : {euros(nightlyRate)}</label>
                  <input id="nightly" type="range" min="50" max="1000" step="10" value={nightlyRate} onChange={e => setNightlyRate(Number(e.target.value))} className="mt-3 w-full"/>
                </div>
                <div>
                  <p className="text-sm font-medium">Durée simulée</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {[1,3,7].map(value => <button key={value} onClick={() => setNights(value)} className={`rounded-xl px-4 py-2 text-sm ${nights === value ? "bg-[#173C3A] text-white" : "border border-[#D9CBB3]"}`}>{value} nuit{value > 1 ? "s" : ""}</button>)}
                  </div>
                </div>
                <div>
                  <label htmlFor="competitor" className="text-sm font-medium">Frais de votre plateforme actuelle : {competitorRate} %</label>
                  <input id="competitor" type="range" min="8" max="22" step="1" value={competitorRate} onChange={e => setCompetitorRate(Number(e.target.value))} className="mt-3 w-full"/>
                </div>
                <div>
                  <label htmlFor="discount" className="text-sm font-medium">Remise accordée au voyageur sur Escale : {travelerDiscount} %</label>
                  <input id="discount" type="range" min="0" max="10" step="1" value={travelerDiscount} onChange={e => setTravelerDiscount(Number(e.target.value))} className="mt-3 w-full"/>
                </div>
                <div>
                  <p className="text-sm font-medium">Formule Escale</p>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <button onClick={() => setFormula("essentiel")} className={`rounded-xl px-4 py-3 text-sm font-medium ${formula === "essentiel" ? "bg-[#173C3A] text-white" : "border border-[#D9CBB3]"}`}>Essentiel</button>
                    <button onClick={() => setFormula("pro")} className={`rounded-xl px-4 py-3 text-sm font-medium ${formula === "pro" ? "bg-[#173C3A] text-white" : "border border-[#D9CBB3]"}`}>Pro</button>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-3xl bg-white p-6">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl bg-[#F8F4EC] p-4">
                  <p className="text-xs text-[#6D6258]">Prix voyageur ailleurs</p>
                  <p className="mt-1 text-2xl font-semibold">{euros(simulation.competitorGross)}</p>
                </div>
                <div className="rounded-2xl bg-[#F1E7D7] p-4">
                  <p className="text-xs text-[#6D6258]">Prix voyageur sur Escale</p>
                  <p className="mt-1 text-2xl font-semibold">{euros(simulation.escaleGross)}</p>
                </div>
                <div className="rounded-2xl border border-[#E2D6C2] p-4">
                  <p className="text-xs text-[#6D6258]">Économie voyageur</p>
                  <p className="mt-1 text-2xl font-semibold text-[#A86735]">+ {euros(simulation.travelerSaving)}</p>
                </div>
                <div className="rounded-2xl bg-[#173C3A] p-4 text-white">
                  <p className="text-xs text-[#C8D8D4]">Gain net hôte sur ce séjour</p>
                  <p className="mt-1 text-2xl font-semibold">{simulation.hostGain >= 0 ? "+ " : ""}{euros(simulation.hostGain)}</p>
                </div>
              </div>
              <div className="mt-5 rounded-2xl border border-[#E2D6C2] p-4">
                <p className="text-sm font-medium">Lecture du résultat</p>
                <p className="mt-2 text-sm leading-6 text-[#6D6258]">Votre plateforme actuelle vous laisserait environ <strong>{euros(simulation.competitorNet)}</strong>. Avec Escale {formula === "pro" ? "Pro" : "Essentiel"}, le même séjour affiché {travelerDiscount} % moins cher vous laisserait environ <strong>{euros(simulation.selectedNet)}</strong>{formula === "pro" ? " avant prise en compte de l’abonnement mensuel de 19 €." : "."}</p>
              </div>
              {formula === "essentiel" && simulation.proMonthlyAdvantage > 0 && (
                <div className="mt-4 rounded-2xl bg-[#F1E7D7] p-4 text-sm">
                  À ce rythme d’activité, Pro pourrait devenir plus intéressant : sur une projection de 10 séjours similaires par mois, l’avantage estimé serait d’environ <strong>{euros(simulation.proMonthlyAdvantage)}</strong> par mois.
                </div>
              )}
              <p className="mt-4 text-xs leading-5 text-[#7B7066]">Simulation indicative. Les frais des plateformes concurrentes varient selon leurs règles, le pays, le type d’hôte et le mode tarifaire. Pour Pro, le gain sur le séjour est affiché avant l’abonnement fixe mensuel, qui est intégré dans la projection mensuelle.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-5 py-16">
        <h2 className="text-center font-serif text-4xl">Questions fréquentes</h2>
        <div className="mt-8 divide-y divide-[#E1D5C2]">
          {faq.map((item, i) => (
            <div key={item.q} className="py-4">
              <button className="flex w-full items-center justify-between gap-4 text-left font-medium" onClick={() => setFaqOpen(faqOpen === i ? -1 : i)}>
                {item.q}
                <ChevronDown size={18} className={faqOpen === i ? "rotate-180 transition" : "transition"}/>
              </button>
              {faqOpen === i && <p className="mt-3 max-w-3xl leading-7 text-[#6D6258]">{item.r}</p>}
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-[#E8DECA] bg-white/40 py-16 text-center">
        <div className="mx-auto max-w-3xl px-5">
          <h2 className="font-serif text-4xl">Commencez par louer en direct. Passez à Pro quand vous voulez construire votre clientèle.</h2>
          <p className="mx-auto mt-4 max-w-2xl leading-7 text-[#6D6258]">Escale vous laisse entrer simplement, puis vous donne les outils pour aller plus loin lorsque votre stratégie évolue.</p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Link href="/hote" className="rounded-xl bg-[#173C3A] px-5 py-3 font-medium text-white">Créer mon espace hôte</Link>
            <a href="#simulateur" className="rounded-xl border border-[#CDBB9B] px-5 py-3 font-medium">Tester le simulateur</a>
          </div>
        </div>
      </section>

      <footer className="border-t border-[#E8DECA] px-5 py-8 text-center text-sm text-[#746A61]">© Escale · Location directe, gestion maîtrisée.</footer>
    </main>
  );
}
