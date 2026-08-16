import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

// Contrôle du rôle administrateur, partagé par les routes du back-office.
//
// Ce helper vit ici et non dans un fichier de route : Next.js n'autorise dans
// app/**/route.ts que les exports de méthodes HTTP et quelques options de
// configuration, tout autre export fait échouer la compilation.
export async function verifierAdmin() {
  const authClient = createClient();
  const {
    data: { user },
  } = await authClient.auth.getUser();
  if (!user) return null;

  const { data: profil } = await supabaseAdmin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  return profil?.role === "admin" ? user : null;
}
