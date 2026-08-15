"use client";

import React, { useState } from "react";
import { AlertTriangle, Wrench, Check, X, HeartHandshake } from "lucide-react";

// À afficher sur "Mes réservations" pour tout séjour en cours ou terminé.
// Deux cas distincts, volontairement séparés dès l'ouverture du formulaire :
//   - une panne constatée, sans faute du voyageur
//   - un dommage que le voyageur reconnaît spontanément avoir causé

export default function SignalerEquipement({ reservationId, onSignale }) {
  const [mode, setMode] = useState(null); // null | "panne" | "dommage"
  const [itemName, setItemName] = useState("");
  const [description, setDescription] = useState("");
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState("");
  const [envoye, setEnvoye] = useState(false);

  async function envoyer() {
    setErreur("");
    if (!itemName.trim()) {
      setErreur("Précisez de quoi il s'agit.");
      return;
    }

    setEnCours(true);
    try {
      const res = await fetch("/api/equipment-reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reservationId,
          itemName,
          description,
          faultAcknowledged: mode === "dommage",
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setErreur(data.error || "Impossible d'envoyer le signalement.");
        return;
      }

      setEnvoye(true);
      onSignale?.();
    } catch {
      setErreur("Une erreur est survenue. Réessayez.");
    } finally {
      setEnCours(false);
    }
  }

  if (envoye) {
    return (
      <div className="flex items-center gap-2 text-xs text-[#1B3A3A] bg-[#E1EEE9] rounded-lg px-3 py-2">
        <Check size={13} /> {mode === "dommage" ? "Votre déclaration a été transmise à l'hôte." : "Signalement envoyé à l'hôte."}
      </div>
    );
  }

  if (!mode) {
    return (
      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => setMode("panne")}
          className="flex items-center gap-1 text-xs font-medium text-[#8A5A2B] hover:text-[#7A2E1F] transition-colors"
        >
          <AlertTriangle size={12} /> Signaler un équipement défectueux
        </button>
        <button
          onClick={() => setMode("dommage")}
          className="flex items-center gap-1 text-xs font-medium text-[#6B5B4D] hover:text-[#1B3A3A] transition-colors"
        >
          <HeartHandshake size={12} /> Déclarer un dommage de ma part
        </button>
      </div>
    );
  }

  const estDommage = mode === "dommage";

  return (
    <div className={`border rounded-lg p-3 ${estDommage ? "bg-[#F1EADB] border-[#D8CCB0]" : "bg-[#F1EADB] border-[#E4DCC8]"}`}>
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-medium text-[#1B3A3A] flex items-center gap-1.5">
          {estDommage ? <HeartHandshake size={13} className="text-[#8A5A2B]" /> : <Wrench size={13} className="text-[#8A5A2B]" />}
          {estDommage ? "Déclarer un dommage dont je suis à l'origine" : "Signaler un équipement défectueux"}
        </p>
        <button onClick={() => setMode(null)} aria-label="Fermer" className="text-[#8C7A66]">
          <X size={14} />
        </button>
      </div>

      {estDommage && (
        <p className="text-[11px] text-[#6B5B4D] mb-2.5 leading-relaxed">
          Merci de le signaler spontanément — c'est pris en compte de façon transparente et ne vous
          expose pas à davantage qu'une réparation ou un remplacement au tarif réel, dans les
          conditions prévues par le dépôt de garantie de cette annonce.
        </p>
      )}

      <input
        value={itemName}
        onChange={(e) => setItemName(e.target.value)}
        placeholder={estDommage ? "Ex : vase cassé, tache sur le canapé..." : "Ex : lave-vaisselle, chauffe-eau, wifi..."}
        className="w-full text-xs px-2.5 py-2 rounded-lg border border-[#E4DCC8] bg-[#F8F4EC] focus:outline-none focus:border-[#2F6E6E] text-[#1B3A3A] placeholder:text-[#B0A48F] mb-2"
      />
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={3}
        maxLength={500}
        placeholder={estDommage ? "Décrivez les circonstances..." : "Décrivez le problème rencontré..."}
        className="w-full text-xs px-2.5 py-2 rounded-lg border border-[#E4DCC8] bg-[#F8F4EC] focus:outline-none focus:border-[#2F6E6E] text-[#1B3A3A] placeholder:text-[#B0A48F] mb-2"
      />

      {erreur && <p className="text-xs text-[#7A2E1F] mb-2">{erreur}</p>}

      <button
        onClick={envoyer}
        disabled={enCours}
        className="px-3 py-1.5 rounded-lg bg-[#1B3A3A] text-[#F8F4EC] text-xs font-medium hover:bg-[#2F6E6E] transition-colors disabled:opacity-50"
      >
        {enCours ? "Envoi..." : "Envoyer à l'hôte"}
      </button>
    </div>
  );
}
