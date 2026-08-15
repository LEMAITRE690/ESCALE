import React, { useEffect, useState } from "react";
import { Download, Share, X } from "lucide-react";

// Affiche une bannière discrète invitant à installer Escale sur l'écran
// d'accueil. Android/desktop : bouton d'installation natif (via
// beforeinstallprompt). iOS Safari ne propose pas cet événement : on guide
// l'utilisateur vers "Partager > Sur l'écran d'accueil" à la place.

function estIOS() {
  if (typeof navigator === "undefined") return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent) && !window.MSStream;
}

function dejaInstallee() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(display-mode: standalone)").matches || (navigator as any).standalone === true;
}

export default function InstallPrompt() {
  const [promptEvent, setPromptEvent] = useState(null);
  const [afficher, setAfficher] = useState(false);
  const [ios, setIos] = useState(false);

  useEffect(() => {
    if (dejaInstallee()) return;
    if (localStorage.getItem("escale_install_masque") === "1") return;

    setIos(estIOS());

    function onBeforeInstall(e) {
      e.preventDefault();
      setPromptEvent(e);
      setAfficher(true);
    }
    window.addEventListener("beforeinstallprompt", onBeforeInstall);

    // Sur iOS, pas d'événement natif : on affiche la bannière après un court délai
    if (estIOS()) {
      const t = setTimeout(() => setAfficher(true), 1500);
      return () => clearTimeout(t);
    }

    return () => window.removeEventListener("beforeinstallprompt", onBeforeInstall);
  }, []);

  async function installer() {
    if (!promptEvent) return;
    promptEvent.prompt();
    await promptEvent.userChoice;
    setAfficher(false);
  }

  function fermer() {
    setAfficher(false);
    localStorage.setItem("escale_install_masque", "1");
  }

  if (!afficher) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:max-w-sm bg-[#1B3A3A] text-[#F8F4EC] rounded-xl p-4 shadow-lg z-50 flex items-start gap-3">
      <div className="w-9 h-9 rounded-lg bg-[#C97B3D] flex items-center justify-center shrink-0 font-serif text-sm">
        E
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">Installer Escale</p>
        {ios ? (
          <p className="text-xs text-[#D8CCB0] mt-0.5 flex items-center gap-1 flex-wrap">
            Appuyez sur <Share size={13} className="inline" /> puis « Sur l'écran d'accueil »
          </p>
        ) : (
          <p className="text-xs text-[#D8CCB0] mt-0.5">Accès rapide, hors-ligne partiel, sans passer par le store.</p>
        )}
        {!ios && (
          <button
            onClick={installer}
            className="flex items-center gap-1.5 mt-2 px-3 py-1.5 rounded-lg bg-[#C97B3D] text-[#F8F4EC] text-xs font-medium hover:bg-[#8A5A2B] transition-colors"
          >
            <Download size={13} /> Installer
          </button>
        )}
      </div>
      <button onClick={fermer} className="text-[#D8CCB0] hover:text-[#F8F4EC] shrink-0" aria-label="Fermer">
        <X size={15} />
      </button>
    </div>
  );
}
