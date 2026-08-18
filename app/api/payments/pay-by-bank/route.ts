import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin as supabase } from "@/lib/supabase/admin";
import { initiatePayByBank } from "@/lib/lemonway/client";
import { computeFees } from "@/lib/stripe/client";
import type { FormuleTarifaire } from "@/lib/pricing";

function clientIp(req: NextRequest) {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || req.headers.get("x-real-ip")
    || "127.0.0.1";
}

export async function POST(req: NextRequest) {
  if (process.env.NEXT_PUBLIC_PAY_BY_BANK_ENABLED !== "true") {
    return NextResponse.json({ error: "Le paiement bancaire n'est pas encore activé." }, { status: 503 });
  }

  const auth = createClient();
  const { data: { user } } = await auth.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Connectez-vous pour payer cette réservation." }, { status: 401 });
  }

  const { reservationId, bankId } = await req.json();
  if (!reservationId) {
    return NextResponse.json({ error: "Réservation requise." }, { status: 400 });
  }

  const { data: reservation, error } = await supabase
    .from("reservations")
    .select("id, guest_id, status, amount_total, tourist_tax_amount, start_date, listings(host_id, title)")
    .eq("id", reservationId)
    .single();

  if (error || !reservation || reservation.guest_id !== user.id) {
    return NextResponse.json({ error: "Réservation introuvable." }, { status: 404 });
  }
  if (reservation.status !== "en_attente") {
    return NextResponse.json({ error: "Cette réservation ne peut plus être payée." }, { status: 409 });
  }
  if (!Number.isInteger(reservation.amount_total) || reservation.amount_total < 100) {
    return NextResponse.json({ error: "Montant incompatible avec Pay by Bank." }, { status: 422 });
  }
  // Limite publique Lemonway Pay by Bank actuellement documentée : 15 000 €.
  if (reservation.amount_total > 1_500_000) {
    return NextResponse.json({
      error: "Cette réservation dépasse la limite Pay by Bank. Utilisez la carte ou contactez le support.",
    }, { status: 422 });
  }

  const hostId = (reservation as any).listings?.host_id;
  if (!hostId) {
    return NextResponse.json({ error: "Hôte introuvable." }, { status: 422 });
  }

  const collectionAccountId = process.env.LEMONWAY_COLLECTION_ACCOUNT_ID;
  if (!collectionAccountId) {
    return NextResponse.json({ error: "Configuration Lemonway incomplète." }, { status: 503 });
  }

  const { data: formuleLue } = await supabase.rpc("formule_hote_a", {
    p_host_id: hostId,
    p_date: reservation.start_date,
  });
  const formule = (formuleLue as FormuleTarifaire) ?? "commission";

  const { data: octroiActif } = await supabase
    .from("partner_host_grants")
    .select("partner_id")
    .eq("host_id", hostId)
    .eq("status", "actif")
    .maybeSingle();

  const partnerId = octroiActif?.partner_id ?? null;
  const breakdown = computeFees(reservation.amount_total, {
    hasPartner: !!partnerId,
    touristTaxAmount: reservation.tourist_tax_amount ?? 0,
    formule,
  });

  const origine = process.env.NEXT_PUBLIC_SITE_URL || req.nextUrl.origin;
  const reference = `resa-${reservationId}`.slice(0, 50);

  try {
    const payment = await initiatePayByBank({
      amount: reservation.amount_total,
      accountId: collectionAccountId,
      reference,
      comment: `Reservation ${reservationId}`,
      returnUrl: `${origine}/api/payments/lemonway/return?reservationId=${reservationId}&outcome=return`,
      errorUrl: `${origine}/api/payments/lemonway/return?reservationId=${reservationId}&outcome=error`,
      cancelUrl: `${origine}/api/payments/lemonway/return?reservationId=${reservationId}&outcome=cancel`,
      ip: clientIp(req),
      userAgent: req.headers.get("user-agent") || "Escale",
      countryCode: "FR",
      bankId: bankId || undefined,
    });

    const { error: ledgerError } = await supabase.from("payments").insert({
      reservation_id: reservationId,
      host_id: hostId,
      stripe_payment_intent_id: null,
      provider_payment_id: payment.id,
      payment_provider: "lemonway",
      payment_channel: "pay_by_bank",
      amount_total: reservation.amount_total,
      platform_fee: breakdown.platformFee,
      partner_id: partnerId,
      partner_fee: partnerId ? breakdown.partnerFee : null,
      amount_host: breakdown.amountHost,
      tourist_tax_held: breakdown.touristTaxHeld,
      currency: "eur",
      status: "pending",
      pricing_plan: formule,
      commission_rate_applied: breakdown.tauxCommission,
    });

    if (ledgerError) {
      return NextResponse.json({ error: "Impossible d'enregistrer le paiement." }, { status: 500 });
    }

    return NextResponse.json({
      provider: "lemonway",
      channel: "pay_by_bank",
      providerPaymentId: payment.id,
      url: payment.redirectUrl,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Paiement bancaire indisponible." }, { status: 502 });
  }
}
