// GET /api/host/invoices/:id — télécharge une facture de commission au format PDF.
//
// Le PDF est recomposé à la demande à partir de la facture enregistrée : ce
// sont les montants figés à l'émission qui font foi, jamais un recalcul au
// taux courant. Un changement de grille tarifaire ne réécrit donc pas les
// factures passées.

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { genererFactureCommissionPDF } from "@/lib/invoices/generateCommissionInvoice";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Connectez-vous." }, { status: 401 });
  }

  // RLS : cette lecture ne peut renvoyer qu'une facture appartenant à l'hôte
  // connecté. Un identifiant valide mais appartenant à un autre hôte donne
  // « introuvable », sans divulguer son existence.
  const { data: facture } = await supabase
    .from("commission_invoices")
    .select(
      "id, payment_id, host_id, invoice_number, issued_at, amount_ttc, amount_ht, vat_amount, vat_rate, platform_fee, partner_fee"
    )
    .eq("id", params.id)
    .maybeSingle();

  if (!facture) {
    return NextResponse.json({ error: "Facture introuvable." }, { status: 404 });
  }

  // Contexte du séjour : jointures traversant plusieurs tables, lues avec la
  // clé service_role après le contrôle d'accès ci-dessus.
  const { data: paiement } = await supabaseAdmin
    .from("payments")
    .select(
      `transferred_at,
       reservations ( id, start_date, end_date, amount_total, tourist_tax_amount,
                      listings ( title, city ) )`
    )
    .eq("id", facture.payment_id)
    .single();

  const { data: profil } = await supabaseAdmin
    .from("profiles")
    .select("full_name, email")
    .eq("id", facture.host_id)
    .maybeSingle();

  const reservation = (paiement as any)?.reservations;
  const logement = reservation?.listings;

  const pdf = await genererFactureCommissionPDF({
    numero: facture.invoice_number,
    emiseLe: facture.issued_at,
    hote: {
      nom: profil?.full_name ?? "Hôte Escale",
      email: profil?.email ?? null,
    },
    reservation: {
      id: reservation?.id ?? facture.payment_id,
      logement: [logement?.title, logement?.city].filter(Boolean).join(" — ") || "Logement",
      debut: reservation?.start_date ?? facture.issued_at,
      fin: reservation?.end_date ?? facture.issued_at,
      montantTotal: reservation?.amount_total ?? 0,
      taxeSejour: reservation?.tourist_tax_amount ?? 0,
    },
    montants: {
      ttc: facture.amount_ttc,
      ht: facture.amount_ht,
      tva: facture.vat_amount,
      tauxTva: Number(facture.vat_rate),
      platformFee: facture.platform_fee,
      partnerFee: facture.partner_fee,
    },
    reverseLe: (paiement as any)?.transferred_at ?? null,
  });

  return new NextResponse(new Uint8Array(pdf), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="facture-${facture.invoice_number}.pdf"`,
    },
  });
}
