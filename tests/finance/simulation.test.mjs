import test from "node:test";
import assert from "node:assert/strict";
import { computeFeeBreakdown } from "../../lib/finance/fees.mjs";

function mulberry32(seed) {
  return function () {
    let t = (seed += 0x6D2B79F5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

test("1000 réservations aléatoires conservent chaque centime", () => {
  const random = mulberry32(690);

  for (let i = 0; i < 1000; i += 1) {
    const amountTotal = 10000 + Math.floor(random() * 990000); // 100 € à 10 000 €
    const touristTaxAmount = Math.floor(random() * Math.min(15000, Math.floor(amountTotal * 0.12)));
    const subscription = random() < 0.45;
    const hasPartner = random() < 0.35;
    const commissionRate = subscription ? 0.05 : 0.08;
    const partnerRate = subscription ? 0.005 : 0.01;

    const r = computeFeeBreakdown({
      amountTotal,
      touristTaxAmount,
      commissionRate,
      partnerRate,
      hasPartner,
    });

    assert.equal(
      r.amountHost + r.platformFee + r.partnerFee + r.touristTaxHeld,
      amountTotal,
      `centimes non conservés au scénario ${i}`
    );
    assert.ok(r.amountHost >= 0);
    assert.ok(r.platformFee >= 0);
    assert.ok(r.partnerFee >= 0);
    assert.equal(r.touristTaxHeld, touristTaxAmount);
    assert.equal(r.totalCommission, Math.round((amountTotal - touristTaxAmount) * commissionRate));
  }
});
