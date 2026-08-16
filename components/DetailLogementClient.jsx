"use client";

import React, { useState, useMemo } from "react";
import {
  Star, MapPin, Users, BedDouble, Bath, Wifi, Car, Utensils, Wind, Waves,
  PawPrint, Sparkles, Moon, Clock, Zap, ShieldCheck, ChevronLeft, ChevronRight,
  X, Heart, Share2, Home, Check, MessageCircle,
} from "lucide-react";
import Link from "next/link";

const POLITIQUES_ANNULATION = {
  flexible: { label: "Flexible", description: "Remboursement intégral jusqu'à 24h avant l'arrivée." },
  moderee: { label: "Modérée", description: "Remboursement intégral jusqu'à 5 jours avant l'arrivée." },
  stricte: { label: "Stricte", description: "Remboursement à 50% jusqu'à 14 jours avant l'arrivée, rien après." },
  tres_stricte: { label: "Très stricte", description: "Remboursement à 50% jusqu'à 30 jours avant l'arrivée, rien après." },
  non_remboursable: { label: "Non remboursable", description: "Aucun remboursement une fois la réservation confirmée." },
};

const EQUIPEMENTS_LABELS = {
  wifi: { label: "Wifi", icon: Wifi },
  parking: { label: "Parking", icon: Car },
  cuisine: { label: "Cuisine équipée", icon: Utensils },
  clim: { label: "Climatisation", icon: Wind },
  piscine: { label: "Piscine", icon: Waves },
};

// ---------------------------------------------------------------------------
// Utilitaires
// ---------------------------------------------------------------------------

function fmtEUR(n) {
  return n.toLocaleString("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
}

// ---------------------------------------------------------------------------
// Galerie photo
// ---------------------------------------------------------------------------

function Galerie({ logement, onOuvrirLightbox }) {
  return (
    <div className="grid grid-cols-4 grid-rows-2 gap-2 rounded-xl overflow-hidden h-[340px] md:h-[420px]">
      <button onClick={() => onOuvrirLightbox(0)} className="col-span-4 md:col-span-2 row-span-2 bg-[#EDE4D4] flex items-center justify-center hover:brightness-95 transition-all">
        <Home size={28} className="text-[#B0A48F]" />
      </button>
      {[1, 2, 3, 4].map((i) => (
        <button
          key={i}
          onClick={() => onOuvrirLightbox(i)}
          className="hidden md:flex bg-[#E4DCC8] items-center justify-center hover:brightness-95 transition-all relative"
        >
          <Home size={18} className="text-[#B0A48F]" />
          {i === 4 && (
            <span className="absolute inset-0 bg-black/35 flex items-center justify-center text-[#F8F4EC] text-xs font-medium">
              +{logement.photos - 4} photos
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

function Lightbox({ logement, index, onFermer }) {
  const [i, setI] = useState(index);
  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex flex-col">
      <div className="flex items-center justify-between px-5 py-4">
        <span className="text-[#F8F4EC] text-sm">{i + 1} / {logement.photos}</span>
        <button onClick={onFermer} aria-label="Fermer" className="text-[#F8F4EC]"><X size={22} /></button>
      </div>
      <div className="flex-1 flex items-center justify-center gap-4 px-5">
        <button onClick={() => setI((v) => (v - 1 + logement.photos) % logement.photos)} className="text-[#F8F4EC] shrink-0" aria-label="Photo précédente">
          <ChevronLeft size={28} />
        </button>
        <div className="w-full max-w-xl aspect-[4/3] bg-[#2C2C2A] rounded-lg flex items-center justify-center">
          <Home size={40} className="text-[#6B5B4D]" />
        </div>
        <button onClick={() => setI((v) => (v + 1) % logement.photos)} className="text-[#F8F4EC] shrink-0" aria-label="Photo suivante">
          <ChevronRight size={28} />
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Résumé de réservation (sidebar)
// ---------------------------------------------------------------------------

function ResumeReservation({ logement }) {
  const [arrivee, setArrivee] = useState("");
  const [depart, setDepart] = useState("");
  const [voyageurs, setVoyageurs] = useState(2);
  const [avecAnimal, setAvecAnimal] = useState(false);
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState("");

  const nuits = useMemo(() => {
    if (!arrivee || !depart) return 0;
    const d = (new Date(depart) - new Date(arrivee)) / (1000 * 60 * 60 * 24);
    return d > 0 ? d : 0;
  }, [arrivee, depart]);

  const sousTotal = nuits * logement.prix;
  const fraisAnimaux = avecAnimal && logement.animauxAcceptes ? logement.fraisAnimaux : 0;
  const total = sousTotal + logement.fraisMenage + fraisAnimaux;

  const politique = POLITIQUES_ANNULATION[logement.politiqueAnnulation];

  async function reserver() {
    setErreur("");
    if (nuits <= 0) {
      setErreur("Choisissez des dates d'arrivée et de départ.");
      return;
    }

    setEnCours(true);
    try {
      const resReservation = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId: logement.id, startDate: arrivee, endDate: depart, guests: voyageurs, avecAnimal }),
      });
      const dataReservation = await resReservation.json();

      if (!resReservation.ok) {
        if (resReservation.status === 401) {
          window.location.href = `/connexion?suite=/logement/${logement.id}`;
          return;
        }
        setErreur(dataReservation.error || "Impossible de créer la réservation.");
        return;
      }

      const resCheckout = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reservationId: dataReservation.reservationId }),
      });
      const dataCheckout = await resCheckout.json();

      if (!resCheckout.ok || !dataCheckout.url) {
        setErreur(dataCheckout.error || "Impossible de démarrer le paiement.");
        return;
      }

      window.location.href = dataCheckout.url;
    } catch {
      setErreur("Une erreur est survenue. Réessayez.");
    } finally {
      setEnCours(false);
    }
  }

  return (
    <div className="bg-[#FFFDF8] border border-[#E4DCC8] rounded-xl p-5 sticky top-6">
      <div className="flex items-baseline justify-between mb-4">
        <p className="text-lg font-medium text-[#1B3A3A]">{fmtEUR(logement.prix)} <span className="text-sm font-normal text-[#8C7A66]">/ nuit</span></p>
        <span className="flex items-center gap-1 text-xs text-[#8A5A2B]">
          <Star size={11} className="fill-[#C97B3D] text-[#C97B3D]" /> {logement.note} · {logement.avis} avis
        </span>
      </div>

      <div className="grid grid-cols-2 border border-[#E4DCC8] rounded-lg overflow-hidden mb-2">
        <div className="p-2.5 border-r border-[#E4DCC8]">
          <label className="text-[10px] uppercase tracking-wide text-[#8C7A66]">Arrivée</label>
          <input type="date" value={arrivee} onChange={(e) => setArrivee(e.target.value)} className="w-full text-xs bg-transparent focus:outline-none text-[#1B3A3A]" />
        </div>
        <div className="p-2.5">
          <label className="text-[10px] uppercase tracking-wide text-[#8C7A66]">Départ</label>
          <input type="date" value={depart} onChange={(e) => setDepart(e.target.value)} className="w-full text-xs bg-transparent focus:outline-none text-[#1B3A3A]" />
        </div>
      </div>

      <div className="border border-[#E4DCC8] rounded-lg p-2.5 mb-4 flex items-center justify-between">
        <label className="text-[10px] uppercase tracking-wide text-[#8C7A66]">Voyageurs</label>
        <input
          type="number" min={1} max={logement.voyageurs}
          value={voyageurs}
          onChange={(e) => setVoyageurs(Math.min(logement.voyageurs, Math.max(1, Number(e.target.value) || 1)))}
          className="w-12 text-sm text-right bg-transparent focus:outline-none text-[#1B3A3A]"
        />
      </div>

      {logement.animauxAcceptes && (
        <label className="flex items-center justify-between gap-2 text-xs text-[#1B3A3A] mb-4 cursor-pointer">
          <span className="flex items-center gap-1.5"><PawPrint size={13} className="text-[#8C7A66]" /> Je viens avec un animal (+{fmtEUR(logement.fraisAnimaux)})</span>
          <input type="checkbox" checked={avecAnimal} onChange={(e) => setAvecAnimal(e.target.checked)} />
        </label>
      )}

      {erreur && (
        <p className="text-xs text-[#7A2E1F] bg-[#F6DEDA] rounded-lg px-3 py-2 mb-3">{erreur}</p>
      )}

      <button
        onClick={reserver}
        disabled={nuits <= 0 || enCours}
        className="w-full py-3 rounded-lg bg-[#1B3A3A] text-[#F8F4EC] text-sm font-medium hover:bg-[#2F6E6E] transition-colors disabled:opacity-50 mb-4"
      >
        {enCours ? "Un instant..." : logement.reservationInstantanee ? "Réserver" : "Envoyer une demande"}
      </button>

      {nuits > 0 && (
        <div className="space-y-1.5 text-xs text-[#6B5B4D] mb-4">
          <div className="flex justify-between">
            <span>{fmtEUR(logement.prix)} × {nuits} nuit{nuits > 1 ? "s" : ""}</span>
            <span>{fmtEUR(sousTotal)}</span>
          </div>
          <div className="flex justify-between">
            <span>Frais de ménage</span>
            <span>{fmtEUR(logement.fraisMenage)}</span>
          </div>
          {fraisAnimaux > 0 && (
            <div className="flex justify-between">
              <span>Supplément animal</span>
              <span>{fmtEUR(fraisAnimaux)}</span>
            </div>
          )}
          <div className="flex justify-between text-sm font-medium text-[#1B3A3A] pt-1.5 border-t border-[#EDE4D4]">
            <span>Total</span>
            <span>{fmtEUR(total)}</span>
          </div>
        </div>
      )}

      <div className="border-t border-[#EDE4D4] pt-3 space-y-1.5">
        <p className="text-xs text-[#6B5B4D] flex items-start gap-1.5">
          <ShieldCheck size={13} className="text-[#8C7A66] shrink-0 mt-0.5" />
          Paiement retenu par Escale jusqu'à la fin du séjour, reversé à l'hôte ensuite.
        </p>
        <p className="text-xs text-[#6B5B4D]">
          Annulation <span className="font-medium text-[#1B3A3A]">{politique.label.toLowerCase()}</span> : {politique.description.toLowerCase()}
        </p>
        {logement.sejourMin > 1 && (
          <p className="text-xs text-[#6B5B4D]">Séjour minimum : {logement.sejourMin} nuits.</p>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Composant principal
// ---------------------------------------------------------------------------

export default function DetailLogementClient({ logement, avisListe = [] }) {
  const [lightboxIndex, setLightboxIndex] = useState(null);

  return (
    <div className="min-h-screen bg-[#F8F4EC] font-sans">
      <div className="max-w-5xl mx-auto px-5 py-6">
        <Link href="/recherche" className="flex items-center gap-1.5 text-sm text-[#6B5B4D] hover:text-[#1B3A3A] transition-colors mb-4">
          <ChevronLeft size={15} /> Retour aux résultats
        </Link>

        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h1 className="font-serif text-2xl md:text-3xl text-[#1B3A3A] mb-1.5">{logement.nom}</h1>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-[#6B5B4D]">
              <span className="flex items-center gap-1"><Star size={13} className="fill-[#C97B3D] text-[#C97B3D]" /> {logement.note} · {logement.avis} avis</span>
              <span className="flex items-center gap-1"><MapPin size={13} /> {logement.ville}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button className="w-9 h-9 rounded-lg border border-[#E4DCC8] flex items-center justify-center hover:bg-[#F1EADB] transition-colors" aria-label="Partager">
              <Share2 size={15} className="text-[#6B5B4D]" />
            </button>
            <button className="w-9 h-9 rounded-lg border border-[#E4DCC8] flex items-center justify-center hover:bg-[#F1EADB] transition-colors" aria-label="Ajouter aux favoris">
              <Heart size={15} className="text-[#6B5B4D]" />
            </button>
          </div>
        </div>

        <Galerie logement={logement} onOuvrirLightbox={setLightboxIndex} />

        <div className="grid lg:grid-cols-[1fr_340px] gap-10 mt-8">
          <div>
            <div className="flex items-center gap-3 pb-6 border-b border-[#E4DCC8] mb-6">
              <div className="w-11 h-11 rounded-full bg-[#1B3A3A] text-[#F8F4EC] flex items-center justify-center font-serif text-sm shrink-0">
                {logement.hote.nom.charAt(0)}
              </div>
              <div>
                <p className="text-sm font-medium text-[#1B3A3A]">Hébergé par {logement.hote.nom}</p>
                <p className="text-xs text-[#8C7A66]">
                  Hôte depuis {logement.hote.depuis} · Répond en {logement.hote.tempsReponse}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-x-6 gap-y-3 pb-6 border-b border-[#E4DCC8] mb-6 text-sm text-[#1B3A3A]">
              <span className="flex items-center gap-1.5"><Users size={15} className="text-[#8C7A66]" /> {logement.voyageurs} voyageurs</span>
              <span className="flex items-center gap-1.5"><BedDouble size={15} className="text-[#8C7A66]" /> {logement.chambres} chambre{logement.chambres > 1 ? "s" : ""}</span>
              <span className="flex items-center gap-1.5"><Bath size={15} className="text-[#8C7A66]" /> {logement.sallesDeBain} salle{logement.sallesDeBain > 1 ? "s" : ""} de bain</span>
              {logement.reservationInstantanee && (
                <span className="flex items-center gap-1.5"><Zap size={15} className="text-[#8C7A66]" /> Réservation instantanée</span>
              )}
            </div>

            <p className="text-sm text-[#4A4238] leading-relaxed mb-8">{logement.description}</p>

            <div className="mb-8">
              <h2 className="font-serif text-lg text-[#1B3A3A] mb-3">Équipements</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {logement.equipements.map((id) => {
                  const eq = EQUIPEMENTS_LABELS[id];
                  const Icon = eq.icon;
                  return (
                    <span key={id} className="flex items-center gap-2 text-sm text-[#1B3A3A]">
                      <Icon size={16} className="text-[#8C7A66]" /> {eq.label}
                    </span>
                  );
                })}
              </div>
            </div>

            <div className="mb-8">
              <h2 className="font-serif text-lg text-[#1B3A3A] mb-3">Règles du séjour</h2>
              <div className="grid grid-cols-2 gap-y-2.5 text-sm">
                <span className="flex items-center gap-2 text-[#1B3A3A]">
                  <Clock size={15} className="text-[#8C7A66]" /> Arrivée après {logement.heureArrivee}
                </span>
                <span className="flex items-center gap-2 text-[#1B3A3A]">
                  <Clock size={15} className="text-[#8C7A66]" /> Départ avant {logement.heureDepart}
                </span>
                <span className="flex items-center gap-2 text-[#1B3A3A]">
                  <PawPrint size={15} className="text-[#8C7A66]" /> Animaux {logement.animauxAcceptes ? "acceptés" : "non acceptés"}
                </span>
                <span className="flex items-center gap-2 text-[#1B3A3A]">
                  <Users size={15} className="text-[#8C7A66]" /> Enfants {logement.enfantsBienvenus ? "bienvenus" : "non recommandé"}
                </span>
                <span className="flex items-center gap-2 text-[#1B3A3A]">
                  <Sparkles size={15} className="text-[#8C7A66]" /> Fumeurs {logement.fumeursAcceptes ? "acceptés" : "non acceptés"}
                </span>
                {logement.departTardif && (
                  <span className="flex items-center gap-2 text-[#1B3A3A]">
                    <Moon size={15} className="text-[#8C7A66]" /> Départ tardif (+{fmtEUR(logement.fraisDepartTardif)})
                  </span>
                )}
              </div>
            </div>

            <div className="mb-8 bg-[#FFFDF8] border border-[#E4DCC8] rounded-xl p-4">
              <h3 className="text-sm font-medium text-[#1B3A3A] mb-1 flex items-center gap-2">
                <ShieldCheck size={15} className="text-[#8C7A66]" /> Un séjour protégé
              </h3>
              <p className="text-xs text-[#6B5B4D] leading-relaxed">
                Escale retient votre paiement jusqu'au lendemain de la fin de votre séjour. En cas de
                problème, signalez-le avant cette date : notre équipe examine chaque signalement avant
                tout reversement à l'hôte.
              </p>
            </div>

            <div>
              <h2 className="font-serif text-lg text-[#1B3A3A] mb-4 flex items-center gap-2">
                <Star size={16} className="fill-[#C97B3D] text-[#C97B3D]" /> {logement.note} · {logement.avis} avis
              </h2>
              <div className="space-y-5">
                {avisListe.map((a) => (
                  <div key={a.nom} className="pb-5 border-b border-[#EDE4D4] last:border-b-0">
                    <div className="flex items-center gap-2.5 mb-1.5">
                      <div className="w-8 h-8 rounded-full bg-[#EDE4D4] text-[#6B5B4D] flex items-center justify-center text-xs font-medium">
                        {a.nom.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-[#1B3A3A]">{a.nom}</p>
                        <p className="text-xs text-[#8C7A66]">{a.date}</p>
                      </div>
                    </div>
                    <div className="flex gap-0.5 mb-1.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} size={11} className={i < a.note ? "fill-[#C97B3D] text-[#C97B3D]" : "text-[#E4DCC8]"} />
                      ))}
                    </div>
                    <p className="text-sm text-[#4A4238] leading-relaxed">{a.texte}</p>
                    {a.reponseHote && (
                      <div className="bg-[#F1EADB] rounded-lg p-3 mt-2.5">
                        <p className="text-xs font-medium text-[#1B3A3A] mb-0.5">Réponse de l'hôte</p>
                        <p className="text-xs text-[#6B5B4D] leading-relaxed">{a.reponseHote}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div>
            <ResumeReservation logement={logement} />
          </div>
        </div>
      </div>

      {lightboxIndex !== null && <Lightbox logement={logement} index={lightboxIndex} onFermer={() => setLightboxIndex(null)} />}
    </div>
  );
}
