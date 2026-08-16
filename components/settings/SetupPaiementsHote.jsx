import React, { useState } from "react";
import { Wallet, CheckCircle2, AlertTriangle, ArrowRight } from "lucide-react";
import { COMMISSION_RATE_TTC, formatTaux } from "@/lib/pricing";

// À intégrer dans les paramètres de l'espace hôte (onglet "Paiements").

export default function SetupPaiementsHote({ userId, stripeAccountId, onboardingComplete }) {
  const [chargement, setChargement] = useState(false);

  async function demarrerOnboarding() {
    setChargement(true);
    const res = await fetch("/api/stripe/connect/onboard", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    const { url } = await res.json();
    if (url) window.location.href = url;
    setChargement(false);
  }

  return (
    <div className="bg-[#FFFDF8] border border-[#E4DCC8] rounded-xl p-5 space-y-4 max-w-xl">
      <div>
        <h3 className="font-serif text-[#1B3A3A] text-base mb-1 flex items-center gap-2">
          <Wallet size={16} /> Recevoir mes paiements
        </h3>
        <p className="text-xs text-[#8C7A66]">
          Le paiement du voyageur est sécurisé par Escale dès la réservation. Vos revenus vous sont
          reversés automatiquement le lendemain de la fin du séjour, déduction faite de la commission
          Escale — un délai qui protège voyageurs et hôtes contre les fraudes et les annonces non conformes.
        </p>
      </div>

      <div className="text-xs text-[#6B5B4D] bg-[#F1EADB] border border-[#E4DCC8] rounded-lg px-3 py-2.5 leading-relaxed">
        <span className="font-medium text-[#1B3A3A]">
          Votre commission : {formatTaux(COMMISSION_RATE_TTC)} TTC
        </span>{" "}
        du montant du séjour, taxe de séjour exclue. Elle est retenue sur le reversement et
        donne lieu à une facture téléchargeable depuis « Revenus et factures ».
      </div>

      {onboardingComplete ? (
        <div className="flex items-center gap-2 text-sm bg-[#E1EEE9] text-[#1B3A3A] rounded-lg px-3 py-2.5">
          <CheckCircle2 size={16} />
          Compte de paiement configuré — les reversements sont actifs.
        </div>
      ) : stripeAccountId ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm bg-[#F6E4CE] text-[#8A5A2B] rounded-lg px-3 py-2.5">
            <AlertTriangle size={16} />
            Configuration commencée mais non terminée.
          </div>
          <button
            onClick={demarrerOnboarding}
            disabled={chargement}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#C97B3D] text-[#F8F4EC] text-sm font-medium hover:bg-[#8A5A2B] transition-colors disabled:opacity-50"
          >
            {chargement ? "Redirection..." : "Terminer la configuration"} <ArrowRight size={14} />
          </button>
        </div>
      ) : (
        <button
          onClick={demarrerOnboarding}
          disabled={chargement}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#1B3A3A] text-[#F8F4EC] text-sm font-medium hover:bg-[#2F6E6E] transition-colors disabled:opacity-50"
        >
          {chargement ? "Redirection..." : "Configurer mes paiements"} <ArrowRight size={14} />
        </button>
      )}

      <p className="text-[11px] text-[#B0A48F]">
        La configuration se fait via un formulaire sécurisé Stripe (identité, IBAN). Tant qu'elle
        n'est pas terminée, vos annonces ne peuvent pas recevoir de réservation payante.
      </p>
    </div>
  );
}
