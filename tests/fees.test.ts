import { describe, it, expect } from "vitest";
import { computeFees } from "@/lib/stripe/client";

// computeFees décide de ce qui est prélevé à l'hôte sur chaque réservation.
// C'est le seul endroit du dépôt où une erreur se traduit directement en
// euros mal répartis : ces tests couvrent les combinaisons formule × partenaire
// × taxe de séjour, et surtout les invariants qui doivent tenir dans tous les cas.

const SEJOUR = 100_000; // 1 000 €, en centimes

describe("formule Commission", () => {
  it("prélève 8,5 % du séjour", () => {
    const { platformFee, partnerFee, amountHost, tauxCommission } = computeFees(SEJOUR);
    expect(platformFee).toBe(8_500);
    expect(partnerFee).toBe(0);
    expect(amountHost).toBe(91_500);
    expect(tauxCommission).toBe(0.085);
  });

  it("réserve 1 point à la conciergerie sans rien changer pour l'hôte", () => {
    const { platformFee, partnerFee, amountHost } = computeFees(SEJOUR, { hasPartner: true });
    expect(partnerFee).toBe(1_000);
    expect(platformFee).toBe(7_500);
    expect(amountHost).toBe(91_500);
  });
});

describe("formule Abonnement", () => {
  it("prélève 5 % du séjour", () => {
    const { platformFee, partnerFee, amountHost, tauxCommission } = computeFees(SEJOUR, {
      formule: "abonnement",
    });
    expect(platformFee).toBe(5_000);
    expect(partnerFee).toBe(0);
    expect(amountHost).toBe(95_000);
    expect(tauxCommission).toBe(0.05);
  });

  it("réduit la rétrocommission à un demi-point", () => {
    const { platformFee, partnerFee, amountHost } = computeFees(SEJOUR, {
      formule: "abonnement",
      hasPartner: true,
    });
    expect(partnerFee).toBe(500);
    expect(platformFee).toBe(4_500);
    expect(amountHost).toBe(95_000);
  });
});

describe("taxe de séjour", () => {
  it("sort de l'assiette de commission mais reste due à l'hôte", () => {
    const taxe = 5_000;
    const avecTaxe = computeFees(SEJOUR, { touristTaxAmount: taxe });

    // La commission ne porte que sur les 950 € hors taxe de séjour…
    expect(avecTaxe.platformFee).toBe(Math.round((SEJOUR - taxe) * 0.085));

    // …et l'hôte reçoit exactement la taxe EN PLUS de ce qu'il toucherait
    // sur un séjour du même montant commissionnable : elle transite par lui,
    // à charge pour lui de la reverser à sa commune.
    const sansTaxe = computeFees(SEJOUR - taxe);
    expect(avecTaxe.platformFee).toBe(sansTaxe.platformFee);
    expect(avecTaxe.amountHost).toBe(sansTaxe.amountHost + taxe);
  });

  it("n'est pas non plus ponctionnée par la conciergerie", () => {
    const { partnerFee } = computeFees(SEJOUR, { touristTaxAmount: 5_000, hasPartner: true });
    expect(partnerFee).toBe(Math.round(95_000 * 0.01));
  });

  it("ne rend jamais l'assiette négative", () => {
    const { platformFee, partnerFee } = computeFees(1_000, { touristTaxAmount: 5_000 });
    expect(platformFee).toBe(0);
    expect(partnerFee).toBe(0);
  });
});

describe("invariants", () => {
  const cas = [
    { formule: "commission" as const, hasPartner: false },
    { formule: "commission" as const, hasPartner: true },
    { formule: "abonnement" as const, hasPartner: false },
    { formule: "abonnement" as const, hasPartner: true },
  ];

  for (const options of cas) {
    const nom = `${options.formule}${options.hasPartner ? " avec conciergerie" : ""}`;

    it(`${nom} — la répartition épuise exactement le montant payé`, () => {
      for (const montant of [1, 999, 12_345, 100_000, 987_654]) {
        const { platformFee, partnerFee, amountHost } = computeFees(montant, options);
        expect(platformFee + partnerFee + amountHost).toBe(montant);
      }
    });

    it(`${nom} — aucune part n'est négative`, () => {
      for (const montant of [0, 1, 50, 100_000]) {
        const { platformFee, partnerFee, amountHost } = computeFees(montant, options);
        expect(platformFee).toBeGreaterThanOrEqual(0);
        expect(partnerFee).toBeGreaterThanOrEqual(0);
        expect(amountHost).toBeGreaterThanOrEqual(0);
      }
    });
  }

  it("la présence d'une conciergerie ne change jamais ce que touche l'hôte", () => {
    // C'est l'engagement pris à l'article 12 des CGU et à l'article 5 du
    // contrat d'apporteur d'affaires.
    for (const formule of ["commission", "abonnement"] as const) {
      for (const montant of [1, 999, 12_345, 100_000, 987_654]) {
        const sans = computeFees(montant, { formule });
        const avec = computeFees(montant, { formule, hasPartner: true });
        expect(avec.amountHost).toBe(sans.amountHost);
        expect(avec.platformFee + avec.partnerFee).toBe(sans.platformFee);
      }
    }
  });

  it("l'abonnement prélève toujours moins que la formule Commission", () => {
    for (const montant of [1_000, 50_000, 1_000_000]) {
      const commission = computeFees(montant, { formule: "commission" });
      const abonnement = computeFees(montant, { formule: "abonnement" });
      expect(abonnement.amountHost).toBeGreaterThan(commission.amountHost);
    }
  });

  it("retombe sur la formule Commission quand aucune formule n'est fournie", () => {
    // Le webhook lit la formule en base ; tant que la migration 0029 n'est pas
    // appliquée, l'appel RPC ne renvoie rien et le calcul doit rester celui
    // d'avant, sans quoi les hôtes seraient sous-facturés sans le savoir.
    expect(computeFees(SEJOUR, { formule: undefined })).toEqual(computeFees(SEJOUR));
  });
});
