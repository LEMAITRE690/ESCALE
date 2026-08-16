// POST /api/stripe/connect/onboard
// Crée (si besoin) le compte Stripe Connect Express de l'hôte connecté,
// puis renvoie un lien d'onboarding hébergé par Stripe.

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabase/admin";
import { stripe } from "@/lib/stripe/client";

export async function POST(req: NextRequest) {
  const { userId } = await req.json();
  if (!userId) {
    return NextResponse.json({ error: "userId manquant" }, { status: 400 });
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, email, stripe_account_id")
    .eq("id", userId)
    .single();

  if (error || !profile) {
    return NextResponse.json({ error: "Profil introuvable" }, { status: 404 });
  }

  let accountId = profile.stripe_account_id;

  // 1. Créer le compte connecté s'il n'existe pas encore
  if (!accountId) {
    const account = await stripe.accounts.create({
      type: "express",
      country: "FR",
      email: profile.email,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      business_type: "individual",
    });

    accountId = account.id;

    await supabase
      .from("profiles")
      .update({ stripe_account_id: accountId })
      .eq("id", userId);
  }

  // 2. Générer le lien d'onboarding hébergé (formulaire Stripe)
  const origin = req.headers.get("origin") ?? "https://escale.app";
  const accountLink = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: `${origin}/api/stripe/connect/refresh?userId=${userId}`,
    return_url: `${origin}/hote/parametres/paiements?onboarding=complete`,
    type: "account_onboarding",
  });

  return NextResponse.json({ url: accountLink.url });
}
