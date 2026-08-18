type LemonwayToken = {
  access_token: string;
  expires_in?: number;
};

let tokenCache: { token: string; expiresAt: number } | null = null;

function sandbox() {
  return process.env.LEMONWAY_SANDBOX !== "false";
}

function envName() {
  const value = process.env.LEMONWAY_ENV_NAME;
  if (!value) throw new Error("LEMONWAY_ENV_NAME manquant");
  return value;
}

function directKitBaseUrl() {
  return sandbox()
    ? `https://sandbox-api.lemonway.fr/mb/${envName()}/directkitrest`
    : `https://ws.lemonway.fr/mb/${envName()}/prod/directkitrest`;
}

async function getAccessToken(): Promise<string> {
  const now = Date.now();
  if (tokenCache && tokenCache.expiresAt > now + 60_000) return tokenCache.token;

  // Pour les environnements où un bearer est provisionné directement.
  if (process.env.LEMONWAY_ACCESS_TOKEN) return process.env.LEMONWAY_ACCESS_TOKEN;

  const apiKey = process.env.LEMONWAY_API_KEY;
  if (!apiKey) throw new Error("LEMONWAY_API_KEY manquant");

  const url = sandbox()
    ? "https://sandbox-api.lemonway.fr/oauth/api/v1/oauth/token"
    : "https://auth.lemonway.com/oauth/api/v1/oauth/token";

  const res = await fetch(url, {
    method: "POST",
    headers: {
      accept: "application/json;charset=UTF-8",
      Authorization: `basic ${apiKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ Grant_type: "client_credentials" }),
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Authentification Lemonway impossible (${res.status})`);
  }

  const data = (await res.json()) as LemonwayToken;
  if (!data.access_token) throw new Error("Réponse OAuth Lemonway invalide");

  tokenCache = {
    token: data.access_token,
    expiresAt: now + Math.max(60, Number(data.expires_in ?? 3600)) * 1000,
  };
  return data.access_token;
}

export type PayByBankInitInput = {
  amount: number; // centimes
  accountId: string;
  reference: string;
  comment: string;
  returnUrl: string;
  errorUrl: string;
  cancelUrl: string;
  ip: string;
  userAgent: string;
  countryCode?: string;
  bankId?: string;
};

export type PayByBankInitResult = {
  id: string;
  redirectUrl: string;
};

/**
 * Initialise un Pay by Bank Lemonway via DirectKit v2.
 * Documentation officielle : POST /v2/moneyins/paybybank/transfer/init.
 */
export async function initiatePayByBank(input: PayByBankInitInput): Promise<PayByBankInitResult> {
  const token = await getAccessToken();

  const body: Record<string, unknown> = {
    returnUrl: input.returnUrl,
    errorUrl: input.errorUrl,
    cancelUrl: input.cancelUrl,
    totalAmount: input.amount,
    accountId: input.accountId,
    commissionAmount: 0,
    autoCommission: false,
    countryCode: input.countryCode ?? "FR",
    transferType: "instant",
    reference: input.reference,
    comment: input.comment.slice(0, 140),
  };
  if (input.bankId) body.bankId = input.bankId;

  const res = await fetch(`${directKitBaseUrl()}/v2/moneyins/paybybank/transfer/init`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      accept: "application/json",
      "Content-Type": "application/json",
      "PSU-Accept-Language": "fr-FR",
      "PSU-IP-Address": input.ip,
      "PSU-User-Agent": input.userAgent || "Escale",
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = data?.error?.message || data?.message || `Erreur Lemonway (${res.status})`;
    throw new Error(message);
  }

  const redirectUrl = data.redirectUrl ?? data.redirectURL;
  if (!redirectUrl || data.id == null) {
    throw new Error("Réponse Pay by Bank Lemonway incomplète");
  }

  return { id: String(data.id), redirectUrl: String(redirectUrl) };
}
