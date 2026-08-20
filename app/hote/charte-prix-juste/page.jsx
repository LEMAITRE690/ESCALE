"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BadgeEuro, CheckCircle2, Loader2, ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function ChartePrixJusteHote() {
  const [annonces, setAnnonces] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [sauvegarde, setSauvegarde] = useState(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function charger() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { window.location.href = "/connexion?suite=/hote/charte-prix-juste"; return; }
      const { data } = await supabase.from("listings").select("id,title,city,fair_price_charter").eq("host_id", user.id).order("created_at", { ascending: false });
      setAnnonces(data ?? []);
      setChargement(false);
    }
    charger();
  }, []);

  async function changer(annonce, actif) {
    setSauvegarde(annonce.id); setMessage("");
    const supabase = createClient();
    const { error } = await supabase.from("listings").update({ fair_price_charter: actif }).eq("id", annonce.id);
    if (error) setMessage("La modification n’a pas pu être enregistrée.");
    else {
      setAnnonces(a => a.map(x => x.id === annonce.id ? { ...x, fair_price_charter: actif } : x));
      setMessage(actif ? "Charte activée : le badge Prix Juste sera visible sur cette annonce." : "Charte désactivée : le badge sera retiré de cette annonce.");
    }
    setSauvegarde(null);
  }

  return <main className="min-h-screen bg-[#F8F4EC] text-[#173C3A] px-5 py-10"><div className="mx-auto max-w-4xl">
    <Link href="/hote" className="text-sm text-[#6D6258]">← Retour à l’espace hôte</Link>
    <div className="mt-7 rounded-3xl bg-[#173C3A] p-7 text-white"><div className="flex items-center gap-2 text-[#E6B27D]"><BadgeEuro size={20}/><span className="text-sm font-semibold uppercase tracking-wider">Charte du Prix Juste Escale</span></div><h1 className="mt-3 font-serif text-4xl">Un engagement simple, visible par les voyageurs.</h1><p className="mt-4 max-w-2xl leading-7 text-[#D3DFDC]">En activant la Charte sur une annonce, vous déclarez proposer sur Escale un tarif au moins 5 % plus avantageux que sur les plateformes traditionnelles, à conditions comparables. L’adhésion est volontaire et peut être retirée à tout moment.</p><Link href="/charte-prix-juste" className="mt-5 inline-flex text-sm underline underline-offset-4">Lire la Charte complète</Link></div>
    <div className="mt-7 rounded-2xl border border-[#E2D6C2] bg-white/60 p-6"><div className="flex gap-3"><ShieldCheck className="shrink-0 text-[#A86735]"/><div><h2 className="font-semibold">Ce que voit le voyageur</h2><p className="mt-1 text-sm leading-6 text-[#6D6258]">Une annonce engagée reçoit automatiquement le badge « Prix Juste Escale » et peut apparaître dans le filtre dédié des résultats de recherche. Le badge indique un engagement déclaré par l’hôte, et non un prix vérifié en permanence par Escale.</p></div></div></div>
    <section className="mt-8"><h2 className="font-serif text-3xl">Mes annonces</h2>{chargement ? <div className="mt-6 flex items-center gap-2 text-sm"><Loader2 className="animate-spin" size={17}/> Chargement…</div> : annonces.length === 0 ? <p className="mt-5 text-[#6D6258]">Vous n’avez pas encore d’annonce.</p> : <div className="mt-5 space-y-3">{annonces.map(a => <div key={a.id} className="flex flex-col gap-4 rounded-2xl border border-[#E2D6C2] bg-[#FFFDF8] p-5 sm:flex-row sm:items-center sm:justify-between"><div><div className="flex flex-wrap items-center gap-2"><h3 className="font-semibold">{a.title}</h3>{a.fair_price_charter && <span className="inline-flex items-center gap-1 rounded-full bg-[#E1EEE9] px-2.5 py-1 text-xs font-semibold"><CheckCircle2 size={12}/> Prix Juste Escale</span>}</div><p className="mt-1 text-sm text-[#6D6258]">{a.city}</p></div><label className="flex cursor-pointer items-center gap-3 text-sm font-medium"><input type="checkbox" className="h-5 w-5" checked={!!a.fair_price_charter} disabled={sauvegarde === a.id} onChange={e => changer(a, e.target.checked)}/><span>J’adhère à la Charte</span></label></div>)}</div>}</section>
    {message && <p className="mt-5 rounded-xl bg-[#F1E7D6] p-4 text-sm" role="status">{message}</p>}
    <p className="mt-8 text-xs leading-5 text-[#7C7065]">En activant l’adhésion, l’hôte reconnaît avoir pris connaissance de la Charte du Prix Juste Escale annexée aux Conditions générales. Cette fonctionnalité et son texte juridique doivent être validés avant mise en production.</p>
  </div></main>;
}
