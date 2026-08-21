import Link from "next/link";
import { LayoutDashboard, Home, CalendarDays, Users, CreditCard, ShieldAlert, LifeBuoy, Megaphone, FlaskConical, BrainCircuit, Settings, Database } from "lucide-react";
import { requireAdmin } from "@/lib/admin/authorize";

const navigation=[
 {href:"/admin",label:"Vue d’ensemble",icon:LayoutDashboard},
 {href:"/admin/logements",label:"Logements",icon:Home},
 {href:"/admin/reservations",label:"Réservations",icon:CalendarDays},
 {href:"/admin/utilisateurs",label:"Utilisateurs",icon:Users},
 {href:"/admin/paiements",label:"Paiements",icon:CreditCard},
 {href:"/admin/moderation",label:"Modération",icon:ShieldAlert},
 {href:"/admin/support",label:"Support",icon:LifeBuoy},
 {href:"/admin/marketing",label:"Marketing CRM",icon:Megaphone},
 {href:"/admin/experiences",label:"Tests A/B",icon:FlaskConical},
 {href:"/admin/growth-ai",label:"IA Growth",icon:BrainCircuit},
 {href:"/admin/demo",label:"Données démo",icon:Database},
];

export default async function AdminLayout({children}){
 const user=await requireAdmin("/admin");
 return <div className="min-h-screen bg-[#F5F1E8] text-[#173C3A]"><header className="border-b border-[#DED4C3] bg-[#173C3A] text-white"><div className="mx-auto flex max-w-[1500px] items-center justify-between px-5 py-3"><div><div className="font-serif text-xl">ESCALE Admin</div><div className="text-xs text-[#D8CCB0]">Back-office personnel</div></div><div className="flex items-center gap-3 text-xs"><span className="hidden sm:inline">{user.email}</span><span className="rounded-full bg-white/10 px-3 py-1.5">Personnel autorisé</span></div></div></header><div className="mx-auto grid max-w-[1500px] lg:grid-cols-[240px_1fr]"><aside className="border-r border-[#DED4C3] bg-[#FFFDF8] p-3 lg:min-h-[calc(100vh-65px)]"><nav className="grid gap-1 sm:grid-cols-2 lg:grid-cols-1">{navigation.map(({href,label,icon:Icon})=><Link key={href} href={href} className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm hover:bg-[#E1EEE9]"><Icon size={16}/>{label}</Link>)}</nav><div className="mt-4 border-t border-[#E4DCC8] pt-3"><Link href="/" className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-[#6B5B4D] hover:bg-[#F1EADB]"><Settings size={16}/>Retour au site</Link></div></aside><div>{children}</div></div></div>;
}
