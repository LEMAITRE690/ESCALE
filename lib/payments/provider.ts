export type PaymentChannel = "card" | "pay_by_bank" | "sepa";
export type PaymentProviderName = "stripe" | "lemonway";

export type CheckoutRequest = {
  reservationId: string;
  amount: number;
  currency: "eur";
  description: string;
  successUrl: string;
  cancelUrl: string;
  metadata?: Record<string, string>;
};

export type CheckoutResult = {
  provider: PaymentProviderName;
  channel: PaymentChannel;
  providerPaymentId?: string;
  url: string;
};

/**
 * Contrat commun des PSP utilisés par ESCALE. L'objectif est que le domaine
 * réservation ne dépende ni de Stripe ni de Lemonway. Les webhooks restent
 * propres à chaque PSP, mais écrivent le même grand livre `payments`.
 */
export interface PaymentProvider {
  name: PaymentProviderName;
  createCheckout(request: CheckoutRequest, channel: PaymentChannel): Promise<CheckoutResult>;
}
