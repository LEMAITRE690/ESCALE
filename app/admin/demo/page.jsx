import {redirect} from 'next/navigation';
import {createClient} from '@/lib/supabase/server';
import DemoSeedButton from './DemoSeedButton';
export default async function AdminDemo(){
 const supabase=createClient();const {data:{user}}=await supabase.auth.getUser();
 const allowed=process.env.DEMO_ADMIN_EMAIL?.toLowerCase();
 if(!user) redirect('/connexion?suite=/admin/demo');
 if(!allowed||user.email?.toLowerCase()!==allowed) redirect('/');
 return <main className="min-h-screen bg-[#F7F5F0] p-6"><div className="mx-auto max-w-2xl rounded-2xl border border-stone-200 bg-white p-7"><p className="text-sm font-medium text-[#2F6E6E]">Administration ESCALE</p><h1 className="mt-2 text-3xl font-semibold text-[#1B3A3A]">Données de démonstration</h1><p className="mt-3 text-stone-600">Crée un hôte de démonstration, 3 logements, 4 voyageurs, 7 réservations, des paiements simulés, des charges et des documents CRM. Une nouvelle exécution réinitialise uniquement les données marquées DEMO.</p><div className="mt-6"><DemoSeedButton/></div><div className="mt-6 rounded-xl bg-amber-50 p-4 text-sm text-amber-900"><b>Sécurité :</b> cette page n'est accessible qu'à l'adresse définie dans <code>DEMO_ADMIN_EMAIL</code>. Le mot de passe du compte démo reste dans la variable serveur <code>DEMO_PASSWORD</code> et n'est jamais affiché dans le navigateur.</div></div></main>;
}
