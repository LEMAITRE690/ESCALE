import test from "node:test";
import assert from "node:assert/strict";
import { evaluatePayoutEligibility, deterministicPayoutReference } from "../../lib/payments/payout-policy.mjs";

const base = {
  paymentStatus: "succeeded",
  transferredAt: null,
  endDate: "2026-08-10",
  now: new Date("2026-08-12T12:00:00.000Z"),
  retentionDays: 1,
  hasOpenDispute: false,
  payoutEnabled: true,
  onboardingComplete: true,
  accountId: "wallet-host",
  ibanId: 42,
};

test("reversement autorisé après J+1 lorsque tout est valide", () => {
  assert.deepEqual(evaluatePayoutEligibility(base), { eligible: true, reason: "eligible" });
});

test("litige ouvert bloque le reversement", () => {
  assert.equal(evaluatePayoutEligibility({ ...base, hasOpenDispute: true }).reason, "open_dispute");
});

test("KYC/onboarding incomplet bloque le reversement", () => {
  assert.equal(evaluatePayoutEligibility({ ...base, onboardingComplete: false }).reason, "onboarding_incomplete");
});

test("IBAN absent bloque le reversement", () => {
  assert.equal(evaluatePayoutEligibility({ ...base, ibanId: null }).reason, "missing_iban");
});

test("paiement déjà reversé ne repart jamais", () => {
  assert.equal(evaluatePayoutEligibility({ ...base, transferredAt: "2026-08-11T08:00:00Z" }).reason, "already_transferred");
});

test("délai de rétention J+1 est respecté", () => {
  assert.equal(
    evaluatePayoutEligibility({ ...base, now: new Date("2026-08-10T23:59:59.000Z") }).reason,
    "retention_period"
  );
});

test("les références de payout sont déterministes", () => {
  assert.equal(deterministicPayoutReference("host", "abc"), deterministicPayoutReference("host", "abc"));
  assert.notEqual(deterministicPayoutReference("host", "abc"), deterministicPayoutReference("partner", "abc"));
});
