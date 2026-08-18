import { describe, it, expect } from "vitest";
import { debutMoisProchain, MOYENS_PAIEMENT_ABONNEMENT } from "@/lib/stripe/subscription";

// La date de prise d'effet d'un changement de formule est contractuelle :
// les CGV Hôtes, article 2, prévoient le premier jour du mois suivant, jamais
// de rétroactivité ni d'effet en cours de mois.

describe("debutMoisProchain", () => {
  const cas: Array<[string, string]> = [
    ["2026-08-16T10:00:00Z", "2026-09-01T00:00:00.000Z"],
    ["2026-08-01T00:00:00Z", "2026-09-01T00:00:00.000Z"],
    ["2026-01-31T23:59:59Z", "2026-02-01T00:00:00.000Z"],
    ["2026-02-15T12:00:00Z", "2026-03-01T00:00:00.000Z"],
    ["2026-04-30T22:00:00Z", "2026-05-01T00:00:00.000Z"],
  ];

  for (const [depuis, attendu] of cas) {
    it(`${depuis} donne ${attendu}`, () => {
      expect(debutMoisProchain(new Date(depuis)).toISOString()).toBe(attendu);
    });
  }

  it("passe correctement d'une année à l'autre", () => {
    expect(debutMoisProchain(new Date("2026-12-31T23:59:00Z")).toISOString()).toBe(
      "2027-01-01T00:00:00.000Z"
    );
    expect(debutMoisProchain(new Date("2026-12-01T00:00:00Z")).toISOString()).toBe(
      "2027-01-01T00:00:00.000Z"
    );
  });

  it("tombe sur le 29 février d'une année bissextile sans déborder", () => {
    expect(debutMoisProchain(new Date("2028-01-15T00:00:00Z")).toISOString()).toBe(
      "2028-02-01T00:00:00.000Z"
    );
    expect(debutMoisProchain(new Date("2028-02-29T18:00:00Z")).toISOString()).toBe(
      "2028-03-01T00:00:00.000Z"
    );
  });

  it("est toujours strictement postérieure à la date de demande", () => {
    for (const iso of ["2026-01-01T00:00:00Z", "2026-06-15T12:00:00Z", "2026-12-31T23:59:59Z"]) {
      const demande = new Date(iso);
      expect(debutMoisProchain(demande).getTime()).toBeGreaterThan(demande.getTime());
    }
  });

  it("tombe toujours le 1er à minuit", () => {
    for (let mois = 0; mois < 12; mois++) {
      const d = debutMoisProchain(new Date(Date.UTC(2026, mois, 17, 9, 30)));
      expect(d.getUTCDate()).toBe(1);
      expect(d.getUTCHours()).toBe(0);
      expect(d.getUTCMinutes()).toBe(0);
    }
  });
});

describe("moyens de paiement de l'abonnement", () => {
  it("propose le SEPA avant la carte", () => {
    // Ordre significatif : Stripe Checkout présente les moyens dans l'ordre
    // fourni, et le prélèvement SEPA coûte nettement moins cher qu'une carte.
    expect([...MOYENS_PAIEMENT_ABONNEMENT]).toEqual(["sepa_debit", "card"]);
  });
});
