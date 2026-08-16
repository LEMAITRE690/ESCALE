// POST /api/partners/onboard
// Même logique que l'onboarding hôte (app/api/stripe/connect/onboard) :
// crée le compte Stripe Connect Express de la conciergerie et renvoie le
// lien d'onboarding hébergé, pour qu'elle puisse recevoir sa rétrocommission.

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabase/admin";
import { stripe } from "@/lib/stripe/client";

export async function POST(req: NextRequest) {
  const { partnerId } = await req.json();
  if (!partnerId) {
    return NextResponse.json({ error: "partnerId manquant" }, { status: 400 });
  }

  const { data: partenaire, error } = await supabase
    .from("partners")
    .select("id, name, email, stripe_account_id")
    .eq("id", partnerId)
    .single();

  if (error || !partenaire) {
    return NextResponse.json({ error: "Partenaire introuvable" }, { status: 404 });
  }

  let accountId = partenaire.stripe_account_id;

  if (!accountId) {
    const account = await stripe.accounts.create({
      type: "express",
      country: "FR",
      email: partenaire.email,
      capabilities: { card_payments: { requested: true }, transfers: { requested: true } },
      business_type: "company", // une conciergerie est généralement une société, pas un particulier
    });

    accountId = account.id;
    await supabase.from("partners").update({ stripe_account_id: accountId }).eq("id", partnerId);
  }

  const origin = req.headers.get("origin") ?? "https://escale.app";
  const accountLink = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: `${origin}/partenaire?onboarding=refresh`,
    return_url: `${origin}/partenaire?onboarding=complete`,
    type: "account_onboarding",
  });

  return NextResponse.json({ url: accountLink.url });
}
