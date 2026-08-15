"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Mail, Lock, User, ArrowRight, AlertCircle, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function PageInscription() {
  const router = useRouter();

  const [nom, setNom] = useState("");
  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState("");
  const [inscrit, setInscrit] = useState(false);

  async function sInscrire(e) {
    e.preventDefault();
    setErreur("");

    if (!nom.trim() || !email.trim() || !motDePasse) {
      setErreur("Tous les champs sont requis.");
      return;
    }
    if (motDePasse.length < 8) {
      setErreur("Le mot de passe doit contenir au moins 8 caractères.");
      return;
    }

    setChargement(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password: motDePasse,
      options: {
        data: { full_name: nom }, // le rôle par défaut ("voyageur") est appliqué par la migration
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    setChargement(false);

    if (error) {
      setErreur(
        error.message.includes("already registered")
          ? "Un compte existe déjà avec cet e-mail."
          : "Une erreur est survenue. Réessayez."
      );
      return;
    }

    setInscrit(true);
  }

  if (inscrit) {
    return (
      <div className="min-h-screen bg-[#F8F4EC] font-sans flex items-center justify-center px-5 py-12">
        <div className="w-full max-w-sm text-center">
          <div className="w-12 h-12 rounded-full bg-[#E1EEE9] flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 size={20} className="text-[#1B3A3A]" />
          </div>
          <h1 className="font-serif text-xl text-[#1B3A3A] mb-2">Vérifiez votre boîte mail</h1>
          <p className="text-sm text-[#6B5B4D]">
            Un e-mail de confirmation a été envoyé à <span className="font-medium text-[#1B3A3A]">{email}</span>.
            Cliquez sur le lien qu'il contient pour activer votre compte.
          </p>
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
          <h1 className="font-serif text-xl text-[#1B3A3A] mb-1">Créer un compte</h1>
          <p className="text-sm text-[#8C7A66] mb-6">
            Un seul compte pour réserver un logement ou en publier un.
          </p>

          {erreur && (
            <div className="flex items-start gap-2 text-xs text-[#7A2E1F] bg-[#F6DEDA] rounded-lg px-3 py-2.5 mb-4">
              <AlertCircle size={14} className="shrink-0 mt-0.5" /> {erreur}
            </div>
          )}

          <form onSubmit={sInscrire} className="space-y-3.5">
            <div>
              <label className="block text-xs font-medium text-[#1B3A3A] mb-1.5">Nom complet</label>
              <div className="flex items-center gap-2 border border-[#E4DCC8] rounded-lg px-3 py-2.5 bg-[#F8F4EC]">
                <User size={14} className="text-[#8C7A66] shrink-0" />
                <input
                  value={nom}
                  onChange={(e) => setNom(e.target.value)}
                  placeholder="Camille Berthier"
                  className="w-full bg-transparent text-sm focus:outline-none text-[#1B3A3A] placeholder:text-[#B0A48F]"
                />
              </div>
            </div>

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
              <label className="block text-xs font-medium text-[#1B3A3A] mb-1.5">Mot de passe</label>
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

            <button
              type="submit"
              disabled={chargement}
              className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-lg bg-[#1B3A3A] text-[#F8F4EC] text-sm font-medium hover:bg-[#2F6E6E] transition-colors disabled:opacity-50 mt-2"
            >
              {chargement ? "Création..." : "Créer mon compte"} {!chargement && <ArrowRight size={14} />}
            </button>
          </form>

          <p className="text-[11px] text-[#B0A48F] mt-4 leading-relaxed">
            En créant un compte, vous acceptez les{" "}
            <Link href="/cgu" className="text-[#2F6E6E] hover:text-[#1B3A3A]">conditions générales d'utilisation</Link> d'Escale.
          </p>
        </div>

        <p className="text-center text-sm text-[#6B5B4D] mt-5">
          Déjà un compte ?{" "}
          <Link href="/connexion" className="text-[#2F6E6E] hover:text-[#1B3A3A] font-medium transition-colors">
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  );
}
