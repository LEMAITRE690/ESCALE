"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Mail, ArrowRight, AlertCircle, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function PageMotDePasseOublie() {
  const [email, setEmail] = useState("");
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState("");
  const [envoye, setEnvoye] = useState(false);

  async function envoyer(e) {
    e.preventDefault();
    setErreur("");

    if (!email.trim()) {
      setErreur("Renseignez votre adresse e-mail.");
      return;
    }

    setChargement(true);
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reinitialiser-mot-de-passe`,
    });
    setChargement(false);

    // Toujours afficher la confirmation, que l'e-mail existe ou non — pour
    // ne jamais révéler si une adresse est associée à un compte Escale.
    setEnvoye(true);
  }

  if (envoye) {
    return (
      <div className="min-h-screen bg-[#F8F4EC] font-sans flex items-center justify-center px-5 py-12">
        <div className="w-full max-w-sm text-center">
          <div className="w-12 h-12 rounded-full bg-[#E1EEE9] flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 size={20} className="text-[#1B3A3A]" />
          </div>
          <h1 className="font-serif text-xl text-[#1B3A3A] mb-2">Vérifiez votre boîte mail</h1>
          <p className="text-sm text-[#6B5B4D]">
            Si un compte existe avec l'adresse <span className="font-medium text-[#1B3A3A]">{email}</span>,
            un e-mail contenant un lien de réinitialisation vient de vous être envoyé.
          </p>
          <Link href="/connexion" className="inline-block text-sm text-[#2F6E6E] hover:text-[#1B3A3A] font-medium transition-colors mt-5">
            Retour à la connexion
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F4EC] font-sans flex items-center justify-center px-5 py-12">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2 justify-center mb-8">
          <div className="w-8 h-8 rounded-lg bg-[#1B3A3A] flex items-center justify-center">
            <span className="font-serif text-sm text-[#C97B3D]">E</span>
          </div>
          <span className="font-serif text-lg text-[#1B3A3A]">Escale</span>
        </div>

        <div className="bg-[#FFFDF8] border border-[#E4DCC8] rounded-xl p-6">
          <h1 className="font-serif text-xl text-[#1B3A3A] mb-1">Mot de passe oublié</h1>
          <p className="text-sm text-[#8C7A66] mb-6">
            Renseignez votre e-mail, nous vous envoyons un lien pour en choisir un nouveau.
          </p>

          {erreur && (
            <div className="flex items-start gap-2 text-xs text-[#7A2E1F] bg-[#F6DEDA] rounded-lg px-3 py-2.5 mb-4">
              <AlertCircle size={14} className="shrink-0 mt-0.5" /> {erreur}
            </div>
          )}

          <form onSubmit={envoyer} className="space-y-3.5">
            <div>
              <label className="block text-xs font-medium text-[#1B3A3A] mb-1.5">E-mail</label>
              <div className="flex items-center gap-2 border border-[#E4DCC8] rounded-lg px-3 py-2.5 bg-[#F8F4EC]">
                <Mail size={14} className="text-[#8C7A66] shrink-0" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="vous@exemple.com"
                  className="w-full bg-transparent text-sm focus:outline-none text-[#1B3A3A] placeholder:text-[#B0A48F]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={chargement}
              className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-lg bg-[#1B3A3A] text-[#F8F4EC] text-sm font-medium hover:bg-[#2F6E6E] transition-colors disabled:opacity-50 mt-2"
            >
              {chargement ? "Envoi..." : "Envoyer le lien"} {!chargement && <ArrowRight size={14} />}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-[#6B5B4D] mt-5">
          <Link href="/connexion" className="text-[#2F6E6E] hover:text-[#1B3A3A] font-medium transition-colors">
            Retour à la connexion
          </Link>
        </p>
      </div>
    </div>
  );
}
