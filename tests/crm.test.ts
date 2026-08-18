import { describe, it, expect } from "vitest";
import { nomAffiche } from "@/lib/crm/voyageurs";

// Le dépôt ne diffuse jamais le nom complet d'un voyageur en dehors de son
// propre compte : avis, export iCal et contrat de location n'utilisent que le
// prénom ou le prénom suivi d'une initiale. La fiche CRM suit la même règle.

describe("nomAffiche", () => {
  it("réduit le nom de famille à son initiale", () => {
    expect(nomAffiche("Camille Bertrand")).toBe("Camille B.");
    expect(nomAffiche("Marie-Claire Du Pont")).toBe("Marie-Claire P.");
  });

  it("laisse un prénom seul intact", () => {
    expect(nomAffiche("Julien")).toBe("Julien");
  });

  it("retombe sur un libellé neutre quand le nom manque", () => {
    expect(nomAffiche(null)).toBe("Voyageur");
    expect(nomAffiche(undefined)).toBe("Voyageur");
    expect(nomAffiche("")).toBe("Voyageur");
    expect(nomAffiche("   ")).toBe("Voyageur");
  });

  it("ne laisse jamais fuiter le nom de famille en entier", () => {
    for (const nom of ["Camille Bertrand", "Jean Dupont-Moreau", "A B C D"]) {
      const affiche = nomAffiche(nom);
      const famille = nom.trim().split(/\s+/).pop()!;
      expect(affiche.includes(famille)).toBe(famille.length === 1);
    }
  });
});
