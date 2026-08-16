// GET /api/host/invoices — liste les factures de commission de l'hôte connecté.
//
// La politique RLS de commission_invoices restreint déjà la lecture aux
// factures dont host_id vaut auth.uid() : le client authentifié suffit, aucun
// filtre supplémentaire n'est nécessaire.

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Connectez-vous." }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("commission_invoices")
    .select(
      "id, invoice_number, issued_at, amount_ht, vat_amount, amount_ttc, vat_rate, currency"
    )
    .order("issued_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: "Lecture des factures impossible." }, { status: 500 });
  }

  return NextResponse.json({ factures: data ?? [] });
}
