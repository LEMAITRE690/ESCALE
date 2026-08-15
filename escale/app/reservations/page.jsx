import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import MesReservationsClient from "@/components/MesReservationsClient";

export default async function PageMesReservations() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/connexion?suite=/reservations");
  }

  const { data: reservations } = await supabase
    .from("reservations")
    .select(`
      id, start_date, end_date, amount_total, status,
      listings ( id, title, city, cover_photo_url ),
      reviews ( id )
    `)
    .eq("guest_id", user.id)
    .order("start_date", { ascending: false });

  return <MesReservationsClient reservations={reservations ?? []} />;
}
