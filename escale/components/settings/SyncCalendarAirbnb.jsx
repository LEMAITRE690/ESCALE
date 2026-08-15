import React, { useState } from "react";
import { Copy, Check, RefreshCw, AlertTriangle, CheckCircle2 } from "lucide-react";

// Composant "Synchronisation Airbnb" à intégrer dans les paramètres d'un
// logement, dans l'espace hôte. Deux sens de synchronisation :
//   1. Exporter : coller le lien Escale dans Airbnb (Calendrier > Disponibilités)
//   2. Importer : coller le lien Airbnb dans Escale, pour bloquer ici les
//      dates déjà réservées côté Airbnb.

export default function SyncCalendarAirbnb({ listingId, source, onSaveIcalUrl }) {
  const [copied, setCopied] = useState(false);
  const [urlAirbnb, setUrlAirbnb] = useState(source?.ical_url ?? "");
  const [enregistrement, setEnregistrement] = useState(false);

  const exportUrl = `https://escale.app/api/ical/export/${listingId}`;

  function copier() {
    navigator.clipboard.writeText(exportUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function enregistrer() {
    setEnregistrement(true);
    await onSaveIcalUrl?.(urlAirbnb);
    setEnregistrement(false);
  }

  const statut = source?.last_sync_status;

  return (
    <div className="bg-[#FFFDF8] border border-[#E4DCC8] rounded-xl p-5 space-y-5 max-w-xl">
      <div>
        <h3 className="font-serif text-[#1B3A3A] text-base mb-1">Synchronisation avec Airbnb</h3>
        <p className="text-xs text-[#8C7A66]">
          Évitez les doubles réservations en reliant ce logement à votre calendrier Airbnb.
        </p>
      </div>

      <div>
        <p className="text-sm font-medium text-[#1B3A3A] mb-1.5">1. Exporter vers Airbnb</p>
        <p className="text-xs text-[#6B5B4D] mb-2">
          Copiez ce lien, puis collez-le dans Airbnb : Calendrier → Disponibilités →
          Associer des calendriers → Me connecter à un autre site web.
        </p>
        <div className="flex items-center gap-2">
          <input
            readOnly
            value={exportUrl}
            className="flex-1 text-xs px-3 py-2 rounded-lg border border-[#E4DCC8] bg-[#F8F4EC] text-[#6B5B4D]"
          />
          <button
            onClick={copier}
            className="w-9 h-9 rounded-lg bg-[#2F6E6E] flex items-center justify-center shrink-0 hover:bg-[#1B3A3A] transition-colors"
            aria-label="Copier le lien"
          >
            {copied ? <Check size={15} className="text-[#F8F4EC]" /> : <Copy size={15} className="text-[#F8F4EC]" />}
          </button>
        </div>
      </div>

      <div className="border-t border-[#EDE4D4] pt-4">
        <p className="text-sm font-medium text-[#1B3A3A] mb-1.5">2. Importer depuis Airbnb</p>
        <p className="text-xs text-[#6B5B4D] mb-2">
          Dans Airbnb, cliquez sur "Exporter le calendrier" et collez le lien obtenu ici.
        </p>
        <div className="flex items-center gap-2">
          <input
            value={urlAirbnb}
            onChange={(e) => setUrlAirbnb(e.target.value)}
            placeholder="https://www.airbnb.fr/calendar/ical/xxxxx.ics?s=xxxx"
            className="flex-1 text-xs px-3 py-2 rounded-lg border border-[#E4DCC8] bg-[#F8F4EC] focus:outline-none focus:border-[#2F6E6E] text-[#1B3A3A]"
          />
          <button
            onClick={enregistrer}
            disabled={!urlAirbnb || enregistrement}
            className="px-3.5 py-2 rounded-lg bg-[#C97B3D] text-[#F8F4EC] text-sm font-medium hover:bg-[#8A5A2B] transition-colors disabled:opacity-50"
          >
            {enregistrement ? "Enregistrement..." : "Enregistrer"}
          </button>
        </div>
      </div>

      {source && (
        <div className="border-t border-[#EDE4D4] pt-4 flex items-center gap-2 text-xs">
          {statut === "ok" && (
            <>
              <CheckCircle2 size={14} className="text-[#1B3A3A]" />
              <span className="text-[#6B5B4D]">
                Dernière synchronisation réussie
                {source.last_synced_at ? ` — ${new Date(source.last_synced_at).toLocaleString("fr-FR")}` : ""}
              </span>
            </>
          )}
          {statut === "error" && (
            <>
              <AlertTriangle size={14} className="text-[#7A2E1F]" />
              <span className="text-[#7A2E1F]">Échec de la dernière synchronisation — vérifiez le lien Airbnb.</span>
            </>
          )}
          {statut === "pending" && (
            <>
              <RefreshCw size={14} className="text-[#8C7A66]" />
              <span className="text-[#8C7A66]">En attente de la première synchronisation.</span>
            </>
          )}
        </div>
      )}

      <p className="text-[11px] text-[#B0A48F]">
        La synchronisation s'exécute automatiquement chaque heure. Les mises à jour côté Airbnb
        peuvent mettre 1 à 3 h à apparaître ici — pensez à confirmer manuellement toute réservation
        reçue dans les minutes suivant une réservation Airbnb.
      </p>
    </div>
  );
}
