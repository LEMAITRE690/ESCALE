import { describe, it, expect } from "vitest";
import {
  COMMISSION_RATE_TTC,
  COMMISSION_RATE_TTC_NET_PARTENAIRE,
  CONCIERGERIE_RETROCOMMISSION,
  CONCIERGERIE_RETROCOMMISSION_ABONNEMENT,
  SUBSCRIPTION_FEE_TTC,
  SUBSCRIPTION_RATE_TTC,
  VAT_RATE,
  formatTaux,
  formatEuros,
  tauxPourFormule,
} from "@/lib/pricing";

describe("formatTaux", () => {
  it("formate à la française, virgule décimale et espace insécable exclus", () => {
    expect(formatTaux(0.085)).toBe("8,5 %");
    expect(formatTaux(0.05)).toBe("5 %");
    expect(formatTaux(0.01)).toBe("1 %");
    expect(formatTaux(0.0708)).toBe("7,08 %");
  });

  it("ne tronque pas les entiers en supprimant leurs zéros terminaux", () => {
    // Régression : une première version rendait « 20 % » sous la forme « 2 % »,
    // le nettoyage des zéros s'appliquant aussi hors partie décimale. Le bug
    // était passé dans les CGU générées.
    expect(formatTaux(0.2, 0)).toBe("20 %");
    expect(formatTaux(0.2)).toBe("20 %");
    expect(formatTaux(0.1, 0)).toBe("10 %");
    expect(formatTaux(1)).toBe("100 %");
  });
});

describe("formatEuros", () => {
  it("utilise la virgule décimale", () => {
    expect(formatEuros(19)).toBe("19 €");
    expect(formatEuros(15.83)).toBe("15,83 €");
  });
});

describe("grille tarifaire", () => {
  it("porte les taux décidés", () => {
    expect(COMMISSION_RATE_TTC).toBe(0.085);
    expect(SUBSCRIPTION_FEE_TTC).toBe(19);
    expect(SUBSCRIPTION_RATE_TTC).toBe(0.05);
    expect(CONCIERGERIE_RETROCOMMISSION).toBe(0.01);
    expect(CONCIERGERIE_RETROCOMMISSION_ABONNEMENT).toBe(0.005);
    expect(VAT_RATE).toBe(0.2);
  });

  it("déduit la part nette d'Escale sans erreur de flottant", () => {
    // 0.085 - 0.01 vaut 0.07500000000000001 en arithmétique flottante : la
    // constante est arrondie, sans quoi le contrat afficherait « 7,500000001 % ».
    expect(COMMISSION_RATE_TTC_NET_PARTENAIRE).toBe(0.075);
    expect(formatTaux(COMMISSION_RATE_TTC_NET_PARTENAIRE)).toBe("7,5 %");
  });

  it("rend l'abonnement plus avantageux au-delà du seuil annoncé", () => {
    const seuil = Math.ceil(
      SUBSCRIPTION_FEE_TTC / (COMMISSION_RATE_TTC - SUBSCRIPTION_RATE_TTC)
    );
    expect(seuil).toBe(543);

    const coutCommission = (ca: number) => ca * COMMISSION_RATE_TTC;
    const coutAbonnement = (ca: number) => SUBSCRIPTION_FEE_TTC + ca * SUBSCRIPTION_RATE_TTC;

    expect(coutAbonnement(seuil)).toBeLessThan(coutCommission(seuil));
    expect(coutAbonnement(seuil - 100)).toBeGreaterThan(coutCommission(seuil - 100));
  });
});

describe("tauxPourFormule", () => {
  it("applique les taux de la formule Commission par défaut", () => {
    expect(tauxPourFormule("commission")).toEqual({ commission: 0.085, retrocommission: 0.01 });
  });

  it("réduit commission et rétrocommission en formule Abonnement", () => {
    expect(tauxPourFormule("abonnement")).toEqual({ commission: 0.05, retrocommission: 0.005 });
  });
});
