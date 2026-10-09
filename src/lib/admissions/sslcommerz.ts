import { createHash } from 'node:crypto';

// SSLCommerz hosted checkout, API v4 (https://developer.sslcommerz.com/doc/v4/; endpoints and fields
// as in the official sslcommerz-lts and SSLCommerz-Laravel libraries):
// - session:     POST {base}/gwprocess/v4/api.php → GatewayPageURL
// - validation:  GET  {base}/validator/api/validationserverAPI.php?val_id=…  (the only proof of payment)
// - query:       GET  {base}/validator/api/merchantTransIDvalidationAPI.php?tran_id=…  (reconciliation)
// The browser returns (success/fail/cancel) and the IPN are only hints: every payment is confirmed
// by calling the validation API from the server and checking tran_id, amount and currency.

export type SslConfig = { storeId: string; storePassword: string; sandbox: boolean };

/** Store credentials from the environment; sandbox unless SSLCOMMERZ_SANDBOX is "false". */
export function sslConfigFromEnv(env: Record<string, string | undefined> = process.env): SslConfig | null {
  const storeId = env.SSLCOMMERZ_STORE_ID?.trim();
  const storePassword = env.SSLCOMMERZ_STORE_PASSWORD?.trim();
  if (!storeId || !storePassword) return null;
  return { storeId, storePassword, sandbox: env.SSLCOMMERZ_SANDBOX?.trim().toLowerCase() !== 'false' };
}

export const gatewayBase = (sandbox: boolean) => (sandbox ? 'https://sandbox.sslcommerz.com' : 'https://securepay.sslcommerz.com');

export type SessionRequest = {
  tranId: string;
  amount: number;
  successUrl: string;
  failUrl: string;
  cancelUrl: string;
  ipnUrl: string;
  productName: string;
  customer: { name: string; email: string; phone: string; address: string };
  /** Passed back in callbacks (value_a); we store the application ID. */
  reference: string;
};

export type SessionResult = { ok: true; gatewayUrl: string; sessionKey: string | null } | { ok: false; reason: string };

/** Fields of the validation API response (and of each transaction-query element) we rely on. */
export type GatewayTransaction = {
  status?: string;
  tran_id?: string;
  val_id?: string;
  amount?: string | number;
  store_amount?: string | number;
  currency?: string;
  currency_type?: string;
  bank_tran_id?: string;
  card_type?: string;
  risk_level?: string | number;
  risk_title?: string;
  tran_date?: string;
  value_a?: string;
  APIConnect?: string;
  [key: string]: unknown;
};

export interface Gateway {
  createSession(req: SessionRequest): Promise<SessionResult>;
  /** The validation API; null when it could not be reached. */
  validate(valId: string): Promise<GatewayTransaction | null>;
  /** All attempts SSLCommerz knows for a tran_id; null when it could not be reached. */
  queryByTranId(tranId: string): Promise<GatewayTransaction[] | null>;
}

type Fetch = typeof fetch;
const TIMEOUT_MS = 20_000;

const clip = (value: string, max: number) => value.slice(0, max);

/** The real gateway (sandbox or live). `fetchImpl` is replaced in tests. */
export function sslCommerzGateway(cfg: SslConfig, fetchImpl: Fetch = fetch): Gateway {
  const base = gatewayBase(cfg.sandbox);
  const auth = { store_id: cfg.storeId, store_passwd: cfg.storePassword };

  async function getJson(path: string, params: Record<string, string>): Promise<Record<string, unknown> | null> {
    const url = `${base}${path}?${new URLSearchParams({ ...params, ...auth, v: '1', format: 'json' })}`;
    try {
      const res = await fetchImpl(url, { signal: AbortSignal.timeout(TIMEOUT_MS), cache: 'no-store' });
      if (!res.ok) return null;
      return (await res.json()) as Record<string, unknown>;
    } catch {
      return null;
    }
  }

  return {
    async createSession(req) {
      const body = new URLSearchParams({
        ...auth,
        total_amount: req.amount.toFixed(2),
        currency: 'BDT',
        tran_id: req.tranId,
        success_url: req.successUrl,
        fail_url: req.failUrl,
        cancel_url: req.cancelUrl,
        ipn_url: req.ipnUrl,
        product_name: clip(req.productName, 255),
        product_category: 'Education',
        product_profile: 'non-physical-goods',
        shipping_method: 'NO',
        num_of_item: '1',
        emi_option: '0',
        cus_name: clip(req.customer.name || 'Guardian', 50),
        cus_email: clip(req.customer.email, 50),
        cus_phone: clip(req.customer.phone, 20),
        cus_add1: clip(req.customer.address || 'Dhaka', 50),
        cus_city: 'Dhaka',
        cus_postcode: '1000',
        cus_country: 'Bangladesh',
        value_a: req.reference,
      });
      try {
        const res = await fetchImpl(`${base}/gwprocess/v4/api.php`, { method: 'POST', body, signal: AbortSignal.timeout(TIMEOUT_MS), cache: 'no-store' });
        const data = (await res.json()) as { status?: string; GatewayPageURL?: string; sessionkey?: string; failedreason?: string };
        if (String(data.status).toUpperCase() === 'SUCCESS' && data.GatewayPageURL) {
          return { ok: true, gatewayUrl: data.GatewayPageURL, sessionKey: data.sessionkey ?? null };
        }
        return { ok: false, reason: data.failedreason || `status ${data.status ?? res.status}` };
      } catch (e) {
        return { ok: false, reason: e instanceof Error ? e.message : 'unreachable' };
      }
    },

    async validate(valId) {
      return (await getJson('/validator/api/validationserverAPI.php', { val_id: valId })) as GatewayTransaction | null;
    },

    async queryByTranId(tranId) {
      const data = await getJson('/validator/api/merchantTransIDvalidationAPI.php', { tran_id: tranId });
      if (!data) return null;
      return Array.isArray(data.element) ? (data.element as GatewayTransaction[]) : [];
    },
  };
}

export type ValidationVerdict = 'valid' | 'risky' | 'mismatch' | 'not_valid';

/**
 * Whether a validation response proves our payment: status VALID/VALIDATED, the same tran_id, the
 * exact amount we asked for, in BDT. A risky transaction (risk_level 1) is held for staff review.
 */
export function judgeTransaction(t: GatewayTransaction | null, expected: { tranId: string; amount: number }): ValidationVerdict {
  if (!t) return 'not_valid';
  const status = String(t.status ?? '').toUpperCase();
  if (status !== 'VALID' && status !== 'VALIDATED') return 'not_valid';
  const currency = String(t.currency_type || t.currency || '').toUpperCase();
  // Another transaction's val_id (e.g. a forged callback) says nothing about this payment.
  if (String(t.tran_id ?? '').trim() !== expected.tranId) return 'not_valid';
  if (Math.abs(Number(t.amount) - expected.amount) > 0.005 || currency !== 'BDT') return 'mismatch';
  return String(t.risk_level ?? '0') === '1' ? 'risky' : 'valid';
}

const md5 = (s: string) => createHash('md5').update(s, 'utf8').digest('hex');

/**
 * IPN signature check (SSLCOMMERZ_hash_verify): the fields named in verify_key, plus
 * store_passwd = md5(password), sorted by key, joined as k=v&…, md5 must equal verify_sign.
 * A failed check is logged; the payment is still decided only by the validation API.
 */
export function verifyIpnSignature(post: Record<string, string>, storePassword: string): boolean {
  if (!post.verify_sign || !post.verify_key) return false;
  const data: Record<string, string> = {};
  for (const key of post.verify_key.split(',')) data[key] = post[key] ?? '';
  data.store_passwd = md5(storePassword);
  const joined = Object.keys(data)
    .sort()
    .map((k) => `${k}=${data[k]}`)
    .join('&');
  return md5(joined) === post.verify_sign;
}
