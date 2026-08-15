"use client";

import React, { useState } from "react";
import { Star, Check, AlertCircle } from "lucide-react";

// À afficher pour chaque réservation terminée sans avis existant, par
// exemple sur une page "Mes réservations" côté voyageur.

export default function FormulaireAvis({ reservationId, nomLogement, onPublie }) {
  const [note, setNote] = useState(0);
  const [noteSurvol, setNoteSurvol] = useState(0);
  const [commentaire, setCommentaire] = useState("");
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState("");
  const [publie, setPublie] = useState(false);

  async function publier() {
    setErreur("");
    if (note === 0) {
      setErreur("Choisissez une note avant de publier votre avis.");
      return;
    }

    setEnCours(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reservationId, rating: note, comment: commentaire }),
      });
      const data = await res.json();

      if (!res.ok) {
        setErreur(data.error || "Impossible de publier l'avis.");
        return;
      }

      setPublie(true);
      onPublie?.();
    } catch {
      setErreur("Une erreur est survenue. Réessayez.");
    } finally {
      setEnCours(false);
    }
  }

  if (publie) {
    return (
      <div className="flex items-center gap-2 text-sm text-[#1B3A3A] bg-[#E1EEE9] rounded-lg px-3 py-2.5">
        <Check size={15} /> Merci, votre avis a été publié.
      </div>
    );
  }

  return (
    <div className="bg-[#FFFDF8] border border-[#E4DCC8] rounded-xl p-4">
      <p className="text-sm font-medium text-[#1B3A3A] mb-1">Comment s'est passé votre séjour ?</p>
      <p className="text-xs text-[#8C7A66] mb-3">{nomLogement}</p>

      <div className="flex gap-1 mb-3">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setNote(n)}
            onMouseEnter={() => setNoteSurvol(n)}
            onMouseLeave={() => setNoteSurvol(0)}
            aria-label={`${n} étoile${n > 1 ? "s" : ""}`}
            className="p-0.5"
          >
            <Star
              size={22}
              className={(noteSurvol || note) >= n ? "fill-[#C97B3D] text-[#C97B3D]" : "text-[#E4DCC8]"}
            />
          </button>
        ))}
      </div>

      <textarea
        value={commentaire}
        onChange={(e) => setCommentaire(e.target.value)}
        rows={4}
        maxLength={800}
        placeholder="Décrivez le logement, l'accueil, ce que vous avez aimé (ou moins aimé)..."
        className="w-full text-sm px-3 py-2.5 rounded-lg border border-[#E4DCC8] bg-[#F8F4EC] focus:outline-none focus:border-[#2F6E6E] text-[#1B3A3A] placeholder:text-[#B0A48F] mb-3"
      />

      {erreur && (
        <div className="flex items-start gap-2 text-xs text-[#7A2E1F] bg-[#F6DEDA] rounded-lg px-3 py-2 mb-3">
          <AlertCircle size={13} className="shrink-0 mt-0.5" /> {erreur}
        </div>
      )}

      <button
        onClick={publier}
        disabled={enCours}
        className="px-4 py-2 rounded-lg bg-[#1B3A3A] text-[#F8F4EC] text-sm font-medium hover:bg-[#2F6E6E] transition-colors disabled:opacity-50"
      >
        {enCours ? "Publication..." : "Publier mon avis"}
      </button>
    </div>
  );
}
