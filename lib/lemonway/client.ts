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

  if (!res.ok) throw new Error(`Authentification Lemonway impossible (${res.status})`);

  const data = (await res.json()) as LemonwayToken;
  if (!data.access_token) throw new Error("Réponse OAuth Lemonway invalide");

  tokenCache = {
    token: data.access_token,
    expiresAt: now + Math.max(60, Number(data.expires_in ?? 3600)) * 1000,
  };
  return data.access_token;
}

function psuHeaders(token: string, ip: string, userAgent: string) {
  return {
    Authorization: `Bearer ${token}`,
    accept: "application/json",
    "PSU-Accept-Language": "fr-FR",
    "PSU-IP-Address": ip,
    "PSU-User-Agent": userAgent || "Escale",
  };
}

function extractId(data: any): string | null {
  const candidates = [
    data?.id,
    data?.transactionId,
    data?.transaction?.id,
    data?.p2p?.id,
    data?.moneyOut?.id,
    data?.trans?.hpay?.id,
    data?.TRANS?.HPAY?.ID,
  ];
  const value = candidates.find((v) => v !== undefined && v !== null && String(v) !== "");
  return value == null ? null : String(value);
}

export type PayByBankInitInput = {
  amount: number;
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
    transferType: 1,
    reference: input.reference,
    comment: input.comment.slice(0, 140),
  };
  if (input.bankId) body.bankId = input.bankId;

  const res = await fetch(`${directKitBaseUrl()}/v2/moneyins/paybybank/transfer/init`, {
    method: "POST",
    headers: {
      ...psuHeaders(token, input.ip, input.userAgent),
      "Content-Type": "application/json",
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
  const id = extractId(data);
  if (!redirectUrl || !id) throw new Error("Réponse Pay by Bank Lemonway incomplète");
  return { id, redirectUrl: String(redirectUrl) };
}

export type LemonwayMoneyIn = {
  id: string;
  status: number | null;
  amount: number | null;
  raw: any;
};

export async function retrieveMoneyIn(transactionId: string, ip = "127.0.0.1", userAgent = "Escale webhook"): Promise<LemonwayMoneyIn> {
  const token = await getAccessToken();
  const url = new URL(`${directKitBaseUrl()}/v2/moneyins`);
  url.searchParams.set("transactionId", transactionId);

  const res = await fetch(url, {
    method: "GET",
    headers: psuHeaders(token, ip, userAgent),
    cache: "no-store",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`Vérification Lemonway impossible (${res.status})`);

  const tx = data?.transactions?.value?.[0] ?? data?.transactions?.[0] ?? data?.transaction ?? data;
  const id = tx?.id ?? tx?.transactionId ?? transactionId;
  const statusRaw = tx?.status ?? tx?.transactionStatus ?? null;
  const amountRaw = tx?.amount ?? tx?.creditAmount ?? tx?.totalAmount ?? null;

  return {
    id: String(id),
    status: statusRaw == null ? null : Number(statusRaw),
    amount: amountRaw == null ? null : Number(amountRaw),
    raw: tx,
  };
}

export type P2PInput = {
  debitAccountId: string;
  creditAccountId: string;
  amount: number;
  reference: string;
  comment: string;
  ip?: string;
  userAgent?: string;
};

/** Ventilation interne entre deux Payment Accounts Lemonway. */
export async function createP2P(input: P2PInput): Promise<{ id: string; raw: any }> {
  const token = await getAccessToken();
  const res = await fetch(`${directKitBaseUrl()}/v2/p2p`, {
    method: "POST",
    headers: {
      ...psuHeaders(token, input.ip ?? "127.0.0.1", input.userAgent ?? "Escale payout"),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      debitAccountId: input.debitAccountId,
      creditAccountId: input.creditAccountId,
      amount: input.amount,
      reference: input.reference.slice(0, 36),
      comment: input.comment.slice(0, 140),
    }),
    cache: "no-store",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = data?.error?.message || data?.message || `P2P Lemonway impossible (${res.status})`;
    throw new Error(message);
  }
  const id = extractId(data);
  if (!id) throw new Error("Réponse P2P Lemonway incomplète");
  return { id, raw: data };
}

export type MoneyOutInput = {
  accountId: string;
  ibanId?: number | null;
  amount: number;
  reference: string;
  comment: string;
  ip?: string;
  userAgent?: string;
};

/** Reverse un Payment Account Lemonway vers l'IBAN validé du bénéficiaire. */
export async function createMoneyOut(input: MoneyOutInput): Promise<{ id: string; raw: any }> {
  const token = await getAccessToken();
  const body: Record<string, unknown> = {
    accountId: input.accountId,
    totalAmount: input.amount,
    commissionAmount: 0,
    autoCommission: false,
    comment: input.comment.slice(0, 140),
    reference: input.reference.slice(0, 50),
  };
  if (input.ibanId != null) body.ibanId = input.ibanId;

  const res = await fetch(`${directKitBaseUrl()}/v2/moneyouts`, {
    method: "POST",
    headers: {
      ...psuHeaders(token, input.ip ?? "127.0.0.1", input.userAgent ?? "Escale payout"),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = data?.error?.message || data?.message || `Money-Out Lemonway impossible (${res.status})`;
    throw new Error(message);
  }
  const id = extractId(data);
  if (!id) throw new Error("Réponse Money-Out Lemonway incomplète");
  return { id, raw: data };
}

/** Recherche un Money-Out par référence pour rendre les relances idempotentes. */
export async function findMoneyOutByReference(reference: string): Promise<any | null> {
  const token = await getAccessToken();
  const url = new URL(`${directKitBaseUrl()}/v2/moneyouts`);
  url.searchParams.set("reference", reference.slice(0, 50));
  url.searchParams.set("limit", "1");

  const res = await fetch(url, {
    method: "GET",
    headers: psuHeaders(token, "127.0.0.1", "Escale payout reconciliation"),
    cache: "no-store",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`Recherche Money-Out Lemonway impossible (${res.status})`);
  const tx = data?.transactions?.value?.[0] ?? data?.transactions?.[0] ?? data?.moneyOuts?.[0] ?? null;
  return tx ?? null;
}
