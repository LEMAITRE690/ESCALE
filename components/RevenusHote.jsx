"use client";

import React, { useEffect, useState } from "react";
import {
  ChevronLeft, Wallet, Clock, Receipt, Download, Loader2, AlertTriangle,
} from "lucide-react";

// Récapitulatif comptable de l'hôte : ce qui a été reversé, ce qui reste à
// venir, la commission supportée et les factures correspondantes.

function fmtEUR(centimes) {
  return (centimes / 100).toLocaleString("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }) + " €";
}

function fmtDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function Tuile({ icon: Icon, label, valeur, precision }) {
  return (
    <div className="border border-[#E4DCC8] rounded-xl bg-[#FFFDF8] p-4">
      <Icon size={16} className="text-[#C97B3D] mb-2" />
      <p className="text-xs uppercase tracking-wide text-[#8C7A66] mb-1">{label}</p>
      <p className="font-serif text-xl text-[#1B3A3A]">{valeur}</p>
      {precision && <p className="text-xs text-[#8C7A66] mt-0.5">{precision}</p>}
    </div>
  );
}

export default function RevenusHote({ onRetour }) {
  const [etat, setEtat] = useState("chargement");
  const [lignes, setLignes] = useState([]);
  const [totaux, setTotaux] = useState({ commission: 0, dejaReverse: 0, aVenir: 0 });

  useEffect(() => {
    let annule = false;
    (async () => {
      try {
        const reponse = await fetch("/api/host/revenus");
        if (!reponse.ok) throw new Error();
        const data = await reponse.json();
        if (annule) return;
        setLignes(data.lignes ?? []);
        setTotaux(data.totaux ?? { commission: 0, dejaReverse: 0, aVenir: 0 });
        setEtat("pret");
      } catch {
        if (!annule) setEtat("erreur");
      }
    })();
    return () => {
      annule = true;
    };
  }, []);

  return (
    <div className="space-y-5">
      <button
        onClick={onRetour}
        className="flex items-center gap-1.5 text-sm text-[#6B5B4D] hover:text-[#1B3A3A] transition-colors"
      >
        <ChevronLeft size={15} /> Retour au tableau de bord
      </button>

      <div>
        <h2 className="font-serif text-2xl text-[#1B3A3A] mb-1">Revenus et factures</h2>
        <p className="text-sm text-[#6B5B4D]">
          Le détail de chaque séjour payé : ce que règle le voyageur, la commission
          Escale et le montant qui vous est reversé automatiquement le lendemain de la
          fin du séjour.
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
          Impossible de charger vos revenus pour le moment. Réessayez dans quelques
          instants.
        </div>
      )}

      {etat === "pret" && (
        <>
          <div className="grid sm:grid-cols-3 gap-3">
            <Tuile
              icon={Wallet}
              label="Déjà reversé"
              valeur={fmtEUR(totaux.dejaReverse)}
              precision="virements effectués"
            />
            <Tuile
              icon={Clock}
              label="À reverser"
              valeur={fmtEUR(totaux.aVenir)}
              precision="séjours en cours ou à venir"
            />
            <Tuile
              icon={Receipt}
              label="Commission Escale"
              valeur={fmtEUR(totaux.commission)}
              precision="toutes taxes comprises"
            />
          </div>

          {lignes.length === 0 ? (
            <p className="text-sm text-[#8C7A66] text-center py-10 border border-dashed border-[#D8CCB0] rounded-xl">
              Aucun séjour payé pour le moment. Vos revenus apparaîtront ici dès votre
              première réservation confirmée.
            </p>
          ) : (
            <div className="border border-[#E4DCC8] rounded-xl bg-[#FFFDF8] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="text-left text-xs uppercase tracking-wide text-[#8C7A66] bg-[#F8F4EC]">
                      <th className="px-4 py-3 font-medium">Séjour</th>
                      <th className="px-4 py-3 font-medium text-right">Payé par le voyageur</th>
                      <th className="px-4 py-3 font-medium text-right">Commission</th>
                      <th className="px-4 py-3 font-medium text-right">Net reversé</th>
                      <th className="px-4 py-3 font-medium">Reversement</th>
                      <th className="px-4 py-3 font-medium">Facture</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lignes.map((l) => (
                      <tr key={l.paiementId} className="border-t border-[#E4DCC8] align-top">
                        <td className="px-4 py-3">
                          <p className="text-[#1B3A3A]">{l.logement}</p>
                          <p className="text-xs text-[#8C7A66]">
                            du {fmtDate(l.debut)} au {fmtDate(l.fin)}
                          </p>
                        </td>
                        <td className="px-4 py-3 text-right text-[#6B5B4D]">
                          {fmtEUR(l.montantVoyageur)}
                          {l.taxeSejour > 0 && (
                            <p className="text-xs text-[#8C7A66]">
                              dont {fmtEUR(l.taxeSejour)} de taxe de séjour
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right text-[#6B5B4D]">
                          − {fmtEUR(l.commission)}
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-[#1B3A3A]">
                          {fmtEUR(l.netReverse)}
                        </td>
                        <td className="px-4 py-3">
                          {l.reverse ? (
                            <span className="text-xs text-[#2F6E6E]">
                              effectué le {fmtDate(l.reverseLe)}
                            </span>
                          ) : (
                            <span className="text-xs text-[#8C7A66]">
                              prévu le {fmtDate(l.reversementPrevuLe)}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {l.facture ? (
                            <a
                              href={`/api/host/invoices/${l.facture.id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 text-xs font-medium text-[#2F6E6E] hover:text-[#1B3A3A] transition-colors"
                            >
                              <Download size={13} /> {l.facture.numero}
                            </a>
                          ) : (
                            <span className="text-xs text-[#B0A48F]">
                              émise au reversement
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <p className="text-xs text-[#8C7A66] leading-relaxed">
            La commission est retenue sur le reversement : elle ne fait l'objet d'aucun
            paiement séparé de votre part. La facture correspondante, détaillant la
            ventilation hors taxes, TVA et toutes taxes comprises, est émise au moment du
            virement et reste téléchargeable ici.
          </p>
        </>
      )}
    </div>
  );
}
