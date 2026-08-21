"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  BadgeEuro, CalendarDays, Check, Heart, Home, MapPin, Search, SlidersHorizontal,
  Sparkles, Star, Users, Waves, Wifi, Car, PawPrint, Zap
} from "lucide-react";

const LOGEMENTS = [
  { id: "demo-1", nom: "Villa des Pins", ville: "Arcachon", prix: 149, ancienPrix: 159, note: 4.9, voyageurs: 6, chambres: 3, type: "Maison", equipements: ["wifi","parking","piscine"], animaux: true, instantanee: true, prixJuste: true },
  { id: "demo-2", nom: "Maison du Bassin", ville: "Cap Ferret", prix: 189, ancienPrix: 200, note: 4.8, voyageurs: 8, chambres: 4, type: "Maison", equipements: ["wifi","parking"], animaux: false, instantanee: true, prixJuste: true },
  { id: "demo-3", nom: "Appartement vue mer", ville: "La Rochelle", prix: 118, ancienPrix: 118, note: 4.7, voyageurs: 4, chambres: 2, type: "Appartement", equipements: ["wifi"], animaux: false, instantanee: false, prixJuste: false },
  { id: "demo-4", nom: "Chalet des Sapins", ville: "Megève", prix: 235, ancienPrix: 249, note: 4.9, voyageurs: 8, chambres: 4, type: "Chalet", equipements: ["wifi","parking"], animaux: true, instantanee: false, prixJuste: true },
  { id: "demo-5", nom: "Loft du Vieux-Port", ville: "Marseille", prix: 132, ancienPrix: 139, note: 4.6, voyageurs: 3, chambres: 1, type: "Loft", equipements: ["wifi"], animaux: false, instantanee: true, prixJuste: true },
  { id: "demo-6", nom: "Mas des Oliviers", ville: "Gordes", prix: 205, ancienPrix: 219, note: 4.9, voyageurs: 10, chambres: 5, type: "Maison", equipements: ["wifi","parking","piscine"], animaux: true, instantanee: false, prixJuste: true },
];

const TYPES = ["Appartement", "Maison", "Loft", "Chalet"];

function BadgePrixJuste() {
  return <span className="inline-flex items-center gap-1 rounded-full bg-[#F1E7D6] px-2.5 py-1 text-[11px] font-semibold text-[#8D5B30]"><BadgeEuro size={12}/> Prix Juste Escale</span>;
}

export default function DemoVoyageur() {
  const [destination, setDestination] = useState("");
  const [voyageurs, setVoyageurs] = useState(2);
  const [prixMax, setPrixMax] = useState(260);
  const [type, setType] = useState("");
  const [prixJuste, setPrixJuste] = useState(false);
  const [instantanee, setInstantanee] = useState(false);
  const [animaux, setAnimaux] = useState(false);
  const [favoris, setFavoris] = useState([]);
  const [filtresOuverts, setFiltresOuverts] = useState(true);

  const resultats = useMemo(() => LOGEMENTS.filter((l) => {
    const q = destination.trim().toLowerCase();
    return (!q || l.ville.toLowerCase().includes(q) || l.nom.toLowerCase().includes(q))
      && l.voyageurs >= voyageurs
      && l.prix <= prixMax
      && (!type || l.type === type)
      && (!prixJuste || l.prixJuste)
      && (!instantanee || l.instantanee)
      && (!animaux || l.animaux);
  }), [destination, voyageurs, prixMax, type, prixJuste, instantanee, animaux]);

  function toggleFavori(id) {
    setFavoris((f) => f.includes(id) ? f.filter((x) => x !== id) : [...f, id]);
  }

  return <main className="min-h-screen bg-[#F8F4EC] text-[#173C3A]">
    <header className="sticky top-0 z-40 border-b border-[#E8DECA] bg-[#F8F4EC]/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5">
        <Link href="/" className="flex items-center gap-2 font-serif text-xl"><span className="grid h-9 w-9 place-items-center rounded-xl bg-[#173C3A] text-[#D99054]">E</span>Escale</Link>
        <div className="flex items-center gap-3 text-sm"><span className="hidden text-[#6D6258] md:inline">Mode démonstration voyageur</span><Link href="/" className="rounded-xl border border-[#CCB999] px-3 py-2">Retour au site</Link></div>
      </div>
    </header>

    <section className="border-b border-[#E8DECA] bg-[#FFFDF8]">
      <div className="mx-auto max-w-7xl px-5 py-8">
        <div className="inline-flex items-center gap-2 rounded-full bg-[#F1E7D6] px-3 py-1.5 text-xs font-semibold uppercase tracking-[.14em] text-[#8D5B30]"><Sparkles size={13}/> Démo complète</div>
        <h1 className="mt-4 font-serif text-4xl md:text-5xl">Trouvez un séjour qui vous ressemble.</h1>
        <p className="mt-3 max-w-3xl text-[#6D6258]">Testez la recherche, les filtres, le Prix Juste Escale, les favoris et les principaux critères voyageur sans créer de compte.</p>

        <div className="mt-7 grid gap-3 rounded-2xl border border-[#E2D6C2] bg-[#F8F4EC] p-3 md:grid-cols-[1.4fr_1fr_.8fr_auto]">
          <label className="rounded-xl bg-white px-4 py-3"><span className="text-[11px] uppercase tracking-wider text-[#8D5B30]">Destination</span><div className="mt-1 flex items-center gap-2"><MapPin size={16}/><input value={destination} onChange={(e)=>setDestination(e.target.value)} placeholder="Ville, région ou envie" className="w-full bg-transparent text-sm outline-none"/></div></label>
          <button className="rounded-xl bg-white px-4 py-3 text-left"><span className="text-[11px] uppercase tracking-wider text-[#8D5B30]">Dates</span><div className="mt-1 flex items-center gap-2 text-sm"><CalendarDays size={16}/> Dates flexibles</div></button>
          <label className="rounded-xl bg-white px-4 py-3"><span className="text-[11px] uppercase tracking-wider text-[#8D5B30]">Voyageurs</span><div className="mt-1 flex items-center gap-2"><Users size={16}/><input type="number" min="1" max="12" value={voyageurs} onChange={(e)=>setVoyageurs(Number(e.target.value))} className="w-full bg-transparent text-sm outline-none"/></div></label>
          <button className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#173C3A] px-5 py-3 font-medium text-white"><Search size={17}/> Rechercher</button>
        </div>
      </div>
    </section>

    <section className="mx-auto max-w-7xl px-5 py-8">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div><p className="text-sm text-[#6D6258]">{resultats.length} résultat{resultats.length>1?"s":""}</p><h2 className="font-serif text-3xl">Séjours disponibles</h2></div>
        <button onClick={()=>setFiltresOuverts(v=>!v)} className="inline-flex items-center gap-2 rounded-xl border border-[#CCB999] bg-[#FFFDF8] px-4 py-2.5 text-sm"><SlidersHorizontal size={16}/> {filtresOuverts ? "Masquer" : "Afficher"} les filtres</button>
      </div>

      <div className={`grid gap-6 ${filtresOuverts ? "lg:grid-cols-[280px_1fr]" : ""}`}>
        {filtresOuverts && <aside className="h-fit rounded-2xl border border-[#E2D6C2] bg-[#FFFDF8] p-5 lg:sticky lg:top-24">
          <h3 className="font-serif text-xl">Affiner</h3>
          <div className="mt-5 border-t border-[#E8DECA] pt-5"><div className="flex justify-between text-sm"><span>Budget / nuit</span><b>{prixMax} € max</b></div><input type="range" min="80" max="300" step="5" value={prixMax} onChange={(e)=>setPrixMax(Number(e.target.value))} className="mt-3 w-full"/></div>
          <div className="mt-5 border-t border-[#E8DECA] pt-5"><p className="text-sm font-medium">Type de logement</p><div className="mt-3 flex flex-wrap gap-2">{TYPES.map((t)=><button key={t} onClick={()=>setType(type===t?"":t)} className={`rounded-full border px-3 py-1.5 text-xs ${type===t?"border-[#173C3A] bg-[#173C3A] text-white":"border-[#E2D6C2] bg-[#F8F4EC]"}`}>{t}</button>)}</div></div>
          <div className="mt-5 space-y-3 border-t border-[#E8DECA] pt-5 text-sm">
            <label className="flex items-center gap-2"><input type="checkbox" checked={prixJuste} onChange={(e)=>setPrixJuste(e.target.checked)}/><BadgeEuro size={15}/> Prix Juste Escale</label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={instantanee} onChange={(e)=>setInstantanee(e.target.checked)}/><Zap size={15}/> Réservation instantanée</label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={animaux} onChange={(e)=>setAnimaux(e.target.checked)}/><PawPrint size={15}/> Animaux acceptés</label>
          </div>
          <button onClick={()=>{setDestination("");setVoyageurs(2);setPrixMax(260);setType("");setPrixJuste(false);setInstantanee(false);setAnimaux(false);}} className="mt-5 text-xs font-medium text-[#8D5B30]">Réinitialiser tous les filtres</button>
        </aside>}

        <div>
          <div className="mb-6 grid gap-3 md:grid-cols-3">
            {[ [Waves,"Bord de mer"], [Wifi,"Wifi indispensable"], [Car,"Parking facile"] ].map(([I,t])=><button key={t} className="flex items-center gap-3 rounded-2xl border border-[#E2D6C2] bg-[#FFFDF8] p-4 text-left text-sm"><span className="grid h-9 w-9 place-items-center rounded-xl bg-[#F1E7D6] text-[#A86735]"><I size={17}/></span>{t}</button>)}
          </div>

          {resultats.length === 0 ? <div className="rounded-3xl border border-dashed border-[#CCB999] bg-[#FFFDF8] p-10 text-center"><Home className="mx-auto"/><h3 className="mt-3 font-serif text-2xl">Aucun séjour avec ces critères</h3><p className="mt-2 text-sm text-[#6D6258]">Élargissez le budget, retirez un filtre ou essayez une autre destination.</p></div> :
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{resultats.map((l)=>{
            const economie = Math.max(0, l.ancienPrix-l.prix);
            return <article key={l.id} className="overflow-hidden rounded-2xl border border-[#E2D6C2] bg-[#FFFDF8]">
              <div className="relative grid aspect-[4/3] place-items-center bg-[#EDE4D4]"><Home size={28} className="text-[#B0A48F]"/><button onClick={()=>toggleFavori(l.id)} className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-white/90"><Heart size={17} className={favoris.includes(l.id)?"fill-[#C97B3D] text-[#C97B3D]":"text-[#6D6258]"}/></button>{l.prixJuste&&<div className="absolute bottom-3 left-3"><BadgePrixJuste/></div>}</div>
              <div className="p-5"><div className="flex items-start justify-between gap-3"><div><p className="text-xs text-[#8D5B30]">{l.ville}</p><h3 className="mt-1 font-semibold">{l.nom}</h3></div><span className="flex items-center gap-1 text-sm"><Star size={14} className="fill-[#D99054] text-[#D99054]"/>{l.note}</span></div><p className="mt-2 text-xs text-[#6D6258]">{l.voyageurs} voyageurs · {l.chambres} chambre{l.chambres>1?"s":""} · {l.type}</p><div className="mt-4 flex items-end justify-between"><div><div><span className="text-lg font-semibold">{l.prix} €</span><span className="text-xs text-[#6D6258]"> / nuit</span>{l.ancienPrix>l.prix&&<span className="ml-2 text-sm text-[#8C7A66] line-through">{l.ancienPrix} €</span>}</div>{economie>0&&<p className="mt-1 text-xs font-semibold text-[#A86735]">Vous économisez {economie} € par nuit</p>}</div>{l.instantanee&&<span className="rounded-full bg-[#E1EEE9] px-2 py-1 text-[10px] font-medium"><Check size={10} className="mr-1 inline"/>Instantanée</span>}</div></div>
            </article>})}</div>}

          <div className="mt-8 rounded-3xl bg-[#173C3A] p-6 text-white"><div className="flex items-start gap-4"><BadgeEuro className="mt-1 text-[#D99054]"/><div><h3 className="text-lg font-semibold">Comprendre le Prix Juste Escale</h3><p className="mt-2 max-w-3xl text-sm leading-6 text-[#C8D8D4]">Le badge indique l’engagement déclaré de l’hôte selon la Charte du Prix Juste. En démonstration, l’ancien prix et l’économie par nuit permettent de vérifier immédiatement la lisibilité de cette promesse pour le voyageur.</p><Link href="/charte-prix-juste" className="mt-3 inline-block text-sm font-medium text-[#F1C7A3]">Lire la Charte →</Link></div></div></div>
        </div>
      </div>
    </section>
  </main>;
}
