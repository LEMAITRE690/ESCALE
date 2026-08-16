import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Client Supabase à privilèges élevés (service role), utilisé par les routes
// d'API qui doivent contourner les politiques RLS : crons, webhooks Stripe,
// back-office admin, cautions.
//
// Pourquoi un accès différé plutôt qu'un `createClient()` en tête de module :
// `next build` importe chaque module de route pendant l'étape « Collecting
// page data ». Une instanciation au chargement du module s'exécute donc à la
// construction, où les variables d'environnement ne sont pas nécessairement
// disponibles, et fait échouer tout le build sur « supabaseUrl is required ».
// Ici l'instanciation n'a lieu qu'au premier accès à une propriété, c'est-à-
// dire au traitement d'une requête. Un défaut de configuration devient une
// erreur de cette route à l'exécution, au lieu d'un build cassé.
//
// Les clés restent évidemment indispensables au fonctionnement : ce module
// repousse l'échec, il ne le supprime pas.

let instance: SupabaseClient | null = null;

function resoudre(): SupabaseClient {
  if (!instance) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const cleService = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !cleService) {
      throw new Error(
        "Configuration Supabase incomplète : NEXT_PUBLIC_SUPABASE_URL et " +
          "SUPABASE_SERVICE_ROLE_KEY doivent être définies dans l'environnement."
      );
    }

    instance = createClient(url, cleService);
  }

  return instance;
}

// Le Proxy conserve l'ergonomie d'un client classique (`supabaseAdmin.from(...)`)
// sans rien instancier tant qu'aucune propriété n'est lue.
export const supabaseAdmin: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_cible, propriete) {
    const client = resoudre();
    const valeur = (client as any)[propriete];
    return typeof valeur === "function" ? valeur.bind(client) : valeur;
  },
});
