import test from "node:test";
import assert from "node:assert/strict";
import { computeCrmMetrics, crmSegment } from "../../lib/crm/metrics.mjs";

const now = new Date("2026-08-18T12:00:00Z");

test("calcule les indicateurs mensuels et exclut annulations/remboursements", () => {
  const result = computeCrmMetrics({
    now,
    reservations: [
      { start_date: "2026-08-18", end_date: "2026-08-20", amount_total: 100000, status: "confirmee" },
      { start_date: "2026-08-10", end_date: "2026-08-12", amount_total: 50000, status: "terminee" },
      { start_date: "2026-08-21", end_date: "2026-08-22", amount_total: 30000, status: "annulee" },
      { start_date: "2026-07-20", end_date: "2026-07-22", amount_total: 70000, status: "terminee" },
    ],
    expenses: [
      { expense_date: "2026-08-01", amount_cents: 12000 },
      { expense_date: "2026-07-01", amount_cents: 9000 },
    ],
    payments: [
      { amount_host: 92000, status: "succeeded", transferred_at: null },
      { amount_host: 46000, status: "succeeded", transferred_at: "2026-08-17T10:00:00Z" },
      { amount_host: 20000, status: "failed", transferred_at: null },
    ],
  });

  assert.deepEqual(result, {
    caMonth: 150000,
    expensesMonth: 12000,
    resultBeforeOtherCharges: 138000,
    awaitingPayout: 92000,
    arrivalsToday: 1,
    departuresToday: 0,
  });
});

test("segmente les clients selon valeur et fidélité", () => {
  assert.equal(crmSegment({ lifetime_value_cents: 250000, stays_count: 1 }), "VIP");
  assert.equal(crmSegment({ lifetime_value_cents: 100000, stays_count: 3 }), "Fidèle");
  assert.equal(crmSegment({ lifetime_value_cents: 50000, stays_count: 1 }), "Client");
});
