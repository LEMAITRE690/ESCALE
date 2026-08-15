"use client";

import React, { useState, useEffect, useRef } from "react";
import { MessageCircle, Send, AlertTriangle } from "lucide-react";

function fmtHeure(d) {
  return new Date(d).toLocaleString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

export default function FilDiscussion({ reservationId, interlocuteurLabel = "l'autre partie" }) {
  const [ouvert, setOuvert] = useState(false);
  const [messages, setMessages] = useState([]);
  const [monId, setMonId] = useState(null);
  const [brouillon, setBrouillon] = useState("");
  const [chargement, setChargement] = useState(false);
  const [envoi, setEnvoi] = useState(false);
  const [avertissement, setAvertissement] = useState("");
  const [erreur, setErreur] = useState("");
  const finDeListe = useRef(null);

  async function charger() {
    setChargement(true);
    try {
      const res = await fetch(`/api/messages?reservationId=${reservationId}`);
      const data = await res.json();
      if (res.ok) {
        setMessages(data.messages ?? []);
        setMonId(data.currentUserId ?? null);
      }
    } finally {
      setChargement(false);
    }
  }

  useEffect(() => {
    if (ouvert) charger();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ouvert]);

  useEffect(() => {
    finDeListe.current?.scrollIntoView({ block: "nearest" });
  }, [messages]);

  async function envoyer() {
    if (!brouillon.trim()) return;
    setEnvoi(true);
    setErreur("");
    setAvertissement("");
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reservationId, content: brouillon.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErreur(data.error || "Impossible d'envoyer le message.");
        return;
      }
      setMessages((prev) => [...prev, data.message]);
      if (data.avertissement) setAvertissement(data.avertissement);
      setBrouillon("");
    } catch {
      setErreur("Une erreur est survenue. Réessayez.");
    } finally {
      setEnvoi(false);
    }
  }

  if (!ouvert) {
    return (
      <button
        onClick={() => setOuvert(true)}
        className="flex items-center gap-1 text-xs font-medium text-[#2F6E6E] hover:text-[#1B3A3A] transition-colors"
      >
        <MessageCircle size={12} /> Discuter avec {interlocuteurLabel}
      </button>
    );
  }

  return (
    <div className="border border-[#E4DCC8] rounded-lg overflow-hidden bg-[#FFFDF8]">
      <div className="px-3 py-2 border-b border-[#E4DCC8] flex items-center justify-between">
        <p className="text-xs font-medium text-[#1B3A3A]">Discussion avec {interlocuteurLabel}</p>
        <button onClick={() => setOuvert(false)} className="text-xs text-[#8C7A66] hover:text-[#1B3A3A]">
          Fermer
        </button>
      </div>

      <div className="max-h-64 overflow-y-auto px-3 py-2 space-y-2">
        {chargement ? (
          <p className="text-xs text-[#B0A48F] text-center py-4">Chargement...</p>
        ) : messages.length === 0 ? (
          <p className="text-xs text-[#B0A48F] text-center py-4">Aucun message pour l'instant.</p>
        ) : (
          messages.map((m) => (
            <div key={m.id} className={`flex ${m.sender_id === monId ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[80%] px-3 py-1.5 rounded-2xl text-xs ${
                  m.sender_id === monId
                    ? "bg-[#1B3A3A] text-[#F8F4EC] rounded-br-sm"
                    : "bg-[#EDE4D4] text-[#1B3A3A] rounded-bl-sm"
                }`}
              >
                <p>{m.content}</p>
                <p className={`text-[10px] mt-0.5 ${m.sender_id === monId ? "text-[#D8CCB0]" : "text-[#8C7A66]"}`}>
                  {fmtHeure(m.created_at)}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={finDeListe} />
      </div>

      {avertissement && (
        <div className="flex items-start gap-1.5 px-3 py-2 bg-[#F6E4CE] text-[#8A5A2B] text-[10px] border-t border-[#E4DCC8]">
          <AlertTriangle size={12} className="shrink-0 mt-0.5" /> {avertissement}
        </div>
      )}
      {erreur && <p className="text-xs text-[#7A2E1F] px-3 pt-2">{erreur}</p>}

      <div className="flex items-center gap-2 p-2 border-t border-[#E4DCC8]">
        <input
          value={brouillon}
          onChange={(e) => setBrouillon(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") envoyer(); }}
          placeholder="Écrire un message..."
          maxLength={2000}
          className="flex-1 text-xs px-2.5 py-2 rounded-lg border border-[#E4DCC8] bg-[#F8F4EC] focus:outline-none focus:border-[#2F6E6E] text-[#1B3A3A]"
        />
        <button
          onClick={envoyer}
          disabled={envoi || !brouillon.trim()}
          className="w-8 h-8 rounded-lg bg-[#2F6E6E] flex items-center justify-center shrink-0 hover:bg-[#1B3A3A] transition-colors disabled:opacity-50"
          aria-label="Envoyer"
        >
          <Send size={13} className="text-[#F8F4EC]" />
        </button>
      </div>
    </div>
  );
}
