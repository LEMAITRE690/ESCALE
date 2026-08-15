"use client";

import React, { useState } from "react";
import { Home, Users, Wallet, Clock, Copy, Check, MapPin, ShieldCheck, ArrowRight } from "lucide-react";

function fmtEUR(centimes) {
  return ((centimes ?? 0) / 100).toLocaleString("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 2 });
}
function fmtDate(d) {
  return new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
}

function MetricCard({ icon: Icon, label, value, sub }) {
  return (
    <div className="bg-[#FFFDF8] border border-[#E4DCC8] rounded-xl p-4">
      <div className="flex items-center gap-2 mb-1.5">
        <Icon size={15} className="text-[#8C7A66]" />
        <p className="text-[11px] uppercase tracking-wide text-[#8C7A66] font-medium">{label}</p>
      </div>
      <p className="font-serif text-xl text-[#1B3A3A]">{value}</p>
      {sub && <p className="text-xs text-[#8C7A66] mt-0.5">{sub}</p>}
    </div>
  );
}

export default function PartenaireDashboardClient({ partenaire, octrois, annonces, resume, paiements }) {
  const [copie, setCopie] = useState(false);

  function copierCode() {
    navigator.clipboard?.writeText(partenaire.referral_code);
    setCopie(true);
    setTimeout(() => setCopie(false), 2000);
  }

  async function demarrerOnboarding() {
    const res = await fetch("/api/partners/onboard", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ partnerId: partenaire.id }),
    });
    const { url } = await res.json();
    if (url) window.location.href = url;
  }

  return (
    <div className="min-h-screen bg-[#F8F4EC] font-sans">
      <div className="max-w-4xl mx-auto px-5 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-[11px] uppercase tracking-widest text-[#8C7A66]">Escale · Espace conciergerie</p>
            <h1 className="font-serif text-2xl text-[#1B3A3A]">{partenaire.name}</h1>
          </div>
          <form action="/api/auth/signout" method="post">
            <button type="submit" className="text-xs text-[#8C7A66] hover:text-[#1B3A3A] transition-colors">
              Se déconnecter
            </button>
          </form>
        </div>

        {!partenaire.stripe_onboarding_complete && (
          <div className="bg-[#F6E4CE] border border-[#E4DCC8] rounded-xl p-4 mb-6 flex items-center justify-between gap-3">
            <p className="text-sm text-[#8A5A2B]">
              Configurez votre compte de paiement pour recevoir vos rétrocommissions.
            </p>
            <button
              onClick={demarrerOnboarding}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#1B3A3A] text-[#F8F4EC] text-xs font-medium hover:bg-[#2F6E6E] transition-colors shrink-0"
            >
              Configurer <ArrowRight size={13} />
            </button>
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <MetricCard icon={Home} label="Hôtes gérés" value={octrois.length} />
          <MetricCard icon={MapPin} label="Annonces" value={annonces.length} />
          <MetricCard icon={Wallet} label="Commissions gagnées" value={fmtEUR(resume.total_earned)} sub={`sur ${resume.reservation_count} réservation${resume.reservation_count !== 1 ? "s" : ""}`} />
          <MetricCard icon={Clock} label="En attente de versement" value={fmtEUR(resume.total_pending)} />
        </div>

        <div className="bg-[#FFFDF8] border border-[#E4DCC8] rounded-xl p-4 mb-6 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-medium text-[#1B3A3A] mb-0.5">Votre code de parrainage</p>
            <p className="text-xs text-[#8C7A66]">Partagez-le aux hôtes que vous accompagnez pour qu'ils vous rattachent.</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <code className="text-sm bg-[#F1EADB] text-[#1B3A3A] px-3 py-1.5 rounded-lg">{partenaire.referral_code}</code>
            <button onClick={copierCode} className="w-8 h-8 rounded-lg border border-[#E4DCC8] flex items-center justify-center hover:bg-[#F1EADB] transition-colors" aria-label="Copier">
              {copie ? <Check size={14} className="text-[#2F6E6E]" /> : <Copy size={14} className="text-[#6B5B4D]" />}
            </button>
          </div>
        </div>

        <div className="bg-[#FFFDF8] border border-[#E4DCC8] rounded-xl overflow-hidden mb-6">
          <div className="px-4 py-3 border-b border-[#E4DCC8]">
            <h2 className="font-serif text-[#1B3A3A] text-base">Hôtes gérés</h2>
          </div>
          {octrois.length === 0 ? (
            <p className="text-xs text-[#B0A48F] text-center py-8">Aucun hôte ne vous a encore rattaché.</p>
          ) : (
            <div className="divide-y divide-[#EDE4D4]">
              {octrois.map((o) => {
                const annoncesHote = annonces.filter((a) => a.host_id === o.profiles?.id);
                return (
                  <div key={o.id} className="px-4 py-3">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium text-[#1B3A3A]">{o.profiles?.full_name || o.profiles?.email}</p>
                      <span className="text-xs text-[#8C7A66] flex items-center gap-1">
                        <ShieldCheck size={12} /> super-hôte depuis {fmtDate(o.granted_at)}
                      </span>
                    </div>
                    {annoncesHote.length > 0 && (
                      <p className="text-xs text-[#8C7A66]">
                        {annoncesHote.map((a) => a.title).join(" · ")}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="bg-[#FFFDF8] border border-[#E4DCC8] rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-[#E4DCC8]">
            <h2 className="font-serif text-[#1B3A3A] text-base">Rétrocommissions récentes</h2>
          </div>
          {paiements.length === 0 ? (
            <p className="text-xs text-[#B0A48F] text-center py-8">Aucune commission enregistrée pour le moment.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wide text-[#8C7A66]">
                  <th className="px-4 py-2 font-medium">Date</th>
                  <th className="px-4 py-2 font-medium">Montant</th>
                  <th className="px-4 py-2 font-medium">Statut</th>
                </tr>
              </thead>
              <tbody>
                {paiements.map((p) => (
                  <tr key={p.id} className="border-t border-[#EDE4D4]">
                    <td className="px-4 py-2.5 text-[#6B5B4D]">{fmtDate(p.created_at)}</td>
                    <td className="px-4 py-2.5 text-[#1B3A3A] font-medium">{fmtEUR(p.partner_fee)}</td>
                    <td className="px-4 py-2.5">
                      {p.partner_transferred_at ? (
                        <span className="text-xs px-2 py-1 rounded-full bg-[#E1EEE9] text-[#1B3A3A]">Versée</span>
                      ) : (
                        <span className="text-xs px-2 py-1 rounded-full bg-[#F6E4CE] text-[#8A5A2B]">En attente</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
