"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Building2, CreditCard, LockKeyhole, ShieldCheck } from "lucide-react";

const PAY_BY_BANK_ENABLED = process.env.NEXT_PUBLIC_PAY_BY_BANK_ENABLED === "true";

export default function PagePaiementReservation() {
  const params = useParams();
  const reservationId = params?.id;
  const [enCours, setEnCours] = useState(null);
  const [erreur, setErreur] = useState("");

  async function payerParCarte() {
    setErreur("");
    setEnCours("card");
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reservationId }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) {
        setErreur(data.error || "Impossible de démarrer le paiement par carte.");
        return;
      }
      window.location.href = data.url;
    } catch {
      setErreur("Le paiement est momentanément indisponible.");
    } finally {
      setEnCours(null);
    }
  }

  async function payerParBanque() {
    setErreur("");
    if (!PAY_BY_BANK_ENABLED) {
      setErreur("Le paiement bancaire sécurisé est en cours d’activation. Utilisez la carte pour ce test.");
      return;
    }

    setEnCours("bank");
    try {
      const res = await fetch("/api/payments/pay-by-bank", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reservationId }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) {
        setErreur(data.error || "Impossible de démarrer le paiement bancaire.");
        return;
      }
      window.location.href = data.url;
    } catch {
      setErreur("Le paiement bancaire est momentanément indisponible.");
    } finally {
      setEnCours(null);
    }
  }

  return (
    <div className="min-h-screen bg-[#F8F4EC] px-5 py-10 font-sans">
      <div className="max-w-lg mx-auto">
        <Link href={`/reservations/${reservationId}`} className="text-sm text-[#6B5B4D] hover:text-[#1B3A3A]">
          ← Retour à la réservation
        </Link>

        <div className="mt-5 bg-[#FFFDF8] border border-[#E4DCC8] rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-[#E1EEE9] flex items-center justify-center">
              <LockKeyhole size={19} className="text-[#1B3A3A]" />
            </div>
            <div>
              <h1 className="font-serif text-2xl text-[#1B3A3A]">Paiement sécurisé</h1>
              <p className="text-xs text-[#8C7A66]">Choisissez votre moyen de paiement</p>
            </div>
          </div>

          <div className="mt-5 border border-[#B7CEC5] bg-[#F3F8F5] rounded-xl p-4">
            <div className="flex items-start gap-3">
              <Building2 size={22} className="text-[#1B3A3A] mt-0.5" />
              <div className="flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium text-[#1B3A3A]">Payer directement avec ma banque</p>
                  <span className="text-[10px] uppercase tracking-wide bg-[#1B3A3A] text-white rounded-full px-2 py-1">Recommandé</span>
                </div>
                <p className="text-xs text-[#6B5B4D] mt-1">
                  Validation depuis votre application bancaire, sans saisie d’IBAN.
                </p>
                <button
                  onClick={payerParBanque}
                  disabled={enCours !== null}
                  className="w-full mt-4 py-3 rounded-lg bg-[#1B3A3A] text-[#F8F4EC] text-sm font-medium hover:bg-[#2F6E6E] disabled:opacity-50"
                >
                  {enCours === "bank" ? "Connexion à votre banque…" : "Continuer avec ma banque"}
                </button>
                {!PAY_BY_BANK_ENABLED && (
                  <p className="text-[11px] text-[#8C7A66] mt-2">Activation en cours sur l’environnement de test.</p>
                )}
              </div>
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-[#EDE4D4]">
            <button
              onClick={payerParCarte}
              disabled={enCours !== null}
              className="w-full flex items-center justify-center gap-2 text-xs text-[#6B5B4D] hover:text-[#1B3A3A] py-2 disabled:opacity-50"
            >
              <CreditCard size={14} />
              {enCours === "card" ? "Ouverture du paiement…" : "Payer plutôt par carte bancaire"}
            </button>
          </div>

          {erreur && <p className="mt-4 text-xs text-[#7A2E1F] bg-[#F6DEDA] rounded-lg px-3 py-2">{erreur}</p>}

          <div className="mt-5 flex items-start gap-2 text-xs text-[#6B5B4D]">
            <ShieldCheck size={15} className="shrink-0 mt-0.5" />
            <p>
              Le paiement est traité par un prestataire de paiement sécurisé. Les fonds sont séparés du compte d’exploitation d’ESCALE et le reversement à l’hôte intervient selon les conditions de la réservation.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
