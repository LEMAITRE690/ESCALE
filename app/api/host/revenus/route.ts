// GET /api/host/revenus
//
// Récapitulatif comptable de l'hôte connecté : pour chaque séjour payé, le
// montant réglé par le voyageur, la commission Escale supportée, le net
// reversé, la date de reversement (effective ou prévisionnelle) et la facture
// de commission lorsqu'elle a été émise.
//
// La rétrocommission conciergerie n'est jamais exposée : elle est postérieure
// à la commission et interne à Escale. Seule la commission totale supportée
// par l'hôte est renvoyée.

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

// Aligné sur DELAI_RETENTION_JOURS du cron de reversement.
const DELAI_RETENTION_JOURS = 1;

function dateReversementPrevue(finSejour: string): string {
  const d = new Date(finSejour);
  d.setDate(d.getDate() + DELAI_RETENTION_JOURS);
  return d.toISOString();
}

export async function GET() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Connectez-vous." }, { status: 401 });
  }

  const { data, error } = await supabaseAdmin
    .from("payments")
    .select(
      `id, amount_total, platform_fee, partner_fee, amount_host, currency,
       transferred_at, created_at,
       reservations ( id, start_date, end_date, tourist_tax_amount,
                      listings ( title, city ) ),
       commission_invoices ( id, invoice_number, issued_at,
                             amount_ht, vat_amount, amount_ttc, vat_rate )`
    )
    .eq("host_id", user.id)
    .eq("status", "succeeded")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: "Lecture des revenus impossible." }, { status: 500 });
  }

  const lignes = (data ?? []).map((p: any) => {
    const reservation = p.reservations;
    const logement = reservation?.listings;
    // Supabase renvoie l'entité liée sous forme de tableau ou d'objet selon la
    // cardinalité détectée : on normalise dans les deux cas.
    const facture = Array.isArray(p.commission_invoices)
      ? p.commission_invoices[0] ?? null
      : p.commission_invoices ?? null;

    return {
      paiementId: p.id,
      reservationId: reservation?.id ?? null,
      logement: [logement?.title, logement?.city].filter(Boolean).join(" — ") || "Logement",
      debut: reservation?.start_date ?? null,
      fin: reservation?.end_date ?? null,

      montantVoyageur: p.amount_total,
      taxeSejour: reservation?.tourist_tax_amount ?? 0,
      // Commission totale supportée par l'hôte, rétrocommission incluse.
      commission: p.platform_fee + (p.partner_fee ?? 0),
      netReverse: p.amount_host,

      reverse: !!p.transferred_at,
      reverseLe: p.transferred_at,
      reversementPrevuLe: p.transferred_at
        ? null
        : reservation?.end_date
          ? dateReversementPrevue(reservation.end_date)
          : null,

      facture: facture
        ? {
            id: facture.id,
            numero: facture.invoice_number,
            emiseLe: facture.issued_at,
            ht: facture.amount_ht,
            tva: facture.vat_amount,
            ttc: facture.amount_ttc,
            tauxTva: Number(facture.vat_rate),
          }
        : null,
    };
  });

  const totaux = lignes.reduce(
    (acc, l) => {
      acc.commission += l.commission;
      if (l.reverse) acc.dejaReverse += l.netReverse;
      else acc.aVenir += l.netReverse;
      return acc;
    },
    { commission: 0, dejaReverse: 0, aVenir: 0 }
  );

  return NextResponse.json({ lignes, totaux });
}
