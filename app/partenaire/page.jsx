import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import PartenaireDashboardClient from "@/components/PartenaireDashboardClient";

export default async function PagePartenaire() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/connexion?suite=/partenaire");
  }

  const { data: partenaire } = await supabase
    .from("partners")
    .select("id, name, email, referral_code, stripe_onboarding_complete")
    .eq("owner_user_id", user.id)
    .maybeSingle();

  if (!partenaire) {
    return (
      <div className="min-h-screen bg-[#F8F4EC] font-sans flex items-center justify-center px-5 py-12">
        <div className="max-w-sm text-center">
          <h1 className="font-serif text-xl text-[#1B3A3A] mb-2">Aucun espace conciergerie</h1>
          <p className="text-sm text-[#6B5B4D]">
            Ce compte n'est associé à aucune conciergerie partenaire sur Escale. Contactez
            l'équipe Escale si vous pensez qu'il s'agit d'une erreur.
          </p>
        </div>
      </div>
    );
  }

  // Hôtes ayant accordé un accès super-hôte actif à cette conciergerie,
  // avec leurs annonces — c'est tout le portefeuille géré par la conciergerie.
  const { data: octrois } = await supabase
    .from("partner_host_grants")
    .select("id, granted_at, profiles ( id, full_name, email )")
    .eq("partner_id", partenaire.id)
    .eq("status", "actif")
    .order("granted_at", { ascending: false });

  const hostIds = (octrois ?? []).map((o) => o.profiles?.id).filter(Boolean);

  const { data: annonces } = hostIds.length
    ? await supabase
        .from("listings")
        .select("id, title, city, status, host_id, price_per_night")
        .in("host_id", hostIds)
    : { data: [] };

  const { data: resume } = await supabase
    .from("partner_commission_summary")
    .select("*")
    .eq("partner_id", partenaire.id)
    .maybeSingle();

  const { data: paiements } = await supabase
    .from("payments")
    .select("id, reservation_id, partner_fee, partner_transferred_at, created_at")
    .eq("partner_id", partenaire.id)
    .eq("status", "succeeded")
    .order("created_at", { ascending: false })
    .limit(20);

  return (
    <PartenaireDashboardClient
      partenaire={partenaire}
      octrois={octrois ?? []}
      annonces={annonces ?? []}
      resume={resume ?? { reservation_count: 0, total_earned: 0, total_transferred: 0, total_pending: 0 }}
      paiements={paiements ?? []}
    />
  );
}
