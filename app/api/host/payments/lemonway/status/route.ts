import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { retrievePayoutReadiness } from "@/lib/lemonway/client";

export async function GET() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Connectez-vous." }, { status: 401 });
  }

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("lemonway_account_id, lemonway_iban_id, lemonway_kyc_status, lemonway_iban_status, lemonway_onboarding_complete, lemonway_payout_enabled")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.lemonway_account_id) {
    return NextResponse.json({
      configured: false,
      onboardingComplete: false,
      payoutEnabled: false,
      message: "Le compte de paiement Lemonway n'est pas encore rattaché à cet hôte.",
    });
  }

  try {
    const readiness = await retrievePayoutReadiness(profile.lemonway_account_id);

    await supabaseAdmin
      .from("profiles")
      .update({
        lemonway_iban_id: readiness.ibanId,
        lemonway_kyc_status: readiness.kycStatus,
        lemonway_iban_status: readiness.ibanStatus,
        lemonway_onboarding_complete: readiness.onboardingComplete,
        lemonway_payout_enabled: readiness.payoutEnabled,
      })
      .eq("id", user.id);

    return NextResponse.json({
      configured: true,
      accountId: readiness.accountId,
      kycStatus: readiness.kycStatus,
      ibanId: readiness.ibanId,
      ibanStatus: readiness.ibanStatus,
      onboardingComplete: readiness.onboardingComplete,
      payoutEnabled: readiness.payoutEnabled,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        configured: true,
        onboardingComplete: profile.lemonway_onboarding_complete,
        payoutEnabled: profile.lemonway_payout_enabled,
        error: err?.message ?? "Synchronisation Lemonway impossible.",
      },
      { status: 502 }
    );
  }
}
