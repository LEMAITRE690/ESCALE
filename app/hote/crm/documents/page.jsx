import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const fmt=d=>d?new Date(d).toLocaleDateString("fr-FR"):"—";

export default async function DocumentsPage(){
 const supabase=createClient(); const {data:{user}}=await supabase.auth.getUser(); if(!user) redirect("/connexion?suite=/hote/crm/documents");
 const {data:docs}=await supabase.from("reservation_documents").select("id,reservation_id,title,document_type,status,created_at").eq("host_id",user.id).order("created_at",{ascending:false}).limit(200);
 return <main className="min-h-screen bg-[#F7F5F0] p-5 md:p-8"><div className="mx-auto max-w-6xl"><h1 className="text-3xl font-semibold text-[#1B3A3A]">Documents</h1><p className="text-stone-500">Contrats, factures et justificatifs rattachés aux réservations.</p><section className="mt-6 rounded-2xl border border-stone-200 bg-white p-5"><div className="divide-y">{(docs||[]).map(d=><div key={d.id} className="grid gap-2 py-3 md:grid-cols-[1fr_160px_140px_140px]"><div><b>{d.title}</b><div><Link href={`/hote/crm/reservations/${d.reservation_id}`} className="text-xs text-[#2F6E6E]">Voir la réservation</Link></div></div><span className="text-sm text-stone-500">{d.document_type}</span><span className="text-sm text-stone-500">{d.status}</span><span className="text-sm text-stone-500">{fmt(d.created_at)}</span></div>)}{!(docs||[]).length&&<p className="py-8 text-center text-stone-400">Aucun document rattaché pour le moment.</p>}</div></section></div></main>;
}
