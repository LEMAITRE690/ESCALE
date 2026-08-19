'use client';
import {useState} from 'react';
export default function DemoSeedButton(){
 const [state,setState]=useState({loading:false,message:''});
 async function run(){
  if(!confirm('Créer ou réinitialiser les données de démonstration ESCALE ?')) return;
  setState({loading:true,message:''});
  try{const r=await fetch('/api/admin/demo/seed',{method:'POST'});const j=await r.json();if(!r.ok)throw new Error(j.error||'Échec');setState({loading:false,message:`Démo prête : ${j.logements} logements, ${j.reservations} réservations, ${j.paiements} paiements. Compte : ${j.email}`});}
  catch(e){setState({loading:false,message:e.message||'Erreur'});}
 }
 return <div><button onClick={run} disabled={state.loading} className="rounded-xl bg-[#1B3A3A] px-5 py-3 font-medium text-white disabled:opacity-50">{state.loading?'Création en cours…':'Installer les données de démo'}</button>{state.message&&<p className="mt-4 rounded-xl bg-stone-100 p-4 text-sm">{state.message}</p>}</div>;
}
