import "leaflet/dist/leaflet.css";
import Link from "next/link";
import { BadgeEuro, ShieldCheck } from "lucide-react";

export default function RechercheLayout({ children }) {
  return (
    <>
      <div className="border-b border-[#D7CCB9] bg-[#F1E7D6]">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3 text-sm text-[#173C3A]">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-[#173C3A] text-[#F8F4EC]"><BadgeEuro size={17}/></span>
            <div><p className="font-semibold">Envie de voir uniquement les annonces Prix Juste ?</p><p className="text-xs text-[#6B5B4D]">Hôtes engagés à proposer au moins 5 % de mieux à conditions comparables.</p></div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/recherche/prix-juste" className="rounded-lg bg-[#173C3A] px-4 py-2 text-sm font-medium text-white">Activer le filtre Prix Juste</Link>
            <Link href="/charte-prix-juste" className="inline-flex items-center gap-1.5 rounded-lg border border-[#BFAF92] px-4 py-2 text-sm font-medium"><ShieldCheck size={14}/> Voir la Charte</Link>
          </div>
        </div>
      </div>
      {children}
    </>
  );
}
