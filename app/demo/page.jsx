"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BedDouble,
  CalendarDays,
  CheckCircle2,
  CreditCard,
  Dumbbell,
  Flame,
  Flower2,
  MapPin,
  ParkingCircle,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Sun,
  Trees,
  Tv,
  Umbrella,
  Users,
  Waves,
  Wifi,
} from "lucide-react";

const listings = [
  {
    id: 1,
    title: "Villa des Embruns",
    city: "La Rochelle",
    price: 245,
    guests: 6,
    bedrooms: 3,
    bathrooms: 2,
    beds: 4,
    rating: "4,92",
    reviews: 86,
    tag: "Maison · bord de mer",
    distance: "Plage à 350 m",
    host: "Sophie",
    description: "Villa lumineuse pensée pour les séjours en famille, avec grand jardin, piscine chauffée et accès rapide à la plage. Le séjour s'ouvre sur la terrasse et l'espace extérieur, idéal pour profiter des beaux jours.",
    photos: [
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1400&q=85",
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=900&q=85",
      "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=900&q=85",
      "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=900&q=85",
      "https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=900&q=85",
    ],
    amenities: [
      ["Piscine chauffée", Waves], ["Wi-Fi fibre", Wifi], ["Jardin privé", Trees], ["Plage à pied", Umbrella],
      ["Parking privé", ParkingCircle], ["Barbecue", Flame], ["Smart TV", Tv], ["Climatisation", Sun],
    ],
    highlights: ["Piscine chauffée d'avril à octobre", "Terrasse et jardin clos", "Plage et commerces accessibles à pied"],
  },
  {
    id: 2,
    title: "Loft Vieux-Port",
    city: "Marseille",
    price: 175,
    guests: 4,
    bedrooms: 2,
    bathrooms: 1,
    beds: 2,
    rating: "4,88",
    reviews: 124,
    tag: "Appartement · centre-ville",
    distance: "Vieux-Port à 2 min",
    host: "Nicolas",
    description: "Loft contemporain au cœur de Marseille, à deux pas du Vieux-Port. Une adresse pratique pour tout faire à pied, avec une grande pièce de vie, une cuisine équipée et une connexion fibre rapide.",
    photos: [
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1400&q=85",
      "https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=900&q=85",
      "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=900&q=85",
      "https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=900&q=85",
      "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=900&q=85",
    ],
    amenities: [
      ["Wi-Fi fibre", Wifi], ["Climatisation", Sun], ["Smart TV", Tv], ["Cuisine équipée", Sparkles],
      ["Vieux-Port à pied", MapPin], ["Linge fourni", Flower2], ["Salle de sport proche", Dumbbell], ["Parking public proche", ParkingCircle],
    ],
    highlights: ["Emplacement central", "Restaurants et marché à proximité", "Arrivée autonome"],
  },
  {
    id: 3,
    title: "Studio Bellecour",
    city: "Lyon",
    price: 120,
    guests: 2,
    bedrooms: 1,
    bathrooms: 1,
    beds: 1,
    rating: "4,84",
    reviews: 58,
    tag: "Studio · hypercentre",
    distance: "Place Bellecour à 150 m",
    host: "Élodie",
    description: "Studio élégant et fonctionnel en plein centre de Lyon. Idéal pour un couple ou un déplacement professionnel avec literie confortable, cuisine équipée et toutes les commodités à quelques minutes.",
    photos: [
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1400&q=85",
      "https://images.unsplash.com/photo-1560185008-b033106af5c3?auto=format&fit=crop&w=900&q=85",
      "https://images.unsplash.com/photo-1560185127-6ed189bf02f4?auto=format&fit=crop&w=900&q=85",
      "https://images.unsplash.com/photo-1554995207-c18c203602cb?auto=format&fit=crop&w=900&q=85",
      "https://images.unsplash.com/photo-1556912172-45b7abe8b7e1?auto=format&fit=crop&w=900&q=85",
    ],
    amenities: [
      ["Wi-Fi fibre", Wifi], ["Smart TV", Tv], ["Cuisine équipée", Sparkles], ["Centre-ville", MapPin],
      ["Linge fourni", Flower2], ["Café & thé", Sun], ["Métro à 2 min", MapPin], ["Arrivée autonome", ShieldCheck],
    ],
    highlights: ["Tout Lyon à pied", "Literie premium", "Métro et commerces immédiats"],
  },
];

const steps = ["Explorer", "Logement", "Réserver", "Compte", "Paiement", "Confirmation"];
const money = (n) => new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);

export default function DemoPage() {
  const [mode, setMode] = useState("voyageur");
  const [step, setStep] = useState(0);
  const [selected, setSelected] = useState(listings[0]);
  const [nights, setNights] = useState(4);
  const [guests, setGuests] = useState(2);
  const [name, setName] = useState("Alexandre Démo");
  const [email, setEmail] = useState("alexandre.demo@escale.fr");
  const [paid, setPaid] = useState(false);

  const pricing = useMemo(() => {
    const stay = selected.price * nights;
    const cleaning = selected.id === 1 ? 85 : selected.id === 2 ? 65 : 45;
    const tax = guests * nights * 2;
    const total = stay + cleaning + tax;
    const competitor = Math.round(total * 1.12);
    return { stay, cleaning, tax, total, competitor, saving: competitor - total };
  }, [selected, nights, guests]);

  const reset = () => {
    setMode("voyageur"); setStep(0); setSelected(listings[0]); setNights(4); setGuests(2); setPaid(false);
  };

  const choose = (listing) => {
    setSelected(listing);
    setGuests(Math.min(2, listing.guests));
    setStep(1);
  };

  return (
    <main className="min-h-screen bg-[#F8F4EC] text-[#173C3A]">
      <div className="sticky top-0 z-50 border-b border-amber-300 bg-amber-100 px-4 py-2 text-center text-sm font-semibold text-amber-950">MODE DÉMONSTRATION · aucune réservation ni aucun paiement réel</div>
      <header className="border-b border-[#E6DCCB] bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4">
          <div className="flex items-center gap-3"><Link href="/" className="grid h-10 w-10 place-items-center rounded-xl bg-[#173C3A] font-serif text-lg text-[#D99054]">E</Link><div><p className="font-serif text-xl">Escale</p><p className="text-xs text-[#756A60]">Démo interactive</p></div></div>
          <div className="flex gap-2"><button onClick={() => setMode("voyageur")} className={`rounded-xl px-4 py-2 text-sm font-medium ${mode === "voyageur" ? "bg-[#173C3A] text-white" : "border border-[#D8CBB8] bg-white"}`}>Voyageur</button><button onClick={() => setMode("hote")} className={`rounded-xl px-4 py-2 text-sm font-medium ${mode === "hote" ? "bg-[#173C3A] text-white" : "border border-[#D8CBB8] bg-white"}`}>Hôte</button><button onClick={reset} className="rounded-xl border border-[#D8CBB8] bg-white p-2" title="Réinitialiser"><RotateCcw size={18}/></button></div>
        </div>
      </header>

      {mode === "hote" ? <HostDemo paid={paid} selected={selected} pricing={pricing} name={name} /> : <>
        <div className="mx-auto max-w-7xl px-5 pt-6"><div className="grid grid-cols-6 gap-2">{steps.map((s, i) => <div key={s}><div className={`h-1.5 rounded-full ${i <= step ? "bg-[#A86735]" : "bg-[#E8DECE]"}`}/><p className={`mt-2 hidden text-xs sm:block ${i === step ? "font-semibold" : "text-[#887B70]"}`}>{s}</p></div>)}</div></div>

        {step === 0 && <section className="mx-auto max-w-7xl px-5 py-10">
          <p className="text-sm font-semibold uppercase tracking-[.16em] text-[#A86735]">Tester comme un vrai voyageur</p>
          <h1 className="mt-3 max-w-3xl font-serif text-4xl md:text-5xl">Des annonces qui donnent vraiment envie de partir.</h1>
          <p className="mt-4 max-w-2xl text-[#6D6258]">Photos, équipements, capacité, emplacement et prix sont présentés comme sur une vraie plateforme de réservation.</p>
          <div className="mt-8 grid gap-6 md:grid-cols-3">{listings.map(l => <article key={l.id} className="overflow-hidden rounded-3xl border border-[#E0D4C1] bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            <div className="relative h-56 overflow-hidden"><img src={l.photos[0]} alt={l.title} className="h-full w-full object-cover"/><span className="absolute left-4 top-4 rounded-full bg-white/95 px-3 py-1 text-xs font-semibold shadow">★ {l.rating}</span></div>
            <div className="p-5"><div className="flex items-start justify-between gap-3"><div><p className="text-xs uppercase tracking-wider text-[#9A673D]">{l.city}</p><h2 className="mt-1 text-xl font-semibold">{l.title}</h2></div><p className="text-sm font-semibold">{l.rating} ★</p></div><p className="mt-1 text-sm text-[#756A60]">{l.tag} · {l.distance}</p>
            <div className="mt-4 flex flex-wrap gap-2">{l.amenities.slice(0,4).map(([label]) => <span key={label} className="rounded-full bg-[#F4EFE6] px-2.5 py-1 text-xs text-[#5F574F]">{label}</span>)}</div>
            <div className="mt-5 flex gap-4 text-sm text-[#756A60]"><span className="flex gap-1"><Users size={16}/>{l.guests}</span><span className="flex gap-1"><BedDouble size={16}/>{l.bedrooms} ch.</span></div>
            <div className="mt-5 flex items-end justify-between"><div><b className="text-xl">{money(l.price)}</b><span className="text-sm text-[#756A60]"> / nuit</span></div><button onClick={() => choose(l)} className="rounded-xl bg-[#173C3A] px-4 py-2.5 text-sm font-medium text-white">Voir l'annonce <ArrowRight className="ml-1 inline" size={15}/></button></div></div>
          </article>)}</div>
        </section>}

        {step === 1 && <section className="mx-auto max-w-7xl px-5 py-8">
          <button onClick={() => setStep(0)} className="mb-5 flex items-center gap-2 text-sm text-[#756A60]"><ArrowLeft size={16}/> Retour aux logements</button>
          <PhotoGallery listing={selected}/>
          <div className="mt-8 grid gap-10 lg:grid-cols-[1.25fr_.75fr]">
            <div>
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#E2D7C6] pb-6"><div><p className="text-sm font-semibold uppercase tracking-wider text-[#A86735]">{selected.city}</p><h1 className="mt-2 font-serif text-4xl">{selected.title}</h1><p className="mt-2 text-[#6D6258]">{selected.guests} voyageurs · {selected.bedrooms} chambres · {selected.beds} lits · {selected.bathrooms} salle{selected.bathrooms > 1 ? "s" : ""} de bain</p></div><div className="text-right"><p className="font-semibold">★ {selected.rating}</p><p className="text-sm text-[#756A60]">{selected.reviews} avis</p></div></div>
              <div className="border-b border-[#E2D7C6] py-6"><p className="font-semibold">Hébergé par {selected.host}</p><p className="mt-1 text-sm text-[#756A60]">Hôte vérifié · réponse rapide · accueil autonome possible</p></div>
              <p className="border-b border-[#E2D7C6] py-6 leading-7 text-[#5F574F]">{selected.description}</p>
              <div className="border-b border-[#E2D7C6] py-7"><h2 className="font-serif text-2xl">Les points forts</h2><div className="mt-4 grid gap-3 sm:grid-cols-3">{selected.highlights.map(x => <div key={x} className="rounded-2xl bg-white p-4 text-sm shadow-sm"><CheckCircle2 className="mb-2 text-[#A86735]" size={20}/>{x}</div>)}</div></div>
              <div className="py-7"><h2 className="font-serif text-2xl">Ce que propose ce logement</h2><div className="mt-5 grid gap-4 sm:grid-cols-2">{selected.amenities.map(([label, Icon]) => <div key={label} className="flex items-center gap-3 rounded-xl border border-[#E3D8C7] bg-white px-4 py-3"><Icon size={20} className="text-[#A86735]"/><span className="text-sm font-medium">{label}</span></div>)}</div></div>
              <div className="rounded-3xl border border-[#E0D4C1] bg-white p-6"><div className="flex items-center gap-2"><MapPin size={20}/><h2 className="font-serif text-xl">Emplacement</h2></div><p className="mt-2 text-sm text-[#6D6258]">{selected.distance}. L'adresse exacte serait communiquée après réservation.</p><div className="mt-4 grid h-40 place-items-center rounded-2xl bg-[#DDE7E1] text-center"><div><MapPin className="mx-auto"/><p className="mt-2 text-sm font-semibold">Zone approximative · {selected.city}</p></div></div></div>
            </div>

            <aside className="h-fit rounded-3xl border border-[#DDCFBA] bg-white p-6 shadow-md lg:sticky lg:top-16">
              <div className="flex items-end justify-between"><p><b className="text-2xl">{money(selected.price)}</b> <span className="text-sm text-[#756A60]">/ nuit</span></p><p className="text-sm">★ {selected.rating} · <u>{selected.reviews} avis</u></p></div>
              <div className="mt-5 rounded-2xl border border-[#E4D9C8] p-4"><p className="text-sm font-semibold">Disponible pour la démo</p><p className="mt-1 text-sm text-[#756A60]">Dates fictives, aucune disponibilité réelle bloquée.</p></div>
              <div className="mt-4 space-y-2 text-sm">{selected.highlights.slice(0,2).map(x => <p key={x} className="flex gap-2"><CheckCircle2 size={17} className="mt-0.5 text-emerald-600"/>{x}</p>)}</div>
              <button onClick={() => setStep(2)} className="mt-6 w-full rounded-xl bg-[#173C3A] px-5 py-3 font-semibold text-white">Réserver ce logement</button><p className="mt-3 text-center text-xs text-[#756A60]">Aucun débit réel dans le mode démo</p>
            </aside>
          </div>
        </section>}

        {step === 2 && <Panel title="Votre séjour" subtitle="Choisissez les paramètres de la fausse réservation."><div className="grid gap-4 sm:grid-cols-2"><label className="rounded-2xl border bg-white p-4"><span className="text-sm font-medium">Nombre de nuits</span><select value={nights} onChange={e=>setNights(Number(e.target.value))} className="mt-2 w-full rounded-xl border bg-white p-3">{Array.from({ length: 14 }, (_, i) => i + 1).map(n => <option key={n} value={n}>{n} {n === 1 ? "nuit" : "nuits"}</option>)}</select></label><label className="rounded-2xl border bg-white p-4"><span className="text-sm font-medium">Nombre de personnes</span><select value={guests} onChange={e=>setGuests(Number(e.target.value))} className="mt-2 w-full rounded-xl border bg-white p-3">{Array.from({ length: selected.guests }, (_, i) => i + 1).map(n => <option key={n} value={n}>{n} {n === 1 ? "personne" : "personnes"}</option>)}</select></label></div><div className="mt-5 flex gap-3 overflow-hidden rounded-2xl border bg-white p-3"><img src={selected.photos[0]} alt="" className="h-20 w-24 rounded-xl object-cover"/><div><p className="font-semibold">{selected.title}</p><p className="mt-1 text-sm text-[#756A60]">{selected.city} · ★ {selected.rating}</p><p className="mt-1 text-xs text-[#756A60]">{selected.distance}</p></div></div><PriceBox pricing={pricing} nights={nights} price={selected.price}/><Next onBack={()=>setStep(1)} onNext={()=>setStep(3)} label="Continuer vers le compte"/></Panel>}

        {step === 3 && <Panel title="Création de compte démo" subtitle="Ces informations servent uniquement au scénario affiché à l'écran."><div className="grid gap-4"><label><span className="text-sm font-medium">Nom</span><input value={name} onChange={e=>setName(e.target.value)} className="mt-2 w-full rounded-xl border bg-white p-3"/></label><label><span className="text-sm font-medium">E-mail</span><input value={email} onChange={e=>setEmail(e.target.value)} className="mt-2 w-full rounded-xl border bg-white p-3"/></label></div><Next onBack={()=>setStep(2)} onNext={()=>setStep(4)} label="Créer le compte démo"/></Panel>}

        {step === 4 && <Panel title="Paiement simulé" subtitle="Aucune donnée bancaire n'est demandée et aucun prestataire de paiement n'est appelé."><div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-900"><ShieldCheck className="mr-2 inline" size={18}/> Environnement de démonstration sécurisé.</div><div className="mt-5 rounded-2xl border bg-white p-5"><div className="flex items-center gap-2 font-semibold"><CreditCard size={19}/> Simulation du paiement</div><p className="mt-2 text-sm text-[#756A60]">Le bouton ci-dessous reproduit uniquement le résultat d'un paiement accepté pour tester la suite du parcours.</p></div><PriceBox pricing={pricing} nights={nights} price={selected.price}/><Next onBack={()=>setStep(3)} onNext={()=>{setPaid(true);setStep(5)}} label={`Simuler le paiement de ${money(pricing.total)}`}/></Panel>}

        {step === 5 && <section className="mx-auto max-w-3xl px-5 py-16 text-center"><CheckCircle2 className="mx-auto text-emerald-600" size={60}/><p className="mt-5 text-sm font-semibold uppercase tracking-wider text-emerald-700">Paiement simulé accepté</p><h1 className="mt-3 font-serif text-4xl">Réservation de démonstration confirmée.</h1><p className="mx-auto mt-4 max-w-xl text-[#6D6258]">{name}, votre séjour fictif à {selected.title} est confirmé pour {nights} nuits. Le tableau de bord hôte affiche maintenant cette réservation et le contact CRM.</p><div className="mt-7 overflow-hidden rounded-3xl border bg-white text-left"><img src={selected.photos[0]} alt="" className="h-44 w-full object-cover"/><div className="p-6"><p className="text-sm text-[#756A60]">Référence</p><p className="font-mono font-semibold">ESCALE-DEMO-260821</p><div className="mt-4 flex justify-between"><span>Total simulé</span><b>{money(pricing.total)}</b></div><div className="mt-2 flex justify-between text-emerald-700"><span>Économie estimée vs plateforme classique</span><b>{money(pricing.saving)}</b></div></div></div><div className="mt-7 flex flex-wrap justify-center gap-3"><button onClick={()=>setMode("hote")} className="rounded-xl bg-[#173C3A] px-5 py-3 font-semibold text-white">Voir côté hôte <ArrowRight className="ml-1 inline" size={16}/></button><button onClick={reset} className="rounded-xl border border-[#CCBDA5] bg-white px-5 py-3 font-semibold">Recommencer la démo</button></div></section>}
      </>}
    </main>
  );
}

function PhotoGallery({ listing }) {
  return <div className="grid h-[470px] grid-cols-2 gap-2 overflow-hidden rounded-3xl md:grid-cols-4"><img src={listing.photos[0]} alt={`${listing.title} - vue principale`} className="col-span-2 row-span-2 h-full w-full object-cover"/>{listing.photos.slice(1,5).map((photo, i) => <img key={photo} src={photo} alt={`${listing.title} - photo ${i + 2}`} className="h-full w-full object-cover"/>)}</div>;
}

function Panel({title, subtitle, children}) { return <section className="mx-auto max-w-3xl px-5 py-12"><h1 className="font-serif text-4xl">{title}</h1><p className="mt-3 text-[#6D6258]">{subtitle}</p><div className="mt-7">{children}</div></section>; }
function Next({onBack,onNext,label}) { return <div className="mt-7 flex justify-between gap-3"><button onClick={onBack} className="rounded-xl border border-[#CCBDA5] bg-white px-4 py-3"><ArrowLeft className="mr-1 inline" size={16}/> Retour</button><button onClick={onNext} className="rounded-xl bg-[#173C3A] px-5 py-3 font-semibold text-white">{label} <ArrowRight className="ml-1 inline" size={16}/></button></div>; }
function PriceBox({pricing,nights,price}) { return <div className="mt-5 rounded-2xl border bg-white p-5 text-sm"><div className="flex justify-between"><span>{money(price)} × {nights} nuits</span><span>{money(pricing.stay)}</span></div><div className="mt-2 flex justify-between"><span>Ménage</span><span>{money(pricing.cleaning)}</span></div><div className="mt-2 flex justify-between"><span>Taxe de séjour simulée</span><span>{money(pricing.tax)}</span></div><div className="mt-4 flex justify-between border-t pt-4 text-base font-semibold"><span>Total</span><span>{money(pricing.total)}</span></div><div className="mt-2 flex justify-between text-emerald-700"><span>Économie estimée</span><b>{money(pricing.saving)}</b></div></div>; }
function HostDemo({paid,selected,pricing,name}) { return <section className="mx-auto max-w-7xl px-5 py-10"><p className="text-sm font-semibold uppercase tracking-[.16em] text-[#A86735]">Vue hôte</p><h1 className="mt-3 font-serif text-4xl">Tableau de bord de démonstration</h1><p className="mt-3 text-[#6D6258]">La réservation créée côté voyageur apparaît ici immédiatement dans la démo.</p><div className="mt-8 grid gap-4 md:grid-cols-4">{[["Réservations","7"],["CA démo","6 380 €"],["Contacts CRM","4"],["Paiements","6"]].map(([l,v])=><div key={l} className="rounded-2xl border bg-white p-5"><p className="text-sm text-[#756A60]">{l}</p><p className="mt-2 text-2xl font-semibold">{v}</p></div>)}</div><div className="mt-8 grid gap-6 lg:grid-cols-2"><div className="rounded-3xl border bg-white p-6"><div className="flex items-center gap-2 font-semibold"><CalendarDays size={19}/> Réservation la plus récente</div>{paid ? <div className="mt-5 overflow-hidden rounded-2xl bg-[#F8F4EC]"><img src={selected.photos[0]} alt="" className="h-36 w-full object-cover"/><div className="p-5"><p className="font-semibold">{selected.title}</p><p className="mt-1 text-sm text-[#756A60]">Voyageur : {name}</p><p className="mt-1 text-sm text-[#756A60]">Montant : {money(pricing.total)}</p><span className="mt-3 inline-block rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">Confirmée · paiement simulé réussi</span></div></div> : <p className="mt-5 text-sm text-[#756A60]">Effectuez d'abord une réservation côté voyageur pour la voir ici.</p>}</div><div className="rounded-3xl border bg-white p-6"><div className="flex items-center gap-2 font-semibold"><Users size={19}/> CRM voyageur</div><div className="mt-5 space-y-3">{["Camille Martin · VIP · Famille","Thomas Renard · Fidèle","Julie Bernard · Nouveau client", paid ? `${name} · Nouveau client démo` : "Nora Petit · Prospect"].map(x=><div key={x} className="rounded-xl bg-[#F8F4EC] p-3 text-sm">{x}</div>)}</div></div></div><div className="mt-8 rounded-3xl bg-[#173C3A] p-6 text-white"><h2 className="text-xl font-semibold">Fonctions validables dans cette démo</h2><div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{["Recherche logement","Annonce enrichie","Paiement simulé","Remontée réservation + CRM"].map(x=><div key={x} className="rounded-xl bg-white/10 p-4 text-sm">✓ {x}</div>)}</div></div></section>; }
