import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import HoteDashboard from "@/components/HoteDashboard";

// Filet de sécurité en plus du middleware : même si le middleware laissait
// passer une requête sans session (mauvaise config, edge case), cette page
// re-vérifie côté serveur avant de rendre quoi que ce soit.
export default async function PageHote() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/connexion?suite=/hote");
  }

  const { data: profil } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", user.id)
    .single();

  // Les vraies annonces de l'hôte connecté — remplace la liste d'exemple
  // affichée par défaut dans "Mes annonces".
  const { data: annonces } = await supabase
    .from("listings")
    .select("id, title, city, status, photo_urls")
    .eq("host_id", user.id)
    .order("created_at", { ascending: false });

  const mesAnnonces = (annonces ?? []).map((a) => ({
    id: a.id,
    nom: a.title,
    ville: a.city,
    statut: a.status,
    nombrePhotos: Array.isArray(a.photo_urls) ? a.photo_urls.length : 0,
  }));

  // Réservations de toutes les annonces de l'hôte — alimente le calendrier,
  // le tableau des réservations et le montant "Revenus (mois en cours)".
  const idsAnnonces = (annonces ?? []).map((a) => a.id);
  const { data: reservationsBrutes } = idsAnnonces.length
    ? await supabase
        .from("reservations")
        .select("id, start_date, end_date, amount_total, status, guest_first_name")
        .in("listing_id", idsAnnonces)
        .order("start_date", { ascending: false })
    : { data: [] };

  const mesReservations = (reservationsBrutes ?? []).map((r) => ({
    id: r.id,
    voyageur: r.guest_first_name || "Voyageur",
    debut: r.start_date,
    fin: r.end_date,
    montant: (r.amount_total ?? 0) / 100,
    statut: r.status,
  }));

  function fmtDateLongue(d) {
    return new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
  }

  // Avis laissés sur les annonces de l'hôte — alimente "Avis voyageurs" et
  // permet d'y répondre réellement (PATCH /api/reviews/:id/reply).
  const { data: avisBruts } = idsAnnonces.length
    ? await supabase
        .from("reviews")
        .select("id, guest_display_name, rating, comment, host_reply, created_at, listings ( title )")
        .in("listing_id", idsAnnonces)
        .order("created_at", { ascending: false })
    : { data: [] };

  const mesAvis = (avisBruts ?? []).map((a) => ({
    id: a.id,
    annonce: a.listings?.title ?? "",
    voyageur: a.guest_display_name,
    date: fmtDateLongue(a.created_at),
    note: a.rating,
    texte: a.comment || "",
    reponse: a.host_reply || "",
  }));

  // Signalements d'équipement (pannes ou dommages reconnus) sur les
  // annonces de l'hôte — alimente "Équipements signalés" et permet de
  // changer leur statut réellement (PATCH /api/equipment-reports/:id).
  const { data: signalementsBruts } = idsAnnonces.length
    ? await supabase
        .from("equipment_reports")
        .select("id, item_name, description, status, host_note, fault_acknowledged, created_at, listings ( title ), profiles ( full_name )")
        .in("listing_id", idsAnnonces)
        .order("created_at", { ascending: false })
    : { data: [] };

  const mesSignalements = (signalementsBruts ?? []).map((s) => ({
    id: s.id,
    annonce: s.listings?.title ?? "",
    voyageur: s.profiles?.full_name || "Voyageur",
    equipement: s.item_name,
    description: s.description || "",
    date: fmtDateLongue(s.created_at),
    statut: s.status,
    note: s.host_note || "",
    dommageReconnu: !!s.fault_acknowledged,
  }));

  // Co-hôtes rattachés aux annonces de l'hôte — alimente l'écran "Co-hôtes"
  // par annonce, avec statut et niveau réels. Les valeurs de `level`/`status`
  // en base correspondent directement aux identifiants utilisés côté
  // interface (gestion_complete/operationnel/messagerie_seule).
  const { data: coHotesBruts } = idsAnnonces.length
    ? await supabase
        .from("co_hosts")
        .select("id, listing_id, co_host_email, level, status, profiles ( full_name )")
        .in("listing_id", idsAnnonces)
    : { data: [] };

  const mesCoHotes = {};
  for (const c of coHotesBruts ?? []) {
    if (!mesCoHotes[c.listing_id]) mesCoHotes[c.listing_id] = [];
    mesCoHotes[c.listing_id].push({
      id: c.id,
      email: c.co_host_email,
      nom: c.profiles?.full_name || "",
      niveau: c.level,
      statut: c.status,
    });
  }

  // Statut super-hôte actif éventuel d'une conciergerie sur cet hôte —
  // alimente le bloc "Conciergerie partenaire". Un seul octroi actif à la
  // fois dans l'interface actuelle, même si le schéma en autoriserait
  // plusieurs (un hôte pourrait en théorie être rattaché à plusieurs
  // conciergeries différentes).
  const { data: octroiActif } = await supabase
    .from("partner_host_grants")
    .select("id, partners ( name )")
    .eq("host_id", user.id)
    .eq("status", "actif")
    .order("granted_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const monPartenaire = octroiActif
    ? { nom: octroiActif.partners?.name ?? "Conciergerie", grantId: octroiActif.id }
    : null;

  // Documents justificatifs de l'hôte (identité, domicile, propriété/mandat,
  // assurance) — alimente le bloc "Documents requis". On garde le document
  // le plus récent par type ; les documents liés à une annonce précise
  // (titre de propriété, assurance) sont ceux de la première annonce
  // trouvée pour l'instant — cette section reste globale au compte plutôt
  // que déclinée annonce par annonce dans cette version de l'interface.
  const { data: documentsBruts } = await supabase
    .from("host_documents")
    .select("id, document_type, status, note_admin, uploaded_at")
    .eq("host_id", user.id)
    .order("uploaded_at", { ascending: false });

  const mesDocuments = {};
  for (const d of documentsBruts ?? []) {
    if (!mesDocuments[d.document_type]) {
      mesDocuments[d.document_type] = { status: d.status, noteAdmin: d.note_admin };
    }
  }

  // Revenus des 6 derniers mois — somme de payments.amount_host (part
  // effectivement reversée à l'hôte, commission déjà déduite) groupée par
  // mois de paiement. Supabase-js ne fait pas de GROUP BY côté requête :
  // on récupère les paiements bruts sur la période et on agrège côté serveur.
  const NOMS_MOIS = ["Jan.", "Fév.", "Mars", "Avr.", "Mai", "Juin", "Juil.", "Août", "Sept.", "Oct.", "Nov.", "Déc."];
  const aujourdHui = new Date();
  const sixMoisAvant = new Date(aujourdHui.getFullYear(), aujourdHui.getMonth() - 5, 1);

  const { data: paiementsBruts } = await supabase
    .from("payments")
    .select("amount_host, created_at")
    .eq("host_id", user.id)
    .eq("status", "succeeded")
    .gte("created_at", sixMoisAvant.toISOString());

  const revenusParMois = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(aujourdHui.getFullYear(), aujourdHui.getMonth() - i, 1);
    revenusParMois.push({ cle: `${d.getFullYear()}-${d.getMonth()}`, mois: NOMS_MOIS[d.getMonth()], montant: 0 });
  }
  for (const p of paiementsBruts ?? []) {
    const d = new Date(p.created_at);
    const cle = `${d.getFullYear()}-${d.getMonth()}`;
    const entree = revenusParMois.find((m) => m.cle === cle);
    if (entree) entree.montant += (p.amount_host ?? 0) / 100;
  }
  const mesRevenusMensuels = revenusParMois.map(({ mois, montant }) => ({ mois, montant: Math.round(montant) }));

  // Acceptation de la version des CGV actuellement en vigueur. En l'absence de
  // toute version publiée, la fonction n'existe pas encore (migration 0031) ou
  // ne renvoie rien : on ne bloque alors personne.
  const { data: cgvAcceptee } = await supabase.rpc("a_accepte_version_en_vigueur", {
    p_user_id: user.id,
    p_type: "cgv_hotes",
  });

  const { data: cgvEnVigueur } = await supabase
    .from("legal_documents_en_vigueur")
    .select("id")
    .eq("type", "cgv_hotes")
    .maybeSingle();

  return (
    <HoteDashboard
      cgvAcceptee={!cgvEnVigueur || cgvAcceptee === true}
      role={profil?.role ?? "voyageur"}
      nomUtilisateur={profil?.full_name ?? ""}
      mesAnnonces={mesAnnonces}
      mesReservations={mesReservations}
      mesAvis={mesAvis}
      mesSignalements={mesSignalements}
      mesCoHotes={mesCoHotes}
      monPartenaire={monPartenaire}
      mesDocuments={mesDocuments}
      mesRevenusMensuels={mesRevenusMensuels}
    />
  );
}
