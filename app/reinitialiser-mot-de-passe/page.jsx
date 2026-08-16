"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Lock, ArrowRight, AlertCircle, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function PageReinitialiserMotDePasse() {
  const router = useRouter();
  const [pretSession, setPretSession] = useState(false);
  const [motDePasse, setMotDePasse] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState("");
  const [reussi, setReussi] = useState(false);

  useEffect(() => {
    // Le lien reçu par e-mail établit une session temporaire dédiée à la
    // réinitialisation ; Supabase la restaure automatiquement à l'arrivée
    // sur cette page. On attend juste que l'événement soit traité avant
    // d'autoriser la soumission du formulaire.
    const supabase = createClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") {
        setPretSession(true);
      }
    });
    // Filet de sécurité si l'événement a déjà été émis avant le montage du composant.
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setPretSession(true);
    });
    return () => subscription.unsubscribe();
  }, []);

  async function reinitialiser(e) {
    e.preventDefault();
    setErreur("");

    if (motDePasse.length < 8) {
      setErreur("Le mot de passe doit contenir au moins 8 caractères.");
      return;
    }
    if (motDePasse !== confirmation) {
      setErreur("Les deux mots de passe ne correspondent pas.");
      return;
    }

    setChargement(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: motDePasse });
    setChargement(false);

    if (error) {
      setErreur("Impossible de mettre à jour le mot de passe. Le lien a peut-être expiré — recommencez la demande.");
      return;
    }

    setReussi(true);
    setTimeout(() => router.push("/connexion"), 2000);
  }

  if (reussi) {
    return (
      <div className="min-h-screen bg-[#F8F4EC] font-sans flex items-center justify-center px-5 py-12">
        <div className="w-full max-w-sm text-center">
          <div className="w-12 h-12 rounded-full bg-[#E1EEE9] flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 size={20} className="text-[#1B3A3A]" />
          </div>
          <h1 className="font-serif text-xl text-[#1B3A3A] mb-2">Mot de passe mis à jour</h1>
          <p className="text-sm text-[#6B5B4D]">Redirection vers la connexion...</p>
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
          <h1 className="font-serif text-xl text-[#1B3A3A] mb-1">Nouveau mot de passe</h1>
          <p className="text-sm text-[#8C7A66] mb-6">Choisissez un nouveau mot de passe pour votre compte.</p>

          {!pretSession && !erreur && (
            <p className="text-xs text-[#8C7A66] mb-4">Vérification du lien...</p>
          )}

          {erreur && (
            <div className="flex items-start gap-2 text-xs text-[#7A2E1F] bg-[#F6DEDA] rounded-lg px-3 py-2.5 mb-4">
              <AlertCircle size={14} className="shrink-0 mt-0.5" /> {erreur}
            </div>
          )}

          <form onSubmit={reinitialiser} className="space-y-3.5">
            <div>
              <label className="block text-xs font-medium text-[#1B3A3A] mb-1.5">Nouveau mot de passe</label>
              <div className="flex items-center gap-2 border border-[#E4DCC8] rounded-lg px-3 py-2.5 bg-[#F8F4EC]">
                <Lock size={14} className="text-[#8C7A66] shrink-0" />
                <input
                  type="password"
                  value={motDePasse}
                  onChange={(e) => setMotDePasse(e.target.value)}
                  placeholder="8 caractères minimum"
                  className="w-full bg-transparent text-sm focus:outline-none text-[#1B3A3A] placeholder:text-[#B0A48F]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#1B3A3A] mb-1.5">Confirmer le mot de passe</label>
              <div className="flex items-center gap-2 border border-[#E4DCC8] rounded-lg px-3 py-2.5 bg-[#F8F4EC]">
                <Lock size={14} className="text-[#8C7A66] shrink-0" />
                <input
                  type="password"
                  value={confirmation}
                  onChange={(e) => setConfirmation(e.target.value)}
                  placeholder="Retapez le mot de passe"
                  className="w-full bg-transparent text-sm focus:outline-none text-[#1B3A3A] placeholder:text-[#B0A48F]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={chargement || !pretSession}
              className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-lg bg-[#1B3A3A] text-[#F8F4EC] text-sm font-medium hover:bg-[#2F6E6E] transition-colors disabled:opacity-50 mt-2"
            >
              {chargement ? "Mise à jour..." : "Mettre à jour le mot de passe"} {!chargement && <ArrowRight size={14} />}
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
