// Identité d'un voyageur telle qu'affichée à un hôte.
//
// Le dépôt ne montre jamais le nom complet d'un voyageur ailleurs que sur son
// propre compte : les avis affichent « Julien M. », l'export iCal et le
// contrat de location n'utilisent que le prénom. La fiche CRM suit la même
// règle — l'hôte reconnaît son voyageur sans que la plateforme diffuse son
// état civil.
export function nomAffiche(nomComplet?: string | null): string {
  const parties = (nomComplet ?? "").trim().split(/\s+/).filter(Boolean);
  if (parties.length === 0) return "Voyageur";
  if (parties.length === 1) return parties[0];
  return `${parties[0]} ${parties[parties.length - 1][0].toUpperCase()}.`;
}

/** Libellés des options de séjour dont on déduit les préférences. */
export const LIBELLES_PREFERENCES: Record<string, string> = {
  animal: "Voyage avec un animal",
  famille: "Séjourne en famille",
  solo: "Voyage seul",
  couple: "Voyage en couple",
  courts_sejours: "Privilégie les courts séjours",
  longs_sejours: "Privilégie les longs séjours",
  weekend: "Réserve surtout des week-ends",
  fidele: "Voyageur fidèle",
};
