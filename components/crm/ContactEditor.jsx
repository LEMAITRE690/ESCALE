"use client";
import { useState } from "react";

export default function ContactEditor({ contact }) {
  const [notes,setNotes]=useState(contact.private_notes||"");
  const [phone,setPhone]=useState(contact.phone||"");
  const [tags,setTags]=useState((contact.tags||[]).join(", "));
  const [marketing,setMarketing]=useState(!!contact.marketing_consent);
  const [state,setState]=useState("");
  async function save(){
    setState("saving");
    const res=await fetch(`/api/hote/crm/contacts/${contact.id}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({privateNotes:notes,phone,marketingConsent:marketing,tags:tags.split(",").map(x=>x.trim()).filter(Boolean)})});
    setState(res.ok?"saved":"error");
  }
  return <div className="space-y-4">
    <div><label className="text-xs uppercase tracking-wide text-stone-500">Téléphone</label><input value={phone} onChange={e=>setPhone(e.target.value)} className="mt-1 w-full rounded-xl border border-stone-200 px-3 py-2 bg-white" /></div>
    <div><label className="text-xs uppercase tracking-wide text-stone-500">Tags</label><input value={tags} onChange={e=>setTags(e.target.value)} placeholder="VIP, Famille, Professionnel" className="mt-1 w-full rounded-xl border border-stone-200 px-3 py-2 bg-white" /></div>
    <div><label className="text-xs uppercase tracking-wide text-stone-500">Notes privées</label><textarea rows={5} value={notes} onChange={e=>setNotes(e.target.value)} className="mt-1 w-full rounded-xl border border-stone-200 px-3 py-2 bg-white" /></div>
    <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={marketing} onChange={e=>setMarketing(e.target.checked)} /> Consentement marketing enregistré</label>
    <button onClick={save} className="rounded-xl bg-[#1B3A3A] px-4 py-2 text-sm font-medium text-white">{state==="saving"?"Enregistrement…":"Enregistrer"}</button>
    {state==="saved"&&<span className="ml-3 text-sm text-emerald-700">Enregistré ✓</span>}{state==="error"&&<span className="ml-3 text-sm text-red-700">Échec de l’enregistrement</span>}
  </div>;
}
