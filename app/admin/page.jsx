import { CalendarDays, Euro, Home, Users, AlertTriangle, ArrowUpRight, Clock3, ShieldCheck, LifeBuoy, TrendingUp } from "lucide-react";

const kpis=[
 {label:"Réservations aujourd’hui",value:"42",delta:"+11 %",icon:CalendarDays},
 {label:"Volume réservé (30 j)",value:"184 620 €",delta:"+8,6 %",icon:Euro},
 {label:"Logements actifs",value:"1 284",delta:"+37",icon:Home},
 {label:"Utilisateurs actifs",value:"8 462",delta:"+4,2 %",icon:Users},
];
const alertes=[
 {type:"Modération",titre:"7 annonces à examiner",detail:"Photos, description ou signalement utilisateur",icon:ShieldCheck},
 {type:"Paiement",titre:"3 reversements en anomalie",detail:"Contrôle PSP requis avant relance",icon:AlertTriangle},
 {type:"Support",titre:"12 tickets prioritaires",detail:"Dont 4 arrivées prévues sous 48 h",icon:LifeBuoy},
];
const activite=[
 ["18:02","Réservation confirmée","Villa des Embruns · La Rochelle","1 890 €"],
 ["17:48","Annonce publiée","Maison du Cap · Biarritz","Modération OK"],
 ["17:21","Remboursement validé","Studio Presqu’île · Lyon","420 €"],
 ["16:56","Nouvel hôte vérifié","Claire D.","KYC validé"],
 ["16:32","Ticket résolu","Arrivée autonome · Annecy","SLA 42 min"],
];
const bars=[38,44,41,53,49,62,58,66,72,69,81,78];

export default function AdminDashboard(){return <main className="p-5 md:p-8"><div className="mx-auto max-w-7xl"><div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-sm text-[#2F6E6E]">Vendredi 21 août · exploitation</p><h1 className="font-serif text-3xl">Vue d’ensemble</h1><p className="mt-2 text-sm text-[#6B5B4D]">Ce qui demande l’attention de l’équipe ESCALE aujourd’hui.</p></div><div className="inline-flex items-center gap-2 rounded-full bg-[#E1EEE9] px-3 py-1.5 text-sm"><span className="h-2 w-2 rounded-full bg-emerald-600"></span>Services opérationnels</div></div>
<div className="mt-7 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{kpis.map(({label,value,delta,icon:Icon})=><article key={label} className="rounded-2xl border border-[#E4DCC8] bg-white p-5"><div className="flex items-center justify-between"><Icon size={18}/><span className="flex items-center gap-1 text-xs text-emerald-700"><ArrowUpRight size={12}/>{delta}</span></div><div className="mt-4 text-2xl font-semibold">{value}</div><div className="mt-1 text-sm text-[#8C7A66]">{label}</div></article>)}</div>
<div className="mt-6 grid gap-5 xl:grid-cols-[1.4fr_.9fr]"><section className="rounded-2xl border border-[#E4DCC8] bg-white p-6"><div className="flex items-center justify-between"><div><h2 className="font-serif text-xl">Réservations sur 12 semaines</h2><p className="text-sm text-[#8C7A66]">Tendance démo, base de comparaison pour l’équipe.</p></div><TrendingUp size={20}/></div><div className="mt-7 flex h-52 items-end gap-2">{bars.map((v,i)=><div key={i} className="flex flex-1 flex-col items-center gap-2"><div className="w-full rounded-t-md bg-[#2F6E6E]" style={{height:`${v}%`}}></div><span className="text-[10px] text-[#8C7A66]">S{i+1}</span></div>)}</div></section><section className="rounded-2xl border border-[#E4DCC8] bg-white p-6"><div className="flex items-center gap-2"><AlertTriangle size={18}/><h2 className="font-serif text-xl">À traiter</h2></div><div className="mt-4 grid gap-3">{alertes.map(({type,titre,detail,icon:Icon})=><div key={titre} className="rounded-xl bg-[#F8F4EC] p-4"><div className="flex items-start gap-3"><Icon size={17} className="mt-0.5 shrink-0"/><div><div className="text-xs text-[#8C7A66]">{type}</div><strong className="text-sm">{titre}</strong><p className="mt-1 text-xs text-[#6B5B4D]">{detail}</p></div></div></div>)}</div></section></div>
<section className="mt-6 overflow-hidden rounded-2xl border border-[#E4DCC8] bg-white"><div className="flex items-center justify-between border-b border-[#E4DCC8] p-5"><div className="flex items-center gap-2"><Clock3 size={18}/><h2 className="font-serif text-xl">Activité récente</h2></div><button className="text-sm font-medium text-[#2F6E6E]">Voir le journal</button></div><div className="divide-y divide-[#EFE8DB]">{activite.map(([heure,action,cible,valeur])=><div key={`${heure}-${action}`} className="grid gap-2 px-5 py-4 text-sm md:grid-cols-[70px_1.2fr_1.6fr_.8fr]"><span className="text-[#8C7A66]">{heure}</span><strong>{action}</strong><span>{cible}</span><span className="md:text-right">{valeur}</span></div>)}</div></section></div></main>}
