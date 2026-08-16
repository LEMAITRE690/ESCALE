import React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

// Coquille commune aux pages éditoriales (/cgu, /confidentialite, /contact) :
// reprend la charte de la page d'accueil sans en dupliquer le header
// interactif, qui n'a pas lieu d'être ici (pas d'ancres à suivre).
export default function PageLegale({ titre, chapeau, miseAJour, children }) {
  return (
    <div className="min-h-screen bg-[#F8F4EC] text-[#1B3A3A]">
      <header className="border-b border-[#E4DCC8] bg-[#F8F4EC]">
        <div className="max-w-3xl mx-auto px-5 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#1B3A3A] flex items-center justify-center">
              <span className="font-serif text-sm text-[#C97B3D]">E</span>
            </div>
            <span className="font-serif text-lg">Escale</span>
          </Link>
          <Link
            href="/"
            className="flex items-center gap-1.5 text-sm text-[#6B5B4D] hover:text-[#1B3A3A] transition-colors"
          >
            <ArrowLeft size={15} /> Retour à l'accueil
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-5 py-12 md:py-16">
        <h1 className="font-serif text-3xl md:text-4xl mb-4">{titre}</h1>
        {chapeau && (
          <p className="text-[#6B5B4D] text-base leading-relaxed mb-4">{chapeau}</p>
        )}
        {miseAJour && (
          <p className="text-xs text-[#8C7A66] mb-10">
            Dernière mise à jour : {miseAJour}
          </p>
        )}
        {children}
      </main>

      <footer className="border-t border-[#E4DCC8]">
        <div className="max-w-3xl mx-auto px-5 py-10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#1B3A3A] flex items-center justify-center">
              <span className="font-serif text-xs text-[#C97B3D]">E</span>
            </div>
            <span className="font-serif text-sm text-[#1B3A3A]">Escale</span>
          </div>
          <div className="flex flex-wrap items-center gap-5 text-xs text-[#8C7A66]">
            <Link href="/cgu" className="hover:text-[#1B3A3A] transition-colors">
              Conditions générales
            </Link>
            <Link href="/confidentialite" className="hover:text-[#1B3A3A] transition-colors">
              Confidentialité
            </Link>
            <Link href="/contact" className="hover:text-[#1B3A3A] transition-colors">
              Contact
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Section numérotée réutilisée par les pages légales.
export function Article({ numero, titre, children }) {
  return (
    <section className="mb-9">
      <h2 className="font-serif text-xl mb-3">
        {numero ? `${numero}. ` : ""}
        {titre}
      </h2>
      <div className="text-sm text-[#6B5B4D] leading-relaxed space-y-3">{children}</div>
    </section>
  );
}

// Encadré d'avertissement (mentions à compléter, conseil juridique…).
export function Avertissement({ children }) {
  return (
    <div className="border border-dashed border-[#C97B3D] bg-[#F1EADB] rounded-xl p-4 mb-10 text-sm text-[#8A5A2B] leading-relaxed">
      {children}
    </div>
  );
}
