"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ShieldCheck, Wallet, Calendar, MessageCircle, Link2, Smartphone,
  ArrowRight, Check, PawPrint, Home, Users, Star, Menu, X,
  Compass, Sparkles, FileText, Lock, ChevronDown, MapPin, Percent,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Données
// ---------------------------------------------------------------------------

const STATS = [
  { valeur: "312", label: "logements actifs" },
  { valeur: "184", label: "hôtes" },
  { valeur: "0 €", label: "frais de réservation caché" },
  { valeur: "4,8 / 5", label: "note moyenne" },
];

const AVANTAGES = [
  { icon: Wallet, titre: "Moins cher qu'une agence", texte: "Aucune commission d'agence classique : juste une commission unique, affichée avant paiement." },
  { icon: ShieldCheck, titre: "Paiement protégé", texte: "Les fonds du voyageur sont retenus jusqu'à la fin du séjour, dans l'intérêt des deux parties." },
  { icon: MessageCircle, titre: "Contact direct", texte: "Vous échangez directement avec l'hôte ou le voyageur, sans intermédiaire qui filtre la conversation." },
  { icon: PawPrint, titre: "Annonces personnalisables", texte: "Chaque hôte définit ses propres règles : animaux, horaires, annulation, caution — rien d'imposé par la plateforme." },
  { icon: Link2, titre: "Compatible avec vos outils", texte: "Synchronisation Airbnb, application installable sur mobile : Escale s'intègre à ce que vous utilisez déjà." },
  { icon: ShieldCheck, titre: "Litiges pris au sérieux", texte: "Un vrai processus de signalement et de médiation, pas une simple boîte mail sans réponse." },
];
const TAMPONS_CONFIANCE = [
  { icon: Lock, label: "Paiement sécurisé" },
  { icon: ShieldCheck, label: "Identité vérifiée" },
  { icon: FileText, label: "Contrat automatique" },
  { icon: Star, label: "Avis vérifiés" }, ];

const COMPARATIF = [
  { critere: "Frais pour le voyageur", escale: "0 €", agence: "10 à 20% de frais", direct: "0 € mais aucune garantie" },
  { critere: "Paiement sécurisé", escale: "Oui, retenu jusqu'à la fin du séjour", agence: "Oui, souvent en plusieurs fois", direct: "À la charge des deux parties" },
  { critere: "Contact hôte/voyageur", escale: "Direct", agence: "Filtré par l'agence", direct: "Direct" },
  { critere: "Gestion des litiges", escale: "Médiation intégrée", agence: "Variable selon l'agence", direct: "Aucune" },
  { critere: "Personnalisation de l'annonce", escale: "Totale, par logement", agence: "Souvent standardisée", direct: "Totale" },
];

const LOGEMENTS_APERCU = [
  { nom: "Loft ancre & sel", ville: "Le Havre", prix: 140, note: 4.8 },
  { nom: "Cabane des embruns", ville: "Quiberon", prix: 95, note: 4.6 },
  { nom: "Mas des lavandes", ville: "Gordes", prix: 180, note: 4.9 },
];

const TEMOIGNAGES = [
  { nom: "Camille B.", role: "Hôte à Quiberon", texte: "Le versement après le séjour m'a évité une mauvaise surprise dès ma première réservation." },
  { nom: "Julien M.", role: "Voyageur", texte: "Réservation simple, propriétaire réactif, et le prix affiché était bien le prix final." },
  { nom: "Sophie A.", role: "Hôte à Paris", texte: "J'ai pu régler un litige directement avec l'équipe Escale, sans avoir à gérer ça seule." },
];

const FAQ = [
  { q: "Escale prend-elle une commission ?", r: "Oui, une commission est prélevée sur chaque réservation confirmée. Elle est toujours affichée avant le paiement, sans frais caché supplémentaire." },
  { q: "Quand l'hôte est-il payé ?", r: "Le lendemain de la fin du séjour, et seulement si aucun signalement n'est en cours sur la réservation." },
  { q: "Que se passe-t-il en cas de litige ?", r: "Le voyageur ou l'hôte peut signaler un problème avant le reversement des fonds. Notre équipe instruit la situation et décide de libérer les fonds, rembourser le voyageur, ou clore le signalement." },
  { q: "Dois-je souscrire une assurance en tant qu'hôte ?", r: "Cela dépend de votre statut (résidence principale louée occasionnellement ou bien dédié à la location). Nous vous guidons sur ce point lors de la publication de votre annonce." },
  { q: "Puis-je synchroniser mon calendrier avec Airbnb ?", r: "Oui, via un lien iCal dans les deux sens, pour éviter les doubles réservations." },
];

const ETAPES_VOYAGEUR = [
  { titre: "Explorez", texte: "Parcourez des logements uniques, décrits et photographiés par leurs hôtes." },
  { titre: "Réservez", texte: "Paiement sécurisé en ligne, confirmation instantanée ou validée par l'hôte." },
  { titre: "Séjournez", texte: "Vos fonds ne sont reversés à l'hôte qu'après votre séjour — de quoi voyager l'esprit tranquille." },
];

const ETAPES_HOTE = [
  { titre: "Publiez", texte: "Un formulaire guidé pour décrire votre logement, ses photos, son tarif et ses options." },
  { titre: "Accueillez", texte: "Gérez vos réservations et échangez avec vos voyageurs depuis un seul espace." },
  { titre: "Encaissez", texte: "Vos revenus sont reversés automatiquement sur votre compte après chaque séjour." },
];

const FONCTIONNALITES = [
  { icon: Wallet, titre: "Paiement séquestré", texte: "Les fonds du voyageur sont retenus jusqu'à la fin du séjour, pour limiter les fraudes et les annonces non conformes." },
  { icon: Link2, titre: "Synchronisation Airbnb", texte: "Reliez votre calendrier Escale à Airbnb en un lien : plus aucun risque de double réservation." },
  { icon: PawPrint, titre: "Options sur mesure", texte: "Animaux, ménage, départ tardif, politique d'annulation : chaque hôte personnalise son annonce." },
  { icon: ShieldCheck, titre: "Médiation intégrée", texte: "En cas de litige, notre équipe instruit chaque signalement avant tout reversement à l'hôte." },
  { icon: Smartphone, titre: "Disponible partout", texte: "Installez Escale sur votre téléphone comme une application, sans passer par un store." },
  { icon: FileText, titre: "Assurance guidée", texte: "Chaque hôte est accompagné pour vérifier sa couverture avant de publier une annonce." },
];

// ---------------------------------------------------------------------------
// Composant principal
// ---------------------------------------------------------------------------

export default function PagePresentation() {
  const [menuOuvert, setMenuOuvert] = useState(false);
  const [onglet, setOnglet] = useState("voyageur");
  const [faqOuverte, setFaqOuverte] = useState(0);

  return (
    <div className="min-h-screen bg-[#F8F4EC] font-sans text-[#1B3A3A]">

      {/* Navigation */}
      <header className="border-b border-[#E4DCC8] bg-[#F8F4EC]/95 backdrop-blur sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#1B3A3A] flex items-center justify-center">
              <span className="font-serif text-sm text-[#C97B3D]">E</span>
            </div>
            <span className="font-serif text-lg">Escale</span>
          </div>

          <nav className="hidden md:flex items-center gap-7 text-sm text-[#6B5B4D]">
            <a href="#avantages" className="hover:text-[#1B3A3A] transition-colors">Avantages</a>
            <a href="#comment-ca-marche" className="hover:text-[#1B3A3A] transition-colors">Comment ça marche</a>
            <a href="#fonctionnalites" className="hover:text-[#1B3A3A] transition-colors">Fonctionnalités</a>
            <a href="#confiance" className="hover:text-[#1B3A3A] transition-colors">Sécurité & confiance</a>
          </nav>
          <div className="hidden md:flex items-center gap-3">
            <Link href="/connexion" className="text-sm text-[#6B5B4D] hover:text-[#1B3A3A] transition-colors">Se connecter</Link>
            <Link href="/hote" className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#1B3A3A] text-[#F8F4EC] text-sm font-medium hover:bg-[#2F6E6E] transition-colors">
              Publier une annonce
            </Link>
          </div>

          <button className="md:hidden" onClick={() => setMenuOuvert((o) => !o)} aria-label="Menu">
            {menuOuvert ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {menuOuvert && (
          <div className="md:hidden border-t border-[#E4DCC8] px-5 py-4 flex flex-col gap-3 text-sm text-[#6B5B4D]">
            <a href="#comment-ca-marche" onClick={() => setMenuOuvert(false)}>Comment ça marche</a>
            <a href="#fonctionnalites" onClick={() => setMenuOuvert(false)}>Fonctionnalités</a>
            <a href="#confiance" onClick={() => setMenuOuvert(false)}>Sécurité & confiance</a>
            <Link
              href="/hote"
              onClick={() => setMenuOuvert(false)}
              className="mt-2 px-4 py-2 rounded-lg bg-[#1B3A3A] text-[#F8F4EC] font-medium text-left"
            >
              Publier une annonce
            </Link>
          </div>
        )}
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-5 pt-16 pb-14 md:pt-24 md:pb-20">
        <div className="grid md:grid-cols-[1.1fr_0.9fr] gap-12 items-center">
          <div>
            <span className="inline-flex items-center gap-1.5 text-xs uppercase tracking-widest text-[#8A5A2B] bg-[#F1EADB] border border-[#E4DCC8] rounded-full px-3 py-1.5 mb-5">
              <Compass size={12} /> Locations entre particuliers
            </span>
            <h1 className="font-serif text-4xl md:text-5xl leading-[1.1] mb-5">
              Voyagez léger,<br />louez en confiance.
            </h1>
            <p className="text-[#6B5B4D] text-base md:text-lg mb-7 max-w-md">
              Escale met en relation directe hôtes et voyageurs, avec un paiement sécurisé
              qui protège les deux parties — sans frais cachés, sans agence.
            </p>
            <div className="flex flex-wrap gap-3 mb-8">
              <Link href="/recherche" className="flex items-center gap-1.5 px-5 py-3 rounded-lg bg-[#1B3A3A] text-[#F8F4EC] text-sm font-medium hover:bg-[#2F6E6E] transition-colors">
                Trouver un logement <ArrowRight size={15} />
              </Link>
              <Link href="/hote" className="flex items-center gap-1.5 px-5 py-3 rounded-lg border border-[#D8CCB0] text-[#1B3A3A] text-sm font-medium hover:bg-[#F1EADB] transition-colors">
                Devenir hôte
              </Link>
            </div>
            <div className="flex flex-wrap gap-4">
              {TAMPONS_CONFIANCE.map(({ icon: Icon, label }, i) => (
                <span
                  key={label}
                  className="flex items-center gap-1.5 text-xs text-[#6B5B4D] border border-dashed border-[#D8CCB0] rounded-full px-3 py-1.5"
                  style={{ transform: `rotate(${i % 2 === 0 ? -2 : 2}deg)` }}
                >
                  <Icon size={13} className="text-[#8A5A2B]" /> {label}
                </span>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="aspect-[4/5] rounded-2xl bg-[#1B3A3A] p-6 flex flex-col justify-between shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-widest text-[#D8CCB0]">Loft ancre & sel</span>
                <span className="flex items-center gap-1 text-[#F8F4EC] text-xs"><Star size={11} className="fill-[#C97B3D] text-[#C97B3D]" /> 4,8</span>
              </div>
              <div>
                <p className="font-serif text-2xl text-[#F8F4EC] mb-1">Le Havre, France</p>
                <p className="text-xs text-[#D8CCB0] mb-4">3 voyageurs · 2 chambres</p>
                <div className="flex items-center justify-between border-t border-[#2F6E6E] pt-4">
                  <span className="text-[#F8F4EC] text-sm font-medium">140 € / nuit</span>
                  <span className="text-xs text-[#D8CCB0] flex items-center gap-1"><Check size={12} /> Instantanée</span>
                </div>
              </div>
            </div>
            <div className="absolute -bottom-5 -left-5 bg-[#FFFDF8] border border-[#E4DCC8] rounded-xl px-4 py-3 shadow-sm hidden sm:block">
              <p className="text-xs text-[#8C7A66]">Fonds reversés</p>
              <p className="text-sm font-medium text-[#1B3A3A]">Après le séjour</p>
            </div>
          </div>
        </div>
      </section>

      {/* Bandeau de chiffres */}
      <section className="border-y border-[#E4DCC8] bg-[#F1EADB]">
        <div className="max-w-6xl mx-auto px-5 py-8 grid grid-cols-2 md:grid-cols-4 gap-6">
          {STATS.map((s) => (
            <div key={s.label} className="text-center">
              <p className="font-serif text-2xl text-[#1B3A3A]">{s.valeur}</p>
              <p className="text-xs text-[#8C7A66] mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Avantages */}
      <section id="avantages" className="max-w-6xl mx-auto px-5 py-16 md:py-20">
        <div className="max-w-lg mb-10">
          <h2 className="font-serif text-2xl md:text-3xl mb-3">Pourquoi choisir Escale</h2>
          <p className="text-sm text-[#6B5B4D]">
            Ni une agence qui prend sa marge sans y être pour grand-chose, ni une location
            sauvage sans aucun filet. Escale garde ce qui compte des deux mondes.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-14">
          {AVANTAGES.map(({ icon: Icon, titre, texte }) => (
            <div key={titre} className="flex gap-3">
              <div className="w-9 h-9 rounded-lg bg-[#F1EADB] flex items-center justify-center shrink-0">
                <Icon size={16} className="text-[#8A5A2B]" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-[#1B3A3A] mb-1">{titre}</h3>
                <p className="text-xs text-[#6B5B4D] leading-relaxed">{texte}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="border border-[#E4DCC8] rounded-xl overflow-hidden bg-[#FFFDF8]">
          <div className="overflow-x-auto">
            <table className="w-full text-sm" style={{ minWidth: 560 }}>
              <thead>
                <tr className="border-b border-[#E4DCC8]">
                  <th className="text-left px-4 py-3 text-xs uppercase tracking-wide text-[#8C7A66] font-medium">Critère</th>
                  <th className="text-left px-4 py-3 text-xs uppercase tracking-wide font-medium text-[#1B3A3A] bg-[#F1EADB]">Escale</th>
                  <th className="text-left px-4 py-3 text-xs uppercase tracking-wide text-[#8C7A66] font-medium">Agence traditionnelle</th>
                  <th className="text-left px-4 py-3 text-xs uppercase tracking-wide text-[#8C7A66] font-medium">Location directe</th>
                </tr>
              </thead>
              <tbody>
                {COMPARATIF.map((row, i) => (
                  <tr key={row.critere} className={i > 0 ? "border-t border-[#EDE4D4]" : ""}>
                    <td className="px-4 py-3 text-[#1B3A3A] font-medium">{row.critere}</td>
                    <td className="px-4 py-3 text-[#1B3A3A] bg-[#F1EADB]/60">{row.escale}</td>
                    <td className="px-4 py-3 text-[#6B5B4D]">{row.agence}</td>
                    <td className="px-4 py-3 text-[#6B5B4D]">{row.direct}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Comment ça marche */}
      <section id="comment-ca-marche" className="max-w-6xl mx-auto px-5 py-16 md:py-20">
        <div className="flex items-center justify-between flex-wrap gap-4 mb-10">
          <h2 className="font-serif text-2xl md:text-3xl">Comment ça marche</h2>
          <div className="inline-flex bg-[#EDE4D4] rounded-full p-1">
            <button
              onClick={() => setOnglet("voyageur")}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                onglet === "voyageur" ? "bg-[#1B3A3A] text-[#F8F4EC]" : "text-[#6B5B4D]"
              }`}
            >
              Voyageur
            </button>
            <button
              onClick={() => setOnglet("hote")}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                onglet === "hote" ? "bg-[#1B3A3A] text-[#F8F4EC]" : "text-[#6B5B4D]"
              }`}
            >
              Hôte
            </button>
          </div>
        </div>

        <div className="grid sm:grid-cols-3 gap-6">
          {(onglet === "voyageur" ? ETAPES_VOYAGEUR : ETAPES_HOTE).map((e, i) => (
            <div key={e.titre}>
              <div className="w-9 h-9 rounded-full bg-[#1B3A3A] text-[#F8F4EC] flex items-center justify-center font-serif text-sm mb-4">
                {i + 1}
              </div>
              <h3 className="font-serif text-lg mb-1.5">{e.titre}</h3>
              <p className="text-sm text-[#6B5B4D]">{e.texte}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Aperçu de logements */}
      <section className="max-w-6xl mx-auto px-5 pb-16 md:pb-20">
        <div className="flex items-center justify-between flex-wrap gap-4 mb-8">
          <h2 className="font-serif text-2xl md:text-3xl">Quelques escales du moment</h2>
          <Link href="/recherche" className="flex items-center gap-1 text-sm text-[#2F6E6E] hover:text-[#1B3A3A] transition-colors font-medium">
            Voir tous les logements <ArrowRight size={14} />
          </Link>
        </div>
        <div className="grid sm:grid-cols-3 gap-5">
          {LOGEMENTS_APERCU.map((l) => (
            <div key={l.nom} className="border border-[#E4DCC8] rounded-xl overflow-hidden bg-[#FFFDF8]">
              <div className="aspect-[4/3] bg-[#EDE4D4] flex items-center justify-center">
                <Home size={22} className="text-[#B0A48F]" />
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-sm font-medium text-[#1B3A3A] truncate">{l.nom}</h3>
                  <span className="flex items-center gap-1 text-xs text-[#8A5A2B] shrink-0">
                    <Star size={11} className="fill-[#C97B3D] text-[#C97B3D]" /> {l.note}
                  </span>
                </div>
                <p className="text-xs text-[#8C7A66] flex items-center gap-1 mb-2">
                  <MapPin size={11} /> {l.ville}
                </p>
                <p className="text-sm font-medium text-[#1B3A3A]">{l.prix} € <span className="text-xs text-[#8C7A66] font-normal">/ nuit</span></p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Fonctionnalités */}
      <section id="fonctionnalites" className="bg-[#FFFDF8] border-y border-[#E4DCC8]">
        <div className="max-w-6xl mx-auto px-5 py-16 md:py-20">
          <h2 className="font-serif text-2xl md:text-3xl mb-2">Pensé pour la confiance</h2>
          <p className="text-[#6B5B4D] mb-10 max-w-lg">
            Chaque fonctionnalité d'Escale existe pour une seule raison : que les hôtes et les
            voyageurs se sentent en sécurité, du premier message à la fin du séjour.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FONCTIONNALITES.map(({ icon: Icon, titre, texte }) => (
              <div key={titre} className="border border-[#E4DCC8] rounded-xl p-5">
                <div className="w-9 h-9 rounded-lg bg-[#F1EADB] flex items-center justify-center mb-3">
                  <Icon size={16} className="text-[#8A5A2B]" />
                </div>
                <h3 className="text-sm font-medium mb-1.5">{titre}</h3>
                <p className="text-xs text-[#6B5B4D] leading-relaxed">{texte}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Sécurité & confiance */}
      <section id="confiance" className="max-w-6xl mx-auto px-5 py-16 md:py-20">
        <div className="grid md:grid-cols-2 gap-10 items-start">
          <div>
            <h2 className="font-serif text-2xl md:text-3xl mb-4">Un intermédiaire, pas un arbitre absent</h2>
            <p className="text-sm text-[#6B5B4D] mb-5 leading-relaxed">
              Escale met en relation hôtes et voyageurs, mais reste présent quand ça compte.
              Le contrat de location se conclut entre vous ; nous nous assurons que le cadre
              reste clair et que les fonds circulent en toute sécurité.
            </p>
            <ul className="space-y-3">
              {[
                "Paiement retenu jusqu'à la fin du séjour",
                "Signalement et médiation en cas de litige",
                "Politique d'annulation claire sur chaque annonce",
                "Rappel systématique de l'assurance à l'hôte",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-sm text-[#1B3A3A]">
                  <Check size={15} className="text-[#2F6E6E] shrink-0 mt-0.5" /> {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-[#1B3A3A] rounded-2xl p-7 text-[#F8F4EC]">
            <Sparkles size={20} className="text-[#C97B3D] mb-4" />
            <p className="font-serif text-lg mb-2">Nos conditions, sans jargon</p>
            <p className="text-sm text-[#D8CCB0] mb-5 leading-relaxed">
              Notre statut d'intermédiaire, la gestion des litiges et le fonctionnement des
              paiements sont détaillés noir sur blanc dans nos conditions générales.
            </p>
            <button className="flex items-center gap-1.5 text-sm font-medium text-[#C97B3D] hover:text-[#F8F4EC] transition-colors">
              Lire les CGU <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </section>

      {/* Tarification */}
      <section className="bg-[#FFFDF8] border-y border-[#E4DCC8]">
        <div className="max-w-6xl mx-auto px-5 py-16 md:py-20">
          <div className="max-w-lg mb-10">
            <span className="inline-flex items-center gap-1.5 text-xs uppercase tracking-widest text-[#8A5A2B] bg-[#F1EADB] border border-[#E4DCC8] rounded-full px-3 py-1.5 mb-4">
              <Percent size={12} /> Tarification
            </span>
            <h2 className="font-serif text-2xl md:text-3xl mb-3">Une commission, aucune surprise</h2>
            <p className="text-sm text-[#6B5B4D]">
              Escale se rémunère uniquement via une commission sur les réservations confirmées.
              Publier une annonce et parcourir les logements reste entièrement gratuit.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 gap-5 max-w-2xl">
            <div className="border border-[#E4DCC8] rounded-xl p-5">
              <p className="text-xs uppercase tracking-wide text-[#8C7A66] mb-2">Voyageurs</p>
              <p className="font-serif text-2xl text-[#1B3A3A] mb-1">0 €</p>
              <p className="text-xs text-[#6B5B4D]">Aucun frais de réservation. Le prix affiché est le prix payé.</p>
            </div>
            <div className="border-2 border-[#2F6E6E] rounded-xl p-5 relative">
              <span className="absolute -top-2.5 left-5 bg-[#2F6E6E] text-[#F8F4EC] text-[10px] px-2 py-0.5 rounded-full font-medium">
                Hôtes
              </span>
              <p className="text-xs uppercase tracking-wide text-[#8C7A66] mb-2 mt-1">Commission</p>
              <p className="font-serif text-2xl text-[#1B3A3A] mb-1">12%</p>
              <p className="text-xs text-[#6B5B4D]">Prélevée uniquement sur les réservations confirmées, jamais sur la publication.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Témoignages */}
      <section className="max-w-6xl mx-auto px-5 py-16 md:py-20">
        <h2 className="font-serif text-2xl md:text-3xl mb-10">Ce qu'ils en disent</h2>
        <div className="grid sm:grid-cols-3 gap-6">
          {TEMOIGNAGES.map((t) => (
            <div key={t.nom} className="border border-[#E4DCC8] rounded-xl p-5 bg-[#FFFDF8]">
              <div className="flex gap-0.5 mb-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} size={12} className="fill-[#C97B3D] text-[#C97B3D]" />
                ))}
              </div>
              <p className="text-sm text-[#1B3A3A] mb-4 leading-relaxed">"{t.texte}"</p>
              <p className="text-xs text-[#8C7A66]">{t.nom} · {t.role}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-[#FFFDF8] border-y border-[#E4DCC8]">
        <div className="max-w-3xl mx-auto px-5 py-16 md:py-20">
          <h2 className="font-serif text-2xl md:text-3xl mb-8">Questions fréquentes</h2>
          <div className="space-y-2">
            {FAQ.map((item, i) => (
              <div key={item.q} className="border border-[#E4DCC8] rounded-xl overflow-hidden">
                <button
                  onClick={() => setFaqOuverte(faqOuverte === i ? -1 : i)}
                  className="w-full flex items-center justify-between gap-3 px-4 py-3.5 text-left"
                >
                  <span className="text-sm font-medium text-[#1B3A3A]">{item.q}</span>
                  <ChevronDown
                    size={16}
                    className={`text-[#8C7A66] shrink-0 transition-transform ${faqOuverte === i ? "rotate-180" : ""}`}
                  />
                </button>
                {faqOuverte === i && (
                  <p className="px-4 pb-4 text-sm text-[#6B5B4D] leading-relaxed">{item.r}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="max-w-6xl mx-auto px-5 pb-20">
        <div className="bg-[#F1EADB] border border-[#E4DCC8] rounded-2xl px-6 py-12 md:py-16 text-center">
          <h2 className="font-serif text-2xl md:text-3xl mb-3">Prêt pour votre prochaine escale ?</h2>
          <p className="text-sm text-[#6B5B4D] mb-7 max-w-md mx-auto">
            Que vous cherchiez un logement ou souhaitiez accueillir des voyageurs, tout commence ici.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/recherche" className="flex items-center gap-1.5 px-5 py-3 rounded-lg bg-[#1B3A3A] text-[#F8F4EC] text-sm font-medium hover:bg-[#2F6E6E] transition-colors">
              Trouver un logement <ArrowRight size={15} />
            </Link>
            <Link href="/hote" className="flex items-center gap-1.5 px-5 py-3 rounded-lg border border-[#D8CCB0] text-[#1B3A3A] text-sm font-medium hover:bg-[#FFFDF8] transition-colors">
              <Home size={15} /> Devenir hôte
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#E4DCC8]">
        <div className="max-w-6xl mx-auto px-5 py-10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#1B3A3A] flex items-center justify-center">
              <span className="font-serif text-xs text-[#C97B3D]">E</span>
            </div>
            <span className="font-serif text-sm text-[#1B3A3A]">Escale</span>
          </div>
          <div className="flex flex-wrap items-center gap-5 text-xs text-[#8C7A66]">
            <a href="#" className="hover:text-[#1B3A3A] transition-colors">Conditions générales</a>
            <a href="#" className="hover:text-[#1B3A3A] transition-colors">Confidentialité</a>
            <a href="#" className="hover:text-[#1B3A3A] transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
