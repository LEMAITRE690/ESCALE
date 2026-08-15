"use client";

import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Mail, Lock, ArrowRight, AlertCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

function PageConnexionContent() {
  const router = useRouter();
  const params = useSearchParams();
  const suite = params.get("suite") || "/";

  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState("");

  async function seConnecter(e) {
    e.preventDefault();
    setErreur("");

    if (!email.trim() || !motDePasse) {
      setErreur("Renseignez votre e-mail et votre mot de passe.");
      return;
    }

    setChargement(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password: motDePasse });
    setChargement(false);

    if (error) {
      setErreur(
        error.message === "Invalid login credentials"
          ? "E-mail ou mot de passe incorrect."
          : "Une erreur est survenue. Réessayez."
      );
      return;
    }

    router.push(suite);
    router.refresh();
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
          <h1 className="font-serif text-xl text-[#1B3A3A] mb-1">Se connecter</h1>
          <p className="text-sm text-[#8C7A66] mb-6">Accédez à votre espace Escale.</p>

          {erreur && (
            <div className="flex items-start gap-2 text-xs text-[#7A2E1F] bg-[#F6DEDA] rounded-lg px-3 py-2.5 mb-4">
              <AlertCircle size={14} className="shrink-0 mt-0.5" /> {erreur}
            </div>
          )}

          <form onSubmit={seConnecter} className="space-y-3.5">
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

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-medium text-[#1B3A3A]">Mot de passe</label>
                <Link href="/mot-de-passe-oublie" className="text-xs text-[#2F6E6E] hover:text-[#1B3A3A] transition-colors">
                  Oublié ?
                </Link>
              </div>
              <div className="flex items-center gap-2 border border-[#E4DCC8] rounded-lg px-3 py-2.5 bg-[#F8F4EC]">
                <Lock size={14} className="text-[#8C7A66] shrink-0" />
                <input
                  type="password"
                  value={motDePasse}
                  onChange={(e) => setMotDePasse(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-transparent text-sm focus:outline-none text-[#1B3A3A] placeholder:text-[#B0A48F]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={chargement}
              className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-lg bg-[#1B3A3A] text-[#F8F4EC] text-sm font-medium hover:bg-[#2F6E6E] transition-colors disabled:opacity-50 mt-2"
            >
              {chargement ? "Connexion..." : "Se connecter"} {!chargement && <ArrowRight size={14} />}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-[#6B5B4D] mt-5">
          Pas encore de compte ?{" "}
          <Link href="/inscription" className="text-[#2F6E6E] hover:text-[#1B3A3A] font-medium transition-colors">
            Créer un compte
          </Link>
        </p>
      </div>
    </div>
  );
}
