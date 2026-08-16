"use client";

import React, { useEffect, useState } from "react";
import { FileText, Loader2, AlertTriangle, Check, X } from "lucide-react";

// Acceptation d'un document juridique par case à cocher tracée.
//
// Le texte intégral est affiché sur place, dépliable : une case à cocher
// renvoyant vers un lien externe ne vaut pas acceptation éclairée.

function fmtDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/** Rendu minimal du markdown stocké : titres, listes, paragraphes. */
function Texte({ contenu }) {
  const lignes = contenu.split("\n");
  return (
    <div className="space-y-2">
      {lignes.map((ligne, i) => {
        const l = ligne.trim();
        if (!l) return null;
        if (l.startsWith("### "))
          return (
            <h4 key={i} className="font-serif text-sm text-[#1B3A3A] pt-1">
              {l.slice(4)}
            </h4>
          );
        if (l.startsWith("## "))
          return (
            <h3 key={i} className="font-serif text-base text-[#1B3A3A] pt-2">
              {l.slice(3)}
            </h3>
          );
        if (l.startsWith("# "))
          return (
            <h2 key={i} className="font-serif text-lg text-[#1B3A3A] pt-2">
              {l.slice(2)}
            </h2>
          );
        if (l.startsWith("- ") || l.startsWith("• "))
          return (
            <p key={i} className="text-xs text-[#6B5B4D] leading-relaxed pl-4">
              • {l.slice(2)}
            </p>
          );
        return (
          <p key={i} className="text-xs text-[#6B5B4D] leading-relaxed text-justify">
            {l}
          </p>
        );
      })}
    </div>
  );
}

export default function AcceptationDocument({
  type,
  intitule,
  reservationId = null,
  onAccepte,
  compact = false,
}) {
  const [etat, setEtat] = useState("chargement");
  const [document, setDocument] = useState(null);
  const [acceptation, setAcceptation] = useState(null);
  const [coche, setCoche] = useState(false);
  const [texteOuvert, setTexteOuvert] = useState(false);
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState(null);

  useEffect(() => {
    let annule = false;
    (async () => {
      try {
        const reponse = await fetch(`/api/legal/documents/${type}`);
        const data = await reponse.json();
        if (annule) return;
        if (!reponse.ok) throw new Error(data.error);
        setDocument(data.document);
        setAcceptation(data.acceptation);
        setEtat("pret");
      } catch (e) {
        if (!annule) {
          setErreur(e.message || "Document indisponible.");
          setEtat("erreur");
        }
      }
    })();
    return () => {
      annule = true;
    };
  }, [type]);

  async function accepter() {
    setEnvoi(true);
    setErreur(null);
    try {
      const reponse = await fetch("/api/legal/acceptances", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, reservationId }),
      });
      const data = await reponse.json();
      if (!reponse.ok) throw new Error(data.error);
      setAcceptation({ version: data.version, acceptedAt: data.acceptedAt, aJour: true });
      onAccepte?.(data);
    } catch (e) {
      setErreur(e.message || "Enregistrement impossible.");
    } finally {
      setEnvoi(false);
    }
  }

  if (etat === "chargement") {
    return (
      <div className="flex items-center gap-2 text-sm text-[#8C7A66] py-6 justify-center">
        <Loader2 size={15} className="animate-spin" /> Chargement du document…
      </div>
    );
  }

  if (etat === "erreur") {
    return (
      <div className="flex items-start gap-2 border border-[#D8CCB0] bg-[#F1EADB] rounded-xl p-4 text-sm text-[#8A5A2B]">
        <AlertTriangle size={16} className="mt-0.5 shrink-0" />
        <span>{erreur}</span>
      </div>
    );
  }

  const dejaAccepte = acceptation?.aJour;

  return (
    <div className="border border-[#E4DCC8] bg-[#FFFDF8] rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-[#E4DCC8] flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm text-[#1B3A3A] flex items-center gap-1.5">
            <FileText size={14} className="text-[#8C7A66] shrink-0" />
            {document.title}
          </p>
          <p className="text-xs text-[#8C7A66] mt-0.5">
            Version {document.version} · en vigueur depuis le {fmtDate(document.effective_from)}
          </p>
        </div>
        {dejaAccepte && (
          <span className="text-xs px-2 py-1 rounded-full bg-[#E1EEE9] text-[#1B3A3A] flex items-center gap-1 shrink-0">
            <Check size={11} /> Acceptée
          </span>
        )}
      </div>

      <div className="p-4 space-y-3">
        {dejaAccepte ? (
          <p className="text-xs text-[#6B5B4D]">
            Vous avez accepté la version {acceptation.version} le{" "}
            {fmtDate(acceptation.acceptedAt)}.
          </p>
        ) : (
          acceptation && (
            <p className="text-xs text-[#8A5A2B]">
              Vous aviez accepté la version {acceptation.version} le{" "}
              {fmtDate(acceptation.acceptedAt)}. Une nouvelle version est entrée en vigueur.
            </p>
          )
        )}

        <button
          onClick={() => setTexteOuvert((o) => !o)}
          className="text-xs font-medium text-[#2F6E6E] hover:text-[#1B3A3A] transition-colors"
        >
          {texteOuvert ? "Masquer le texte intégral" : "Lire le texte intégral"}
        </button>

        {texteOuvert && (
          <div className="max-h-80 overflow-y-auto border border-[#EDE4D4] rounded-lg p-3 bg-[#F8F4EC]">
            <Texte contenu={document.content} />
          </div>
        )}

        {!dejaAccepte && (
          <>
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={coche}
                onChange={(e) => setCoche(e.target.checked)}
                className="mt-0.5 accent-[#1B3A3A]"
              />
              <span className="text-sm text-[#1B3A3A]">{intitule}</span>
            </label>

            <div className="flex items-center gap-3">
              <button
                onClick={accepter}
                disabled={!coche || envoi}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#1B3A3A] text-[#F8F4EC] text-sm font-medium hover:bg-[#2F6E6E] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {envoi ? <Loader2 size={14} className="animate-spin" /> : null}
                Valider mon acceptation
              </button>
              {erreur && (
                <span className="text-xs text-[#8A5A2B] flex items-center gap-1">
                  <X size={12} /> {erreur}
                </span>
              )}
            </div>

            {!compact && (
              <p className="text-[11px] text-[#8C7A66] leading-relaxed">
                Votre acceptation est enregistrée avec sa date, la version du document et
                votre adresse IP.
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
