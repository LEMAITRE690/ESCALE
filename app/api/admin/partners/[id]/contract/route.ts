// GET /api/admin/partners/:id/contract
// Prégénère le contrat d'apporteur d'affaires d'une conciergerie, avec les
// informations des deux parties et les taux de rétrocommission déjà remplis.
//
// La fiche légale doit être complète : un contrat auquel il manquerait le
// SIRET ou le représentant d'une partie n'a pas d'objet.

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { verifierAdmin } from "@/lib/admin/auth";
import { genererContratApporteurPDF } from "@/lib/contracts/generateApporteurContract";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  if (!(await verifierAdmin())) {
    return NextResponse.json({ error: "Accès réservé aux administrateurs." }, { status: 403 });
  }

  const { data: partenaire } = await supabaseAdmin
    .from("partners")
    .select(
      "id, name, legal_name, legal_form, siret, registered_address, legal_rep_name, legal_rep_role"
    )
    .eq("id", params.id)
    .maybeSingle();

  if (!partenaire) {
    return NextResponse.json({ error: "Conciergerie introuvable." }, { status: 404 });
  }

  const { data: etat } = await supabaseAdmin
    .from("partner_legal_status")
    .select("fiche_complete")
    .eq("partner_id", params.id)
    .maybeSingle();

  if (!etat?.fiche_complete) {
    return NextResponse.json(
      { error: "Fiche légale incomplète : complétez-la avant de générer le contrat." },
      { status: 409 }
    );
  }

  const pdf = await genererContratApporteurPDF({
    conciergerie: {
      legalName: partenaire.legal_name,
      legalForm: partenaire.legal_form,
      siret: partenaire.siret,
      registeredAddress: partenaire.registered_address,
      repName: partenaire.legal_rep_name,
      repRole: partenaire.legal_rep_role,
    },
    // Contrat prégénéré, non signé : la date reste à compléter à la signature.
    dateSignature: null,
  });

  const nomFichier = (partenaire.legal_name ?? partenaire.name ?? "conciergerie")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^A-Za-z0-9]+/g, "-")
    .toLowerCase();

  return new NextResponse(new Uint8Array(pdf), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="contrat-apporteur-${nomFichier}.pdf"`,
    },
  });
}
