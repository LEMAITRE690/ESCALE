import Link from "next/link";
import { BadgeEuro, ArrowRight } from "lucide-react";

export default function HoteLayout({ children }) {
  return (
    <>
      <div className="border-b border-[#D7CCB9] bg-[#F1E7D6]">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3 text-sm text-[#173C3A]">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-[#173C3A] text-white"><BadgeEuro size={17}/></span>
            <div><p className="font-semibold">Charte du Prix Juste Escale</p><p className="text-xs text-[#6B5B4D]">Activez l’engagement annonce par annonce et obtenez automatiquement le badge voyageur.</p></div>
          </div>
          <Link href="/hote/charte-prix-juste" className="inline-flex items-center gap-2 rounded-lg bg-[#173C3A] px-4 py-2 text-sm font-medium text-white">Gérer mes engagements <ArrowRight size={14}/></Link>
        </div>
      </div>
      {children}
    </>
  );
}
