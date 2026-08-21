"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Mic, MicOff } from "lucide-react";

function setReactInputValue(input, value) {
  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")?.set;
  setter?.call(input, value);
  input.dispatchEvent(new Event("input", { bubbles: true }));
  input.dispatchEvent(new Event("change", { bubbles: true }));
}

export default function RechercheIAVocale() {
  const [cible, setCible] = useState(null);
  const [ecoute, setEcoute] = useState(false);
  const [message, setMessage] = useState("");

  const SpeechRecognition = useMemo(() => {
    if (typeof window === "undefined") return null;
    return window.SpeechRecognition || window.webkitSpeechRecognition || null;
  }, []);

  useEffect(() => {
    function trouverCible() {
      const input = document.querySelector('input[placeholder^="Décrivez le logement"]');
      setCible(input?.parentElement || null);
    }

    trouverCible();
    const observer = new MutationObserver(trouverCible);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  function demarrerEcoute() {
    setMessage("");
    const input = document.querySelector('input[placeholder^="Décrivez le logement"]');
    if (!input) return;

    if (!SpeechRecognition) {
      setMessage("La dictée vocale n’est pas disponible sur ce navigateur. Vous pouvez toujours écrire votre demande.");
      input.focus();
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "fr-FR";
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    let texteFinal = "";

    recognition.onstart = () => setEcoute(true);
    recognition.onend = () => setEcoute(false);
    recognition.onerror = (event) => {
      setEcoute(false);
      if (event.error === "not-allowed" || event.error === "service-not-allowed") {
        setMessage("Autorisez le micro pour parler à l’IA.");
      } else if (event.error !== "no-speech") {
        setMessage("Je n’ai pas pu vous entendre. Touchez le micro et réessayez.");
      }
    };

    recognition.onresult = (event) => {
      let provisoire = "";
      texteFinal = "";
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const texte = event.results[i][0]?.transcript || "";
        if (event.results[i].isFinal) texteFinal += texte;
        else provisoire += texte;
      }

      const texte = (texteFinal || provisoire).trim();
      if (texte) setReactInputValue(input, texte);

      if (texteFinal.trim()) {
        setMessage(`Vous avez dit : « ${texteFinal.trim()} »`);
        window.setTimeout(() => {
          const bouton = [...document.querySelectorAll("button")].find((el) =>
            el.textContent?.includes("Rechercher avec l'IA")
          );
          bouton?.click();
        }, 250);
      }
    };

    recognition.start();
  }

  if (!cible) return null;

  return createPortal(
    <>
      <button
        type="button"
        onClick={demarrerEcoute}
        disabled={ecoute}
        aria-label={ecoute ? "Écoute en cours" : "Parler à l’IA"}
        title={ecoute ? "Je vous écoute…" : "Parler à l’IA"}
        className={`shrink-0 w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
          ecoute
            ? "bg-[#C97B3D] text-white animate-pulse"
            : "bg-[#E1EEE9] text-[#1B3A3A] hover:bg-[#CDE1D9]"
        }`}
      >
        {ecoute ? <MicOff size={16} /> : <Mic size={16} />}
      </button>
      {message && (
        <span className="sr-only" role="status" aria-live="polite">{message}</span>
      )}
    </>,
    cible
  );
}
