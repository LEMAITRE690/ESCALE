import Link from "next/link";
import { BadgeEuro, ShieldCheck } from "lucide-react";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import DetailLogementClient from "@/components/DetailLogementClient";

const EQUIPEMENTS_CONNUS = ["wifi", "parking", "cuisine", "clim", "piscine"];

function versLogement(l) {
  const anneeCreation = l.profiles?.created_at
    ? new Date(l.profiles.created_at).getFullYear()
    : new Date().getFullYear();

  return {
    id: l.id,
    nom: l.title,
    ville: [l.city, "France"].filter(Boolean).join(", "),
    type: l.type,
    note: Number(l.average_rating) || 0,
    avis: l.review_count || 0,
    voyageurs: l.guests,
    chambres: l.bedrooms,
    sallesDeBain: l.bathrooms,
    prix: Number(l.price_per_night),
    fraisMenage: l.cleaning_fee ? Number(l.cleaning_fee) : 0,
    fraisAnimaux: l.pets_fee ? Number(l.pets_fee) : 0,
    animauxAcceptes: !!l.pets_allowed,
    fumeursAcceptes: !!l.smoking_allowed,
    evenementsAutorises: !!l.events_allowed,
    enfantsBienvenus: !!l.children_welcome,
    reservationInstantanee: !!l.instant_booking,
    heureArrivee: "15:00",
    heureDepart: "11:00",
    departTardif: !!l.late_checkout_available,
    fraisDepartTardif: l.late_checkout_fee ? Number(l.late_checkout_fee) : 0,
    politiqueAnnulation: l.cancellation_policy || "moderee",
    sejourMin: l.min_stay_nights || 1,
    description: l.description || "",
    equipements: (Array.isArray(l.amenities) ? l.amenities : []).filter((e) => EQUIPEMENTS_CONNUS.includes(e)),
    hote: {
      nom: l.profiles?.full_name || "Hôte Escale",
      depuis: anneeCreation,
      tempsReponse: "quelques heures",
    },
    photos: Array.isArray(l.photo_urls) && l.photo_urls.length > 0 ? l.photo_urls.length : 1,
    prixJuste: !!l.fair_price_charter,
  };
}

function versAvis(reviews) {
  return (reviews ?? []).map((r) => ({
    nom: r.guest_display_name,
    date: new Date(r.created_at).toLocaleDateString("fr-FR", { month: "long", year: "numeric" }),
    note: r.rating,
    texte: r.comment || "",
    reponseHote: r.host_reply || "",
  }));
}

export default async function PageDetailLogement({ params }) {
  const supabase = createClient();

  const { data: ligne, error } = await supabase
    .from("listings")
    .select("*, profiles ( full_name, created_at )")
    .eq("id", params.id)
    .eq("status", "actif")
    .single();

  if (error || !ligne) notFound();

  const { data: avis } = await supabase
    .from("reviews")
    .select("guest_display_name, rating, comment, created_at, host_reply")
    .eq("listing_id", params.id)
    .order("created_at", { ascending: false })
    .limit(20);

  return (
    <>
      {ligne.fair_price_charter && (
        <div className="border-b border-[#D7CCB9] bg-[#F1E7D6]">
          <div className="mx-auto flex max-w-6xl flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-full bg-[#173C3A] text-white"><BadgeEuro size={18}/></span>
              <div><p className="font-semibold text-[#173C3A]">Prix Juste Escale</p><p className="text-sm text-[#6B5B4D]">Cet hôte déclare proposer sur Escale un tarif au moins 5 % plus avantageux que sur les plateformes traditionnelles, à conditions comparables.</p></div>
            </div>
            <Link href="/charte-prix-juste" className="inline-flex items-center gap-1.5 text-sm font-medium text-[#173C3A] underline underline-offset-4"><ShieldCheck size={14}/> Comprendre l’engagement</Link>
          </div>
        </div>
      )}
      <DetailLogementClient logement={versLogement(ligne)} avisListe={versAvis(avis)} />
    </>
  );
}
