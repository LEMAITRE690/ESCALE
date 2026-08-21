import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function requireAdmin(next = "/admin") {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/connexion?suite=${encodeURIComponent(next)}`);

  const allowed = new Set([
    ...(process.env.ADMIN_EMAILS || "").split(","),
    process.env.DEMO_ADMIN_EMAIL || "",
  ].map((v) => v.trim().toLowerCase()).filter(Boolean));

  if (!user?.email || !allowed.has(user.email.toLowerCase())) redirect("/");
  return user;
}
