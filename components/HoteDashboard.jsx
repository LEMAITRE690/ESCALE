"use client";

import React, { useState, useMemo, useRef } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import {
  Calendar, Users, Wallet, Star, MessageCircle, Home, ShieldAlert,
  Search, ChevronLeft, ChevronRight, Send, CheckCircle2, Clock, XCircle,
  LayoutGrid, Building2, TrendingUp, Flag, Copy, Check, RefreshCw, AlertTriangle, Link2,
  MapPin, Camera, ShieldCheck, X, GripVertical, BedDouble, Bath, Wifi, Car, Utensils, Wind, Waves, Plus, PawPrint, Sparkles, Moon, HeartHandshake, FileCheck, Receipt, Percent,
} from "lucide-react";
import RevenusHote from "@/components/RevenusHote";
import ChoixFormule from "@/components/ChoixFormule";
import MesVoyageurs from "@/components/MesVoyageurs";
import AcceptationDocument from "@/components/AcceptationDocument";
import FichesConciergeries from "@/components/admin/FichesConciergeries";

// ---------------------------------------------------------------------------
// Données de démonstration
// ---------------------------------------------------------------------------

const MONTHS = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];

const today = new Date(2026, 7, 14); // 14 août 2026

const reservationsHote = [
  { id: "R-2201", voyageur: "Camille Berthier", debut: "2026-08-16", fin: "2026-08-20", montant: 640, statut: "confirmee" },
  { id: "R-2198", voyageur: "Thomas Renard", debut: "2026-08-22", fin: "2026-08-25", montant: 390, statut: "confirmee" },
  { id: "R-2190", voyageur: "Léa Fontaine", debut: "2026-08-05", fin: "2026-08-09", montant: 520, statut: "terminee" },
  { id: "R-2185", voyageur: "Marc Dubuisson", debut: "2026-09-02", fin: "2026-09-06", montant: 580, statut: "en_attente" },
  { id: "R-2179", voyageur: "Julie Anceaume", debut: "2026-07-28", fin: "2026-08-01", montant: 460, statut: "terminee" },
];

const joursReserves = new Set([
  "2026-08-16","2026-08-17","2026-08-18","2026-08-19",
  "2026-08-22","2026-08-23","2026-08-24",
  "2026-08-05","2026-08-06","2026-08-07","2026-08-08",
]);
const joursBloques = new Set(["2026-08-12", "2026-08-13"]);

const ZONES_ETAT_LIEUX = ["Entrée", "Cuisine", "Séjour", "Chambre(s)", "Salle de bain", "Extérieur"];
const ETATS_POSSIBLES = [
  { id: "bon", label: "Bon état", cls: "bg-[#E1EEE9] text-[#1B3A3A] border-[#2F6E6E]" },
  { id: "usure", label: "Usure normale", cls: "bg-[#F6E4CE] text-[#8A5A2B] border-[#C97B3D]" },
  { id: "endommage", label: "Endommagé", cls: "bg-[#F6DEDA] text-[#7A2E1F] border-[#E24B4A]" },
];

function etatLieuxVide() {
  return {
    zones: Object.fromEntries(ZONES_ETAT_LIEUX.map((z) => [z, { etat: "bon", note: "", photos: [] }])),
    noteGenerale: "",
    signeHote: false,
    signeVoyageur: false,
  };
}

const CATEGORIES_INVENTAIRE = ["Linge de maison", "Vaisselle & cuisine", "Mobilier", "Électroménager", "Autre"];

const inventaireInitial = {
  "L-104": [
    { id: "inv-1", nom: "Couette 140x200", categorie: "Linge de maison", quantite: 2, prix: 45, dateAchat: "2026-03-12", etat: "bon" },
    { id: "inv-2", nom: "Jeu de draps blanc", categorie: "Linge de maison", quantite: 3, prix: 28, dateAchat: "2026-03-12", etat: "bon" },
    { id: "inv-3", nom: "Service vaisselle 6 pers.", categorie: "Vaisselle & cuisine", quantite: 1, prix: 65, dateAchat: "2025-11-02", etat: "usure" },
  ],
};

const mesAnnoncesHote = [
  { id: "L-104", nom: "Loft ancre & sel", ville: "Le Havre", statut: "actif", nombrePhotos: 6 },
  { id: "L-231", nom: "Chambre calme au jardin", ville: "Le Havre", statut: "actif", nombrePhotos: 3 },
  { id: "L-245", nom: "Studio vue port", ville: "Le Havre", statut: "en_moderation", nombrePhotos: 0 },
];

const NIVEAUX_CO_HOTE = [
  {
    id: "gestion_complete",
    label: "Gestion complète",
    description: "Modifie l'annonce, gère le calendrier et les réservations, répond aux voyageurs, voit les revenus.",
    cls: "bg-[#E1EEE9] text-[#1B3A3A] border-[#2F6E6E]",
  },
  {
    id: "operationnel",
    label: "Opérationnel",
    description: "Gère le calendrier, les réservations et les messages — ne modifie pas l'annonce, ne voit pas les revenus.",
    cls: "bg-[#F6E4CE] text-[#8A5A2B] border-[#C97B3D]",
  },
  {
    id: "messagerie_seule",
    label: "Messagerie seule",
    description: "Répond aux voyageurs uniquement — aucun accès au calendrier, à l'annonce ou aux revenus.",
    cls: "bg-[#EDE9E1] text-[#6B5B4D] border-[#D8CCB0]",
  },
];

const coHotesInitial = {
  "L-104": [
    { id: "ch-1", email: "yann.legoff@example.com", nom: "Yann Le Goff", niveau: "operationnel", statut: "actif" },
  ],
};

const avisHote = [
  { id: "R-1", annonce: "Loft ancre & sel", voyageur: "Julien M.", date: "juillet 2026", note: 5, texte: "Loft magnifique, exactement comme sur les photos. Camille a été très réactive pour toutes nos questions.", reponse: "" },
  { id: "R-2", annonce: "Loft ancre & sel", voyageur: "Sarah K.", date: "juin 2026", note: 5, texte: "Emplacement parfait pour visiter Le Havre à pied. On reviendra !", reponse: "Merci beaucoup Sarah, ravie que le quartier vous ait plu !" },
  { id: "R-3", annonce: "Chambre calme au jardin", voyageur: "Marc D.", date: "mai 2026", note: 4, texte: "Très bon séjour, juste un peu de bruit le matin côté rue. Rien de grave.", reponse: "" },
];

const STATUTS_SIGNALEMENT = [
  { id: "nouveau", label: "Nouveau", cls: "bg-[#F6DEDA] text-[#7A2E1F]" },
  { id: "en_cours", label: "En cours", cls: "bg-[#F6E4CE] text-[#8A5A2B]" },
  { id: "resolu", label: "Résolu", cls: "bg-[#E1EEE9] text-[#1B3A3A]" },
];

const signalementsEquipementHote = [
  { id: "SE-1", annonce: "Loft ancre & sel", voyageur: "Julien M.", equipement: "Lave-vaisselle", description: "Ne démarre plus depuis hier soir, le voyant reste éteint.", date: "14 août 2026", statut: "nouveau", note: "", dommageReconnu: false },
  { id: "SE-2", annonce: "Chambre calme au jardin", voyageur: "Sarah K.", equipement: "Wifi", description: "Connexion très instable dans la chambre, correcte dans le salon.", date: "10 août 2026", statut: "en_cours", note: "Technicien prévu mercredi.", dommageReconnu: false },
  { id: "SE-3", annonce: "Loft ancre & sel", voyageur: "Marc D.", equipement: "Chauffe-eau", description: "Eau chaude qui met très longtemps à arriver.", date: "2 août 2026", statut: "resolu", note: "Ballon d'eau chaude détartré, problème réglé.", dommageReconnu: false },
  { id: "SE-4", annonce: "Loft ancre & sel", voyageur: "Julien M.", equipement: "Vase en céramique", description: "Cassé par mégarde en déplaçant la table basse.", date: "16 août 2026", statut: "nouveau", note: "", dommageReconnu: true },
];

const revenusMensuels = [
  { mois: "Mars", montant: 1180 },
  { mois: "Avril", montant: 1420 },
  { mois: "Mai", montant: 1960 },
  { mois: "Juin", montant: 2340 },
  { mois: "Juil.", montant: 2870 },
  { mois: "Août", montant: 2100 },
];

const logementsAdmin = [
  { id: "L-104", nom: "Loft ancre & sel — Le Havre", hote: "Camille Berthier", statut: "actif", note: 4.8, reservations: 34 },
  { id: "L-098", nom: "Cabane des embruns — Quiberon", hote: "Yann Le Goff", statut: "en_moderation", note: null, reservations: 0 },
  { id: "L-091", nom: "Atelier Montmartre", hote: "Sophie Aznar", statut: "signale", note: 3.9, reservations: 21 },
  { id: "L-087", nom: "Mas des lavandes — Gordes", hote: "Antoine Rey", statut: "actif", note: 4.9, reservations: 58 },
  { id: "L-076", nom: "Petit port — La Rochelle", hote: "Nina Costa", statut: "actif", note: 4.6, reservations: 42 },
];

const litigesAdmin = [
  { id: "S-441", logement: "Atelier Montmartre", motif: "Logement non conforme à l'annonce", statut: "en_cours", depuis: "3 j", montant: 480 },
  { id: "S-439", logement: "Cabane des embruns", motif: "Annonce en attente de vérification initiale", statut: "en_attente", depuis: "1 j", montant: 310 },
  { id: "S-432", logement: "Loft ancre & sel", motif: "Demande de remboursement partiel", statut: "resolu", depuis: "9 j", montant: 640 },
];

const syncAirbnb = {
  ical_url: "https://www.airbnb.fr/calendar/ical/98213456.ics?s=7f2a9c1d",
  last_synced_at: "2026-08-14T07:00:00",
  last_sync_status: "ok",
};

const revenusPlateforme = [
  { mois: "Mars", montant: 8200 },
  { mois: "Avril", montant: 9600 },
  { mois: "Mai", montant: 12400 },
  { mois: "Juin", montant: 15100 },
  { mois: "Juil.", montant: 18900 },
  { mois: "Août", montant: 14700 },
];

// ---------------------------------------------------------------------------
// Utilitaires
// ---------------------------------------------------------------------------

function fmtEUR(n) {
  return n.toLocaleString("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
}
function fmtDate(d) {
  const [y, m, day] = d.split("-");
  return `${day}/${m}`;
}

const STATUT_STYLES = {
  confirmee: { label: "Confirmée", cls: "bg-[#E1EEE9] text-[#1B3A3A]" },
  en_attente: { label: "En attente", cls: "bg-[#F6E4CE] text-[#8A5A2B]" },
  terminee: { label: "Terminée", cls: "bg-[#EDE9E1] text-[#6B5B4D]" },
  actif: { label: "Actif", cls: "bg-[#E1EEE9] text-[#1B3A3A]" },
  en_moderation: { label: "En modération", cls: "bg-[#F6E4CE] text-[#8A5A2B]" },
  signale: { label: "Signalé", cls: "bg-[#F6DEDA] text-[#7A2E1F]" },
  en_cours: { label: "En cours", cls: "bg-[#F6E4CE] text-[#8A5A2B]" },
  resolu: { label: "Résolu", cls: "bg-[#E1EEE9] text-[#1B3A3A]" },
  refunded: { label: "Remboursé", cls: "bg-[#EDE9E1] text-[#6B5B4D]" },
  partially_refunded: { label: "Remb. partiel", cls: "bg-[#F6E4CE] text-[#8A5A2B]" },
};

function Badge({ statut }) {
  const s = STATUT_STYLES[statut] || { label: statut, cls: "bg-[#EDE9E1] text-[#6B5B4D]" };
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${s.cls}`}>
      {s.label}
    </span>
  );
}

function MetricCard({ icon: Icon, label, value, sub }) {
  return (
    <div className="bg-[#FFFDF8] border border-[#E4DCC8] rounded-xl p-4 flex items-start gap-3">
      <div className="w-9 h-9 rounded-lg bg-[#1B3A3A] flex items-center justify-center shrink-0">
        <Icon size={17} className="text-[#F8F4EC]" />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] uppercase tracking-wide text-[#8C7A66] font-medium">{label}</p>
        <p className="text-xl font-serif text-[#1B3A3A] mt-0.5 truncate">{value}</p>
        {sub && <p className="text-xs text-[#8C7A66] mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Calendrier
// ---------------------------------------------------------------------------

function CalendrierReservations({ reservations = null }) {
  const [cursor, setCursor] = useState(new Date(2026, 7, 1));
  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const firstDay = new Date(year, month, 1);
  const startOffset = (firstDay.getDay() + 6) % 7; // lundi = 0
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  function iso(d) {
    return `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  }

  // Si de vraies réservations sont fournies, on recalcule les jours occupés
  // à partir de leurs dates ; sinon on retombe sur les jours de démonstration.
  const joursReservesActifs = useMemo(() => {
    if (reservations === null) return joursReserves;
    const jours = new Set();
    for (const r of reservations) {
      if (!["confirmee", "en_attente", "terminee"].includes(r.statut)) continue;
      let curseur = new Date(r.debut);
      const fin = new Date(r.fin);
      while (curseur < fin) {
        jours.add(curseur.toISOString().slice(0, 10));
        curseur.setDate(curseur.getDate() + 1);
      }
    }
    return jours;
  }, [reservations]);
  const joursBloquesActifs = reservations === null ? joursBloques : new Set();

  return (
    <div className="bg-[#FFFDF8] border border-[#E4DCC8] rounded-xl p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-serif text-[#1B3A3A] text-base">
          {MONTHS[month]} {year}
        </h3>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setCursor(new Date(year, month - 1, 1))}
            className="w-7 h-7 rounded-md border border-[#E4DCC8] flex items-center justify-center hover:bg-[#F1EADB]"
            aria-label="Mois précédent"
          >
            <ChevronLeft size={14} className="text-[#1B3A3A]" />
          </button>
          <button
            onClick={() => setCursor(new Date(year, month + 1, 1))}
            className="w-7 h-7 rounded-md border border-[#E4DCC8] flex items-center justify-center hover:bg-[#F1EADB]"
            aria-label="Mois suivant"
          >
            <ChevronRight size={14} className="text-[#1B3A3A]" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1.5 mb-1.5">
        {["L", "M", "M", "J", "V", "S", "D"].map((d, i) => (
          <div key={i} className="text-center text-[10px] font-medium text-[#8C7A66] uppercase">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1.5">
        {cells.map((d, i) => {
          if (d === null) return <div key={i} />;
          const key = iso(d);
          const reserve = joursReservesActifs.has(key);
          const bloque = joursBloquesActifs.has(key);
          const isToday = year === today.getFullYear() && month === today.getMonth() && d === today.getDate();
          return (
            <div
              key={i}
              className={[
                "aspect-square rounded-md flex items-center justify-center text-xs relative",
                reserve ? "bg-[#2F6E6E] text-[#F8F4EC] font-medium" :
                bloque ? "bg-[#EDE4D4] text-[#8C7A66] line-through" :
                "bg-[#F8F4EC] text-[#1B3A3A]",
                isToday ? "ring-2 ring-[#C97B3D] ring-offset-1 ring-offset-[#FFFDF8]" : "",
              ].join(" ")}
            >
              {d}
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-4 mt-4 text-[11px] text-[#6B5B4D]">
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-[#2F6E6E]" /> Réservé</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-[#EDE4D4]" /> Bloqué</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-[#F8F4EC] border border-[#E4DCC8]" /> Libre</span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Graphique de revenus
// ---------------------------------------------------------------------------

function GraphiqueRevenus({ data, titre }) {
  return (
    <div className="bg-[#FFFDF8] border border-[#E4DCC8] rounded-xl p-4">
      <h3 className="font-serif text-[#1B3A3A] text-base mb-3">{titre}</h3>
      <div style={{ width: "100%", height: 220 }}>
        <ResponsiveContainer>
          <BarChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke="#E4DCC8" />
            <XAxis dataKey="mois" tick={{ fill: "#8C7A66", fontSize: 11 }} axisLine={{ stroke: "#E4DCC8" }} tickLine={false} />
            <YAxis tick={{ fill: "#8C7A66", fontSize: 11 }} axisLine={false} tickLine={false} width={56}
              tickFormatter={(v) => `${v >= 1000 ? (v / 1000).toFixed(1) + "k" : v}€`} />
            <Tooltip
              formatter={(v) => [fmtEUR(v), "Revenus"]}
              contentStyle={{ background: "#FFFDF8", border: "1px solid #E4DCC8", borderRadius: 8, fontSize: 12 }}
            />
            <Bar dataKey="montant" fill="#C97B3D" radius={[4, 4, 0, 0]} maxBarSize={36} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Synchronisation Airbnb (iCal)
// ---------------------------------------------------------------------------

function SyncCalendarAirbnb({ listingId = "L-104", source = syncAirbnb }) {
  const [copied, setCopied] = useState(false);
  const [urlAirbnb, setUrlAirbnb] = useState(source?.ical_url ?? "");
  const [enregistrement, setEnregistrement] = useState(false);
  const [erreur, setErreur] = useState("");

  const exportUrl = `https://escale.app/api/ical/export/${listingId}`;

  function copier() {
    navigator.clipboard?.writeText(exportUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function enregistrer() {
    if (!urlAirbnb.trim()) {
      setErreur("Collez d'abord un lien iCal Airbnb.");
      return;
    }
    setErreur("");
    setEnregistrement(true);
    setTimeout(() => setEnregistrement(false), 900);
  }

  const statut = source?.last_sync_status;

  return (
    <div className="bg-[#FFFDF8] border border-[#E4DCC8] rounded-xl p-5 space-y-5">
      <div>
        <h3 className="font-serif text-[#1B3A3A] text-base mb-1 flex items-center gap-2">
          <Link2 size={16} /> Synchronisation avec Airbnb
        </h3>
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
            onChange={(e) => { setUrlAirbnb(e.target.value); if (erreur) setErreur(""); }}
            placeholder="https://www.airbnb.fr/calendar/ical/xxxxx.ics?s=xxxx"
            className="flex-1 text-xs px-3 py-2 rounded-lg border border-[#E4DCC8] bg-[#F8F4EC] focus:outline-none focus:border-[#2F6E6E] text-[#1B3A3A]"
          />
          <button
            onClick={enregistrer}
            disabled={enregistrement}
            className="px-3.5 py-2 rounded-lg bg-[#C97B3D] text-[#F8F4EC] text-sm font-medium hover:bg-[#8A5A2B] transition-colors disabled:opacity-50 whitespace-nowrap"
          >
            {enregistrement ? "Enregistrement..." : "Enregistrer"}
          </button>
        </div>
        {erreur && <p className="text-xs text-[#7A2E1F] mt-1.5">{erreur}</p>}
      </div>

      <div className="border-t border-[#EDE4D4] pt-4 flex items-center gap-2 text-xs">
        {statut === "ok" && (
          <>
            <CheckCircle2 size={14} className="text-[#1B3A3A]" />
            <span className="text-[#6B5B4D]">
              Dernière synchronisation réussie
              {source?.last_synced_at ? ` — ${new Date(source.last_synced_at).toLocaleString("fr-FR")}` : ""}
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

      <p className="text-[11px] text-[#B0A48F]">
        La synchronisation s'exécute automatiquement chaque heure. Les mises à jour côté Airbnb
        peuvent mettre 1 à 3 h à apparaître ici — confirmez manuellement toute réservation reçue
        dans les minutes suivant une réservation Airbnb.
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Formulaire de publication d'annonce
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const ETAPES = ["Description", "Localisation", "Photos", "Tarif & équipements", "Options du séjour", "Règles du séjour", "Assurance", "Récapitulatif"];

const POLITIQUES_ANNULATION = [
  { id: "flexible", label: "Flexible", description: "Remboursement intégral jusqu'à 24h avant l'arrivée." },
  { id: "moderee", label: "Modérée", description: "Remboursement intégral jusqu'à 5 jours avant l'arrivée." },
  { id: "stricte", label: "Stricte", description: "Remboursement à 50% jusqu'à 14 jours avant l'arrivée, rien après." },
  { id: "tres_stricte", label: "Très stricte", description: "Remboursement à 50% jusqu'à 30 jours avant l'arrivée, rien après." },
  { id: "non_remboursable", label: "Non remboursable", description: "Aucun remboursement une fois la réservation confirmée, sauf annulation par l'hôte." },
];

const TYPES_LOGEMENT = ["Appartement", "Maison", "Studio", "Loft", "Chalet", "Cabane"];

const CATEGORIES_EQUIPEMENTS = [
  {
    categorie: "Cuisine",
    items: [
      { id: "cuisine", label: "Cuisine équipée", icon: Utensils },
      { id: "lave_vaisselle", label: "Lave-vaisselle", icon: Utensils },
      { id: "micro_ondes", label: "Micro-ondes", icon: Utensils },
      { id: "refrigerateur", label: "Réfrigérateur", icon: Utensils },
      { id: "cafetiere", label: "Cafetière", icon: Utensils },
      { id: "bouilloire", label: "Bouilloire", icon: Utensils },
    ],
  },
  {
    categorie: "Confort",
    items: [
      { id: "wifi", label: "Wifi", icon: Wifi },
      { id: "clim", label: "Climatisation", icon: Wind },
      { id: "chauffage", label: "Chauffage", icon: Wind },
      { id: "tv", label: "Télévision", icon: Home },
      { id: "lave_linge", label: "Lave-linge", icon: Home },
      { id: "seche_linge", label: "Sèche-linge", icon: Home },
      { id: "fer_a_repasser", label: "Fer à repasser", icon: Home },
    ],
  },
  {
    categorie: "Salle de bain",
    items: [
      { id: "seche_cheveux", label: "Sèche-cheveux", icon: Home },
      { id: "serviettes_fournies", label: "Serviettes fournies", icon: Home },
      { id: "produits_toilette", label: "Produits de toilette", icon: Home },
    ],
  },
  {
    categorie: "Extérieur",
    items: [
      { id: "parking", label: "Parking", icon: Car },
      { id: "piscine", label: "Piscine", icon: Waves },
      { id: "jardin", label: "Jardin", icon: Home },
      { id: "terrasse_balcon", label: "Terrasse ou balcon", icon: Home },
      { id: "barbecue", label: "Barbecue", icon: Home },
    ],
  },
  {
    categorie: "Sécurité",
    items: [
      { id: "detecteur_fumee", label: "Détecteur de fumée", icon: ShieldCheck },
      { id: "detecteur_co", label: "Détecteur de monoxyde de carbone", icon: ShieldCheck },
      { id: "extincteur", label: "Extincteur", icon: ShieldCheck },
      { id: "trousse_secours", label: "Trousse de secours", icon: ShieldCheck },
    ],
  },
];

// Liste à plat, dérivée du catalogue ci-dessus — conservée pour les endroits
// (filtres de recherche, affichage) qui n'ont besoin que d'un id + libellé.
const EQUIPEMENTS = CATEGORIES_EQUIPEMENTS.flatMap((c) => c.items);

function StepDot({ index, actif, complete, onClick }) {
  return (
    <button
      onClick={onClick}
      className={[
        "w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium shrink-0 transition-colors",
        actif ? "bg-[#1B3A3A] text-[#F8F4EC]" :
        complete ? "bg-[#2F6E6E] text-[#F8F4EC]" :
        "bg-[#EDE4D4] text-[#8C7A66]",
      ].join(" ")}
    >
      {complete && !actif ? <Check size={13} /> : index + 1}
    </button>
  );
}

function Field({ label, children, hint }) {
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-[#1B3A3A] mb-1.5">{label}</label>
      {children}
      {hint && <p className="text-xs text-[#8C7A66] mt-1">{hint}</p>}
    </div>
  );
}

const inputCls =
  "w-full text-sm px-3 py-2.5 rounded-lg border border-[#E4DCC8] bg-[#F8F4EC] focus:outline-none focus:border-[#2F6E6E] text-[#1B3A3A] placeholder:text-[#B0A48F]";

// ---------------------------------------------------------------------------
// Étape 1 — Description
// ---------------------------------------------------------------------------

function EtapeDescription({ data, setData }) {
  return (
    <div>
      <Field label="Titre de l'annonce" hint="Décrivez le logement en une phrase accrocheuse (60 caractères max).">
        <input
          className={inputCls}
          maxLength={60}
          placeholder="Loft baigné de lumière avec vue sur les toits"
          value={data.titre}
          onChange={(e) => setData({ ...data, titre: e.target.value })}
        />
      </Field>

      <Field label="Type de logement">
        <div className="flex flex-wrap gap-2">
          {TYPES_LOGEMENT.map((t) => (
            <button
              key={t}
              onClick={() => setData({ ...data, type: t })}
              className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                data.type === t
                  ? "bg-[#1B3A3A] text-[#F8F4EC] border-[#1B3A3A]"
                  : "bg-[#F8F4EC] text-[#6B5B4D] border-[#E4DCC8] hover:border-[#2F6E6E]"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </Field>

      <div className="grid grid-cols-3 gap-3 mb-4">
        <Field label="Voyageurs">
          <div className="flex items-center gap-2">
            <Users size={15} className="text-[#8C7A66]" />
            <input
              type="number" min={1} className={inputCls}
              value={data.voyageurs}
              onChange={(e) => setData({ ...data, voyageurs: e.target.value })}
            />
          </div>
        </Field>
        <Field label="Chambres">
          <div className="flex items-center gap-2">
            <BedDouble size={15} className="text-[#8C7A66]" />
            <input
              type="number" min={0} className={inputCls}
              value={data.chambres}
              onChange={(e) => setData({ ...data, chambres: e.target.value })}
            />
          </div>
        </Field>
        <Field label="Salles de bain">
          <div className="flex items-center gap-2">
            <Bath size={15} className="text-[#8C7A66]" />
            <input
              type="number" min={0} className={inputCls}
              value={data.sallesDeBain}
              onChange={(e) => setData({ ...data, sallesDeBain: e.target.value })}
            />
          </div>
        </Field>
      </div>

      <Field label="Description" hint={`${data.description.length} / 1000 caractères`}>
        <textarea
          className={inputCls}
          rows={6}
          maxLength={1000}
          placeholder="Décrivez l'ambiance du logement, le quartier, ce qui le rend unique..."
          value={data.description}
          onChange={(e) => setData({ ...data, description: e.target.value })}
        />
      </Field>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Étape 2 — Localisation
// ---------------------------------------------------------------------------

function EtapeLocalisation({ data, setData }) {
  return (
    <div>
      <Field label="Adresse">
        <div className="flex items-center gap-2">
          <MapPin size={15} className="text-[#8C7A66] shrink-0" />
          <input
            className={inputCls}
            placeholder="12 rue des Embruns"
            value={data.adresse}
            onChange={(e) => setData({ ...data, adresse: e.target.value })}
          />
        </div>
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Ville">
          <input
            className={inputCls}
            placeholder="Quiberon"
            value={data.ville}
            onChange={(e) => setData({ ...data, ville: e.target.value })}
          />
        </Field>
        <Field label="Code postal">
          <input
            className={inputCls}
            placeholder="56170"
            value={data.codePostal}
            onChange={(e) => setData({ ...data, codePostal: e.target.value })}
          />
        </Field>
      </div>
      <Field label="Complément" hint="Étage, code d'accès... Ces détails ne seront visibles qu'après réservation confirmée.">
        <input
          className={inputCls}
          placeholder="3ème étage, digicode 2847"
          value={data.complement}
          onChange={(e) => setData({ ...data, complement: e.target.value })}
        />
      </Field>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Étape 3 — Photos
// ---------------------------------------------------------------------------

function EtapePhotos({ photos, setPhotos }) {
  const inputRef = useRef(null);
  const [dragIndex, setDragIndex] = useState(null);

  function ajouterFichiers(fileList) {
    const nouvelles = Array.from(fileList)
      .filter((f) => f.type.startsWith("image/"))
      .map((f) => ({ id: `${f.name}-${Date.now()}-${Math.random()}`, file: f, url: URL.createObjectURL(f) }));
    setPhotos((prev) => [...prev, ...nouvelles].slice(0, 20));
  }

  function supprimer(id) {
    setPhotos((prev) => prev.filter((p) => p.id !== id));
  }

  function onDrop(e) {
    e.preventDefault();
    ajouterFichiers(e.dataTransfer.files);
  }

  function reordonner(depuis, vers) {
    setPhotos((prev) => {
      const copie = [...prev];
      const [item] = copie.splice(depuis, 1);
      copie.splice(vers, 0, item);
      return copie;
    });
  }

  return (
    <div>
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className="border-2 border-dashed border-[#D8CCB0] rounded-xl p-8 text-center cursor-pointer hover:border-[#2F6E6E] hover:bg-[#F1EADB] transition-colors mb-4"
      >
        <Camera size={22} className="mx-auto text-[#8C7A66] mb-2" />
        <p className="text-sm text-[#1B3A3A] font-medium">Glissez vos photos ici, ou cliquez pour parcourir</p>
        <p className="text-xs text-[#8C7A66] mt-1">JPG, PNG — 5 photos minimum recommandées</p>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => ajouterFichiers(e.target.files)}
        />
      </div>

      {photos.length === 0 ? (
        <p className="text-xs text-[#B0A48F] text-center">Aucune photo ajoutée pour le moment.</p>
      ) : (
        <>
          <p className="text-xs text-[#8C7A66] mb-2">
            {photos.length} photo{photos.length > 1 ? "s" : ""} — la première sera la photo de couverture. Glissez pour réordonner.
          </p>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
            {photos.map((p, i) => (
              <div
                key={p.id}
                draggable
                onDragStart={() => setDragIndex(i)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => { if (dragIndex !== null) reordonner(dragIndex, i); setDragIndex(null); }}
                className="relative aspect-square rounded-lg overflow-hidden border border-[#E4DCC8] group bg-[#EDE4D4]"
              >
                <img src={p.url} alt="" className="w-full h-full object-cover" />
                {i === 0 && (
                  <span className="absolute top-1.5 left-1.5 bg-[#1B3A3A] text-[#F8F4EC] text-[10px] px-2 py-0.5 rounded-full font-medium">
                    Couverture
                  </span>
                )}
                <button
                  onClick={() => supprimer(p.id)}
                  className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label="Retirer la photo"
                >
                  <X size={12} />
                </button>
                <div className="absolute bottom-1.5 right-1.5 w-5 h-5 rounded bg-black/40 text-white flex items-center justify-center cursor-grab opacity-0 group-hover:opacity-100 transition-opacity">
                  <GripVertical size={12} />
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Gestion des photos d'une annonce déjà publiée
// ---------------------------------------------------------------------------

function GererPhotosAnnonce({ annonce, onRetour }) {
  const [photos, setPhotos] = useState([]);
  const [enregistrement, setEnregistrement] = useState(false);
  const [enregistre, setEnregistre] = useState(false);
  const [erreur, setErreur] = useState("");

  async function enregistrer() {
    setEnregistrement(true);
    setErreur("");

    // Route déjà codée côté serveur : POST /api/listings/:id/photos
    // (attend un vrai UUID d'annonce Supabase — voir la remarque du README
    // sur les identifiants d'exemple utilisés dans ce prototype).
    try {
      const formData = new FormData();
      photos.forEach((p) => { if (p.file) formData.append("photos", p.file); });
      formData.append("keepUrls", JSON.stringify(photos.filter((p) => !p.file).map((p) => p.url)));

      const res = await fetch(`/api/listings/${annonce.id}/photos`, { method: "POST", body: formData });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setErreur(data.error || "Impossible d'enregistrer les photos.");
      } else {
        setEnregistre(true);
        setTimeout(() => setEnregistre(false), 2000);
      }
    } catch {
      setErreur("Une erreur est survenue. Réessayez.");
    } finally {
      setEnregistrement(false);
    }
  }

  return (
    <div className="bg-[#FFFDF8] border border-[#E4DCC8] rounded-xl p-5 max-w-2xl">
      <button
        onClick={onRetour}
        className="flex items-center gap-1.5 text-sm text-[#6B5B4D] hover:text-[#1B3A3A] transition-colors mb-4"
      >
        <ChevronLeft size={15} /> Retour à mes annonces
      </button>

      <h3 className="font-serif text-lg text-[#1B3A3A] mb-1">Photos — {annonce.nom}</h3>
      <p className="text-xs text-[#8C7A66] mb-4">{annonce.ville} · {annonce.nombrePhotos} photo{annonce.nombrePhotos !== 1 ? "s" : ""} actuellement en ligne</p>

      <EtapePhotos photos={photos} setPhotos={setPhotos} />

      {erreur && <p className="text-xs text-[#7A2E1F] mt-3">{erreur}</p>}

      <button
        onClick={enregistrer}
        disabled={enregistrement || photos.length === 0}
        className="mt-4 px-4 py-2 rounded-lg bg-[#1B3A3A] text-[#F8F4EC] text-sm font-medium hover:bg-[#2F6E6E] transition-colors disabled:opacity-50"
      >
        {enregistrement ? "Enregistrement..." : enregistre ? "Enregistré" : "Enregistrer les photos"}
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Co-hôtes
// ---------------------------------------------------------------------------

function InviterCoHote({ onInviter }) {
  const [email, setEmail] = useState("");
  const [niveau, setNiveau] = useState("operationnel");
  const [erreur, setErreur] = useState("");

  function inviter() {
    if (!email.trim() || !email.includes("@")) {
      setErreur("Entrez une adresse e-mail valide.");
      return;
    }
    setErreur("");
    onInviter({ email: email.trim(), niveau });
    setEmail("");
  }

  return (
    <div className="bg-[#F8F4EC] border border-[#E4DCC8] rounded-lg p-3 mb-4">
      <p className="text-xs font-medium text-[#1B3A3A] mb-2">Inviter un co-hôte</p>
      <div className="flex flex-col sm:flex-row gap-2 mb-2">
        <input
          className={`${inputCls} flex-1`}
          placeholder="email@exemple.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <select value={niveau} onChange={(e) => setNiveau(e.target.value)} className={inputCls}>
          {NIVEAUX_CO_HOTE.map((n) => <option key={n.id} value={n.id}>{n.label}</option>)}
        </select>
        <button
          onClick={inviter}
          className="px-4 py-2.5 rounded-lg bg-[#1B3A3A] text-[#F8F4EC] text-sm font-medium hover:bg-[#2F6E6E] transition-colors shrink-0"
        >
          Inviter
        </button>
      </div>
      {erreur && <p className="text-xs text-[#7A2E1F]">{erreur}</p>}
      <p className="text-[11px] text-[#8C7A66] mt-1">
        {NIVEAUX_CO_HOTE.find((n) => n.id === niveau)?.description}
      </p>
    </div>
  );
}

function CoHoteItem({ coHote, onChangerNiveau, onRevoquer }) {
  const [edition, setEdition] = useState(false);
  const infoNiveau = NIVEAUX_CO_HOTE.find((n) => n.id === coHote.niveau);
  const revoque = coHote.statut === "revoque";

  return (
    <div className="px-4 py-3 border-b border-[#EDE4D4] last:border-b-0">
      <div className="flex items-center justify-between gap-3 mb-1.5">
        <div className="min-w-0">
          <p className="text-sm font-medium text-[#1B3A3A] truncate">{coHote.nom || coHote.email}</p>
          <p className="text-xs text-[#8C7A66] truncate">{coHote.email}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {revoque ? (
            <span className="text-xs px-2.5 py-1 rounded-full bg-[#EDE9E1] text-[#6B5B4D]">Accès révoqué</span>
          ) : (
            <>
              <span className={`text-xs px-2.5 py-1 rounded-full border ${infoNiveau.cls}`}>{infoNiveau.label}</span>
              <button onClick={() => setEdition((e) => !e)} className="text-xs text-[#2F6E6E] hover:text-[#1B3A3A] font-medium">
                Modifier
              </button>
              <button onClick={() => onRevoquer(coHote.id)} className="text-xs text-[#7A2E1F] hover:text-[#5C2116] font-medium">
                Révoquer
              </button>
            </>
          )}
        </div>
      </div>

      {edition && !revoque && (
        <div className="flex flex-wrap gap-2 mt-2">
          {NIVEAUX_CO_HOTE.map((n) => (
            <button
              key={n.id}
              onClick={() => { onChangerNiveau(coHote.id, n.id); setEdition(false); }}
              className={`px-3 py-1.5 rounded-lg text-xs border transition-colors ${
                coHote.niveau === n.id ? n.cls : "bg-[#F8F4EC] border-[#E4DCC8] text-[#6B5B4D]"
              }`}
            >
              {n.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function GererCoHotes({ annonce, coHotes, onInviter, onChangerNiveau, onRevoquer, onRetour }) {
  return (
    <div className="bg-[#FFFDF8] border border-[#E4DCC8] rounded-xl p-5 max-w-2xl">
      <button
        onClick={onRetour}
        className="flex items-center gap-1.5 text-sm text-[#6B5B4D] hover:text-[#1B3A3A] transition-colors mb-4"
      >
        <ChevronLeft size={15} /> Retour à mes annonces
      </button>

      <h3 className="font-serif text-lg text-[#1B3A3A] mb-1">Co-hôtes — {annonce.nom}</h3>
      <p className="text-xs text-[#8C7A66] mb-4">
        Donnez accès à cette annonce à une autre personne, avec un niveau de droits adapté à son rôle.
      </p>

      <InviterCoHote onInviter={(data) => onInviter(annonce.id, data)} />

      <div className="border border-[#E4DCC8] rounded-lg overflow-hidden">
        {coHotes.length === 0 ? (
          <p className="text-xs text-[#B0A48F] text-center py-6">Aucun co-hôte pour cette annonce.</p>
        ) : (
          coHotes.map((c) => (
            <CoHoteItem key={c.id} coHote={c} onChangerNiveau={onChangerNiveau} onRevoquer={onRevoquer} />
          ))
        )}
      </div>

      <p className="text-[11px] text-[#B0A48F] mt-3">
        Un co-hôte ne peut jamais accéder aux virements ni modifier vos coordonnées bancaires,
        quel que soit son niveau d'accès.
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Conciergerie partenaire
// ---------------------------------------------------------------------------

function PartenaireConciergerie({ partenaireRattache, grantId, onRattacher, onRevoquer }) {
  const [code, setCode] = useState("");
  const [enCours, setEnCours] = useState(false);
  const [enCoursRevocation, setEnCoursRevocation] = useState(false);
  const [erreur, setErreur] = useState("");

  function rattacher() {
    if (!code.trim()) {
      setErreur("Entrez un code de parrainage.");
      return;
    }
    setErreur("");
    setEnCours(true);
    // Route déjà codée côté serveur : POST /api/partners/attach
    // (accorde aussi automatiquement le statut super-hôte, voir migration 0018)
    fetch("/api/partners/attach", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: code.trim() }),
    }).catch(() => {});
    setTimeout(() => {
      onRattacher(code.trim());
      setEnCours(false);
    }, 500);
  }

  function revoquer() {
    setEnCoursRevocation(true);
    // Route déjà codée côté serveur : DELETE /api/partners/grants
    fetch("/api/partners/grants", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ grantId }),
    }).catch(() => {});
    setTimeout(() => {
      onRevoquer();
      setEnCoursRevocation(false);
    }, 500);
  }

  return (
    <div className="bg-[#FFFDF8] border border-[#E4DCC8] rounded-xl p-5 max-w-lg">
      <h3 className="font-serif text-base text-[#1B3A3A] mb-1">Conciergerie partenaire</h3>
      <p className="text-xs text-[#8C7A66] mb-4">
        Si une conciergerie partenaire vous a orienté vers Escale, renseignez son code. Elle
        obtient alors le statut <b>super-hôte</b> : un accès de gestion sur l'ensemble de vos
        annonces, pratique si elle gère votre portefeuille au quotidien.
      </p>

      {partenaireRattache ? (
        <>
          <div className="flex items-center justify-between gap-3 bg-[#E1EEE9] rounded-lg px-3 py-2.5 mb-2">
            <span className="flex items-center gap-2 text-sm text-[#1B3A3A]">
              <ShieldCheck size={15} /> {partenaireRattache} — statut super-hôte actif
            </span>
            <button
              onClick={revoquer}
              disabled={enCoursRevocation}
              className="text-xs font-medium text-[#7A2E1F] hover:text-[#5C2116] transition-colors shrink-0 disabled:opacity-50"
            >
              {enCoursRevocation ? "..." : "Révoquer l'accès"}
            </button>
          </div>
          <p className="text-[11px] text-[#8C7A66]">
            Vos annonces restent les vôtres à tout moment : la révoquer coupe uniquement
            l'accès de gestion de la conciergerie, sans affecter la propriété de vos annonces
            ni votre visibilité sur Escale.
          </p>
        </>
      ) : (
        <>
          <div className="flex gap-2 mb-2">
            <input
              className={inputCls}
              placeholder="Ex : CONCIERGE-4F2A"
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
            <button
              onClick={rattacher}
              disabled={enCours}
              className="px-4 py-2.5 rounded-lg bg-[#1B3A3A] text-[#F8F4EC] text-sm font-medium hover:bg-[#2F6E6E] transition-colors disabled:opacity-50 shrink-0"
            >
              {enCours ? "..." : "Rattacher"}
            </button>
          </div>
          {erreur && <p className="text-xs text-[#7A2E1F]">{erreur}</p>}
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Documents requis (anti-fraude, alimente le contrat de location)
// ---------------------------------------------------------------------------

const TYPES_DOCUMENTS = [
  { id: "piece_identite", label: "Pièce d'identité", description: "Carte d'identité ou passeport en cours de validité.", parAnnonce: false },
  { id: "justificatif_domicile", label: "Justificatif de domicile", description: "Daté de moins de 3 mois.", parAnnonce: false },
  { id: "titre_propriete_ou_mandat", label: "Titre de propriété ou mandat de gestion", description: "Selon que vous êtes propriétaire ou conciergerie mandatée.", parAnnonce: true },
  { id: "attestation_assurance", label: "Attestation d'assurance", description: "Habitation avec clause villégiature, ou Propriétaire Non Occupant.", parAnnonce: true },
];

const STATUTS_DOCUMENT = {
  manquant: { label: "À fournir", cls: "bg-[#F6DEDA] text-[#7A2E1F]" },
  en_attente: { label: "En vérification", cls: "bg-[#F6E4CE] text-[#8A5A2B]" },
  valide: { label: "Validé", cls: "bg-[#E1EEE9] text-[#1B3A3A]" },
  refuse: { label: "Refusé", cls: "bg-[#F6DEDA] text-[#7A2E1F]" },
};

function LigneDocument({ typeDoc, document, onUpload }) {
  const inputRef = useRef(null);
  const statut = document?.status ?? "manquant";
  const info = STATUTS_DOCUMENT[statut];

  function choisirFichier(e) {
    const fichier = e.target.files?.[0];
    if (fichier) onUpload(typeDoc.id, fichier);
  }

  return (
    <div className="flex items-start justify-between gap-3 py-3 border-b border-[#EDE4D4] last:border-b-0">
      <div className="min-w-0">
        <p className="text-sm font-medium text-[#1B3A3A]">{typeDoc.label}</p>
        <p className="text-xs text-[#8C7A66]">{typeDoc.description}</p>
        {statut === "refuse" && document?.noteAdmin && (
          <p className="text-xs text-[#7A2E1F] mt-1">Motif du refus : {document.noteAdmin}</p>
        )}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span className={`text-xs px-2.5 py-1 rounded-full ${info.cls}`}>{info.label}</span>
        {(statut === "manquant" || statut === "refuse") && (
          <>
            <button
              onClick={() => inputRef.current?.click()}
              className="text-xs font-medium text-[#2F6E6E] hover:text-[#1B3A3A] transition-colors"
            >
              {statut === "refuse" ? "Renvoyer" : "Téléverser"}
            </button>
            <input ref={inputRef} type="file" accept="image/*,.pdf" className="hidden" onChange={choisirFichier} />
          </>
        )}
      </div>
    </div>
  );
}

function DocumentsRequis({ documents, onUpload }) {
  const nbManquants = TYPES_DOCUMENTS.filter((t) => !documents[t.id] || documents[t.id].status === "refuse").length;

  return (
    <div className="bg-[#FFFDF8] border border-[#E4DCC8] rounded-xl p-5 max-w-2xl">
      <div className="flex items-center justify-between mb-1">
        <h3 className="font-serif text-base text-[#1B3A3A]">Documents requis</h3>
        {nbManquants > 0 && (
          <span className="text-xs font-medium bg-[#F6DEDA] text-[#7A2E1F] px-2.5 py-1 rounded-full">
            {nbManquants} à fournir
          </span>
        )}
      </div>
      <p className="text-xs text-[#8C7A66] mb-3">
        Ces documents nous permettent de limiter les fausses annonces et de générer des contrats de
        location plus complets pour vos voyageurs. Ils restent strictement confidentiels : seule
        notre équipe de vérification y a accès, jamais vos voyageurs ni les autres hôtes.
      </p>

      <div>
        {TYPES_DOCUMENTS.map((t) => (
          <LigneDocument key={t.id} typeDoc={t} document={documents[t.id]} onUpload={onUpload} />
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Avis et réponses de l'hôte
// ---------------------------------------------------------------------------

function AvisItem({ avis, onRepondre }) {
  const [enEdition, setEnEdition] = useState(false);
  const [brouillon, setBrouillon] = useState(avis.reponse);

  function enregistrer() {
    onRepondre(avis.id, brouillon.trim());
    setEnEdition(false);
  }

  return (
    <div className="px-4 py-4 border-b border-[#EDE4D4] last:border-b-0">
      <div className="flex items-start justify-between gap-3 mb-1.5">
        <div>
          <p className="text-sm font-medium text-[#1B3A3A]">{avis.voyageur}</p>
          <p className="text-xs text-[#8C7A66]">{avis.annonce} · {avis.date}</p>
        </div>
        <div className="flex gap-0.5 shrink-0">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star key={i} size={11} className={i < avis.note ? "fill-[#C97B3D] text-[#C97B3D]" : "text-[#E4DCC8]"} />
          ))}
        </div>
      </div>
      <p className="text-sm text-[#4A4238] leading-relaxed mb-2.5">{avis.texte}</p>

      {avis.reponse && !enEdition ? (
        <div className="bg-[#F1EADB] rounded-lg p-3 flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium text-[#1B3A3A] mb-0.5">Votre réponse</p>
            <p className="text-xs text-[#6B5B4D] leading-relaxed">{avis.reponse}</p>
          </div>
          <button
            onClick={() => setEnEdition(true)}
            className="text-xs text-[#2F6E6E] hover:text-[#1B3A3A] font-medium shrink-0"
          >
            Modifier
          </button>
        </div>
      ) : enEdition || !avis.reponse ? (
        <div className="space-y-2">
          {enEdition && (
            <textarea
              className={inputCls}
              rows={3}
              maxLength={600}
              placeholder="Remerciez le voyageur ou apportez une précision utile aux futurs visiteurs..."
              value={brouillon}
              onChange={(e) => setBrouillon(e.target.value)}
            />
          )}
          {!enEdition && !avis.reponse ? (
            <button
              onClick={() => setEnEdition(true)}
              className="text-xs font-medium text-[#2F6E6E] hover:text-[#1B3A3A] transition-colors"
            >
              Répondre à cet avis
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={enregistrer}
                disabled={!brouillon.trim()}
                className="px-3 py-1.5 rounded-lg bg-[#1B3A3A] text-[#F8F4EC] text-xs font-medium hover:bg-[#2F6E6E] transition-colors disabled:opacity-50"
              >
                Publier la réponse
              </button>
              <button
                onClick={() => { setEnEdition(false); setBrouillon(avis.reponse); }}
                className="px-3 py-1.5 rounded-lg border border-[#E4DCC8] text-xs text-[#6B5B4D] hover:bg-[#EDE4D4] transition-colors"
              >
                Annuler
              </button>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}

function AvisHote({ avisListe, onRepondre }) {
  return (
    <div className="bg-[#FFFDF8] border border-[#E4DCC8] rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-[#E4DCC8]">
        <h3 className="font-serif text-[#1B3A3A] text-base">Avis voyageurs</h3>
        <p className="text-xs text-[#8C7A66] mt-0.5">
          Votre réponse est visible publiquement sous l'avis, sur la fiche de votre logement.
        </p>
      </div>
      <div>
        {avisListe.length === 0 ? (
          <p className="text-xs text-[#B0A48F] text-center py-6">Aucun avis pour le moment.</p>
        ) : (
          avisListe.map((a) => (
            <AvisItem key={a.id} avis={a} onRepondre={onRepondre} />
          ))
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Signalements d'équipement pendant le séjour
// ---------------------------------------------------------------------------

function SignalementEquipementItem({ signalement, onMettreAJour }) {
  const [note, setNote] = useState(signalement.note);
  const statutInfo = STATUTS_SIGNALEMENT.find((s) => s.id === signalement.statut);

  function changerStatut(statut) {
    onMettreAJour(signalement.id, { statut, note });
  }

  function enregistrerNote() {
    onMettreAJour(signalement.id, { statut: signalement.statut, note });
  }

  return (
    <div className="px-4 py-3.5 border-b border-[#EDE4D4] last:border-b-0">
      <div className="flex items-start justify-between gap-3 mb-1.5">
        <div>
          <p className="text-sm font-medium text-[#1B3A3A] flex items-center gap-1.5">
            {signalement.dommageReconnu ? (
              <HeartHandshake size={13} className="text-[#8A5A2B]" />
            ) : (
              <AlertTriangle size={13} className="text-[#8A5A2B]" />
            )}
            {signalement.equipement}
            {signalement.dommageReconnu && (
              <span className="text-[10px] font-medium bg-[#F1EADB] text-[#8A5A2B] px-2 py-0.5 rounded-full">
                Dommage reconnu par le voyageur
              </span>
            )}
          </p>
          <p className="text-xs text-[#8C7A66]">{signalement.annonce} · {signalement.voyageur} · {signalement.date}</p>
        </div>
        <select
          value={signalement.statut}
          onChange={(e) => changerStatut(e.target.value)}
          className={`text-xs rounded-full border-0 px-2.5 py-1 font-medium shrink-0 ${statutInfo.cls}`}
        >
          {STATUTS_SIGNALEMENT.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
        </select>
      </div>
      <p className="text-sm text-[#4A4238] leading-relaxed mb-2">{signalement.description}</p>
      <div className="flex items-center gap-2">
        <input
          className={`${inputCls} text-xs py-1.5`}
          placeholder="Note interne (ex : technicien prévu mercredi)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          onBlur={enregistrerNote}
        />
      </div>
    </div>
  );
}

function SignalementsEquipementHote({ signalements, onMettreAJour }) {
  const nouveaux = signalements.filter((s) => s.statut === "nouveau").length;
  return (
    <div className="bg-[#FFFDF8] border border-[#E4DCC8] rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-[#E4DCC8] flex items-center justify-between">
        <div>
          <h3 className="font-serif text-[#1B3A3A] text-base">Équipements signalés</h3>
          <p className="text-xs text-[#8C7A66] mt-0.5">Déclarés par vos voyageurs pendant leur séjour.</p>
        </div>
        {nouveaux > 0 && (
          <span className="text-xs font-medium bg-[#F6DEDA] text-[#7A2E1F] px-2.5 py-1 rounded-full">
            {nouveaux} nouveau{nouveaux > 1 ? "x" : ""}
          </span>
        )}
      </div>
      <div>
        {signalements.length === 0 ? (
          <p className="text-xs text-[#B0A48F] text-center py-6">Aucun signalement pour le moment.</p>
        ) : (
          signalements.map((s) => (
            <SignalementEquipementItem key={s.id} signalement={s} onMettreAJour={onMettreAJour} />
          ))
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// État des lieux (entrée / sortie)
// ---------------------------------------------------------------------------

function ZoneEtatLieux({ nom, zone, onChange }) {
  const inputRef = useRef(null);

  function ajouterPhoto(fileList) {
    const nouvelles = Array.from(fileList)
      .filter((f) => f.type.startsWith("image/"))
      .map((f) => ({ id: `${f.name}-${Date.now()}-${Math.random()}`, url: URL.createObjectURL(f) }));
    onChange({ ...zone, photos: [...zone.photos, ...nouvelles].slice(0, 6) });
  }

  function retirerPhoto(id) {
    onChange({ ...zone, photos: zone.photos.filter((p) => p.id !== id) });
  }

  return (
    <div className="border border-[#E4DCC8] rounded-lg p-3">
      <p className="text-sm font-medium text-[#1B3A3A] mb-2">{nom}</p>

      <div className="flex gap-2 mb-2.5">
        {ETATS_POSSIBLES.map((e) => (
          <button
            key={e.id}
            onClick={() => onChange({ ...zone, etat: e.id })}
            className={`px-2.5 py-1.5 rounded-lg text-xs border transition-colors ${
              zone.etat === e.id ? e.cls : "bg-[#F8F4EC] border-[#E4DCC8] text-[#6B5B4D]"
            }`}
          >
            {e.label}
          </button>
        ))}
      </div>

      <textarea
        className={inputCls}
        rows={2}
        placeholder="Remarques éventuelles (rayures, taches, éléments manquants...)"
        value={zone.note}
        onChange={(e) => onChange({ ...zone, note: e.target.value })}
      />

      <div className="flex flex-wrap items-center gap-2 mt-2">
        {zone.photos.map((p) => (
          <div key={p.id} className="relative w-14 h-14 rounded-lg overflow-hidden border border-[#E4DCC8] group">
            <img src={p.url} alt="" className="w-full h-full object-cover" />
            <button
              onClick={() => retirerPhoto(p.id)}
              className="absolute inset-0 bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label="Retirer la photo"
            >
              <X size={13} />
            </button>
          </div>
        ))}
        <button
          onClick={() => inputRef.current?.click()}
          className="w-14 h-14 rounded-lg border-2 border-dashed border-[#D8CCB0] flex items-center justify-center text-[#8C7A66] hover:border-[#2F6E6E] hover:text-[#2F6E6E] transition-colors"
          aria-label="Ajouter une photo"
        >
          <Camera size={16} />
        </button>
        <input ref={inputRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => ajouterPhoto(e.target.files)} />
      </div>
    </div>
  );
}

function EtatDesLieuxForm({ reservation, type, etatOppose, onRetour, onEnregistrer }) {
  const [etat, setEtat] = useState(etatLieuxVide());
  const [enregistrement, setEnregistrement] = useState(false);
  const [enregistre, setEnregistre] = useState(false);

  const titre = type === "entree" ? "État des lieux d'entrée" : "État des lieux de sortie";

  function enregistrer() {
    setEnregistrement(true);
    // Ici : POST /api/etats-des-lieux { reservationId, type, ...etat }
    setTimeout(() => {
      setEnregistrement(false);
      setEnregistre(true);
      onEnregistrer?.(etat);
      setTimeout(() => setEnregistre(false), 2000);
    }, 700);
  }

  return (
    <div className="bg-[#FFFDF8] border border-[#E4DCC8] rounded-xl p-5 max-w-2xl">
      <button
        onClick={onRetour}
        className="flex items-center gap-1.5 text-sm text-[#6B5B4D] hover:text-[#1B3A3A] transition-colors mb-4"
      >
        <ChevronLeft size={15} /> Retour aux réservations
      </button>

      <h3 className="font-serif text-lg text-[#1B3A3A] mb-1">{titre}</h3>
      <p className="text-xs text-[#8C7A66] mb-4">
        {reservation.voyageur} · {fmtDate(reservation.debut)} → {fmtDate(reservation.fin)}
      </p>

      {etatOppose && (
        <div className="bg-[#F1EADB] border border-[#E4DCC8] rounded-lg px-3 py-2.5 mb-4 text-xs text-[#6B5B4D] flex items-start gap-2">
          <ShieldCheck size={14} className="text-[#8A5A2B] shrink-0 mt-0.5" />
          Un état des lieux d'entrée existe déjà pour ce séjour — comparez les zones pour repérer tout écart avant de conclure.
        </div>
      )}

      <div className="space-y-3 mb-4">
        {ZONES_ETAT_LIEUX.map((nom) => (
          <ZoneEtatLieux
            key={nom}
            nom={nom}
            zone={etat.zones[nom]}
            onChange={(z) => setEtat((e) => ({ ...e, zones: { ...e.zones, [nom]: z } }))}
          />
        ))}
      </div>

      <Field label="Note générale">
        <textarea
          className={inputCls}
          rows={3}
          placeholder="Impression d'ensemble, points à surveiller pour la suite..."
          value={etat.noteGenerale}
          onChange={(e) => setEtat({ ...etat, noteGenerale: e.target.value })}
        />
      </Field>

      <label className="flex items-center gap-2 text-sm text-[#1B3A3A] mb-4 cursor-pointer">
        <input
          type="checkbox"
          checked={etat.signeHote}
          onChange={(e) => setEtat({ ...etat, signeHote: e.target.checked })}
        />
        Je certifie cet état des lieux exact et complet.
      </label>

      <button
        onClick={enregistrer}
        disabled={enregistrement || !etat.signeHote}
        className="px-4 py-2 rounded-lg bg-[#1B3A3A] text-[#F8F4EC] text-sm font-medium hover:bg-[#2F6E6E] transition-colors disabled:opacity-50"
      >
        {enregistrement ? "Enregistrement..." : enregistre ? "Enregistré" : "Enregistrer l'état des lieux"}
      </button>
      <p className="text-[11px] text-[#B0A48F] mt-2">
        Une fois signé par vous et le voyageur, ce document sert de référence en cas de
        contestation sur le dépôt de garantie (voir la procédure de médiation).
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Inventaire du logement (achats de matériel)
// ---------------------------------------------------------------------------

function LigneAjoutInventaire({ onAjouter }) {
  const [nom, setNom] = useState("");
  const [categorie, setCategorie] = useState(CATEGORIES_INVENTAIRE[0]);
  const [quantite, setQuantite] = useState(1);
  const [prix, setPrix] = useState("");
  const [dateAchat, setDateAchat] = useState("");

  function ajouter() {
    if (!nom.trim()) return;
    onAjouter({
      id: `inv-${Date.now()}`,
      nom: nom.trim(),
      categorie,
      quantite: Number(quantite) || 1,
      prix: prix ? Number(prix) : 0,
      dateAchat: dateAchat || new Date().toISOString().slice(0, 10),
      etat: "bon",
    });
    setNom(""); setPrix(""); setQuantite(1); setDateAchat("");
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 p-3 bg-[#F8F4EC] rounded-lg border border-[#E4DCC8]">
      <input
        className={`${inputCls} sm:col-span-2`}
        placeholder="Ex : couette 140x200"
        value={nom}
        onChange={(e) => setNom(e.target.value)}
      />
      <select className={inputCls} value={categorie} onChange={(e) => setCategorie(e.target.value)}>
        {CATEGORIES_INVENTAIRE.map((c) => <option key={c} value={c}>{c}</option>)}
      </select>
      <input type="number" min={1} className={inputCls} placeholder="Qté" value={quantite} onChange={(e) => setQuantite(e.target.value)} />
      <input type="number" min={0} className={inputCls} placeholder="Prix €" value={prix} onChange={(e) => setPrix(e.target.value)} />
      <div className="flex gap-2">
        <input type="date" className={inputCls} value={dateAchat} onChange={(e) => setDateAchat(e.target.value)} />
        <button
          onClick={ajouter}
          disabled={!nom.trim()}
          className="px-3 rounded-lg bg-[#1B3A3A] text-[#F8F4EC] text-sm font-medium hover:bg-[#2F6E6E] transition-colors disabled:opacity-50 shrink-0"
        >
          <Plus size={15} />
        </button>
      </div>
    </div>
  );
}

function GestionInventaire({ annonce, items, onAjouter, onModifierEtat, onSupprimer, onRetour }) {
  const valeurTotale = items.reduce((s, i) => s + i.prix * i.quantite, 0);
  const aSurveiller = items.filter((i) => i.etat !== "bon").length;

  return (
    <div className="bg-[#FFFDF8] border border-[#E4DCC8] rounded-xl p-5 max-w-3xl">
      <button
        onClick={onRetour}
        className="flex items-center gap-1.5 text-sm text-[#6B5B4D] hover:text-[#1B3A3A] transition-colors mb-4"
      >
        <ChevronLeft size={15} /> Retour à mes annonces
      </button>

      <h3 className="font-serif text-lg text-[#1B3A3A] mb-1">Inventaire — {annonce.nom}</h3>
      <p className="text-xs text-[#8C7A66] mb-4">
        Linge, vaisselle, mobilier, électroménager... conservez la trace de vos achats pour ce logement.
      </p>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-[#F1EADB] rounded-lg p-3">
          <p className="text-[11px] uppercase tracking-wide text-[#8C7A66]">Valeur totale</p>
          <p className="font-serif text-lg text-[#1B3A3A]">{fmtEUR(valeurTotale)}</p>
        </div>
        <div className="bg-[#F1EADB] rounded-lg p-3">
          <p className="text-[11px] uppercase tracking-wide text-[#8C7A66]">Articles à surveiller</p>
          <p className="font-serif text-lg text-[#1B3A3A]">{aSurveiller}</p>
        </div>
      </div>

      <LigneAjoutInventaire onAjouter={onAjouter} />

      <div className="mt-4 divide-y divide-[#EDE4D4]">
        {items.length === 0 && (
          <p className="text-xs text-[#B0A48F] text-center py-6">Aucun article enregistré pour ce logement.</p>
        )}
        {items.map((item) => (
          <div key={item.id} className="py-3 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm text-[#1B3A3A] font-medium truncate">
                {item.nom} <span className="text-xs text-[#8C7A66] font-normal">× {item.quantite}</span>
              </p>
              <p className="text-xs text-[#8C7A66]">
                {item.categorie} · {fmtEUR(item.prix)} · acheté le {fmtDate(item.dateAchat)}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <select
                value={item.etat}
                onChange={(e) => onModifierEtat(item.id, e.target.value)}
                className={`text-xs rounded-lg border px-2 py-1.5 bg-[#F8F4EC] ${
                  item.etat === "bon" ? "border-[#2F6E6E] text-[#1B3A3A]" :
                  item.etat === "usure" ? "border-[#C97B3D] text-[#8A5A2B]" :
                  "border-[#E24B4A] text-[#7A2E1F]"
                }`}
              >
                {ETATS_POSSIBLES.map((e) => <option key={e.id} value={e.id}>{e.label}</option>)}
              </select>
              <button
                onClick={() => onSupprimer(item.id)}
                aria-label={`Supprimer ${item.nom}`}
                className="text-[#8C7A66] hover:text-[#7A2E1F]"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ToggleOption({ label, description, actif, onToggle, children }) {
  return (
    <div className="border border-[#E4DCC8] rounded-lg p-3">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-[#1B3A3A]">{label}</p>
          {description && <p className="text-xs text-[#8C7A66] mt-0.5">{description}</p>}
        </div>
        <button
          onClick={onToggle}
          role="switch"
          aria-checked={actif}
          aria-label={label}
          className={`w-10 h-6 rounded-full shrink-0 transition-colors relative ${actif ? "bg-[#2F6E6E]" : "bg-[#E4DCC8]"}`}
        >
          <span
            className={`absolute top-0.5 w-5 h-5 rounded-full bg-[#FFFDF8] transition-transform ${
              actif ? "translate-x-[18px]" : "translate-x-0.5"
            }`}
          />
        </button>
      </div>
      {actif && children && <div className="mt-3">{children}</div>}
    </div>
  );
}

function ListeEquipementsLibres({ items, onChange }) {
  const [saisie, setSaisie] = useState("");

  function ajouter() {
    const valeur = saisie.trim();
    if (!valeur || items.includes(valeur)) { setSaisie(""); return; }
    onChange([...items, valeur]);
    setSaisie("");
  }

  function retirer(item) {
    onChange(items.filter((i) => i !== item));
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <input
          className={inputCls}
          placeholder="Ex : lave-linge, fer à repasser, sèche-cheveux..."
          value={saisie}
          onChange={(e) => setSaisie(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); ajouter(); } }}
        />
        <button
          onClick={ajouter}
          className="px-3 py-2.5 rounded-lg border border-[#E4DCC8] text-sm text-[#1B3A3A] hover:bg-[#F1EADB] transition-colors shrink-0"
        >
          Ajouter
        </button>
      </div>
      {items.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {items.map((item) => (
            <span key={item} className="flex items-center gap-1.5 text-xs bg-[#F1EADB] text-[#1B3A3A] px-2.5 py-1 rounded-full">
              {item}
              <button onClick={() => retirer(item)} aria-label={`Retirer ${item}`} className="text-[#8C7A66] hover:text-[#7A2E1F]">
                <X size={11} />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Étape 4 — Tarif & équipements (fixe, s'applique à toute réservation)
// ---------------------------------------------------------------------------

function EtapeTarif({ data, setData }) {
  function toggleEquipement(id) {
    setData((d) => ({
      ...d,
      equipements: d.equipements.includes(id)
        ? d.equipements.filter((e) => e !== id)
        : [...d.equipements, id],
    }));
  }

  return (
    <div>
      <Field label="Prix par nuit" hint="Vous pourrez ajuster ce tarif à tout moment, ou définir des tarifs saisonniers plus tard.">
        <div className="flex items-center gap-2">
          <Wallet size={15} className="text-[#8C7A66]" />
          <input
            type="number" min={0} className={inputCls}
            placeholder="120"
            value={data.prix}
            onChange={(e) => setData({ ...data, prix: e.target.value })}
          />
          <span className="text-sm text-[#6B5B4D]">€ / nuit</span>
        </div>
      </Field>

      <Field
        label="Taxe de séjour"
        hint="Montant fixé par votre commune (consultez votre mairie ou collectivites-locales.gouv.fr) — collecté pour son compte, jamais soumis à la commission Escale."
      >
        <label className="flex items-center gap-2 text-sm text-[#1B3A3A] mb-2 cursor-pointer">
          <input
            type="checkbox"
            checked={data.taxeSejourActive}
            onChange={(e) => setData({ ...data, taxeSejourActive: e.target.checked })}
          />
          Collecter la taxe de séjour via Escale
        </label>
        {data.taxeSejourActive && (
          <div className="flex items-center gap-2">
            <input
              type="number" min={0} step="0.01" className={inputCls}
              placeholder="1.50"
              value={data.taxeSejourMontant}
              onChange={(e) => setData({ ...data, taxeSejourMontant: e.target.value })}
            />
            <span className="text-xs text-[#6B5B4D] shrink-0">€ / personne / nuit (les mineurs sont exonérés de plein droit)</span>
          </div>
        )}
      </Field>

      <Field label="Équipements présents dans le logement" hint="Cochez tout ce qui est disponible pour vos voyageurs.">
        <div className="space-y-4">
          {CATEGORIES_EQUIPEMENTS.map(({ categorie, items }) => (
            <div key={categorie}>
              <p className="text-xs font-medium text-[#8A5A2B] uppercase tracking-wide mb-1.5">{categorie}</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {items.map(({ id, label, icon: Icon }) => {
                  const actif = data.equipements.includes(id);
                  return (
                    <button
                      key={id}
                      onClick={() => toggleEquipement(id)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm border transition-colors text-left ${
                        actif
                          ? "bg-[#E1EEE9] border-[#2F6E6E] text-[#1B3A3A]"
                          : "bg-[#F8F4EC] border-[#E4DCC8] text-[#6B5B4D] hover:border-[#2F6E6E]"
                      }`}
                    >
                      <span className={`w-4 h-4 rounded border shrink-0 flex items-center justify-center ${
                        actif ? "bg-[#2F6E6E] border-[#2F6E6E]" : "border-[#B0A48F]"
                      }`}>
                        {actif && <Check size={11} className="text-[#F8F4EC]" />}
                      </span>
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </Field>

      <Field label="Autres équipements présents dans le logement" hint="Tout ce qui ne figure pas dans la liste ci-dessus.">
        <ListeEquipementsLibres
          items={data.equipementsAutres}
          onChange={(items) => setData({ ...data, equipementsAutres: items })}
        />
      </Field>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Options du séjour — suppléments que le voyageur choisit à la réservation
// (distinct du tarif de base et des équipements fixes, et distinct des
// politiques/règles définies par l'hôte)
// ---------------------------------------------------------------------------

function EtapeOptionsSejour({ data, setData }) {
  return (
    <div>
      <p className="text-xs text-[#8C7A66] mb-4">
        Ces options apparaissent au voyageur au moment de la réservation, qui choisit ou non de
        les activer pour son séjour — à la différence du tarif de base et des équipements, qui
        s'appliquent automatiquement à toute réservation.
      </p>
      <div className="space-y-2">
        <ToggleOption
          label="Animaux acceptés"
          description="Le voyageur peut indiquer qu'il vient avec un animal de compagnie."
          actif={data.animauxAcceptes}
          onToggle={() => setData({ ...data, animauxAcceptes: !data.animauxAcceptes })}
        >
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#6B5B4D] shrink-0">Supplément</span>
            <input
              type="number" min={0} className={inputCls}
              placeholder="20"
              value={data.fraisAnimaux}
              onChange={(e) => setData({ ...data, fraisAnimaux: e.target.value })}
            />
            <span className="text-xs text-[#6B5B4D] shrink-0">€ / séjour</span>
          </div>
        </ToggleOption>

        <ToggleOption
          label="Frais de ménage"
          description="Un forfait ménage ajouté au montant total si le voyageur réserve ce logement."
          actif={data.menagePayant}
          onToggle={() => setData({ ...data, menagePayant: !data.menagePayant })}
        >
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#6B5B4D] shrink-0">Montant</span>
            <input
              type="number" min={0} className={inputCls}
              placeholder="35"
              value={data.fraisMenage}
              onChange={(e) => setData({ ...data, fraisMenage: e.target.value })}
            />
            <span className="text-xs text-[#6B5B4D] shrink-0">€ / séjour</span>
          </div>
        </ToggleOption>

        <ToggleOption
          label="Départ tardif possible"
          description="Le voyageur peut demander un check-out plus tard que l'horaire standard."
          actif={data.departTardif}
          onToggle={() => setData({ ...data, departTardif: !data.departTardif })}
        >
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#6B5B4D] shrink-0">Heure limite</span>
            <input
              type="time" className={inputCls}
              value={data.heureDepartTardif}
              onChange={(e) => setData({ ...data, heureDepartTardif: e.target.value })}
            />
            <span className="text-xs text-[#6B5B4D] shrink-0">Supplément</span>
            <input
              type="number" min={0} className={inputCls}
              placeholder="15"
              value={data.fraisDepartTardif}
              onChange={(e) => setData({ ...data, fraisDepartTardif: e.target.value })}
            />
            <span className="text-xs text-[#6B5B4D] shrink-0">€</span>
          </div>
        </ToggleOption>

        <ToggleOption
          label="Arrivée anticipée possible"
          description="Le voyageur peut demander un check-in avant l'horaire standard."
          actif={data.arriveeAnticipee}
          onToggle={() => setData({ ...data, arriveeAnticipee: !data.arriveeAnticipee })}
        >
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#6B5B4D] shrink-0">Heure limite</span>
            <input
              type="time" className={inputCls}
              value={data.heureArriveeAnticipee}
              onChange={(e) => setData({ ...data, heureArriveeAnticipee: e.target.value })}
            />
            <span className="text-xs text-[#6B5B4D] shrink-0">Supplément</span>
            <input
              type="number" min={0} className={inputCls}
              placeholder="15"
              value={data.fraisArriveeAnticipee}
              onChange={(e) => setData({ ...data, fraisArriveeAnticipee: e.target.value })}
            />
            <span className="text-xs text-[#6B5B4D] shrink-0">€</span>
          </div>
        </ToggleOption>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Règles du séjour — politiques définies par l'hôte (non tarifaires)
// ---------------------------------------------------------------------------

function EtapeRegles({ data, setData }) {
  return (
    <div>
      <Field label="Horaires standards">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <span className="text-xs text-[#6B5B4D] block mb-1">Arrivée à partir de</span>
            <input
              type="time" className={inputCls}
              value={data.heureArriveeStandard}
              onChange={(e) => setData({ ...data, heureArriveeStandard: e.target.value })}
            />
          </div>
          <div>
            <span className="text-xs text-[#6B5B4D] block mb-1">Départ avant</span>
            <input
              type="time" className={inputCls}
              value={data.heureDepartStandard}
              onChange={(e) => setData({ ...data, heureDepartStandard: e.target.value })}
            />
          </div>
        </div>
      </Field>

      <div className="grid grid-cols-2 gap-3 mb-1">
        <Field label="Séjour minimum">
          <input
            type="number" min={1} className={inputCls}
            placeholder="2"
            value={data.sejourMin}
            onChange={(e) => setData({ ...data, sejourMin: e.target.value })}
          />
        </Field>
        <Field label="Séjour maximum">
          <input
            type="number" min={1} className={inputCls}
            placeholder="30"
            value={data.sejourMax}
            onChange={(e) => setData({ ...data, sejourMax: e.target.value })}
          />
        </Field>
      </div>

      <Field label="Réservation">
        <div className="flex gap-2">
          <button
            onClick={() => setData({ ...data, reservationInstantanee: true })}
            className={`flex-1 text-left px-3 py-2.5 rounded-lg border text-sm transition-colors ${
              data.reservationInstantanee ? "border-[#2F6E6E] bg-[#E1EEE9] text-[#1B3A3A]" : "border-[#E4DCC8] text-[#6B5B4D]"
            }`}
          >
            <span className="font-medium block">Instantanée</span>
            <span className="text-xs text-[#8C7A66]">La réservation est confirmée automatiquement.</span>
          </button>
          <button
            onClick={() => setData({ ...data, reservationInstantanee: false })}
            className={`flex-1 text-left px-3 py-2.5 rounded-lg border text-sm transition-colors ${
              !data.reservationInstantanee ? "border-[#2F6E6E] bg-[#E1EEE9] text-[#1B3A3A]" : "border-[#E4DCC8] text-[#6B5B4D]"
            }`}
          >
            <span className="font-medium block">Sur validation</span>
            <span className="text-xs text-[#8C7A66]">Vous approuvez chaque demande avant confirmation.</span>
          </button>
        </div>
      </Field>

      <Field label="Options">
        <div className="space-y-2">
          <ToggleOption
            label="Enfants et bébés bienvenus"
            description="Le logement est adapté à un séjour en famille."
            actif={data.enfantsBienvenus}
            onToggle={() => setData({ ...data, enfantsBienvenus: !data.enfantsBienvenus })}
          >
            <div className="flex flex-wrap gap-2">
              <label className="flex items-center gap-1.5 text-xs text-[#6B5B4D]">
                <input
                  type="checkbox"
                  checked={data.equipementLitParapluie}
                  onChange={(e) => setData({ ...data, equipementLitParapluie: e.target.checked })}
                />
                Lit parapluie disponible
              </label>
              <label className="flex items-center gap-1.5 text-xs text-[#6B5B4D]">
                <input
                  type="checkbox"
                  checked={data.equipementChaiseHaute}
                  onChange={(e) => setData({ ...data, equipementChaiseHaute: e.target.checked })}
                />
                Chaise haute disponible
              </label>
            </div>
          </ToggleOption>

          <ToggleOption
            label="Fumeurs acceptés"
            actif={data.fumeursAcceptes}
            onToggle={() => setData({ ...data, fumeursAcceptes: !data.fumeursAcceptes })}
          />

          <ToggleOption
            label="Événements et fêtes autorisés"
            description="Anniversaires, réunions de famille... Déconseillé en copropriété."
            actif={data.evenementsAutorises}
            onToggle={() => setData({ ...data, evenementsAutorises: !data.evenementsAutorises })}
          />
        </div>
      </Field>

      <Field label="Politique d'annulation">
        <div className="space-y-2">
          {POLITIQUES_ANNULATION.map((p) => (
            <button
              key={p.id}
              onClick={() => setData({ ...data, politiqueAnnulation: p.id })}
              className={`w-full text-left px-3 py-2.5 rounded-lg border text-sm transition-colors ${
                data.politiqueAnnulation === p.id
                  ? "border-[#2F6E6E] bg-[#E1EEE9] text-[#1B3A3A]"
                  : "border-[#E4DCC8] text-[#6B5B4D]"
              }`}
            >
              <span className="font-medium block">{p.label}</span>
              <span className="text-xs text-[#8C7A66]">{p.description}</span>
            </button>
          ))}
        </div>
      </Field>

      <Field label="Dépôt de garantie" hint="Non prélevé à la réservation : bloqué sur la carte du voyageur, restitué après le séjour sauf dommage constaté.">
        <div className="flex items-center gap-2">
          <Wallet size={15} className="text-[#8C7A66]" />
          <input
            type="number" min={0} className={inputCls}
            placeholder="200"
            value={data.caution}
            onChange={(e) => setData({ ...data, caution: e.target.value })}
          />
          <span className="text-sm text-[#6B5B4D]">€</span>
        </div>
      </Field>

      <Field label="Règlement intérieur" hint="Consignes propres au logement : bruit, poubelles, code d'accès, usage de la terrasse... Affiché au voyageur avant réservation.">
        <textarea
          className={inputCls}
          rows={5}
          maxLength={1500}
          placeholder="Ex : merci de ne pas fumer à l'intérieur, de sortir les poubelles le mardi soir, de respecter le calme après 22h..."
          value={data.reglementInterieur}
          onChange={(e) => setData({ ...data, reglementInterieur: e.target.value })}
        />
      </Field>
    </div>
  );
}

function EtapeAssurance({ data, setData }) {
  return (
    <div className="space-y-4">
      <div className="bg-[#F1EADB] border border-[#E4DCC8] rounded-lg p-4">
        <h4 className="text-sm font-medium text-[#1B3A3A] mb-2 flex items-center gap-2">
          <ShieldCheck size={15} /> Assurance & protection
        </h4>
        <p className="text-xs text-[#6B5B4D] mb-3">
          Une location saisonnière peut nécessiter une couverture spécifique selon votre statut.
          Vérifiez laquelle vous concerne avant de publier.
        </p>
        <div className="space-y-2 text-xs text-[#6B5B4D]">
          <p><span className="font-medium text-[#1B3A3A]">Résidence principale/secondaire, location occasionnelle</span> — une clause "villégiature" ajoutée à votre assurance habitation suffit généralement.</p>
          <p><span className="font-medium text-[#1B3A3A]">Bien dédié à la location saisonnière</span> — une assurance Propriétaire Non Occupant (PNO) est obligatoire.</p>
        </div>
      </div>

      <label className="flex items-start gap-2.5 text-sm text-[#1B3A3A] cursor-pointer">
        <input
          type="checkbox"
          checked={data.assuranceConfirmee}
          onChange={(e) => setData({ ...data, assuranceConfirmee: e.target.checked })}
          className="mt-0.5"
        />
        J'ai vérifié que mon assurance couvre la location de courte durée pour ce logement.
      </label>

      {!data.assuranceConfirmee && (
        <p className="text-xs text-[#8A5A2B] flex items-center gap-1.5">
          <AlertTriangle size={13} /> Cette case doit être cochée pour publier l'annonce.
        </p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Étape 8 — Récapitulatif
// ---------------------------------------------------------------------------

function EtapeRecap({ data, photos }) {
  return (
    <div>
      <div className="rounded-xl overflow-hidden border border-[#E4DCC8] bg-[#F8F4EC] mb-4">
        <div className="aspect-[16/9] bg-[#EDE4D4]">
          {photos[0] && <img src={photos[0].url} alt="" className="w-full h-full object-cover" />}
        </div>
        <div className="p-4">
          <p className="text-[11px] uppercase tracking-wide text-[#8C7A66]">{data.type || "Logement"} · {data.ville || "Ville"}</p>
          <h4 className="font-serif text-lg text-[#1B3A3A] mt-0.5">{data.titre || "Titre de l'annonce"}</h4>
          <div className="flex items-center gap-3 text-xs text-[#6B5B4D] mt-1.5">
            <span className="flex items-center gap-1"><Users size={12} /> {data.voyageurs || 0}</span>
            <span className="flex items-center gap-1"><BedDouble size={12} /> {data.chambres || 0}</span>
            <span className="flex items-center gap-1"><Bath size={12} /> {data.sallesDeBain || 0}</span>
          </div>
          <p className="text-sm text-[#1B3A3A] font-medium mt-2">{data.prix ? `${data.prix} € / nuit` : "Tarif non renseigné"}</p>

          {(data.animauxAcceptes || data.menagePayant || data.departTardif) && (
            <div className="flex flex-wrap gap-1.5 mt-2.5">
              {data.animauxAcceptes && (
                <span className="text-[11px] px-2 py-1 rounded-full bg-[#E1EEE9] text-[#1B3A3A] flex items-center gap-1">
                  <PawPrint size={11} /> Animaux acceptés{data.fraisAnimaux ? ` (+${data.fraisAnimaux} €)` : ""}
                </span>
              )}
              {data.menagePayant && (
                <span className="text-[11px] px-2 py-1 rounded-full bg-[#E1EEE9] text-[#1B3A3A] flex items-center gap-1">
                  <Sparkles size={11} /> Ménage{data.fraisMenage ? ` (+${data.fraisMenage} €)` : ""}
                </span>
              )}
              {data.departTardif && (
                <span className="text-[11px] px-2 py-1 rounded-full bg-[#E1EEE9] text-[#1B3A3A] flex items-center gap-1">
                  <Moon size={11} /> Départ tardif jusqu'à {data.heureDepartTardif}{data.fraisDepartTardif ? ` (+${data.fraisDepartTardif} €)` : ""}
                </span>
              )}
              {data.arriveeAnticipee && (
                <span className="text-[11px] px-2 py-1 rounded-full bg-[#E1EEE9] text-[#1B3A3A]">
                  Arrivée anticipée dès {data.heureArriveeAnticipee}
                </span>
              )}
              {data.enfantsBienvenus && (
                <span className="text-[11px] px-2 py-1 rounded-full bg-[#E1EEE9] text-[#1B3A3A]">
                  Enfants bienvenus
                </span>
              )}
              {data.fumeursAcceptes && (
                <span className="text-[11px] px-2 py-1 rounded-full bg-[#E1EEE9] text-[#1B3A3A]">
                  Fumeurs acceptés
                </span>
              )}
              {data.evenementsAutorises && (
                <span className="text-[11px] px-2 py-1 rounded-full bg-[#E1EEE9] text-[#1B3A3A]">
                  Événements autorisés
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-3 text-xs text-[#6B5B4D] mb-3">
        <span>
          Annulation : <span className="font-medium text-[#1B3A3A]">
            {POLITIQUES_ANNULATION.find((p) => p.id === data.politiqueAnnulation)?.label ?? "Modérée"}
          </span>
        </span>
        {data.caution && <span>Caution : <span className="font-medium text-[#1B3A3A]">{data.caution} €</span></span>}
        {(data.sejourMin || data.sejourMax) && (
          <span>
            Séjour : <span className="font-medium text-[#1B3A3A]">
              {data.sejourMin || "1"} - {data.sejourMax || "∞"} nuits
            </span>
          </span>
        )}
      </div>

      <div className="flex items-center gap-2 text-sm">
        {data.assuranceConfirmee ? (
          <span className="flex items-center gap-1.5 text-[#1B3A3A]"><Check size={14} /> Vérification assurance confirmée</span>
        ) : (
          <span className="flex items-center gap-1.5 text-[#8A5A2B]"><AlertTriangle size={14} /> Vérification assurance manquante</span>
        )}
      </div>
      <p className="text-xs text-[#8C7A66] mt-1">{photos.length} photo{photos.length !== 1 ? "s" : ""} ajoutée{photos.length !== 1 ? "s" : ""}</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Composant principal
// ---------------------------------------------------------------------------

const DEFAUTS_HOTE_VIDES = {
  equipements: [], equipementsAutres: [],
  taxeSejourActive: false, taxeSejourMontant: "",
  animauxAcceptes: false, fraisAnimaux: "",
  menagePayant: false, fraisMenage: "",
  departTardif: false, heureDepartTardif: "12:00", fraisDepartTardif: "",
  heureArriveeStandard: "15:00", heureDepartStandard: "11:00",
  sejourMin: "", sejourMax: "",
  reservationInstantanee: true,
  arriveeAnticipee: false, heureArriveeAnticipee: "13:00", fraisArriveeAnticipee: "",
  enfantsBienvenus: false, equipementLitParapluie: false, equipementChaiseHaute: false,
  fumeursAcceptes: false, evenementsAutorises: false,
  politiqueAnnulation: "moderee", caution: "",
  reglementInterieur: "",
};

function PreferencesParDefautHote({ defauts, onEnregistrer }) {
  const [data, setData] = useState(defauts);
  const [enregistre, setEnregistre] = useState(false);

  function toggleEquipement(id) {
    setData((d) => ({
      ...d,
      equipements: d.equipements.includes(id) ? d.equipements.filter((e) => e !== id) : [...d.equipements, id],
    }));
  }

  function enregistrer() {
    onEnregistrer?.(data);
    setEnregistre(true);
    setTimeout(() => setEnregistre(false), 2000);
  }

  return (
    <div className="bg-[#FFFDF8] border border-[#E4DCC8] rounded-xl p-5 max-w-2xl">
      <div className="mb-4">
        <h3 className="font-serif text-[#1B3A3A] text-base mb-1">Préférences par défaut</h3>
        <p className="text-xs text-[#8C7A66]">
          Ces réglages pré-remplissent automatiquement chaque nouvelle annonce — vous pourrez toujours
          les modifier annonce par annonce.
        </p>
      </div>

      <Field label="Équipements habituels">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {EQUIPEMENTS.map(({ id, label, icon: Icon }) => {
            const actif = data.equipements.includes(id);
            return (
              <button
                key={id}
                onClick={() => toggleEquipement(id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm border transition-colors ${
                  actif ? "bg-[#E1EEE9] border-[#2F6E6E] text-[#1B3A3A]" : "bg-[#F8F4EC] border-[#E4DCC8] text-[#6B5B4D] hover:border-[#2F6E6E]"
                }`}
              >
                <Icon size={14} /> {label}
              </button>
            );
          })}
        </div>
      </Field>

      <Field label="Autres équipements habituels">
        <ListeEquipementsLibres
          items={data.equipementsAutres}
          onChange={(items) => setData({ ...data, equipementsAutres: items })}
        />
      </Field>

      <Field label="Horaires standards habituels">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <span className="text-xs text-[#6B5B4D] block mb-1">Arrivée à partir de</span>
            <input type="time" className={inputCls} value={data.heureArriveeStandard} onChange={(e) => setData({ ...data, heureArriveeStandard: e.target.value })} />
          </div>
          <div>
            <span className="text-xs text-[#6B5B4D] block mb-1">Départ avant</span>
            <input type="time" className={inputCls} value={data.heureDepartStandard} onChange={(e) => setData({ ...data, heureDepartStandard: e.target.value })} />
          </div>
        </div>
      </Field>

      <Field label="Options habituelles">
        <div className="space-y-2">
          <ToggleOption label="Animaux acceptés" actif={data.animauxAcceptes} onToggle={() => setData({ ...data, animauxAcceptes: !data.animauxAcceptes })}>
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#6B5B4D] shrink-0">Supplément</span>
              <input type="number" min={0} className={inputCls} placeholder="20" value={data.fraisAnimaux} onChange={(e) => setData({ ...data, fraisAnimaux: e.target.value })} />
              <span className="text-xs text-[#6B5B4D] shrink-0">€ / séjour</span>
            </div>
          </ToggleOption>
          <ToggleOption label="Frais de ménage" actif={data.menagePayant} onToggle={() => setData({ ...data, menagePayant: !data.menagePayant })}>
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#6B5B4D] shrink-0">Montant</span>
              <input type="number" min={0} className={inputCls} placeholder="35" value={data.fraisMenage} onChange={(e) => setData({ ...data, fraisMenage: e.target.value })} />
              <span className="text-xs text-[#6B5B4D] shrink-0">€ / séjour</span>
            </div>
          </ToggleOption>
          <ToggleOption label="Départ tardif possible" actif={data.departTardif} onToggle={() => setData({ ...data, departTardif: !data.departTardif })}>
            <div className="flex items-center gap-2">
              <input type="time" className={inputCls} value={data.heureDepartTardif} onChange={(e) => setData({ ...data, heureDepartTardif: e.target.value })} />
              <input type="number" min={0} className={inputCls} placeholder="15" value={data.fraisDepartTardif} onChange={(e) => setData({ ...data, fraisDepartTardif: e.target.value })} />
              <span className="text-xs text-[#6B5B4D] shrink-0">€</span>
            </div>
          </ToggleOption>
          <ToggleOption label="Arrivée anticipée possible" actif={data.arriveeAnticipee} onToggle={() => setData({ ...data, arriveeAnticipee: !data.arriveeAnticipee })}>
            <div className="flex items-center gap-2">
              <input type="time" className={inputCls} value={data.heureArriveeAnticipee} onChange={(e) => setData({ ...data, heureArriveeAnticipee: e.target.value })} />
              <input type="number" min={0} className={inputCls} placeholder="15" value={data.fraisArriveeAnticipee} onChange={(e) => setData({ ...data, fraisArriveeAnticipee: e.target.value })} />
              <span className="text-xs text-[#6B5B4D] shrink-0">€</span>
            </div>
          </ToggleOption>
          <ToggleOption label="Enfants et bébés bienvenus" actif={data.enfantsBienvenus} onToggle={() => setData({ ...data, enfantsBienvenus: !data.enfantsBienvenus })} />
          <ToggleOption label="Fumeurs acceptés" actif={data.fumeursAcceptes} onToggle={() => setData({ ...data, fumeursAcceptes: !data.fumeursAcceptes })} />
          <ToggleOption label="Événements et fêtes autorisés" actif={data.evenementsAutorises} onToggle={() => setData({ ...data, evenementsAutorises: !data.evenementsAutorises })} />
        </div>
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Séjour minimum">
          <input type="number" min={1} className={inputCls} placeholder="2" value={data.sejourMin} onChange={(e) => setData({ ...data, sejourMin: e.target.value })} />
        </Field>
        <Field label="Séjour maximum">
          <input type="number" min={1} className={inputCls} placeholder="30" value={data.sejourMax} onChange={(e) => setData({ ...data, sejourMax: e.target.value })} />
        </Field>
      </div>

      <Field label="Politique d'annulation par défaut">
        <select
          className={inputCls}
          value={data.politiqueAnnulation}
          onChange={(e) => setData({ ...data, politiqueAnnulation: e.target.value })}
        >
          {POLITIQUES_ANNULATION.map((p) => (
            <option key={p.id} value={p.id}>{p.label}</option>
          ))}
        </select>
      </Field>

      <Field label="Dépôt de garantie par défaut">
        <div className="flex items-center gap-2">
          <Wallet size={15} className="text-[#8C7A66]" />
          <input type="number" min={0} className={inputCls} placeholder="200" value={data.caution} onChange={(e) => setData({ ...data, caution: e.target.value })} />
          <span className="text-sm text-[#6B5B4D]">€</span>
        </div>
      </Field>

      <button
        onClick={enregistrer}
        className="px-4 py-2 rounded-lg bg-[#1B3A3A] text-[#F8F4EC] text-sm font-medium hover:bg-[#2F6E6E] transition-colors"
      >
        {enregistre ? "Enregistré" : "Enregistrer mes préférences"}
      </button>
    </div>
  );
}

function PublierAnnonce({ onPublier, defauts = DEFAUTS_HOTE_VIDES }) {
  const [etape, setEtape] = useState(0);
  const [publication, setPublication] = useState(false);
  const [publie, setPublie] = useState(false);
  const [erreurPublication, setErreurPublication] = useState("");
  const [data, setData] = useState({
    titre: "", type: "", voyageurs: 2, chambres: 1, sallesDeBain: 1, description: "",
    adresse: "", ville: "", codePostal: "", complement: "",
    prix: "",
    assuranceConfirmee: false,
    ...defauts,
  });
  const [photos, setPhotos] = useState([]);

  const derniereEtape = etape === ETAPES.length - 1;

  function peutAvancer() {
    if (etape === 0) return data.titre.trim() && data.type;
    if (etape === 2) return photos.length >= 1;
    if (etape === 6) return data.assuranceConfirmee;
    return true;
  }

  async function publier() {
    setPublication(true);
    setErreurPublication("");
    try {
      const formData = new FormData();
      const champsTexte = {
        titre: data.titre, type: data.type, description: data.description,
        voyageurs: data.voyageurs, chambres: data.chambres, sallesDeBain: data.sallesDeBain,
        adresse: data.adresse, ville: data.ville, codePostal: data.codePostal, complement: data.complement,
        prix: data.prix,
        taxeSejourActive: data.taxeSejourActive, taxeSejourMontant: data.taxeSejourMontant,
        animauxAcceptes: data.animauxAcceptes, fraisAnimaux: data.fraisAnimaux,
        menagePayant: data.menagePayant, fraisMenage: data.fraisMenage,
        heureArriveeStandard: data.heureArriveeStandard, heureDepartStandard: data.heureDepartStandard,
        reglementInterieur: data.reglementInterieur,
        departTardif: data.departTardif, heureDepartTardif: data.heureDepartTardif, fraisDepartTardif: data.fraisDepartTardif,
        sejourMin: data.sejourMin, sejourMax: data.sejourMax,
        reservationInstantanee: data.reservationInstantanee,
        arriveeAnticipee: data.arriveeAnticipee, heureArriveeAnticipee: data.heureArriveeAnticipee, fraisArriveeAnticipee: data.fraisArriveeAnticipee,
        enfantsBienvenus: data.enfantsBienvenus, equipementLitParapluie: data.equipementLitParapluie, equipementChaiseHaute: data.equipementChaiseHaute,
        fumeursAcceptes: data.fumeursAcceptes, evenementsAutorises: data.evenementsAutorises,
        politiqueAnnulation: data.politiqueAnnulation, caution: data.caution,
        assuranceConfirmee: data.assuranceConfirmee,
      };
      for (const [cle, valeur] of Object.entries(champsTexte)) {
        formData.append(cle, valeur === null || valeur === undefined ? "" : String(valeur));
      }
      formData.append("equipements", JSON.stringify(data.equipements ?? []));
      formData.append("equipementsAutres", JSON.stringify(data.equipementsAutres ?? []));
      photos.forEach((p) => { if (p.file) formData.append("photos", p.file); });

      const res = await fetch("/api/listings", { method: "POST", body: formData });
      if (!res.ok) {
        const reponse = await res.json().catch(() => ({}));
        setErreurPublication(reponse.error || "Impossible de publier l'annonce. Réessayez.");
        return;
      }

      setPublie(true);
      onPublier?.({ ...data, photos });
    } catch {
      setErreurPublication("Une erreur est survenue. Vérifiez votre connexion et réessayez.");
    } finally {
      setPublication(false);
    }
  }

  if (publie) {
    return (
      <div className="bg-[#FFFDF8] border border-[#E4DCC8] rounded-xl p-8 text-center max-w-xl mx-auto">
        <div className="w-12 h-12 rounded-full bg-[#E1EEE9] flex items-center justify-center mx-auto mb-3">
          <Check size={20} className="text-[#1B3A3A]" />
        </div>
        <h3 className="font-serif text-lg text-[#1B3A3A] mb-1">Annonce publiée</h3>
        <p className="text-sm text-[#6B5B4D]">
          "{data.titre}" est maintenant visible dans les résultats de recherche Escale.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-[#FFFDF8] border border-[#E4DCC8] rounded-xl overflow-hidden max-w-2xl mx-auto">
      <div className="px-5 pt-5">
        <div className="flex items-center gap-2 mb-5 overflow-x-auto">
          {ETAPES.map((label, i) => (
            <React.Fragment key={label}>
              <StepDot index={i} actif={i === etape} complete={i < etape} onClick={() => i < etape && setEtape(i)} />
              {i < ETAPES.length - 1 && <div className="flex-1 h-px bg-[#E4DCC8] min-w-[16px]" />}
            </React.Fragment>
          ))}
        </div>
        <p className="text-[11px] uppercase tracking-wide text-[#8C7A66] mb-1">Étape {etape + 1} / {ETAPES.length}</p>
        <h3 className="font-serif text-lg text-[#1B3A3A] mb-1 flex items-center gap-2">
          <Home size={16} /> {ETAPES[etape]}
        </h3>
        {etape === 3 && (
          <p className="text-xs text-[#8C7A66] mb-3">Pré-rempli à partir de vos préférences par défaut — modifiable pour cette annonce.</p>
        )}
      </div>

      <div className="px-5 pb-2 max-h-[440px] overflow-y-auto">
        {etape === 0 && <EtapeDescription data={data} setData={setData} />}
        {etape === 1 && <EtapeLocalisation data={data} setData={setData} />}
        {etape === 2 && <EtapePhotos photos={photos} setPhotos={setPhotos} />}
        {etape === 3 && <EtapeTarif data={data} setData={setData} />}
        {etape === 4 && <EtapeOptionsSejour data={data} setData={setData} />}
        {etape === 5 && <EtapeRegles data={data} setData={setData} />}
        {etape === 6 && <EtapeAssurance data={data} setData={setData} />}
        {etape === 7 && <EtapeRecap data={data} photos={photos} />}
      </div>

      <div className="px-5 pb-2">
        {erreurPublication && (
          <p className="text-xs text-[#7A2E1F] bg-[#F6DEDA] rounded-lg px-3 py-2 mb-2">{erreurPublication}</p>
        )}
      </div>

      <div className="px-5 py-4 border-t border-[#E4DCC8] flex items-center justify-between">
        <button
          onClick={() => setEtape((e) => Math.max(0, e - 1))}
          disabled={etape === 0}
          className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm text-[#6B5B4D] hover:bg-[#EDE4D4] transition-colors disabled:opacity-0"
        >
          <ChevronLeft size={15} /> Précédent
        </button>

        {derniereEtape ? (
          <button
            onClick={publier}
            disabled={publication || !data.assuranceConfirmee}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#C97B3D] text-[#F8F4EC] text-sm font-medium hover:bg-[#8A5A2B] transition-colors disabled:opacity-50"
          >
            {publication ? "Publication..." : "Publier l'annonce"}
          </button>
        ) : (
          <button
            onClick={() => peutAvancer() && setEtape((e) => Math.min(ETAPES.length - 1, e + 1))}
            disabled={!peutAvancer()}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#1B3A3A] text-[#F8F4EC] text-sm font-medium hover:bg-[#2F6E6E] transition-colors disabled:opacity-50"
          >
            Suivant <ChevronRight size={15} />
          </button>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Fil de discussion par réservation (hôte) — appelle les vraies routes
// /api/messages une fois déployé ; sans effet visible dans cet aperçu
// autonome, faute de backend réel derrière lui.
// ---------------------------------------------------------------------------

function fmtHeureMessage(d) {
  return new Date(d).toLocaleString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

function FilDiscussionHote({ reservationId, interlocuteurLabel }) {
  const [messages, setMessages] = useState([]);
  const [monId, setMonId] = useState(null);
  const [brouillon, setBrouillon] = useState("");
  const [chargement, setChargement] = useState(true);
  const [envoi, setEnvoi] = useState(false);
  const [avertissement, setAvertissement] = useState("");
  const [erreur, setErreur] = useState("");

  useEffect(() => {
    let annule = false;
    fetch(`/api/messages?reservationId=${reservationId}`)
      .then((r) => r.json())
      .then((data) => {
        if (annule) return;
        setMessages(data.messages ?? []);
        setMonId(data.currentUserId ?? null);
      })
      .catch(() => {})
      .finally(() => { if (!annule) setChargement(false); });
    return () => { annule = true; };
  }, [reservationId]);

  async function envoyer() {
    if (!brouillon.trim()) return;
    setEnvoi(true);
    setErreur("");
    setAvertissement("");
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reservationId, content: brouillon.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErreur(data.error || "Impossible d'envoyer le message.");
        return;
      }
      setMessages((prev) => [...prev, data.message]);
      if (data.avertissement) setAvertissement(data.avertissement);
      setBrouillon("");
    } catch {
      setErreur("Une erreur est survenue. Réessayez.");
    } finally {
      setEnvoi(false);
    }
  }

  return (
    <div className="bg-[#F8F4EC] border border-[#E4DCC8] rounded-lg overflow-hidden">
      <div className="max-h-56 overflow-y-auto px-3 py-2 space-y-2">
        {chargement ? (
          <p className="text-xs text-[#B0A48F] text-center py-3">Chargement...</p>
        ) : messages.length === 0 ? (
          <p className="text-xs text-[#B0A48F] text-center py-3">Aucun message pour l'instant.</p>
        ) : (
          messages.map((m) => (
            <div key={m.id} className={`flex ${m.sender_id === monId ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] px-3 py-1.5 rounded-2xl text-xs ${
                m.sender_id === monId ? "bg-[#1B3A3A] text-[#F8F4EC] rounded-br-sm" : "bg-[#EDE4D4] text-[#1B3A3A] rounded-bl-sm"
              }`}>
                <p>{m.content}</p>
                <p className={`text-[10px] mt-0.5 ${m.sender_id === monId ? "text-[#D8CCB0]" : "text-[#8C7A66]"}`}>
                  {fmtHeureMessage(m.created_at)}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
      {avertissement && (
        <div className="flex items-start gap-1.5 px-3 py-2 bg-[#F6E4CE] text-[#8A5A2B] text-[10px] border-t border-[#E4DCC8]">
          <AlertTriangle size={12} className="shrink-0 mt-0.5" /> {avertissement}
        </div>
      )}
      {erreur && <p className="text-xs text-[#7A2E1F] px-3 pt-2">{erreur}</p>}
      <div className="flex items-center gap-2 p-2 border-t border-[#E4DCC8]">
        <input
          value={brouillon}
          onChange={(e) => setBrouillon(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") envoyer(); }}
          placeholder={`Écrire à ${interlocuteurLabel}...`}
          maxLength={2000}
          className={`${inputCls} text-xs py-2`}
        />
        <button
          onClick={envoyer}
          disabled={envoi || !brouillon.trim()}
          className="w-8 h-8 rounded-lg bg-[#2F6E6E] flex items-center justify-center shrink-0 hover:bg-[#1B3A3A] transition-colors disabled:opacity-50"
          aria-label="Envoyer"
        >
          <Send size={13} className="text-[#F8F4EC]" />
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Espace hôte
// ---------------------------------------------------------------------------

function EspaceHote({ cgvAcceptee = true, mesAnnoncesReelles = null, mesReservationsReelles = null, mesAvisReels = null, mesSignalementsReels = null, mesCoHotesReels = null, monPartenaireReel = null, mesDocumentsReels = null, mesRevenusMensuelsReels = null }) {
  // Si la page serveur a fourni de vraies réservations (même une liste
  // vide), le revenu du mois est recalculé dessus ; sinon on retombe sur
  // l'exemple de démonstration.
  const revenuMois = mesReservationsReelles !== null
    ? mesReservationsReelles
        .filter((r) => r.statut !== "annulee" && r.statut !== "remboursee")
        .reduce((somme, r) => somme + r.montant, 0)
    : revenusMensuels[revenusMensuels.length - 1].montant;
  // Si la page serveur a fourni de vraies annonces (même une liste vide),
  // on les utilise ; sinon (prototype autonome, sans backend) on retombe
  // sur les exemples de démonstration.
  const annonces = mesAnnoncesReelles !== null ? mesAnnoncesReelles : mesAnnoncesHote;
  const reservations = mesReservationsReelles !== null ? mesReservationsReelles : reservationsHote;
  const revenusGraphique = mesRevenusMensuelsReels !== null ? mesRevenusMensuelsReels : revenusMensuels;
  const [vue, setVue] = useState("accueil"); // accueil | publier | preferences | photos | etat_lieux | inventaire | voyageurs | formule | revenus
  // Fiche voyageur ouverte depuis le tableau des réservations.
  const [voyageurSelectionne, setVoyageurSelectionne] = useState(null);
  const [defautsHote, setDefautsHote] = useState(DEFAUTS_HOTE_VIDES);
  const [annonceSelectionnee, setAnnonceSelectionnee] = useState(null);
  const [avisListe, setAvisListe] = useState(mesAvisReels !== null ? mesAvisReels : avisHote);
  const [reservationEtatLieux, setReservationEtatLieux] = useState(null);
  const [conversationOuvertePour, setConversationOuvertePour] = useState(null);
  const [typeEtatLieux, setTypeEtatLieux] = useState("entree");
  const [etatsEnregistres, setEtatsEnregistres] = useState({}); // { [reservationId]: { entree: bool, sortie: bool } }
  const [inventaireParAnnonce, setInventaireParAnnonce] = useState(inventaireInitial);
  const [signalements, setSignalements] = useState(mesSignalementsReels !== null ? mesSignalementsReels : signalementsEquipementHote);
  const [coHotesParAnnonce, setCoHotesParAnnonce] = useState(mesCoHotesReels !== null ? mesCoHotesReels : coHotesInitial);
  const [partenaireRattache, setPartenaireRattache] = useState(monPartenaireReel ? monPartenaireReel.nom : null);
  const [grantId, setGrantId] = useState(monPartenaireReel ? monPartenaireReel.grantId : null);
  const [documentsHote, setDocumentsHote] = useState(mesDocumentsReels ?? {});

  async function uploaderDocument(documentType, fichier) {
    setDocumentsHote((prev) => ({ ...prev, [documentType]: { status: "en_attente" } }));
    // Route déjà codée côté serveur : POST /api/host/documents
    try {
      const formData = new FormData();
      formData.append("documentType", documentType);
      formData.append("file", fichier);
      await fetch("/api/host/documents", { method: "POST", body: formData });
    } catch {
      // L'échec réseau laisse le document en "en_attente" côté affichage ;
      // un rechargement de page reflétera l'état réel côté serveur.
    }
  }

  function inviterCoHote(annonceId, { email, niveau }) {
    const nouveau = { id: `ch-${Date.now()}`, email, nom: "", niveau, statut: "invite" };
    setCoHotesParAnnonce((prev) => ({ ...prev, [annonceId]: [...(prev[annonceId] ?? []), nouveau] }));
    // Route déjà codée côté serveur : POST /api/co-hosts
    fetch("/api/co-hosts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ listingId: annonceId, email, level: niveau }),
    }).catch(() => {});
  }

  function changerNiveauCoHote(coHoteId, niveau) {
    setCoHotesParAnnonce((prev) => {
      const copie = { ...prev };
      for (const id of Object.keys(copie)) {
        copie[id] = copie[id].map((c) => (c.id === coHoteId ? { ...c, niveau } : c));
      }
      return copie;
    });
    fetch(`/api/co-hosts/${coHoteId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ level: niveau }),
    }).catch(() => {});
  }

  function revoquerCoHote(coHoteId) {
    setCoHotesParAnnonce((prev) => {
      const copie = { ...prev };
      for (const id of Object.keys(copie)) {
        copie[id] = copie[id].map((c) => (c.id === coHoteId ? { ...c, statut: "revoque" } : c));
      }
      return copie;
    });
    fetch(`/api/co-hosts/${coHoteId}`, { method: "DELETE" }).catch(() => {});
  }

  function mettreAJourSignalement(id, { statut, note }) {
    setSignalements((liste) => liste.map((s) => (s.id === id ? { ...s, statut, note } : s)));
    // Route déjà codée côté serveur : app/api/equipment-reports/[id]/route.ts
    fetch(`/api/equipment-reports/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: statut, hostNote: note }),
    }).catch(() => {});
  }

  function repondreAvis(id, reponse) {
    // Ici : PATCH /api/reviews/:id { hostReply: reponse } — voir migration à ajouter.
    setAvisListe((liste) => liste.map((a) => (a.id === id ? { ...a, reponse } : a)));
  }

  function ouvrirEtatLieux(reservation, type) {
    setReservationEtatLieux(reservation);
    setTypeEtatLieux(type);
    setVue("etat_lieux");
  }

  function ajouterArticleInventaire(item) {
    setInventaireParAnnonce((prev) => ({
      ...prev,
      [annonceSelectionnee.id]: [...(prev[annonceSelectionnee.id] ?? []), item],
    }));
  }

  function modifierEtatArticle(id, etat) {
    setInventaireParAnnonce((prev) => ({
      ...prev,
      [annonceSelectionnee.id]: (prev[annonceSelectionnee.id] ?? []).map((i) => (i.id === id ? { ...i, etat } : i)),
    }));
  }

  function supprimerArticleInventaire(id) {
    setInventaireParAnnonce((prev) => ({
      ...prev,
      [annonceSelectionnee.id]: (prev[annonceSelectionnee.id] ?? []).filter((i) => i.id !== id),
    }));
  }

  function marquerEtatLieuxEnregistre() {
    setEtatsEnregistres((prev) => ({
      ...prev,
      [reservationEtatLieux.id]: { ...prev[reservationEtatLieux.id], [typeEtatLieux]: true },
    }));
  }

  if (vue === "publier") {
    return (
      <div>
        <button
          onClick={() => setVue("accueil")}
          className="flex items-center gap-1.5 text-sm text-[#6B5B4D] hover:text-[#1B3A3A] transition-colors mb-4"
        >
          <ChevronLeft size={15} /> Retour à l'espace hôte
        </button>
        <PublierAnnonce onPublier={() => {}} defauts={defautsHote} />
      </div>
    );
  }

  if (vue === "preferences") {
    return (
      <div>
        <button
          onClick={() => setVue("accueil")}
          className="flex items-center gap-1.5 text-sm text-[#6B5B4D] hover:text-[#1B3A3A] transition-colors mb-4"
        >
          <ChevronLeft size={15} /> Retour à l'espace hôte
        </button>
        <PreferencesParDefautHote defauts={defautsHote} onEnregistrer={setDefautsHote} />
      </div>
    );
  }

  // Gestion d'annonces conditionnée à l'acceptation des CGV en vigueur.
  // La consultation des réservations et la messagerie restent ouvertes : un
  // voyageur en cours de séjour ne doit pas se retrouver sans interlocuteur.
  const VUES_SOUMISES_AUX_CGV = ["publier", "preferences", "photos", "inventaire", "co_hotes"];
  if (!cgvAcceptee && VUES_SOUMISES_AUX_CGV.includes(vue)) {
    return (
      <div className="space-y-5">
        <button
          onClick={() => setVue("accueil")}
          className="flex items-center gap-1.5 text-sm text-[#6B5B4D] hover:text-[#1B3A3A] transition-colors"
        >
          <ChevronLeft size={15} /> Retour au tableau de bord
        </button>
        <div>
          <h2 className="font-serif text-2xl text-[#1B3A3A] mb-1">
            Acceptation des conditions requise
          </h2>
          <p className="text-sm text-[#6B5B4D]">
            La gestion de vos annonces est suspendue jusqu'à l'acceptation de la version
            en vigueur des conditions générales de vente. Vos annonces publiées et vos
            réservations en cours ne sont pas affectées.
          </p>
        </div>
        <AcceptationDocument
          type="cgv_hotes"
          intitule="J'ai lu et j'accepte les Conditions Générales de Vente"
          onAccepte={() => window.location.reload()}
        />
      </div>
    );
  }

  if (vue === "revenus") {
    return <RevenusHote onRetour={() => setVue("accueil")} />;
  }

  if (vue === "formule") {
    return <ChoixFormule onRetour={() => setVue("accueil")} />;
  }

  if (vue === "voyageurs") {
    return (
      <MesVoyageurs
        guestIdInitial={voyageurSelectionne}
        onRetour={() => {
          setVoyageurSelectionne(null);
          setVue("accueil");
        }}
      />
    );
  }

  if (vue === "photos" && annonceSelectionnee) {
    return <GererPhotosAnnonce annonce={annonceSelectionnee} onRetour={() => setVue("accueil")} />;
  }

  if (vue === "etat_lieux" && reservationEtatLieux) {
    const dejaEnregistres = etatsEnregistres[reservationEtatLieux.id] ?? {};
    return (
      <EtatDesLieuxForm
        reservation={reservationEtatLieux}
        type={typeEtatLieux}
        etatOppose={typeEtatLieux === "sortie" && dejaEnregistres.entree}
        onRetour={() => setVue("accueil")}
        onEnregistrer={marquerEtatLieuxEnregistre}
      />
    );
  }

  if (vue === "inventaire" && annonceSelectionnee) {
    return (
      <GestionInventaire
        annonce={annonceSelectionnee}
        items={inventaireParAnnonce[annonceSelectionnee.id] ?? []}
        onAjouter={ajouterArticleInventaire}
        onModifierEtat={modifierEtatArticle}
        onSupprimer={supprimerArticleInventaire}
        onRetour={() => setVue("accueil")}
      />
    );
  }

  if (vue === "co_hotes" && annonceSelectionnee) {
    return (
      <GererCoHotes
        annonce={annonceSelectionnee}
        coHotes={coHotesParAnnonce[annonceSelectionnee.id] ?? []}
        onInviter={inviterCoHote}
        onChangerNiveau={changerNiveauCoHote}
        onRevoquer={revoquerCoHote}
        onRetour={() => setVue("accueil")}
      />
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 flex-1">
          <MetricCard icon={Wallet} label="Revenus (août)" value={fmtEUR(revenuMois)} sub="+12% vs juillet" />
          <MetricCard icon={Calendar} label="Réservations en cours" value="2" sub="1 en attente" />
          <MetricCard icon={Users} label="Taux d'occupation" value="68%" sub="ce mois-ci" />
          <MetricCard icon={Star} label="Note moyenne" value="4,8 / 5" sub="34 avis" />
        </div>
      </div>

      {!cgvAcceptee && (
        <div className="border border-[#C97B3D] bg-[#F1EADB] rounded-xl p-4 flex items-start gap-2.5">
          <ShieldAlert size={16} className="text-[#C97B3D] mt-0.5 shrink-0" />
          <div className="text-sm text-[#8A5A2B] leading-relaxed">
            <p className="font-medium mb-0.5">Conditions générales de vente à accepter</p>
            <p className="text-xs">
              La publication et la modification de vos annonces sont suspendues jusqu'à
              votre acceptation.{" "}
              <button
                onClick={() => setVue("publier")}
                className="underline font-medium hover:text-[#1B3A3A]"
              >
                Lire et accepter
              </button>
            </p>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => setVue("publier")}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-[#1B3A3A] text-[#F8F4EC] text-sm font-medium hover:bg-[#2F6E6E] transition-colors"
        >
          <Plus size={15} /> Publier une annonce
        </button>
        <button
          onClick={() => setVue("preferences")}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg border border-[#E4DCC8] text-[#6B5B4D] text-sm font-medium hover:bg-[#EDE4D4] transition-colors"
        >
          <ShieldCheck size={15} /> Préférences par défaut
        </button>
        <button
          onClick={() => setVue("revenus")}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg border border-[#E4DCC8] text-[#6B5B4D] text-sm font-medium hover:bg-[#EDE4D4] transition-colors"
        >
          <Receipt size={15} /> Revenus et factures
        </button>
        <button
          onClick={() => setVue("voyageurs")}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg border border-[#E4DCC8] text-[#6B5B4D] text-sm font-medium hover:bg-[#EDE4D4] transition-colors"
        >
          <Users size={15} /> Mes voyageurs
        </button>
        <button
          onClick={() => setVue("formule")}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg border border-[#E4DCC8] text-[#6B5B4D] text-sm font-medium hover:bg-[#EDE4D4] transition-colors"
        >
          <Percent size={15} /> Ma formule
        </button>
      </div>

      <PartenaireConciergerie
        partenaireRattache={partenaireRattache}
        grantId={grantId}
        onRattacher={(code) => { setPartenaireRattache(`Conciergerie (${code})`); setGrantId(`grant-${Date.now()}`); }}
        onRevoquer={() => { setPartenaireRattache(null); setGrantId(null); }}
      />

      <DocumentsRequis documents={documentsHote} onUpload={uploaderDocument} />

      <div className="bg-[#FFFDF8] border border-[#E4DCC8] rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-[#E4DCC8]">
          <h3 className="font-serif text-[#1B3A3A] text-base">Mes annonces</h3>
        </div>
        <div className="divide-y divide-[#EDE4D4]">
          {annonces.length === 0 ? (
            <p className="text-xs text-[#B0A48F] text-center py-6">
              Vous n'avez pas encore publié d'annonce.
            </p>
          ) : (
            annonces.map((a) => (
            <div key={a.id} className="px-4 py-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-11 h-11 rounded-lg bg-[#EDE4D4] flex items-center justify-center shrink-0">
                  <Camera size={16} className="text-[#B0A48F]" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-[#1B3A3A] font-medium truncate">{a.nom}</p>
                  <p className="text-xs text-[#8C7A66]">{a.ville} · {a.nombrePhotos} photo{a.nombrePhotos !== 1 ? "s" : ""}</p>
                </div>
              </div>
              <div className="flex items-center gap-2.5 shrink-0">
                <Badge statut={a.statut} />
                <button
                  onClick={() => { setAnnonceSelectionnee(a); setVue("photos"); }}
                  className="text-xs font-medium text-[#2F6E6E] hover:text-[#1B3A3A] transition-colors"
                >
                  Gérer les photos
                </button>
                <button
                  onClick={() => { setAnnonceSelectionnee(a); setVue("inventaire"); }}
                  className="text-xs font-medium text-[#2F6E6E] hover:text-[#1B3A3A] transition-colors"
                >
                  Inventaire
                </button>
                <button
                  onClick={() => { setAnnonceSelectionnee(a); setVue("co_hotes"); }}
                  className="text-xs font-medium text-[#2F6E6E] hover:text-[#1B3A3A] transition-colors"
                >
                  Co-hôtes
                </button>
              </div>
            </div>
            ))
          )}
        </div>
      </div>

      <SignalementsEquipementHote signalements={signalements} onMettreAJour={mettreAJourSignalement} />

      <AvisHote avisListe={avisListe} onRepondre={repondreAvis} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <CalendrierReservations reservations={mesReservationsReelles} />
        <GraphiqueRevenus data={revenusGraphique} titre="Revenus des 6 derniers mois" />
      </div>

      <SyncCalendarAirbnb />

      <div className="bg-[#FFFDF8] border border-[#E4DCC8] rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-[#E4DCC8]">
          <h3 className="font-serif text-[#1B3A3A] text-base">Réservations</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wide text-[#8C7A66]">
                <th className="px-4 py-2 font-medium">Voyageur</th>
                <th className="px-4 py-2 font-medium">Séjour</th>
                <th className="px-4 py-2 font-medium">Montant</th>
                <th className="px-4 py-2 font-medium">Statut</th>
                <th className="px-4 py-2 font-medium">État des lieux</th>
                <th className="px-4 py-2 font-medium">Message</th>
              </tr>
            </thead>
            <tbody>
              {reservations.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-[#B0A48F] text-sm">
                    Aucune réservation pour le moment.
                  </td>
                </tr>
              )}
              {reservations.map((r) => {
                const enregistres = etatsEnregistres[r.id] ?? {};
                const discussionOuverte = conversationOuvertePour === r.id;
                return (
                  <React.Fragment key={r.id}>
                    <tr className="border-t border-[#EDE4D4]">
                      <td className="px-4 py-2.5 text-[#1B3A3A] font-medium">
                        {r.guestId ? (
                          <button
                            onClick={() => {
                              setVoyageurSelectionne(r.guestId);
                              setVue("voyageurs");
                            }}
                            className="hover:text-[#2F6E6E] transition-colors underline decoration-dotted underline-offset-2"
                            title="Voir la fiche de ce voyageur"
                          >
                            {r.voyageur}
                          </button>
                        ) : (
                          r.voyageur
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-[#6B5B4D]">{fmtDate(r.debut)} → {fmtDate(r.fin)}</td>
                      <td className="px-4 py-2.5 text-[#1B3A3A]">{fmtEUR(r.montant)}</td>
                      <td className="px-4 py-2.5"><Badge statut={r.statut} /></td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2.5">
                          <button
                            onClick={() => ouvrirEtatLieux(r, "entree")}
                            className={`text-xs font-medium transition-colors ${
                              enregistres.entree ? "text-[#1B3A3A]" : "text-[#2F6E6E] hover:text-[#1B3A3A]"
                            }`}
                          >
                            {enregistres.entree ? "✓ Entrée" : "Entrée"}
                          </button>
                          <button
                            onClick={() => ouvrirEtatLieux(r, "sortie")}
                            className={`text-xs font-medium transition-colors ${
                              enregistres.sortie ? "text-[#1B3A3A]" : "text-[#2F6E6E] hover:text-[#1B3A3A]"
                            }`}
                          >
                            {enregistres.sortie ? "✓ Sortie" : "Sortie"}
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-2.5">
                        <button
                          onClick={() => setConversationOuvertePour(discussionOuverte ? null : r.id)}
                          className="flex items-center gap-1 text-xs font-medium text-[#2F6E6E] hover:text-[#1B3A3A] transition-colors"
                        >
                          <MessageCircle size={12} /> {discussionOuverte ? "Fermer" : "Discuter"}
                        </button>
                      </td>
                    </tr>
                    {discussionOuverte && (
                      <tr className="border-t border-[#EDE4D4]">
                        <td colSpan={6} className="px-4 py-3">
                          <FilDiscussionHote reservationId={r.id} interlocuteurLabel={r.voyageur} />
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Back-office admin
// ---------------------------------------------------------------------------

function LitigeItem({ litige, onResoudre }) {
  const [ouvert, setOuvert] = useState(false);
  const [resolu, setResolu] = useState(litige.statut === "resolu");

  function agir(action) {
    setResolu(true);
    setOuvert(false);
    onResoudre?.(litige.id, action);
  }

  const statutAffiche = resolu ? "resolu" : litige.statut;
  const peutAgir = !resolu && litige.statut !== "resolu";

  return (
    <div className="px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm text-[#1B3A3A] font-medium truncate">{litige.logement}</p>
          <p className="text-xs text-[#8C7A66] truncate">{litige.motif}</p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-xs text-[#B0A48F]">{litige.depuis}</span>
          <Badge statut={statutAffiche} />
          {peutAgir && (
            <button
              onClick={() => setOuvert((o) => !o)}
              className="text-xs font-medium text-[#2F6E6E] hover:text-[#1B3A3A] transition-colors"
            >
              Instruire
            </button>
          )}
        </div>
      </div>

      {ouvert && peutAgir && (
        <div className="mt-3 bg-[#F8F4EC] border border-[#E4DCC8] rounded-lg p-3 space-y-2">
          <p className="text-xs text-[#6B5B4D]">
            Montant retenu : <span className="font-medium text-[#1B3A3A]">{fmtEUR(litige.montant)}</span>
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => agir("liberer")}
              className="px-3 py-1.5 rounded-lg bg-[#1B3A3A] text-[#F8F4EC] text-xs font-medium hover:bg-[#2F6E6E] transition-colors"
            >
              Signalement infondé — libérer les fonds à l'hôte
            </button>
            <button
              onClick={() => agir("rembourser")}
              className="px-3 py-1.5 rounded-lg bg-[#C97B3D] text-[#F8F4EC] text-xs font-medium hover:bg-[#8A5A2B] transition-colors"
            >
              Logement non conforme — rembourser le voyageur
            </button>
            <button
              onClick={() => agir("resoudre")}
              className="px-3 py-1.5 rounded-lg border border-[#E4DCC8] text-[#6B5B4D] text-xs font-medium hover:bg-[#EDE4D4] transition-colors"
            >
              Clore sans mouvement de fonds
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Vérification des documents (hôtes et voyageurs) — appelle les vraies
// routes /api/admin/documents et /api/admin/guest-documents une fois
// déployé ; liste vide dans cet aperçu autonome, faute de backend réel.
// ---------------------------------------------------------------------------

const LABELS_TYPE_DOCUMENT = {
  piece_identite: "Pièce d'identité",
  justificatif_domicile: "Justificatif de domicile",
  titre_propriete_ou_mandat: "Titre de propriété / mandat",
  attestation_assurance: "Attestation d'assurance",
  assurance_villegiature: "Assurance villégiature",
};

function LigneDocumentAdmin({ document, cote, onDecision }) {
  const [enCours, setEnCours] = useState(false);
  const [noteRefus, setNoteRefus] = useState("");
  const [refusOuvert, setRefusOuvert] = useState(false);

  async function consulter() {
    const route = cote === "hote" ? "documents" : "guest-documents";
    const res = await fetch(`/api/admin/${route}/${document.id}`);
    const data = await res.json();
    if (data.url) window.open(data.url, "_blank", "noopener,noreferrer");
  }

  async function decider(status) {
    if (status === "refuse" && !refusOuvert) {
      setRefusOuvert(true);
      return;
    }
    setEnCours(true);
    const route = cote === "hote" ? "documents" : "guest-documents";
    await fetch(`/api/admin/${route}/${document.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, noteAdmin: status === "refuse" ? noteRefus : undefined }),
    }).catch(() => {});
    setEnCours(false);
    onDecision(document.id);
  }

  return (
    <div className="px-4 py-3 border-b border-[#EDE4D4] last:border-b-0">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-[#1B3A3A] truncate">
            {document.profiles?.full_name || document.profiles?.email || "Utilisateur"}
          </p>
          <p className="text-xs text-[#8C7A66]">
            {LABELS_TYPE_DOCUMENT[document.document_type] ?? document.document_type} · {fmtDate(document.uploaded_at)}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button onClick={consulter} className="text-xs font-medium text-[#2F6E6E] hover:text-[#1B3A3A] transition-colors">
            Consulter
          </button>
          <button
            onClick={() => decider("valide")}
            disabled={enCours}
            className="text-xs font-medium px-2.5 py-1 rounded-full bg-[#E1EEE9] text-[#1B3A3A] hover:bg-[#CFE3DB] transition-colors disabled:opacity-50"
          >
            Valider
          </button>
          <button
            onClick={() => decider("refuse")}
            disabled={enCours}
            className="text-xs font-medium px-2.5 py-1 rounded-full bg-[#F6DEDA] text-[#7A2E1F] hover:bg-[#F0C9C2] transition-colors disabled:opacity-50"
          >
            Refuser
          </button>
        </div>
      </div>
      {refusOuvert && (
        <div className="flex items-center gap-2 mt-2">
          <input
            className={`${inputCls} text-xs py-1.5`}
            placeholder="Motif du refus (visible par l'utilisateur)"
            value={noteRefus}
            onChange={(e) => setNoteRefus(e.target.value)}
          />
          <button
            onClick={() => decider("refuse")}
            disabled={enCours || !noteRefus.trim()}
            className="text-xs font-medium px-3 py-1.5 rounded-lg bg-[#7A2E1F] text-[#F8F4EC] hover:bg-[#5C2116] transition-colors disabled:opacity-50 shrink-0"
          >
            Confirmer le refus
          </button>
        </div>
      )}
    </div>
  );
}

function DocumentsAVerifier() {
  const [documentsHote, setDocumentsHote] = useState(null);
  const [documentsVoyageur, setDocumentsVoyageur] = useState(null);

  async function charger() {
    const [resHote, resVoyageur] = await Promise.all([
      fetch("/api/admin/documents").then((r) => r.json()).catch(() => ({ documents: [] })),
      fetch("/api/admin/guest-documents").then((r) => r.json()).catch(() => ({ documents: [] })),
    ]);
    setDocumentsHote(resHote.documents ?? []);
    setDocumentsVoyageur(resVoyageur.documents ?? []);
  }

  useEffect(() => { charger(); }, []);

  function retirer(cote, id) {
    if (cote === "hote") setDocumentsHote((prev) => prev.filter((d) => d.id !== id));
    else setDocumentsVoyageur((prev) => prev.filter((d) => d.id !== id));
  }

  const total = (documentsHote?.length ?? 0) + (documentsVoyageur?.length ?? 0);

  return (
    <div className="bg-[#FFFDF8] border border-[#E4DCC8] rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-[#E4DCC8] flex items-center justify-between">
        <h3 className="font-serif text-[#1B3A3A] text-base flex items-center gap-2">
          <FileCheck size={16} /> Documents à vérifier
        </h3>
        {total > 0 && (
          <span className="text-xs font-medium bg-[#F6DEDA] text-[#7A2E1F] px-2.5 py-1 rounded-full">{total} en attente</span>
        )}
      </div>

      {documentsHote === null ? (
        <p className="text-xs text-[#B0A48F] text-center py-6">Chargement...</p>
      ) : total === 0 ? (
        <p className="text-xs text-[#B0A48F] text-center py-6">Aucun document en attente de vérification.</p>
      ) : (
        <div>
          {documentsHote.map((d) => (
            <LigneDocumentAdmin key={d.id} document={d} cote="hote" onDecision={(id) => retirer("hote", id)} />
          ))}
          {documentsVoyageur.map((d) => (
            <LigneDocumentAdmin key={d.id} document={d} cote="voyageur" onDecision={(id) => retirer("voyageur", id)} />
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Taxe de séjour — suivi des reversements dus par commune (Article L2333-34
// du CGCT). Appelle les vraies routes /api/admin/tourist-tax une fois
// déployé ; liste vide dans cet aperçu autonome, faute de backend réel.
// ---------------------------------------------------------------------------

function fmtEURPrecis(centimes) {
  return (centimes / 100).toLocaleString("fr-FR", { style: "currency", currency: "EUR", minimumFractionDigits: 2 });
}

function SuiviTaxeSejour() {
  const [lignes, setLignes] = useState(null);
  const [semestre, setSemestre] = useState("");

  async function charger() {
    const res = await fetch("/api/admin/tourist-tax").then((r) => r.json()).catch(() => null);
    setLignes(res?.lignes ?? []);
    setSemestre(res?.semestre ?? "");
  }

  useEffect(() => { charger(); }, []);

  async function marquerReverse(id) {
    await fetch(`/api/admin/tourist-tax/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) }).catch(() => {});
    setLignes((prev) => prev.map((l) => (l.id === id ? { ...l, status: "verse" } : l)));
  }

  const totalDu = (lignes ?? []).filter((l) => l.status === "a_verser").reduce((s, l) => s + l.amount_due, 0);

  return (
    <div className="bg-[#FFFDF8] border border-[#E4DCC8] rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-[#E4DCC8] flex items-center justify-between">
        <h3 className="font-serif text-[#1B3A3A] text-base flex items-center gap-2">
          <Wallet size={16} /> Taxe de séjour — {semestre || "semestre en cours"}
        </h3>
        {totalDu > 0 && (
          <span className="text-xs font-medium bg-[#F6E4CE] text-[#8A5A2B] px-2.5 py-1 rounded-full">
            {fmtEURPrecis(totalDu)} à reverser
          </span>
        )}
      </div>
      <p className="px-4 pt-3 text-xs text-[#8C7A66]">
        Agrégat par commune, préparé pour la déclaration (FARITAS ou déclaration par commune) —
        le virement effectif à chaque comptable public reste une opération manuelle, à
        confirmer ici une fois réalisée.
      </p>

      {lignes === null ? (
        <p className="text-xs text-[#B0A48F] text-center py-6">Chargement...</p>
      ) : lignes.length === 0 ? (
        <p className="text-xs text-[#B0A48F] text-center py-6">Aucune taxe de séjour collectée pour ce semestre.</p>
      ) : (
        <table className="w-full text-sm mt-2">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-wide text-[#8C7A66]">
              <th className="px-4 py-2 font-medium">Commune</th>
              <th className="px-4 py-2 font-medium">Réservations</th>
              <th className="px-4 py-2 font-medium">Montant dû</th>
              <th className="px-4 py-2 font-medium">Statut</th>
            </tr>
          </thead>
          <tbody>
            {lignes.map((l) => (
              <tr key={l.id} className="border-t border-[#EDE4D4]">
                <td className="px-4 py-2.5 text-[#1B3A3A] font-medium">{l.commune}</td>
                <td className="px-4 py-2.5 text-[#6B5B4D]">{l.reservation_count}</td>
                <td className="px-4 py-2.5 text-[#1B3A3A]">{fmtEURPrecis(l.amount_due)}</td>
                <td className="px-4 py-2.5">
                  {l.status === "verse" ? (
                    <span className="text-xs px-2 py-1 rounded-full bg-[#E1EEE9] text-[#1B3A3A]">Reversé</span>
                  ) : (
                    <button
                      onClick={() => marquerReverse(l.id)}
                      className="text-xs font-medium text-[#2F6E6E] hover:text-[#1B3A3A] transition-colors"
                    >
                      Marquer comme reversé
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function BackOfficeAdmin() {
  const [recherche, setRecherche] = useState("");
  const revenuMois = revenusPlateforme[revenusPlateforme.length - 1].montant;

  const logementsFiltres = useMemo(() => {
    const q = recherche.trim().toLowerCase();
    if (!q) return logementsAdmin;
    return logementsAdmin.filter(
      (l) => l.nom.toLowerCase().includes(q) || l.hote.toLowerCase().includes(q)
    );
  }, [recherche]);

  function resoudreLitige(id, action) {
    // Ici : appel réel à POST /api/admin/disputes/:reservationId
    // avec { action } — voir la route codée côté serveur.
    console.log(`Litige ${id} résolu avec l'action "${action}"`);
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard icon={Building2} label="Logements actifs" value="312" sub="+8 ce mois-ci" />
        <MetricCard icon={Users} label="Hôtes inscrits" value="184" />
        <MetricCard icon={TrendingUp} label="Commission (août)" value={fmtEUR(revenuMois)} />
        <MetricCard icon={ShieldAlert} label="Signalements ouverts" value="2" sub="1 nouveau" />
      </div>

      <GraphiqueRevenus data={revenusPlateforme} titre="Commission plateforme — 6 derniers mois" />

      <FichesConciergeries />

      <DocumentsAVerifier />

      <SuiviTaxeSejour />

      <div className="bg-[#FFFDF8] border border-[#E4DCC8] rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-[#E4DCC8] flex items-center justify-between gap-3">
          <h3 className="font-serif text-[#1B3A3A] text-base flex items-center gap-2">
            <LayoutGrid size={16} /> Logements
          </h3>
          <div className="flex items-center gap-2 bg-[#F8F4EC] border border-[#E4DCC8] rounded-lg px-2.5 py-1.5">
            <Search size={13} className="text-[#8C7A66]" />
            <input
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
              placeholder="Rechercher un logement ou un hôte"
              className="bg-transparent text-xs focus:outline-none w-52 text-[#1B3A3A]"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wide text-[#8C7A66]">
                <th className="px-4 py-2 font-medium">Logement</th>
                <th className="px-4 py-2 font-medium">Hôte</th>
                <th className="px-4 py-2 font-medium">Réservations</th>
                <th className="px-4 py-2 font-medium">Note</th>
                <th className="px-4 py-2 font-medium">Statut</th>
              </tr>
            </thead>
            <tbody>
              {logementsFiltres.map((l) => (
                <tr key={l.id} className="border-t border-[#EDE4D4]">
                  <td className="px-4 py-2.5 text-[#1B3A3A] font-medium flex items-center gap-2">
                    <Home size={13} className="text-[#8C7A66]" /> {l.nom}
                  </td>
                  <td className="px-4 py-2.5 text-[#6B5B4D]">{l.hote}</td>
                  <td className="px-4 py-2.5 text-[#6B5B4D]">{l.reservations}</td>
                  <td className="px-4 py-2.5 text-[#6B5B4D]">{l.note ? `${l.note} / 5` : "—"}</td>
                  <td className="px-4 py-2.5"><Badge statut={l.statut} /></td>
                </tr>
              ))}
              {logementsFiltres.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-[#8C7A66] text-sm">
                    Aucun logement ne correspond à cette recherche.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-[#FFFDF8] border border-[#E4DCC8] rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-[#E4DCC8]">
          <h3 className="font-serif text-[#1B3A3A] text-base flex items-center gap-2">
            <Flag size={16} /> Signalements et litiges
          </h3>
        </div>
        <div className="divide-y divide-[#EDE4D4]">
          {litigesAdmin.map((s) => (
            <LitigeItem key={s.id} litige={s} onResoudre={resoudreLitige} />
          ))}
        </div>
      </div>
    </div>
  );
}


// ---------------------------------------------------------------------------
// Composant principal
// ---------------------------------------------------------------------------

export default function GestionLocations({ role = "admin", nomUtilisateur = "", mesAnnonces = null, mesReservations = null, mesAvis = null, mesSignalements = null, mesCoHotes = null, monPartenaire = null, mesDocuments = null, mesRevenusMensuels = null, cgvAcceptee = true }) {
  const [vue, setVue] = useState("hote");
  const estAdmin = role === "admin";

  return (
    <div className="min-h-screen bg-[#F8F4EC] font-sans">
      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-[11px] uppercase tracking-widest text-[#8C7A66]">Escale</p>
            <h1 className="font-serif text-2xl text-[#1B3A3A]">Gestion des locations</h1>
          </div>

          <div className="flex items-center gap-3">
            <div className="inline-flex bg-[#EDE4D4] rounded-full p-1">
              <button
                onClick={() => setVue("hote")}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  vue === "hote" ? "bg-[#1B3A3A] text-[#F8F4EC]" : "text-[#6B5B4D] hover:text-[#1B3A3A]"
                }`}
              >
                <Home size={14} /> Espace hôte
              </button>
              {estAdmin && (
                <button
                  onClick={() => setVue("admin")}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    vue === "admin" ? "bg-[#1B3A3A] text-[#F8F4EC]" : "text-[#6B5B4D] hover:text-[#1B3A3A]"
                  }`}
                >
                  <ShieldAlert size={14} /> Back-office admin
                </button>
              )}
            </div>
            <form action="/api/auth/signout" method="post">
              <button type="submit" className="text-xs text-[#8C7A66] hover:text-[#1B3A3A] transition-colors">
                {nomUtilisateur ? `${nomUtilisateur} · ` : ""}Se déconnecter
              </button>
            </form>
          </div>
        </div>

        {vue === "hote" || !estAdmin ? (
          <EspaceHote
            cgvAcceptee={cgvAcceptee}
            mesAnnoncesReelles={mesAnnonces}
            mesReservationsReelles={mesReservations}
            mesAvisReels={mesAvis}
            mesSignalementsReels={mesSignalements}
            mesCoHotesReels={mesCoHotes}
            monPartenaireReel={monPartenaire}
            mesDocumentsReels={mesDocuments}
            mesRevenusMensuelsReels={mesRevenusMensuels}
          />
        ) : <BackOfficeAdmin />}
      </div>
    </div>
  );
}
