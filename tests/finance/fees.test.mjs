import test from "node:test";
import assert from "node:assert/strict";
import { computeFeeBreakdown } from "../../lib/finance/fees.mjs";

test("8 % TTC sans taxe ni partenaire", () => {
  const r = computeFeeBreakdown({
    amountTotal: 100000,
    touristTaxAmount: 0,
    commissionRate: 0.08,
  });
  assert.deepEqual(r, {
    commissionBase: 100000,
    totalCommission: 8000,
    platformFee: 8000,
    partnerFee: 0,
    amountHost: 92000,
    touristTaxHeld: 0,
  });
});

test("5 % TTC avec taxe de séjour isolée", () => {
  const r = computeFeeBreakdown({
    amountTotal: 105000,
    touristTaxAmount: 5000,
    commissionRate: 0.05,
  });
  assert.equal(r.totalCommission, 5000);
  assert.equal(r.amountHost, 95000);
  assert.equal(r.touristTaxHeld, 5000);
  assert.equal(r.amountHost + r.platformFee + r.partnerFee + r.touristTaxHeld, 105000);
});

test("8 % avec conciergerie à 1 point", () => {
  const r = computeFeeBreakdown({
    amountTotal: 100000,
    touristTaxAmount: 0,
    commissionRate: 0.08,
    partnerRate: 0.01,
    hasPartner: true,
  });
  assert.equal(r.totalCommission, 8000);
  assert.equal(r.platformFee, 7000);
  assert.equal(r.partnerFee, 1000);
  assert.equal(r.amountHost, 92000);
});

test("5 % avec conciergerie à 0,5 point et taxe de séjour", () => {
  const r = computeFeeBreakdown({
    amountTotal: 205000,
    touristTaxAmount: 5000,
    commissionRate: 0.05,
    partnerRate: 0.005,
    hasPartner: true,
  });
  assert.equal(r.commissionBase, 200000);
  assert.equal(r.totalCommission, 10000);
  assert.equal(r.partnerFee, 1000);
  assert.equal(r.platformFee, 9000);
  assert.equal(r.amountHost, 190000);
  assert.equal(r.touristTaxHeld, 5000);
});

test("refuse une taxe supérieure au total", () => {
  assert.throws(() => computeFeeBreakdown({
    amountTotal: 1000,
    touristTaxAmount: 1200,
    commissionRate: 0.08,
  }));
});
