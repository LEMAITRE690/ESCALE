"use client";

import React, { useState, useEffect, useRef } from "react";
import { FileCheck, Upload, Check } from "lucide-react";

const STATUTS = {
  manquant: { label: "À fournir", cls: "bg-[#F6DEDA] text-[#7A2E1F]" },
  manquant_facultatif: { label: "Facultatif", cls: "bg-[#EDE9E1] text-[#6B5B4D]" },
  en_attente: { label: "En vérification", cls: "bg-[#F6E4CE] text-[#8A5A2B]" },
  valide: { label: "Validée", cls: "bg-[#E1EEE9] text-[#1B3A3A]" },
  refuse: { label: "Refusée", cls: "bg-[#F6DEDA] text-[#7A2E1F]" },
};

const TYPES_DOCUMENTS = [
  { id: "piece_identite", label: "Pièce d'identité", description: "Vérifiée une fois pour toutes vos réservations — limite les fraudes et enrichit vos contrats.", facultatif: false },
  { id: "assurance_villegiature", label: "Attestation d'assurance villégiature", description: "Recommandée mais facultative — couvre les dommages que vous pourriez causer pendant votre séjour.", facultatif: true },
];

function LigneDocument({ typeDoc, document, onUpload, envoiEnCours }) {
  const inputRef = useRef(null);
  const statutBrut = document?.status ?? "manquant";
  const statut = statutBrut === "manquant" && typeDoc.facultatif ? "manquant_facultatif" : statutBrut;
  const info = STATUTS[statut];

  function choisirFichier(e) {
    const fichier = e.target.files?.[0];
    if (fichier) onUpload(typeDoc.id, fichier);
  }

  return (
    <div className="flex items-start justify-between gap-3 py-3 border-b border-[#EDE4D4] last:border-b-0">
      <div className="flex items-center gap-2.5 min-w-0">
        <FileCheck size={16} className="text-[#8C7A66] shrink-0" />
        <div className="min-w-0">
          <p className="text-sm font-medium text-[#1B3A3A]">{typeDoc.label}</p>
          <p className="text-xs text-[#8C7A66]">{typeDoc.description}</p>
          {statutBrut === "refuse" && document?.note_admin && (
            <p className="text-xs text-[#7A2E1F] mt-1">Motif du refus : {document.note_admin}</p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span className={`text-xs px-2.5 py-1 rounded-full ${info.cls}`}>
          {statutBrut === "valide" && <Check size={11} className="inline mr-1" />}
          {info.label}
        </span>
        {(statutBrut === "manquant" || statutBrut === "refuse") && (
          <>
            <button
              onClick={() => inputRef.current?.click()}
              disabled={envoiEnCours}
              className="flex items-center gap-1.5 text-xs font-medium text-[#2F6E6E] hover:text-[#1B3A3A] transition-colors disabled:opacity-50"
            >
              <Upload size={12} /> {envoiEnCours ? "Envoi..." : "Téléverser"}
            </button>
            <input ref={inputRef} type="file" accept="image/*,.pdf" className="hidden" onChange={choisirFichier} />
          </>
        )}
      </div>
    </div>
  );
}

export default function MesDocumentsVoyageur() {
  const [documents, setDocuments] = useState(null); // null pendant le chargement initial
  const [enCours, setEnCours] = useState(null); // id du type en cours d'envoi
  const [erreur, setErreur] = useState("");

  useEffect(() => {
    let annule = false;
    fetch("/api/guest/documents")
      .then((r) => r.json())
      .then((data) => {
        if (annule) return;
        const parType = {};
        for (const d of data.documents ?? []) {
          if (!parType[d.document_type]) parType[d.document_type] = d; // le plus récent d'abord
        }
        setDocuments(parType);
      })
      .catch(() => { if (!annule) setDocuments({}); });
    return () => { annule = true; };
  }, []);

  async function uploader(documentType, fichier) {
    setEnCours(documentType);
    setErreur("");
    try {
      const formData = new FormData();
      formData.append("documentType", documentType);
      formData.append("file", fichier);
      const res = await fetch("/api/guest/documents", { method: "POST", body: formData });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setErreur(data.error || "Impossible d'envoyer le document.");
        return;
      }
      setDocuments((prev) => ({ ...prev, [documentType]: { status: "en_attente" } }));
    } catch {
      setErreur("Une erreur est survenue. Réessayez.");
    } finally {
      setEnCours(null);
    }
  }

  if (documents === null) return null; // évite un flash le temps du chargement

  return (
    <div className="bg-[#FFFDF8] border border-[#E4DCC8] rounded-xl p-4 mb-6">
      <p className="text-xs font-medium text-[#1B3A3A] mb-1">Mes documents</p>
      {TYPES_DOCUMENTS.map((t) => (
        <LigneDocument
          key={t.id}
          typeDoc={t}
          document={documents[t.id]}
          onUpload={uploader}
          envoiEnCours={enCours === t.id}
        />
      ))}
      {erreur && <p className="text-xs text-[#7A2E1F] mt-2">{erreur}</p>}
    </div>
  );
}
