"use client";

import { useEffect, useRef, useState } from "react";
import { LocateFixed, MapPinned } from "lucide-react";

const FRANCE_CENTER = [46.6, 2.4];
const FRANCE_ZOOM = 5.4;

export default function CarteRechercheFrance({ logements, onZoneChange, zoneActive }) {
  const mapNode = useRef(null);
  const mapRef = useRef(null);
  const layerRef = useRef(null);
  const leafletRef = useRef(null);
  const [zoneCourante, setZoneCourante] = useState(null);
  const [pret, setPret] = useState(false);

  useEffect(() => {
    let actif = true;

    async function init() {
      if (!mapNode.current || mapRef.current) return;
      const L = await import("leaflet");
      if (!actif || !mapNode.current) return;
      leafletRef.current = L;

      const map = L.map(mapNode.current, {
        zoomControl: true,
        scrollWheelZoom: true,
        minZoom: 4,
        maxZoom: 16,
      }).setView(FRANCE_CENTER, FRANCE_ZOOM);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap",
        maxZoom: 19,
      }).addTo(map);

      layerRef.current = L.layerGroup().addTo(map);
      mapRef.current = map;

      const memoriserZone = () => {
        const b = map.getBounds();
        setZoneCourante({
          south: b.getSouth(),
          north: b.getNorth(),
          west: b.getWest(),
          east: b.getEast(),
          zoom: map.getZoom(),
        });
      };

      map.on("moveend", memoriserZone);
      memoriserZone();
      setPret(true);
    }

    init();
    return () => {
      actif = false;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const L = leafletRef.current;
    const layer = layerRef.current;
    if (!L || !layer) return;

    layer.clearLayers();
    logements
      .filter((l) => Number.isFinite(l.latitude) && Number.isFinite(l.longitude))
      .forEach((l) => {
        const icon = L.divIcon({
          className: "escale-map-marker",
          html: `<span>${Math.round(l.prix)} €</span>`,
          iconSize: [54, 28],
          iconAnchor: [27, 14],
        });
        L.marker([l.latitude, l.longitude], { icon })
          .bindPopup(`<strong>${l.nom}</strong><br/>${l.ville}<br/>${Math.round(l.prix)} € / nuit`)
          .addTo(layer);
      });
  }, [logements, pret]);

  function appliquerZone() {
    if (zoneCourante) onZoneChange(zoneCourante);
  }

  function reinitialiserFrance() {
    mapRef.current?.setView(FRANCE_CENTER, FRANCE_ZOOM);
    onZoneChange(null);
  }

  return (
    <section className="overflow-hidden rounded-xl border border-[#E4DCC8] bg-[#FFFDF8]">
      <div className="flex flex-col gap-3 border-b border-[#E4DCC8] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-sm font-medium text-[#1B3A3A]"><MapPinned size={16}/> Rechercher sur la carte</h2>
          <p className="mt-0.5 text-xs text-[#8C7A66]">Zoomez et déplacez la carte, puis affichez uniquement les logements de cette zone.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={appliquerZone}
            disabled={!zoneCourante}
            className="rounded-lg bg-[#1B3A3A] px-3 py-2 text-xs font-medium text-[#F8F4EC] disabled:opacity-50"
          >
            Rechercher dans cette zone
          </button>
          <button
            type="button"
            onClick={reinitialiserFrance}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#E4DCC8] px-3 py-2 text-xs font-medium text-[#6B5B4D]"
          >
            <LocateFixed size={13}/> Toute la France
          </button>
        </div>
      </div>
      {zoneActive && (
        <div className="border-b border-[#E4DCC8] bg-[#E1EEE9] px-4 py-2 text-xs text-[#1B3A3A]">
          Filtre cartographique actif. Déplacez la carte pour changer de secteur ou revenez à « Toute la France ».
        </div>
      )}
      <div ref={mapNode} className="h-[360px] w-full sm:h-[430px]" aria-label="Carte interactive des logements en France" />
    </section>
  );
}
