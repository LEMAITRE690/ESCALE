"use client";

import React, { useEffect, useState } from "react";
import {
  ChevronLeft, Check, Loader2, AlertTriangle, CreditCard, Landmark,
} from "lucide-react";
import {
  COMMISSION_RATE_TTC,
  SUBSCRIPTION_FEE_TTC,
  SUBSCRIPTION_RATE_TTC,
  formatTaux,
  formatEuros,
} from "@/lib/pricing";

// Écran de choix de formule, accessible à l'inscription comme depuis le
// tableau de bord. Le comparatif chiffré est dérivé des taux, jamais saisi :
// il suit automatiquement toute évolution de la grille.

const SEUIL = Math.ceil(SUBSCRIPTION_FEE_TTC / (COMMISSION_RATE_TTC - SUBSCRIPTION_RATE_TTC));

const EXEMPLES = [1000, 2000, 3000].map((ca) => {
  const commission = ca * COMMISSION_RATE_TTC;
  const abonnement = SUBSCRIPTION_FEE_TTC + ca * SUBSCRIPTION_RATE_TTC;
  return {
    ca,
    commission: Math.round(commission),
    abonnement: Math.round(abonnement),
    gain: Math.round((commission - abonnement) * 12),
  };
});

function fmtDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function Carte({ titre, prix, detail, actif, recommande, children }) {
  return (
    <div
      className={`rounded-xl p-5 relative ${
        recommande ? "border-2 border-[#2F6E6E]" : "border border-[#E4DCC8]"
      } ${actif ? "bg-[#F1EADB]" : "bg-[#FFFDF8]"}`}
    >
      {actif && (
        <span className="absolute -top-2.5 left-5 bg-[#1B3A3A] text-[#F8F4EC] text-[10px] px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
          <Check size={10} /> Votre formule
        </span>
      )}
      <p className="text-xs uppercase tracking-wide text-[#8C7A66] mb-2 mt-1">{titre}</p>
      <p className="font-serif text-2xl text-[#1B3A3A] mb-1">{prix}</p>
      <p className="text-xs text-[#6B5B4D] mb-4">{detail}</p>
      {children}
    </div>
  );
}

export default function ChoixFormule({ onRetour }) {
  const [etat, setEtat] = useState("chargement");
  const [formule, setFormule] = useState(null);
  const [action, setAction] = useState(null);
  const [erreur, setErreur] = useState(null);

  async function charger() {
    try {
      const reponse = await fetch("/api/host/subscription");
      if (!reponse.ok) throw new Error();
      setFormule(await reponse.json());
      setEtat("pret");
    } catch {
      setEtat("erreur");
    }
  }

  useEffect(() => {
    charger();
  }, []);

  async function souscrire() {
    setAction("souscription");
    setErreur(null);
    try {
      const reponse = await fetch("/api/host/subscription", { method: "POST" });
      const data = await reponse.json();
      if (!reponse.ok) throw new Error(data.error);
      window.location.href = data.url;
    } catch (e) {
      setErreur(e.message || "Souscription impossible pour le moment.");
      setAction(null);
    }
  }

  async function resilier() {
    setAction("resiliation");
    setErreur(null);
    try {
      const reponse = await fetch("/api/host/subscription", { method: "DELETE" });
      const data = await reponse.json();
      if (!reponse.ok) throw new Error(data.error);
      await charger();
    } catch (e) {
      setErreur(e.message || "Résiliation impossible pour le moment.");
    } finally {
      setAction(null);
    }
  }

  const surAbonnement = formule?.active === "abonnement";

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
        <h2 className="font-serif text-2xl text-[#1B3A3A] mb-1">Votre formule</h2>
        <p className="text-sm text-[#6B5B4D]">
          Deux façons de payer votre commission. Vous pouvez changer à tout moment ; le
          changement prend effet au début du mois suivant, jamais rétroactivement.
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
          Impossible de charger votre formule pour le moment.
        </div>
      )}

      {etat === "pret" && (
        <>
          {formule.enAttente && (
            <div className="border border-[#D8CCB0] bg-[#F1EADB] rounded-xl p-4 text-sm text-[#8A5A2B]">
              Changement programmé : passage en formule{" "}
              <strong>{formule.enAttente === "abonnement" ? "Abonnement" : "Commission"}</strong>{" "}
              le {fmtDate(formule.priseEffetEnAttente)}.
            </div>
          )}

          {["past_due", "unpaid"].includes(formule.statutAbonnement) && (
            <div className="flex items-start gap-2 border border-[#C97B3D] bg-[#F1EADB] rounded-xl p-4 text-sm text-[#8A5A2B]">
              <AlertTriangle size={16} className="mt-0.5 shrink-0" />
              <span>
                Le prélèvement de votre abonnement a échoué. Sans régularisation, vous
                repasserez automatiquement en formule Commission. Vos annonces et vos
                réservations en cours ne sont pas affectées.
              </span>
            </div>
          )}

          <div className="grid sm:grid-cols-2 gap-4">
            <Carte
              titre="Formule Commission"
              prix={formatTaux(COMMISSION_RATE_TTC)}
              detail="Prélevés sur chaque réservation confirmée. Aucun engagement, aucun frais fixe."
              actif={!surAbonnement}
            >
              {surAbonnement && (
                <button
                  onClick={resilier}
                  disabled={action !== null}
                  className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg border border-[#E4DCC8] text-sm font-medium text-[#6B5B4D] hover:bg-[#EDE4D4] transition-colors disabled:opacity-50"
                >
                  {action === "resiliation" ? (
                    <Loader2 size={15} className="animate-spin" />
                  ) : null}
                  Revenir à cette formule
                </button>
              )}
            </Carte>

            <Carte
              titre="Formule Abonnement"
              prix={`${formatEuros(SUBSCRIPTION_FEE_TTC)}/mois + ${formatTaux(SUBSCRIPTION_RATE_TTC)}`}
              detail={`Une commission divisée par près de deux sur chaque réservation. Intéressante au-delà de ${SEUIL} € de réservations par mois.`}
              actif={surAbonnement}
              recommande={!surAbonnement}
            >
              {!surAbonnement && (
                <button
                  onClick={souscrire}
                  disabled={action !== null}
                  className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg bg-[#1B3A3A] text-[#F8F4EC] text-sm font-medium hover:bg-[#2F6E6E] transition-colors disabled:opacity-50"
                >
                  {action === "souscription" ? (
                    <Loader2 size={15} className="animate-spin" />
                  ) : null}
                  Choisir l'abonnement
                </button>
              )}
              {surAbonnement && formule.prochainPrelevement && (
                <p className="text-xs text-[#6B5B4D]">
                  Prochain prélèvement le {fmtDate(formule.prochainPrelevement)}.
                </p>
              )}
            </Carte>
          </div>

          {erreur && (
            <p className="text-sm text-[#8A5A2B] bg-[#F1EADB] border border-[#D8CCB0] rounded-lg px-3 py-2">
              {erreur}
            </p>
          )}

          <div className="border border-[#E4DCC8] bg-[#FFFDF8] rounded-xl p-5">
            <p className="text-sm text-[#1B3A3A] font-medium mb-3">
              À partir de {SEUIL} € de réservations par mois, l'abonnement coûte moins cher.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="text-left text-[#8C7A66]">
                    <th className="border-b border-[#D8CCB0] py-2 pr-4 font-medium">Réservations / mois</th>
                    <th className="border-b border-[#D8CCB0] py-2 pr-4 font-medium">
                      Commission ({formatTaux(COMMISSION_RATE_TTC)})
                    </th>
                    <th className="border-b border-[#D8CCB0] py-2 pr-4 font-medium">Abonnement</th>
                    <th className="border-b border-[#D8CCB0] py-2 font-medium">Économie / an</th>
                  </tr>
                </thead>
                <tbody>
                  {EXEMPLES.map((l) => (
                    <tr key={l.ca}>
                      <td className="border-b border-[#E4DCC8] py-2.5 pr-4 text-[#1B3A3A]">{l.ca} €</td>
                      <td className="border-b border-[#E4DCC8] py-2.5 pr-4 text-[#6B5B4D]">{l.commission} €</td>
                      <td className="border-b border-[#E4DCC8] py-2.5 pr-4 text-[#6B5B4D]">{l.abonnement} €</td>
                      <td className="border-b border-[#E4DCC8] py-2.5 font-medium text-[#2F6E6E]">
                        {l.gain} €
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="text-xs text-[#8C7A66] leading-relaxed space-y-1.5">
            <p className="flex items-center gap-2">
              <Landmark size={13} /> <CreditCard size={13} />
              L'abonnement est prélevé par virement SEPA ou par carte bancaire, au choix.
            </p>
            <p>
              Une souscription prend effet au premier du mois suivant : vous n'êtes pas
              prélevé le jour de votre choix, et le mois en cours reste en formule
              Commission. Une résiliation prend effet à la fin du mois déjà réglé.
            </p>
            <p>
              Le taux appliqué à une réservation est celui de votre formule à la date
              d'arrivée du séjour, figé au moment de la réservation.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
