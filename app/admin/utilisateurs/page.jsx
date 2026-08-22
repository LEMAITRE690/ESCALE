import { Users, UserCheck, UserX, BadgeCheck } from "lucide-react";
const rows=[
 ["Claire Dubois","Hôte","claire@example.fr","Vérifié","12 annonces"],
 ["Camille Martin","Voyageur","camille@example.fr","Actif","8 séjours"],
 ["Julien Morel","Hôte","julien@example.fr","KYC en attente","2 annonces"],
 ["Nora Petit","Voyageur","nora@example.fr","Actif","3 séjours"],
 ["Marc Laurent","Voyageur","marc@example.fr","Suspendu","Signalement"],
];
export default function AdminUtilisateurs(){return <main className="p-5 md:p-8"><div className="mx-auto max-w-7xl"><p className="text-sm text-[#2F6E6E]">Comptes</p><h1 className="font-serif text-3xl">Utilisateurs</h1><p className="mt-2 text-sm text-[#6B5B4D]">Voyageurs, hôtes, vérifications et mesures de sécurité.</p><div className="mt-6 grid gap-3 sm:grid-cols-4">{[["Comptes actifs","8 462",Users],["Hôtes vérifiés","1 126",BadgeCheck],["KYC à traiter","14",UserCheck],["Suspendus","9",UserX]].map(([l,v,I])=><div key={l} className="rounded-xl border border-[#E4DCC8] bg-white p-5"><I size={17}/><div className="mt-2 text-2xl font-semibold">{v}</div><div className="text-sm text-[#8C7A66]">{l}</div></div>)}</div><section className="mt-6 overflow-hidden rounded-2xl border border-[#E4DCC8] bg-white"><div className="grid grid-cols-[1.2fr_.7fr_1.5fr_.9fr_1fr] gap-3 border-b border-[#E4DCC8] bg-[#FFFDF8] px-5 py-3 text-xs text-[#8C7A66]"><span>Nom</span><span>Rôle</span><span>Email</span><span>Statut</span><span>Activité</span></div>{rows.map(r=><div key={r[2]} className="grid grid-cols-[1.2fr_.7fr_1.5fr_.9fr_1fr] gap-3 border-b border-[#EFE8DB] px-5 py-4 text-sm last:border-0">{r.map((v,i)=><span key={i} className={i===0?"font-medium":""}>{v}</span>)}</div>)}</section></div></main>}
