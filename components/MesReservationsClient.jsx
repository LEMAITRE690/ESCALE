"use client";

import React, { useState } from "react";
import { MapPin, Calendar, Home, FileText } from "lucide-react";
import FormulaireAvis from "@/components/FormulaireAvis";
import SignalerEquipement from "@/components/SignalerEquipement";
import MesDocumentsVoyageur from "@/components/MesDocumentsVoyageur";
import FilDiscussion from "@/components/FilDiscussion";

const STATUT_LABELS = {
  en_attente: { label: "En attente", cls: "bg-[#F6E4CE] text-[#8A5A2B]" },
  confirmee: { label: "Confirmée", cls: "bg-[#E1EEE9] text-[#1B3A3A]" },
  terminee: { label: "Terminée", cls: "bg-[#EDE9E1] text-[#6B5B4D]" },
  annulee: { label: "Annulée", cls: "bg-[#F6DEDA] text-[#7A2E1F]" },
  remboursee: { label: "Remboursée", cls: "bg-[#EDE9E1] text-[#6B5B4D]" },
};

function fmtEUR(centimes) {
  return (centimes / 100).toLocaleString("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
}
function fmtDate(d) {
  return new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
}

export default function MesReservationsClient({ reservations }) {
  const [avisOuvertPour, setAvisOuvertPour] = useState(null);
  const [dejaNotees, setDejaNotees] = useState(new Set());

  const sejourTermine = (r) => r.status === "terminee" || new Date(r.end_date) < new Date();
  const sejourCommence = (r) => new Date(r.start_date) <= new Date() && ["confirmee", "terminee"].includes(r.status);

  return (
    <div className="min-h-screen bg-[#F8F4EC] font-sans">
      <div className="max-w-3xl mx-auto px-5 py-8">
        <h1 className="font-serif text-2xl text-[#1B3A3A] mb-6">Mes réservations</h1>

        <MesDocumentsVoyageur />

        {reservations.length === 0 ? (
          <p className="text-sm text-[#6B5B4D]">Vous n'avez pas encore de réservation.</p>
        ) : (
          <div className="space-y-4">
            {reservations.map((r) => {
              const statut = STATUT_LABELS[r.status] ?? STATUT_LABELS.en_attente;
              const dejaAvis = (r.reviews && r.reviews.length > 0) || dejaNotees.has(r.id);
              const peutNoter = sejourTermine(r) && !dejaAvis;

              return (
                <div key={r.id} className="bg-[#FFFDF8] border border-[#E4DCC8] rounded-xl overflow-hidden">
                  <div className="p-4 flex items-center gap-4">
                    <div className="w-16 h-16 rounded-lg bg-[#EDE4D4] flex items-center justify-center shrink-0">
                      <Home size={20} className="text-[#B0A48F]" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium text-[#1B3A3A] truncate">{r.listings?.title}</p>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0 ${statut.cls}`}>
                          {statut.label}
                        </span>
                      </div>
                      <p className="text-xs text-[#8C7A66] flex items-center gap-1 mt-0.5">
                        <MapPin size={11} /> {r.listings?.city}
                      </p>
                      <p className="text-xs text-[#6B5B4D] flex items-center gap-1 mt-1">
                        <Calendar size={11} /> {fmtDate(r.start_date)} → {fmtDate(r.end_date)} · {fmtEUR(r.amount_total)}
                      </p>
                      {["confirmee", "terminee"].includes(r.status) && (
                        <a
                          href={`/api/reservations/${r.id}/contract`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-[#2F6E6E] hover:text-[#1B3A3A] font-medium flex items-center gap-1 mt-1.5"
                        >
                          <FileText size={11} /> Voir le contrat de location
                        </a>
                      )}
                    </div>
                  </div>

                  {peutNoter && (
                    <div className="px-4 pb-4">
                      {avisOuvertPour === r.id ? (
                        <FormulaireAvis
                          reservationId={r.id}
                          nomLogement={r.listings?.title}
                          onPublie={() => setDejaNotees((s) => new Set(s).add(r.id))}
                        />
                      ) : (
                        <button
                          onClick={() => setAvisOuvertPour(r.id)}
                          className="text-xs font-medium text-[#2F6E6E] hover:text-[#1B3A3A] transition-colors"
                        >
                          Laisser un avis
                        </button>
                      )}
                    </div>
                  )}

                  {sejourCommence(r) && (
                    <div className="px-4 pb-4">
                      <SignalerEquipement reservationId={r.id} />
                    </div>
                  )}

                  {r.status !== "annulee" && (
                    <div className="px-4 pb-4">
                      <FilDiscussion reservationId={r.id} interlocuteurLabel="l'hôte" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
