"use client";

import { Share2, MessageCircle, Linkedin } from "lucide-react";

export default function PartageSocial({ title = "Découvrez ce logement sur Escale", url }) {
  const href = url || (typeof window !== "undefined" ? window.location.href : "");
  const texte = encodeURIComponent(title);
  const cible = encodeURIComponent(href);
  const ouvrir = (lien) => window.open(lien, "_blank", "noopener,noreferrer,width=720,height=640");
  const partager = async () => {
    if (navigator.share) return navigator.share({ title, url: href });
    await navigator.clipboard?.writeText(href);
  };
  return <div className="flex flex-wrap gap-2" aria-label="Partager ce logement">
    <button type="button" onClick={partager} className="inline-flex items-center gap-2 rounded-lg border border-[#E4DCC8] bg-white px-3 py-2 text-sm"><Share2 size={14}/> Partager</button>
    <button type="button" onClick={() => ouvrir(`https://wa.me/?text=${texte}%20${cible}`)} className="inline-flex items-center gap-2 rounded-lg border border-[#E4DCC8] bg-white px-3 py-2 text-sm"><MessageCircle size={14}/> WhatsApp</button>
    <button type="button" onClick={() => ouvrir(`https://www.linkedin.com/sharing/share-offsite/?url=${cible}`)} className="inline-flex items-center gap-2 rounded-lg border border-[#E4DCC8] bg-white px-3 py-2 text-sm"><Linkedin size={14}/> LinkedIn</button>
  </div>;
}
