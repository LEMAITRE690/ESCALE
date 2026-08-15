import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

function fmtEUR(centimes) {
  return (centimes / 100).toLocaleString("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
}
function fmtDate(d) {
  return new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

export default async function PageConfirmationReservation({ params, searchParams }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/connexion?suite=/reservations/${params.id}`);
  }

  const { data: reservation, error } = await supabase
    .from("reservations")
    .select("id, start_date, end_date, guests, amount_total, status, guest_id, listings ( id, title, city, cover_photo_url )")
    .eq("id", params.id)
    .single();

  if (error || !reservation) {
    notFound();
  }
  if (reservation.guest_id !== user.id) {
    notFound(); // n'expose jamais l'existence d'une réservation à quelqu'un d'autre que son auteur
  }

  const statutParam = searchParams?.statut; // "paye" | "annule", passé par Stripe (voir success_url/cancel_url)
  const payee = reservation.status === "confirmee" || statutParam === "paye";
  const annulee = statutParam === "annule" && reservation.status === "en_attente";

  return (
    <div className="min-h-screen bg-[#F8F4EC] font-sans flex items-center justify-center px-5 py-12">
      <div className="w-full max-w-md">
        <div className="bg-[#FFFDF8] border border-[#E4DCC8] rounded-xl p-6 text-center">
          {payee ? (
            <>
              <div className="w-12 h-12 rounded-full bg-[#E1EEE9] flex items-center justify-center mx-auto mb-4">
                <span className="text-xl">✓</span>
              </div>
              <h1 className="font-serif text-xl text-[#1B3A3A] mb-1">Réservation confirmée</h1>
              <p className="text-sm text-[#6B5B4D] mb-5">
                Un e-mail de confirmation vous a été envoyé. Le paiement est retenu par Escale
                jusqu'au lendemain de la fin de votre séjour.
              </p>
            </>
          ) : annulee ? (
            <>
              <div className="w-12 h-12 rounded-full bg-[#F6DEDA] flex items-center justify-center mx-auto mb-4">
                <span className="text-xl">✕</span>
              </div>
              <h1 className="font-serif text-xl text-[#1B3A3A] mb-1">Paiement annulé</h1>
              <p className="text-sm text-[#6B5B4D] mb-5">
                Votre réservation n'a pas été confirmée. Aucun montant n'a été prélevé.
              </p>
            </>
          ) : (
            <>
              <div className="w-12 h-12 rounded-full bg-[#F6E4CE] flex items-center justify-center mx-auto mb-4">
                <span className="text-xl">⏳</span>
              </div>
              <h1 className="font-serif text-xl text-[#1B3A3A] mb-1">Paiement en cours de traitement</h1>
              <p className="text-sm text-[#6B5B4D] mb-5">
                Cette page se mettra à jour dès la confirmation par notre prestataire de paiement —
                actualisez dans quelques instants si besoin.
              </p>
            </>
          )}

          <div className="border-t border-[#EDE4D4] pt-4 text-left">
            <p className="text-sm font-medium text-[#1B3A3A]">{reservation.listings?.title}</p>
            <p className="text-xs text-[#8C7A66] mb-3">{reservation.listings?.city}</p>
            <div className="text-xs text-[#6B5B4D] space-y-1">
              <div className="flex justify-between">
                <span>Séjour</span>
                <span>{fmtDate(reservation.start_date)} → {fmtDate(reservation.end_date)}</span>
              </div>
              <div className="flex justify-between">
                <span>Voyageurs</span>
                <span>{reservation.guests}</span>
              </div>
              <div className="flex justify-between font-medium text-[#1B3A3A] pt-1.5 border-t border-[#EDE4D4] mt-1.5">
                <span>Total</span>
                <span>{fmtEUR(reservation.amount_total)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center gap-4 mt-5">
          <Link href="/reservations" className="text-sm text-[#2F6E6E] hover:text-[#1B3A3A] font-medium transition-colors">
            Mes réservations
          </Link>
          {annulee && (
            <Link href={`/logement/${reservation.listings?.id}`} className="text-sm text-[#2F6E6E] hover:text-[#1B3A3A] font-medium transition-colors">
              Retenter le paiement
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
