"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  Search, MapPin, Calendar, Users, SlidersHorizontal, Star, Heart,
  X, Wifi, Car, Utensils, Wind, Waves, PawPrint, Zap, ChevronDown,
  Home, Building2, Warehouse, Mountain, Trees, Loader2, Sparkles,
} from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

// ---------------------------------------------------------------------------
// Configuration des filtres (statique, ne dépend pas des données)
// ---------------------------------------------------------------------------

const TYPES = [
  { id: "appartement", label: "Appartement", icon: Building2 },
  { id: "maison", label: "Maison", icon: Home },
  { id: "loft", label: "Loft", icon: Warehouse },
  { id: "chalet", label: "Chalet", icon: Mountain },
  { id: "cabane", label: "Cabane", icon: Trees },
];

const EQUIPEMENTS = [
  { id: "wifi", label: "Wifi", icon: Wifi },
  { id: "parking", label: "Parking", icon: Car },
  { id: "cuisine", label: "Cuisine équipée", icon: Utensils },
  { id: "clim", label: "Climatisation", icon: Wind },
  { id: "piscine", label: "Piscine", icon: Waves },
];

// Traduit une ligne `listings` (Supabase) vers la forme attendue par l'UI
function depuisLigneSupabase(l) {
  return {
    id: l.id,
    nom: l.title,
    ville: l.city,
    type: l.type,
    prix: Number(l.price_per_night),
    note: Number(l.average_rating) || 0,
    avis: l.review_count || 0,
    voyageurs: l.guests,
    equipements: Array.isArray(l.amenities) ? l.amenities : [],
    animaux: !!l.pets_allowed,
    instantanee: !!l.instant_booking,
  };
}

const TRIS = [
  { id: "recommande", label: "Recommandés" },
  { id: "prix_croissant", label: "Prix croissant" },
  { id: "prix_decroissant", label: "Prix décroissant" },
  { id: "mieux_notes", label: "Mieux notés" },
];

// ---------------------------------------------------------------------------
// Composants
// ---------------------------------------------------------------------------

function CarteLogement({ logement, favori, onToggleFavori }) {
  return (
    <div className="border border-[#E4DCC8] rounded-xl overflow-hidden bg-[#FFFDF8] group relative">
      <Link href={`/logement/${logement.id}`} className="absolute inset-0 z-0" aria-label={logement.nom} />
      <div className="relative aspect-[4/3] bg-[#EDE4D4] flex items-center justify-center pointer-events-none">
        <Home size={24} className="text-[#B0A48F]" />
        <button
          onClick={(e) => { e.preventDefault(); onToggleFavori(logement.id); }}
          className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-[#FFFDF8]/90 flex items-center justify-center hover:bg-[#FFFDF8] transition-colors pointer-events-auto"
          aria-label="Ajouter aux favoris"
        >
          <Heart size={15} className={favori ? "fill-[#C97B3D] text-[#C97B3D]" : "text-[#6B5B4D]"} />
        </button>
        {logement.instantanee && (
          <span className="absolute bottom-2.5 left-2.5 flex items-center gap-1 bg-[#1B3A3A] text-[#F8F4EC] text-[10px] px-2 py-1 rounded-full font-medium">
            <Zap size={10} /> Instantanée
          </span>
        )}
      </div>
      <div className="p-4 pointer-events-none">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="text-sm font-medium text-[#1B3A3A] truncate">{logement.nom}</h3>
          <span className="flex items-center gap-1 text-xs text-[#8A5A2B] shrink-0">
            <Star size={11} className="fill-[#C97B3D] text-[#C97B3D]" /> {logement.note || "Nouveau"}
          </span>
        </div>
        <p className="text-xs text-[#8C7A66] flex items-center gap-1 mb-1">
          <MapPin size={11} /> {logement.ville}
        </p>
        <p className="text-xs text-[#8C7A66] mb-2.5">{logement.avis} avis · {logement.voyageurs} voyageurs max</p>
        <p className="text-sm font-medium text-[#1B3A3A]">{logement.prix} € <span className="text-xs text-[#8C7A66] font-normal">/ nuit</span></p>
      </div>
    </div>
  );
}

function BlocFiltre({ titre, children }) {
  return (
    <div className="py-4 border-b border-[#E4DCC8] last:border-b-0">
      <h3 className="text-sm font-medium text-[#1B3A3A] mb-3">{titre}</h3>
      {children}
    </div>
  );
}

function PanneauFiltres({ filtres, setFiltres, onFermer }) {
  function toggleType(id) {
    setFiltres((f) => ({ ...f, types: f.types.includes(id) ? f.types.filter((t) => t !== id) : [...f.types, id] }));
  }
  function toggleEquipement(id) {
    setFiltres((f) => ({ ...f, equipements: f.equipements.includes(id) ? f.equipements.filter((e) => e !== id) : [...f.equipements, id] }));
  }

  return (
    <div className="bg-[#FFFDF8] border border-[#E4DCC8] rounded-xl p-5">
      {onFermer && (
        <div className="flex items-center justify-between mb-2 md:hidden">
          <h2 className="font-serif text-lg text-[#1B3A3A]">Filtres</h2>
          <button onClick={onFermer} aria-label="Fermer les filtres"><X size={18} className="text-[#6B5B4D]" /></button>
        </div>
      )}

      <BlocFiltre titre="Prix par nuit">
        <div className="flex items-center gap-2">
          <input
            type="number" min={0} className="w-full text-sm px-2.5 py-2 rounded-lg border border-[#E4DCC8] bg-[#F8F4EC] focus:outline-none focus:border-[#2F6E6E]"
            placeholder="Min"
            value={filtres.prixMin}
            onChange={(e) => setFiltres({ ...filtres, prixMin: e.target.value })}
          />
          <span className="text-[#8C7A66] text-xs">à</span>
          <input
            type="number" min={0} className="w-full text-sm px-2.5 py-2 rounded-lg border border-[#E4DCC8] bg-[#F8F4EC] focus:outline-none focus:border-[#2F6E6E]"
            placeholder="Max"
            value={filtres.prixMax}
            onChange={(e) => setFiltres({ ...filtres, prixMax: e.target.value })}
          />
        </div>
      </BlocFiltre>

      <BlocFiltre titre="Type de logement">
        <div className="flex flex-wrap gap-2">
          {TYPES.map(({ id, label, icon: Icon }) => {
            const actif = filtres.types.includes(id);
            return (
              <button
                key={id}
                onClick={() => toggleType(id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs border transition-colors ${
                  actif ? "bg-[#1B3A3A] text-[#F8F4EC] border-[#1B3A3A]" : "bg-[#F8F4EC] text-[#6B5B4D] border-[#E4DCC8] hover:border-[#2F6E6E]"
                }`}
              >
                <Icon size={12} /> {label}
              </button>
            );
          })}
        </div>
      </BlocFiltre>

      <BlocFiltre titre="Équipements">
        <div className="flex flex-wrap gap-2">
          {EQUIPEMENTS.map(({ id, label, icon: Icon }) => {
            const actif = filtres.equipements.includes(id);
            return (
              <button
                key={id}
                onClick={() => toggleEquipement(id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs border transition-colors ${
                  actif ? "bg-[#E1EEE9] border-[#2F6E6E] text-[#1B3A3A]" : "bg-[#F8F4EC] text-[#6B5B4D] border-[#E4DCC8] hover:border-[#2F6E6E]"
                }`}
              >
                <Icon size={12} /> {label}
              </button>
            );
          })}
        </div>
      </BlocFiltre>

      <BlocFiltre titre="Options">
        <div className="space-y-2.5">
          <label className="flex items-center gap-2 text-sm text-[#1B3A3A] cursor-pointer">
            <input type="checkbox" checked={filtres.animaux} onChange={(e) => setFiltres({ ...filtres, animaux: e.target.checked })} />
            <PawPrint size={14} className="text-[#8C7A66]" /> Animaux acceptés
          </label>
          <label className="flex items-center gap-2 text-sm text-[#1B3A3A] cursor-pointer">
            <input type="checkbox" checked={filtres.instantanee} onChange={(e) => setFiltres({ ...filtres, instantanee: e.target.checked })} />
            <Zap size={14} className="text-[#8C7A66]" /> Réservation instantanée
          </label>
        </div>
      </BlocFiltre>

      <button
        onClick={() => setFiltres({ prixMin: "", prixMax: "", types: [], equipements: [], animaux: false, instantanee: false })}
        className="text-xs text-[#2F6E6E] hover:text-[#1B3A3A] font-medium mt-2"
      >
        Réinitialiser les filtres
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Composant principal
// ---------------------------------------------------------------------------

export default function PageRecherche() {
  const [destination, setDestination] = useState("");
  const [voyageurs, setVoyageurs] = useState(2);
  const [tri, setTri] = useState("recommande");
  const [triOuvert, setTriOuvert] = useState(false);
  const [filtresMobileOuverts, setFiltresMobileOuverts] = useState(false);
  const [favoris, setFavoris] = useState([]);
  const [filtres, setFiltres] = useState({
    prixMin: "", prixMax: "", types: [], equipements: [], animaux: false, instantanee: false,
  });

  const [logements, setLogements] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState("");

  const [rechercheIA, setRechercheIA] = useState("");
  const [chargementIA, setChargementIA] = useState(false);
  const [resumeIA, setResumeIA] = useState("");
  const [erreurIA, setErreurIA] = useState("");

  async function lancerRechercheIA() {
    if (!rechercheIA.trim()) return;
    setChargementIA(true);
    setErreurIA("");
    setResumeIA("");
    try {
      const res = await fetch("/api/search/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: rechercheIA }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErreurIA(data.error || "Recherche impossible pour le moment.");
        return;
      }
      setLogements((data.resultats ?? []).map(depuisLigneSupabase));
      setResumeIA(data.filtres?.resume || "");
      // La recherche IA prend la main sur l'affichage : on réinitialise les
      // filtres classiques pour éviter qu'ils ne masquent ses résultats.
      setDestination("");
      setFiltres({ prixMin: "", prixMax: "", types: [], equipements: [], animaux: false, instantanee: false });
    } catch {
      setErreurIA("Une erreur est survenue. Réessayez.");
    } finally {
      setChargementIA(false);
    }
  }

  useEffect(() => {
    let annule = false;
    async function charger() {
      setChargement(true);
      setErreur("");
      const supabase = createClient();
      const { data, error } = await supabase
        .from("listings")
        .select("id, title, city, type, price_per_night, average_rating, review_count, guests, amenities, pets_allowed, instant_booking")
        .eq("status", "actif")
        .order("created_at", { ascending: false });

      if (annule) return;
      if (error) {
        setErreur("Impossible de charger les logements pour le moment.");
        setLogements([]);
      } else {
        setLogements((data ?? []).map(depuisLigneSupabase));
      }
      setChargement(false);
    }
    charger();
    return () => { annule = true; };
  }, []);

  function toggleFavori(id) {
    setFavoris((f) => (f.includes(id) ? f.filter((x) => x !== id) : [...f, id]));
  }

  const resultats = useMemo(() => {
    let liste = logements.filter((l) => {
      if (destination.trim() && !l.ville?.toLowerCase().includes(destination.trim().toLowerCase())) return false;
      if (l.voyageurs < voyageurs) return false;
      if (filtres.prixMin && l.prix < Number(filtres.prixMin)) return false;
      if (filtres.prixMax && l.prix > Number(filtres.prixMax)) return false;
      if (filtres.types.length && !filtres.types.includes(l.type)) return false;
      if (filtres.equipements.length && !filtres.equipements.every((e) => l.equipements.includes(e))) return false;
      if (filtres.animaux && !l.animaux) return false;
      if (filtres.instantanee && !l.instantanee) return false;
      return true;
    });

    if (tri === "prix_croissant") liste = [...liste].sort((a, b) => a.prix - b.prix);
    if (tri === "prix_decroissant") liste = [...liste].sort((a, b) => b.prix - a.prix);
    if (tri === "mieux_notes") liste = [...liste].sort((a, b) => b.note - a.note);

    return liste;
  }, [logements, destination, voyageurs, filtres, tri]);

  return (
    <div className="min-h-screen bg-[#F8F4EC] font-sans">
      {/* Recherche IA en langage naturel */}
      <div className="bg-[#1B3A3A]">
        <div className="max-w-6xl mx-auto px-5 py-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            <div className="flex-1 flex items-center gap-2 border border-[#2F6E6E] rounded-lg px-3 py-2.5 bg-[#F8F4EC]">
              <Sparkles size={15} className="text-[#C97B3D] shrink-0" />
              <input
                value={rechercheIA}
                onChange={(e) => setRechercheIA(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") lancerRechercheIA(); }}
                placeholder="Décrivez le logement de vos rêves : « loft avec piscine pour 4 personnes, budget 150€ »"
                maxLength={300}
                className="w-full bg-transparent text-sm focus:outline-none text-[#1B3A3A] placeholder:text-[#B0A48F]"
              />
            </div>
            <button
              onClick={lancerRechercheIA}
              disabled={chargementIA || !rechercheIA.trim()}
              className="flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-lg bg-[#C97B3D] text-[#F8F4EC] text-sm font-medium hover:bg-[#8A5A2B] transition-colors disabled:opacity-50 shrink-0"
            >
              {chargementIA ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
              {chargementIA ? "Recherche..." : "Rechercher avec l'IA"}
            </button>
          </div>
          {resumeIA && (
            <p className="text-xs text-[#D8CCB0] mt-2 flex items-center gap-1.5">
              <Sparkles size={11} /> {resumeIA}
            </p>
          )}
          {erreurIA && <p className="text-xs text-[#F6B8B0] mt-2">{erreurIA}</p>}
        </div>
      </div>

      {/* Barre de recherche */}
      <div className="border-b border-[#E4DCC8] bg-[#FFFDF8] sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-5 py-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            <div className="flex-1 flex items-center gap-2 border border-[#E4DCC8] rounded-lg px-3 py-2.5 bg-[#F8F4EC]">
              <MapPin size={15} className="text-[#8C7A66] shrink-0" />
              <input
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="Destination — ville, région..."
                className="w-full bg-transparent text-sm focus:outline-none text-[#1B3A3A] placeholder:text-[#B0A48F]"
              />
            </div>
            <div className="flex items-center gap-2 border border-[#E4DCC8] rounded-lg px-3 py-2.5 bg-[#F8F4EC]">
              <Calendar size={15} className="text-[#8C7A66] shrink-0" />
              <span className="text-sm text-[#B0A48F] whitespace-nowrap">Dates</span>
            </div>
            <div className="flex items-center gap-2 border border-[#E4DCC8] rounded-lg px-3 py-2.5 bg-[#F8F4EC]">
              <Users size={15} className="text-[#8C7A66] shrink-0" />
              <input
                type="number" min={1}
                value={voyageurs}
                onChange={(e) => setVoyageurs(Number(e.target.value) || 1)}
                className="w-10 bg-transparent text-sm focus:outline-none text-[#1B3A3A]"
              />
            </div>
            <button className="flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-lg bg-[#1B3A3A] text-[#F8F4EC] text-sm font-medium hover:bg-[#2F6E6E] transition-colors">
              <Search size={15} /> Rechercher
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-5 py-6">
        <div className="flex items-center justify-between mb-5">
          <p className="text-sm text-[#6B5B4D]">
            <span className="font-medium text-[#1B3A3A]">{resultats.length}</span> logement{resultats.length !== 1 ? "s" : ""}
            {destination.trim() ? ` à ${destination}` : ""}
          </p>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setFiltresMobileOuverts(true)}
              className="md:hidden flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#E4DCC8] text-sm text-[#6B5B4D]"
            >
              <SlidersHorizontal size={14} /> Filtres
            </button>
            <div className="relative">
              <button
                onClick={() => setTriOuvert((o) => !o)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#E4DCC8] text-sm text-[#6B5B4D] hover:bg-[#F1EADB] transition-colors"
              >
                {TRIS.find((t) => t.id === tri)?.label} <ChevronDown size={13} />
              </button>
              {triOuvert && (
                <div className="absolute right-0 top-full mt-1.5 bg-[#FFFDF8] border border-[#E4DCC8] rounded-lg shadow-sm py-1 w-44 z-10">
                  {TRIS.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => { setTri(t.id); setTriOuvert(false); }}
                      className={`w-full text-left px-3 py-2 text-sm hover:bg-[#F1EADB] transition-colors ${
                        tri === t.id ? "text-[#1B3A3A] font-medium" : "text-[#6B5B4D]"
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-[260px_1fr] gap-6">
          <aside className="hidden md:block">
            <div className="sticky top-24">
              <PanneauFiltres filtres={filtres} setFiltres={setFiltres} />
            </div>
          </aside>

          <main>
            {chargement ? (
              <div className="flex items-center justify-center gap-2 py-16 text-sm text-[#6B5B4D]">
                <Loader2 size={16} className="animate-spin" /> Chargement des logements...
              </div>
            ) : erreur ? (
              <div className="text-center py-16 text-sm text-[#7A2E1F]">{erreur}</div>
            ) : resultats.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-sm text-[#6B5B4D]">Aucun logement ne correspond à votre recherche.</p>
                <button
                  onClick={() => setFiltres({ prixMin: "", prixMax: "", types: [], equipements: [], animaux: false, instantanee: false })}
                  className="text-sm text-[#2F6E6E] hover:text-[#1B3A3A] font-medium mt-2"
                >
                  Réinitialiser les filtres
                </button>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {resultats.map((l) => (
                  <CarteLogement key={l.id} logement={l} favori={favoris.includes(l.id)} onToggleFavori={toggleFavori} />
                ))}
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Filtres en overlay sur mobile */}
      {filtresMobileOuverts && (
        <div className="fixed inset-0 bg-black/40 z-40 flex items-end md:hidden">
          <div className="bg-[#F8F4EC] w-full max-h-[85vh] overflow-y-auto rounded-t-2xl p-1">
            <PanneauFiltres filtres={filtres} setFiltres={setFiltres} onFermer={() => setFiltresMobileOuverts(false)} />
            <div className="p-4">
              <button
                onClick={() => setFiltresMobileOuverts(false)}
                className="w-full py-3 rounded-lg bg-[#1B3A3A] text-[#F8F4EC] text-sm font-medium"
              >
                Voir {resultats.length} logement{resultats.length !== 1 ? "s" : ""}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
