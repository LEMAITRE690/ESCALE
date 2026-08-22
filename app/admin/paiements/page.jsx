import { CreditCard, Euro, AlertTriangle, Landmark } from "lucide-react";
const rows=[
 ["PAY-8821","Stripe","1 890 €","173,88 €","Réussi"],
 ["PAY-8819","Lemonway","1 420 €","130,64 €","À contrôler"],
 ["PAY-8814","Stripe","615 €","56,58 €","Réussi"],
 ["PAY-8798","Lemonway","1 160 €","106,72 €","Reversement prévu"],
 ["PAY-8772","Stripe","236 €","21,71 €","Remboursé"],
];
export default function AdminPaiements(){return <main className="p-5 md:p-8"><div className="mx-auto max-w-7xl"><p className="text-sm text-[#2F6E6E]">Finance</p><h1 className="font-serif text-3xl">Paiements & reversements</h1><p className="mt-2 text-sm text-[#6B5B4D]">Supervision Stripe/Lemonway, commissions et anomalies.</p><div className="mt-6 grid gap-3 sm:grid-cols-4">{[["Volume 30 jours","184 620 €",Euro],["Commission Escale","14 782 €",CreditCard],["À reverser","48 310 €",Landmark],["Anomalies","3",AlertTriangle]].map(([l,v,I])=><div key={l} className="rounded-xl border border-[#E4DCC8] bg-white p-5"><I size={17}/><div className="mt-2 text-2xl font-semibold">{v}</div><div className="text-sm text-[#8C7A66]">{l}</div></div>)}</div><section className="mt-6 overflow-hidden rounded-2xl border border-[#E4DCC8] bg-white"><div className="grid grid-cols-[1fr_1fr_1fr_1fr_1.2fr] gap-3 border-b border-[#E4DCC8] bg-[#FFFDF8] px-5 py-3 text-xs text-[#8C7A66]"><span>ID</span><span>PSP</span><span>Montant</span><span>Commission</span><span>Statut</span></div>{rows.map(r=><div key={r[0]} className="grid grid-cols-[1fr_1fr_1fr_1fr_1.2fr] gap-3 border-b border-[#EFE8DB] px-5 py-4 text-sm last:border-0">{r.map((v,i)=><span key={i}>{v}</span>)}</div>)}</section></div></main>}
