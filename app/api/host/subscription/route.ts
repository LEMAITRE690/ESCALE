// POST   /api/host/subscription — souscrire à la formule Abonnement
// DELETE /api/host/subscription — résilier l'abonnement en cours
//
// Les deux règles de calendrier sont tenues ici :
//   - une souscription prend effet au premier du mois suivant, jamais en
//     cours de mois ni rétroactivement ;
//   - une résiliation prend effet à la fin de la période déjà payée, l'hôte
//     repassant alors en formule Commission.
//
// Aucune bascule de formule n'est écrite dans cette route : elles le sont par
// les webhooks Stripe, seuls à savoir si le prélèvement a effectivement eu
// lieu. Voir app/api/stripe/webhook/route.ts.

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { stripe } from "@/lib/stripe/client";
import { creerSessionAbonnement } from "@/lib/stripe/subscription";

async function hoteConnecte() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function GET() {
  const user = await hoteConnecte();
  if (!user) {
    return NextResponse.json({ error: "Connectez-vous." }, { status: 401 });
  }

  // Vue absente tant que la migration 0029 n'est pas appliquée : on dégrade
  // vers la formule Commission plutôt que de faire échouer l'écran.
  const { data } = await supabaseAdmin
    .from("host_pricing_state")
    .select(
      "formule_active, formule_en_attente, prise_effet_en_attente, subscription_status, subscription_current_period_end"
    )
    .eq("host_id", user.id)
    .maybeSingle();

  return NextResponse.json({
    active: data?.formule_active ?? "commission",
    enAttente: data?.formule_en_attente ?? null,
    priseEffetEnAttente: data?.prise_effet_en_attente ?? null,
    statutAbonnement: data?.subscription_status ?? null,
    prochainPrelevement: data?.subscription_current_period_end ?? null,
  });
}

export async function POST(req: NextRequest) {
  const user = await hoteConnecte();
  if (!user) {
    return NextResponse.json({ error: "Connectez-vous." }, { status: 401 });
  }

  const { data: profil } = await supabaseAdmin
    .from("profiles")
    .select("email, stripe_customer_id, subscription_id, subscription_status")
    .eq("id", user.id)
    .maybeSingle();

  // Un abonnement encore actif ou en cours de régularisation interdit une
  // seconde souscription : l'hôte serait prélevé deux fois.
  if (profil?.subscription_id && ["active", "trialing", "past_due"].includes(profil.subscription_status ?? "")) {
    return NextResponse.json(
      { error: "Un abonnement est déjà en cours sur ce compte." },
      { status: 409 }
    );
  }

  try {
    const session = await creerSessionAbonnement({
      hostId: user.id,
      email: profil?.email ?? user.email ?? "",
      customerId: profil?.stripe_customer_id ?? null,
      origine: req.nextUrl.origin,
    });

    return NextResponse.json({ url: session.url });
  } catch (erreur: any) {
    return NextResponse.json(
      { error: erreur?.message ?? "Souscription impossible pour le moment." },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  const user = await hoteConnecte();
  if (!user) {
    return NextResponse.json({ error: "Connectez-vous." }, { status: 401 });
  }

  const { data: profil } = await supabaseAdmin
    .from("profiles")
    .select("subscription_id")
    .eq("id", user.id)
    .maybeSingle();

  if (!profil?.subscription_id) {
    return NextResponse.json({ error: "Aucun abonnement à résilier." }, { status: 404 });
  }

  try {
    // Résiliation en fin de période : l'hôte conserve le bénéfice du mois
    // qu'il a déjà réglé. Stripe émettra customer.subscription.deleted à
    // l'échéance, moment où la bascule en formule Commission est écrite.
    const abonnement = await stripe.subscriptions.update(profil.subscription_id, {
      cancel_at_period_end: true,
    });

    return NextResponse.json({
      resilieLe: new Date(abonnement.current_period_end * 1000).toISOString(),
    });
  } catch (erreur: any) {
    return NextResponse.json(
      { error: erreur?.message ?? "Résiliation impossible pour le moment." },
      { status: 500 }
    );
  }
}
