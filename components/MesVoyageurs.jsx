"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  ChevronLeft, Search, Users, Star, Loader2, AlertTriangle, PawPrint,
  Calendar, Wallet, Save, ChevronRight, Home,
} from "lucide-react";

// Fiches voyageurs d'un hôte : liste avec recherche et tri, puis fiche
// détaillée avec historique, préférences déduites et note privée.

function fmtEUR(centimes) {
  return ((centimes ?? 0) / 100).toLocaleString("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  });
}
function fmtDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

const TRIS = [
  { id: "sejours", label: "Séjours (décroissant)" },
  { id: "anciennete", label: "Dernier séjour le plus ancien" },
  { id: "depense", label: "Montant dépensé" },
];

// ---------------------------------------------------------------------------
// Fiche détaillée
// ---------------------------------------------------------------------------

function FicheVoyageur({ guestId, onRetour }) {
  const [etat, setEtat] = useState("chargement");
  const [fiche, setFiche] = useState(null);
  const [note, setNote] = useState("");
  const [enregistrement, setEnregistrement] = useState(null);

  useEffect(() => {
    let annule = false;
    (async () => {
      try {
        const reponse = await fetch(`/api/host/guests/${guestId}`);
        if (!reponse.ok) throw new Error();
        const data = await reponse.json();
        if (annule) return;
        setFiche(data);
        setNote(data.note ?? "");
        setEtat("pret");
      } catch {
        if (!annule) setEtat("erreur");
      }
    })();
    return () => {
      annule = true;
    };
  }, [guestId]);

  async function enregistrerNote() {
    setEnregistrement("cours");
    try {
      const reponse = await fetch(`/api/host/guests/${guestId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note }),
      });
      if (!reponse.ok) throw new Error();
      setEnregistrement("ok");
      setTimeout(() => setEnregistrement(null), 2500);
    } catch {
      setEnregistrement("erreur");
    }
  }

  if (etat === "chargement") {
    return (
      <div className="flex items-center gap-2 text-sm text-[#8C7A66] py-10 justify-center">
        <Loader2 size={16} className="animate-spin" /> Chargement…
      </div>
    );
  }

  if (etat === "erreur") {
    return (
      <div className="space-y-4">
        <button onClick={onRetour} className="flex items-center gap-1.5 text-sm text-[#6B5B4D]">
          <ChevronLeft size={15} /> Retour
        </button>
        <div className="flex items-start gap-2 border border-[#D8CCB0] bg-[#F1EADB] rounded-xl p-4 text-sm text-[#8A5A2B]">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" />
          Fiche indisponible.
        </div>
      </div>
    );
  }

  const totalDepense = fiche.reservations
    .filter((r) => ["confirmee", "terminee"].includes(r.statut))
    .reduce((s, r) => s + (r.montant ?? 0), 0);

  return (
    <div className="space-y-5">
      <button
        onClick={onRetour}
        className="flex items-center gap-1.5 text-sm text-[#6B5B4D] hover:text-[#1B3A3A] transition-colors"
      >
        <ChevronLeft size={15} /> Retour à mes voyageurs
      </button>

      <div>
        <h2 className="font-serif text-2xl text-[#1B3A3A] mb-1">{fiche.nom}</h2>
        <p className="text-sm text-[#6B5B4D]">
          {fiche.reservations.length} réservation{fiche.reservations.length !== 1 ? "s" : ""} ·{" "}
          {fmtEUR(totalDepense)} dépensés chez vous
        </p>
      </div>

      {fiche.preferences.length > 0 && (
        <div className="border border-[#E4DCC8] bg-[#FFFDF8] rounded-xl p-4">
          <p className="text-xs uppercase tracking-wide text-[#8C7A66] mb-2">
            Habitudes observées
          </p>
          <ul className="space-y-1">
            {fiche.preferences.map((p) => (
              <li key={p} className="text-sm text-[#6B5B4D]">• {p}</li>
            ))}
          </ul>
          <p className="text-[11px] text-[#B0A48F] mt-2.5 leading-relaxed">
            Régularités constatées sur ses séjours chez vous, à prendre comme une
            indication et non comme un profil.
          </p>
        </div>
      )}

      <div className="border border-[#E4DCC8] bg-[#FFFDF8] rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-[#E4DCC8]">
          <h3 className="font-serif text-[#1B3A3A] text-base">Historique des réservations</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wide text-[#8C7A66]">
                <th className="px-4 py-2 font-medium">Séjour</th>
                <th className="px-4 py-2 font-medium">Logement</th>
                <th className="px-4 py-2 font-medium text-right">Voyageurs</th>
                <th className="px-4 py-2 font-medium text-right">Montant</th>
                <th className="px-4 py-2 font-medium">Statut</th>
              </tr>
            </thead>
            <tbody>
              {fiche.reservations.map((r) => (
                <tr key={r.id} className="border-t border-[#EDE4D4]">
                  <td className="px-4 py-2.5 text-[#1B3A3A] whitespace-nowrap">
                    {fmtDate(r.debut)} → {fmtDate(r.fin)}
                    {r.avecAnimal && (
                      <PawPrint size={12} className="inline ml-1.5 text-[#8C7A66]" />
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-[#6B5B4D]">{r.logement}</td>
                  <td className="px-4 py-2.5 text-right text-[#6B5B4D]">{r.voyageurs}</td>
                  <td className="px-4 py-2.5 text-right text-[#1B3A3A]">{fmtEUR(r.montant)}</td>
                  <td className="px-4 py-2.5 text-xs text-[#8C7A66]">{r.statut}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {fiche.avis.length > 0 && (
        <div className="border border-[#E4DCC8] bg-[#FFFDF8] rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-[#E4DCC8]">
            <h3 className="font-serif text-[#1B3A3A] text-base">Avis laissés chez vous</h3>
          </div>
          <div className="divide-y divide-[#EDE4D4]">
            {fiche.avis.map((a, i) => (
              <div key={i} className="px-4 py-3">
                <div className="flex items-center gap-1.5 mb-1">
                  {Array.from({ length: a.note }).map((_, j) => (
                    <Star key={j} size={11} className="fill-[#C97B3D] text-[#C97B3D]" />
                  ))}
                  <span className="text-xs text-[#8C7A66] ml-1">
                    {a.logement} · {fmtDate(a.date)}
                  </span>
                </div>
                {a.commentaire && (
                  <p className="text-sm text-[#6B5B4D] leading-relaxed">{a.commentaire}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="border border-[#E4DCC8] bg-[#FFFDF8] rounded-xl p-4 space-y-3">
        <div>
          <h3 className="font-serif text-[#1B3A3A] text-base">Ma note privée</h3>
          <p className="text-xs text-[#8C7A66] mt-0.5">
            Visible de vous seul. Ni le voyageur ni les autres hôtes n'y ont accès.
          </p>
        </div>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={4}
          maxLength={5000}
          placeholder="Préférences, remarques, points d'attention pour un prochain séjour…"
          className="w-full text-sm border border-[#E4DCC8] rounded-lg px-3 py-2 bg-[#F8F4EC] text-[#1B3A3A] focus:outline-none focus:border-[#2F6E6E]"
        />
        <div className="flex items-center gap-3">
          <button
            onClick={enregistrerNote}
            disabled={enregistrement === "cours"}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#1B3A3A] text-[#F8F4EC] text-sm font-medium hover:bg-[#2F6E6E] transition-colors disabled:opacity-50"
          >
            {enregistrement === "cours" ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Save size={14} />
            )}
            Enregistrer
          </button>
          {enregistrement === "ok" && (
            <span className="text-xs text-[#2F6E6E]">Note enregistrée.</span>
          )}
          {enregistrement === "erreur" && (
            <span className="text-xs text-[#8A5A2B]">Enregistrement impossible.</span>
          )}
          {fiche.noteMiseAJourLe && enregistrement === null && (
            <span className="text-xs text-[#B0A48F]">
              Dernière modification le {fmtDate(fiche.noteMiseAJourLe)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Liste
// ---------------------------------------------------------------------------

export default function MesVoyageurs({ onRetour, guestIdInitial = null }) {
  const [etat, setEtat] = useState("chargement");
  const [voyageurs, setVoyageurs] = useState([]);
  const [recherche, setRecherche] = useState("");
  const [tri, setTri] = useState("sejours");
  const [selection, setSelection] = useState(guestIdInitial);

  useEffect(() => {
    let annule = false;
    (async () => {
      try {
        const reponse = await fetch("/api/host/guests");
        if (!reponse.ok) throw new Error();
        const data = await reponse.json();
        if (annule) return;
        setVoyageurs(data.voyageurs ?? []);
        setEtat("pret");
      } catch {
        if (!annule) setEtat("erreur");
      }
    })();
    return () => {
      annule = true;
    };
  }, []);

  const listeAffichee = useMemo(() => {
    const q = recherche.trim().toLowerCase();
    const filtres = q
      ? voyageurs.filter(
          (v) =>
            v.nom.toLowerCase().includes(q) ||
            (v.logements ?? []).some((l) => l.toLowerCase().includes(q))
        )
      : [...voyageurs];

    return filtres.sort((a, b) => {
      if (tri === "sejours") return b.nbSejours - a.nbSejours;
      // Dernier séjour le plus ancien en premier : les voyageurs qu'on n'a pas
      // revus depuis longtemps, ceux qu'il y a matière à relancer.
      if (tri === "anciennete")
        return new Date(a.dernierSejour) - new Date(b.dernierSejour);
      return b.totalDepense - a.totalDepense;
    });
  }, [voyageurs, recherche, tri]);

  if (selection) {
    return <FicheVoyageur guestId={selection} onRetour={() => setSelection(null)} />;
  }

  return (
    <div className="space-y-5">
      {onRetour && (
        <button
          onClick={onRetour}
          className="flex items-center gap-1.5 text-sm text-[#6B5B4D] hover:text-[#1B3A3A] transition-colors"
        >
          <ChevronLeft size={15} /> Retour au tableau de bord
        </button>
      )}

      <div>
        <h2 className="font-serif text-2xl text-[#1B3A3A] mb-1">Mes voyageurs</h2>
        <p className="text-sm text-[#6B5B4D]">
          Les voyageurs déjà venus chez vous, avec leur historique et vos notes.
        </p>
      </div>

      {etat === "chargement" && (
        <div className="flex items-center gap-2 text-sm text-[#8C7A66] py-10 justify-center">
          <Loader2 size={16} className="animate-spin" /> Chargement…
        </div>
      )}

      {etat === "erreur" && (
        <div className="flex items-start gap-2 border border-[#D8CCB0] bg-[#F1EADB] rounded-xl p-4 text-sm text-[#8A5A2B]">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" />
          Lecture de vos voyageurs impossible.
        </div>
      )}

      {etat === "pret" && (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[200px]">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8C7A66]" />
              <input
                value={recherche}
                onChange={(e) => setRecherche(e.target.value)}
                placeholder="Rechercher un voyageur ou un logement…"
                className="w-full text-sm border border-[#E4DCC8] rounded-lg pl-9 pr-3 py-2 bg-[#FFFDF8] text-[#1B3A3A] focus:outline-none focus:border-[#2F6E6E]"
              />
            </div>
            <select
              value={tri}
              onChange={(e) => setTri(e.target.value)}
              className="text-sm border border-[#E4DCC8] rounded-lg px-3 py-2 bg-[#FFFDF8] text-[#1B3A3A] focus:outline-none focus:border-[#2F6E6E]"
            >
              {TRIS.map((t) => (
                <option key={t.id} value={t.id}>{t.label}</option>
              ))}
            </select>
          </div>

          {listeAffichee.length === 0 ? (
            <p className="text-sm text-[#8C7A66] text-center py-10 border border-dashed border-[#D8CCB0] rounded-xl">
              {voyageurs.length === 0
                ? "Aucun voyageur n'a encore séjourné chez vous."
                : "Aucun voyageur ne correspond à cette recherche."}
            </p>
          ) : (
            <div className="grid sm:grid-cols-2 gap-3">
              {listeAffichee.map((v) => (
                <button
                  key={v.guestId}
                  onClick={() => setSelection(v.guestId)}
                  className="text-left border border-[#E4DCC8] bg-[#FFFDF8] rounded-xl p-4 hover:border-[#2F6E6E] transition-colors"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-[#1B3A3A] truncate">{v.nom}</p>
                      <p className="text-xs text-[#8C7A66]">
                        {v.nbSejours} séjour{v.nbSejours > 1 ? "s" : ""} · dernier le{" "}
                        {fmtDate(v.dernierSejour)}
                      </p>
                    </div>
                    <ChevronRight size={15} className="text-[#B0A48F] shrink-0 mt-0.5" />
                  </div>

                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#6B5B4D]">
                    <span className="flex items-center gap-1">
                      <Wallet size={12} /> {fmtEUR(v.totalDepense)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar size={12} /> depuis {fmtDate(v.premierSejour)}
                    </span>
                    {v.noteMoyenneLaissee !== null && (
                      <span className="flex items-center gap-1">
                        <Star size={12} className="fill-[#C97B3D] text-[#C97B3D]" />
                        {v.noteMoyenneLaissee.toFixed(1).replace(".", ",")}
                      </span>
                    )}
                    {v.sejoursAvecAnimal > 0 && (
                      <span className="flex items-center gap-1">
                        <PawPrint size={12} /> {v.sejoursAvecAnimal}
                      </span>
                    )}
                  </div>

                  {v.logements.length > 0 && (
                    <p className="text-[11px] text-[#B0A48F] mt-2 truncate flex items-center gap-1">
                      <Home size={11} /> {v.logements.join(" · ")}
                    </p>
                  )}

                  {v.aUneNote && (
                    <span className="inline-block mt-2 text-[11px] px-2 py-0.5 rounded-full bg-[#F1EADB] text-[#8A5A2B]">
                      Note enregistrée
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
