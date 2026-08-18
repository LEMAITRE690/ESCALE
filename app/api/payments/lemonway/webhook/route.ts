import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabase/admin";
import { retrieveMoneyIn } from "@/lib/lemonway/client";

function firstValue(payload: Record<string, any>, keys: string[]) {
  for (const key of keys) {
    const value = payload[key];
    if (value !== undefined && value !== null && String(value).length) return String(value);
  }
  return null;
}

async function parsePayload(req: NextRequest): Promise<Record<string, any>> {
  const raw = await req.text();
  const contentType = req.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    try { return JSON.parse(raw); } catch { return {}; }
  }
  return Object.fromEntries(new URLSearchParams(raw).entries());
}

/**
 * Notification Lemonway.
 * Important : le payload reçu n'est jamais utilisé comme preuve de paiement.
 * Il sert uniquement à retrouver l'identifiant Lemonway, puis ESCALE relit
 * la transaction auprès de l'API Lemonway avec OAuth avant toute écriture.
 */
export async function POST(req: NextRequest) {
  if (process.env.NEXT_PUBLIC_PAY_BY_BANK_ENABLED !== "true") {
    return NextResponse.json({ received: true, ignored: "pay_by_bank_disabled" });
  }

  const payload = await parsePayload(req);
  const transactionId = firstValue(payload, [
    "response_transacctionid", // orthographe présente dans la documentation Lemonway
    "response_transactionid",
    "transactionId",
    "transaction_id",
    "id",
  ]);

  if (!transactionId) {
    // ACK pour éviter une boucle de retry sur un événement non exploitable.
    return NextResponse.json({ received: true, ignored: "missing_transaction_id" });
  }

  const { data: paiement } = await supabase
    .from("payments")
    .select("id, reservation_id, amount_total, status")
    .eq("payment_provider", "lemonway")
    .eq("provider_payment_id", transactionId)
    .maybeSingle();

  if (!paiement) {
    return NextResponse.json({ received: true, ignored: "unknown_transaction" });
  }

  try {
    const verified = await retrieveMoneyIn(
      transactionId,
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1",
      req.headers.get("user-agent") || "Escale Lemonway webhook"
    );

    // Si Lemonway retourne un montant, il doit correspondre au centime près au
    // grand livre ESCALE. Une divergence bloque automatiquement la confirmation.
    if (verified.amount != null && verified.amount !== paiement.amount_total) {
      return NextResponse.json({ received: true, error: "amount_mismatch" }, { status: 409 });
    }

    // Codes Lemonway documentés pour Pay by Bank :
    // 0 Success, 4 Pending, 16 Authorized, 6 Error.
    if (verified.status === 0) {
      await supabase
        .from("payments")
        .update({ status: "succeeded" })
        .eq("id", paiement.id);

      await supabase
        .from("reservations")
        .update({ status: "confirmee" })
        .eq("id", paiement.reservation_id)
        .eq("status", "en_attente");

      return NextResponse.json({ received: true, verified: "succeeded" });
    }

    if (verified.status === 6) {
      await supabase
        .from("payments")
        .update({ status: "failed" })
        .eq("id", paiement.id)
        .neq("status", "succeeded");
      return NextResponse.json({ received: true, verified: "failed" });
    }

    return NextResponse.json({
      received: true,
      verified: verified.status === 16 ? "authorized" : "pending",
    });
  } catch (err: any) {
    // Non-200 volontaire : Lemonway pourra retenter la notification. Aucun état
    // financier n'est modifié si la vérification API échoue.
    return NextResponse.json(
      { received: false, error: err?.message || "verification_failed" },
      { status: 502 }
    );
  }
}
