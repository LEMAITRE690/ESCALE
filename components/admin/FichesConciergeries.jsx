"use client";

import React, { useEffect, useState } from "react";
import {
  Building2, Check, AlertTriangle, Loader2, ChevronDown, Save, FileText,
} from "lucide-react";

// Fiches légales des conciergeries partenaires, saisies par un administrateur
// Escale. Ces informations identifient la conciergerie au contrat d'apporteur
// d'affaires et conditionnent l'octroi du statut super-hôte.

const CHAMPS = [
  { cle: "legal_name", label: "Dénomination sociale", requis: true },
  { cle: "legal_form", label: "Forme juridique", requis: true, exemple: "SAS, SARL, EI…" },
  { cle: "siret", label: "SIRET", requis: true },
  { cle: "rcs", label: "RCS", exemple: "Ville et numéro" },
  { cle: "share_capital", label: "Capital social (€)", type: "number", exemple: "Vide si entreprise individuelle" },
  { cle: "registered_address", label: "Adresse du siège", requis: true, large: true },
  { cle: "legal_rep_name", label: "Représentant légal", requis: true },
  { cle: "legal_rep_role", label: "Qualité", requis: true, exemple: "Président, gérant…" },
  { cle: "legal_rep_email", label: "E-mail du signataire" },
  { cle: "legal_rep_phone", label: "Mobile du signataire", requis: true, exemple: "+33… — requis pour la signature par SMS" },
];

const champCls =
  "w-full text-sm border border-[#E4DCC8] rounded-lg px-3 py-2 bg-[#FFFDF8] text-[#1B3A3A] focus:outline-none focus:border-[#2F6E6E]";

function Fiche({ partenaire, onEnregistre }) {
  const [ouvert, setOuvert] = useState(!partenaire.ficheComplete);
  const [valeurs, setValeurs] = useState(partenaire);
  const [etat, setEtat] = useState(null);

  async function enregistrer() {
    setEtat("enregistrement");
    try {
      const corps = {};
      for (const c of CHAMPS) corps[c.cle] = valeurs[c.cle] ?? "";
      corps.vat_regime = valeurs.vat_regime ?? "";
      corps.vat_number = valeurs.vat_number ?? "";

      const reponse = await fetch(`/api/admin/partners/${partenaire.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(corps),
      });
      const data = await reponse.json();
      if (!reponse.ok) throw new Error(data.error);
      setEtat("enregistre");
      onEnregistre(partenaire.id, data.ficheComplete);
    } catch (e) {
      setEtat(e.message || "Enregistrement impossible.");
    }
  }

  const assujettie = (valeurs.vat_regime ?? "") === "assujettie";

  return (
    <div className="border border-[#E4DCC8] rounded-xl bg-[#FFFDF8] overflow-hidden">
      <button
        onClick={() => setOuvert((o) => !o)}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <Building2 size={15} className="text-[#8C7A66] shrink-0" />
          <div className="min-w-0">
            <p className="text-sm text-[#1B3A3A] truncate">
              {partenaire.legal_name || partenaire.name}
            </p>
            <p className="text-xs text-[#8C7A66]">
              {partenaire.referral_code} · {partenaire.hotesActifs} hôte
              {partenaire.hotesActifs !== 1 ? "s" : ""} rattaché
              {partenaire.hotesActifs !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {partenaire.ficheComplete ? (
            <span className="text-xs px-2 py-1 rounded-full bg-[#E1EEE9] text-[#1B3A3A] flex items-center gap-1">
              <Check size={11} /> Fiche complète
            </span>
          ) : (
            <span className="text-xs px-2 py-1 rounded-full bg-[#F6E4CE] text-[#8A5A2B] flex items-center gap-1">
              <AlertTriangle size={11} /> À compléter
            </span>
          )}
          <ChevronDown
            size={15}
            className={`text-[#8C7A66] transition-transform ${ouvert ? "rotate-180" : ""}`}
          />
        </div>
      </button>

      {ouvert && (
        <div className="px-4 pb-4 border-t border-[#EDE4D4] pt-4 space-y-3">
          <div className="grid sm:grid-cols-2 gap-3">
            {CHAMPS.map((c) => (
              <div key={c.cle} className={c.large ? "sm:col-span-2" : ""}>
                <label className="block text-xs text-[#6B5B4D] mb-1">
                  {c.label}
                  {c.requis && <span className="text-[#C97B3D]"> *</span>}
                </label>
                <input
                  type={c.type ?? "text"}
                  className={champCls}
                  value={valeurs[c.cle] ?? ""}
                  onChange={(e) => setValeurs({ ...valeurs, [c.cle]: e.target.value })}
                />
                {c.exemple && <p className="text-[11px] text-[#B0A48F] mt-0.5">{c.exemple}</p>}
              </div>
            ))}

            <div>
              <label className="block text-xs text-[#6B5B4D] mb-1">
                Régime de TVA<span className="text-[#C97B3D]"> *</span>
              </label>
              <select
                className={champCls}
                value={valeurs.vat_regime ?? ""}
                onChange={(e) => setValeurs({ ...valeurs, vat_regime: e.target.value })}
              >
                <option value="">—</option>
                <option value="assujettie">Assujettie à la TVA</option>
                <option value="franchise_en_base">Franchise en base</option>
              </select>
            </div>

            {assujettie && (
              <div>
                <label className="block text-xs text-[#6B5B4D] mb-1">
                  N° de TVA intracommunautaire<span className="text-[#C97B3D]"> *</span>
                </label>
                <input
                  className={champCls}
                  value={valeurs.vat_number ?? ""}
                  onChange={(e) => setValeurs({ ...valeurs, vat_number: e.target.value })}
                />
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={enregistrer}
              disabled={etat === "enregistrement"}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#1B3A3A] text-[#F8F4EC] text-sm font-medium hover:bg-[#2F6E6E] transition-colors disabled:opacity-50"
            >
              {etat === "enregistrement" ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Save size={14} />
              )}
              Enregistrer
            </button>
            {partenaire.ficheComplete && (
              <a
                href={`/api/admin/partners/${partenaire.id}/contract`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-[#E4DCC8] text-sm font-medium text-[#6B5B4D] hover:bg-[#EDE4D4] transition-colors"
              >
                <FileText size={14} /> Contrat prérempli
              </a>
            )}
            {etat === "enregistre" && (
              <span className="text-xs text-[#2F6E6E]">Enregistré.</span>
            )}
            {etat && !["enregistrement", "enregistre"].includes(etat) && (
              <span className="text-xs text-[#8A5A2B]">{etat}</span>
            )}
          </div>

          <p className="text-[11px] text-[#8C7A66] leading-relaxed">
            Les champs marqués d'une astérisque sont exigés avant tout octroi du statut
            super-hôte : tant qu'ils manquent, la base refuse le rattachement d'un hôte à
            cette conciergerie.
          </p>
        </div>
      )}
    </div>
  );
}

export default function FichesConciergeries() {
  const [etat, setEtat] = useState("chargement");
  const [partenaires, setPartenaires] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const reponse = await fetch("/api/admin/partners");
        if (!reponse.ok) throw new Error();
        const data = await reponse.json();
        setPartenaires(data.partenaires ?? []);
        setEtat("pret");
      } catch {
        setEtat("erreur");
      }
    })();
  }, []);

  function marquerComplete(id, complete) {
    setPartenaires((liste) =>
      liste.map((p) => (p.id === id ? { ...p, ficheComplete: complete } : p))
    );
  }

  const incompletes = partenaires.filter((p) => !p.ficheComplete).length;

  return (
    <div className="bg-[#FFFDF8] border border-[#E4DCC8] rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-[#E4DCC8]">
        <h2 className="font-serif text-[#1B3A3A] text-base">Conciergeries partenaires</h2>
        <p className="text-xs text-[#8C7A66] mt-0.5">
          Identité légale nécessaire au contrat d'apporteur d'affaires.
          {incompletes > 0 && ` ${incompletes} fiche${incompletes > 1 ? "s" : ""} à compléter.`}
        </p>
      </div>

      <div className="p-4 space-y-3">
        {etat === "chargement" && (
          <div className="flex items-center gap-2 text-sm text-[#8C7A66] py-6 justify-center">
            <Loader2 size={15} className="animate-spin" /> Chargement…
          </div>
        )}
        {etat === "erreur" && (
          <p className="text-xs text-[#8A5A2B] text-center py-6">
            Lecture des conciergeries impossible.
          </p>
        )}
        {etat === "pret" && partenaires.length === 0 && (
          <p className="text-xs text-[#B0A48F] text-center py-6">
            Aucune conciergerie enregistrée.
          </p>
        )}
        {etat === "pret" &&
          partenaires.map((p) => (
            <Fiche key={p.id} partenaire={p} onEnregistre={marquerComplete} />
          ))}
      </div>
    </div>
  );
}
