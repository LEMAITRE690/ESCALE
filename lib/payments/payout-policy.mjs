export function evaluatePayoutEligibility({
  paymentStatus,
  transferredAt,
  endDate,
  now = new Date(),
  retentionDays = 1,
  hasOpenDispute = false,
  payoutEnabled = true,
  onboardingComplete = true,
  accountId = null,
  ibanId = null,
}) {
  if (paymentStatus !== "succeeded") return { eligible: false, reason: "payment_not_succeeded" };
  if (transferredAt) return { eligible: false, reason: "already_transferred" };
  if (hasOpenDispute) return { eligible: false, reason: "open_dispute" };
  if (!payoutEnabled) return { eligible: false, reason: "payout_disabled" };
  if (!onboardingComplete) return { eligible: false, reason: "onboarding_incomplete" };
  if (!accountId) return { eligible: false, reason: "missing_account" };
  if (ibanId == null) return { eligible: false, reason: "missing_iban" };

  const releaseAt = new Date(`${endDate}T00:00:00.000Z`);
  releaseAt.setUTCDate(releaseAt.getUTCDate() + retentionDays);
  if (now < releaseAt) return { eligible: false, reason: "retention_period" };

  return { eligible: true, reason: "eligible" };
}

export function deterministicPayoutReference(kind, paymentId) {
  const prefix = kind === "partner" ? "payout-part" : "payout-host";
  return `${prefix}-${paymentId}`.slice(0, 50);
}
