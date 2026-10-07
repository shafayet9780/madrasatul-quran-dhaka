// @vitest-environment node
import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { judgeTransaction, sslCommerzGateway, sslConfigFromEnv, verifyIpnSignature } from './sslcommerz';

const md5 = (s: string) => createHash('md5').update(s).digest('hex');
const cfg = { storeId: 'testbox', storePassword: 'qwerty', sandbox: true };

function recordingFetch(response: unknown) {
  const calls: { url: string; init?: RequestInit }[] = [];
  const fetchImpl = (async (url: string, init?: RequestInit) => {
    calls.push({ url, init });
    return new Response(JSON.stringify(response), { status: 200 });
  }) as unknown as typeof fetch;
  return { calls, fetchImpl };
}

describe('sslConfigFromEnv', () => {
  it('needs both credentials and defaults to the sandbox', () => {
    expect(sslConfigFromEnv({})).toBeNull();
    expect(sslConfigFromEnv({ SSLCOMMERZ_STORE_ID: 'a', SSLCOMMERZ_STORE_PASSWORD: 'b' })).toEqual({ storeId: 'a', storePassword: 'b', sandbox: true });
    expect(sslConfigFromEnv({ SSLCOMMERZ_STORE_ID: 'a', SSLCOMMERZ_STORE_PASSWORD: 'b', SSLCOMMERZ_SANDBOX: 'false' })!.sandbox).toBe(false);
  });
});

describe('sslCommerzGateway', () => {
  const request = {
    tranId: 'MQ27-abc',
    amount: 500,
    successUrl: 'https://example.org/s',
    failUrl: 'https://example.org/f',
    cancelUrl: 'https://example.org/c',
    ipnUrl: 'https://example.org/i',
    productName: 'Pre-admission 2027 application fee',
    customer: { name: 'Rafiqul Islam', email: 'a@b.co', phone: '01712345678', address: 'Mirpur' },
    reference: 'app-1',
  };

  it('opens a hosted checkout session with the server-side amount', async () => {
    const { calls, fetchImpl } = recordingFetch({ status: 'SUCCESS', GatewayPageURL: 'https://sandbox.sslcommerz.com/EasyCheckOut/x', sessionkey: 'S1' });
    const result = await sslCommerzGateway(cfg, fetchImpl).createSession(request);
    expect(result).toEqual({ ok: true, gatewayUrl: 'https://sandbox.sslcommerz.com/EasyCheckOut/x', sessionKey: 'S1' });
    expect(calls[0].url).toBe('https://sandbox.sslcommerz.com/gwprocess/v4/api.php');
    const body = new URLSearchParams(String(calls[0].init!.body));
    expect(Object.fromEntries(body)).toMatchObject({
      store_id: 'testbox',
      store_passwd: 'qwerty',
      total_amount: '500.00',
      currency: 'BDT',
      tran_id: 'MQ27-abc',
      ipn_url: 'https://example.org/i',
      product_profile: 'non-physical-goods',
      shipping_method: 'NO',
      value_a: 'app-1',
    });
  });

  it('reports why a session was refused', async () => {
    const { fetchImpl } = recordingFetch({ status: 'FAILED', failedreason: 'Store Credential Error Or Store is De-active' });
    expect(await sslCommerzGateway(cfg, fetchImpl).createSession(request)).toEqual({ ok: false, reason: 'Store Credential Error Or Store is De-active' });
  });

  it('validates by val_id and queries by tran_id on the live host when not in the sandbox', async () => {
    const { calls, fetchImpl } = recordingFetch({ APIConnect: 'DONE', no_of_trans_found: '1', element: [{ status: 'VALID', tran_id: 'MQ27-abc' }] });
    const gateway = sslCommerzGateway({ ...cfg, sandbox: false }, fetchImpl);
    expect(await gateway.queryByTranId('MQ27-abc')).toEqual([{ status: 'VALID', tran_id: 'MQ27-abc' }]);
    await gateway.validate('V1');
    expect(calls[0].url).toMatch(/^https:\/\/securepay\.sslcommerz\.com\/validator\/api\/merchantTransIDvalidationAPI\.php\?tran_id=MQ27-abc&store_id=testbox&store_passwd=qwerty&v=1&format=json$/);
    expect(calls[1].url).toMatch(/validationserverAPI\.php\?val_id=V1&/);
  });

  it('treats an unreachable gateway as unknown, not as failed', async () => {
    const fetchImpl = (async () => {
      throw new Error('timeout');
    }) as unknown as typeof fetch;
    expect(await sslCommerzGateway(cfg, fetchImpl).validate('V1')).toBeNull();
    expect(await sslCommerzGateway(cfg, fetchImpl).queryByTranId('T')).toBeNull();
  });
});

describe('judgeTransaction', () => {
  const ok = { status: 'VALID', tran_id: 'T1', amount: '500.00', currency: 'BDT', risk_level: '0' };
  it('accepts only our tran_id, the exact amount and BDT', () => {
    expect(judgeTransaction(ok, { tranId: 'T1', amount: 500 })).toBe('valid');
    expect(judgeTransaction({ ...ok, status: 'VALIDATED' }, { tranId: 'T1', amount: 500 })).toBe('valid');
    expect(judgeTransaction({ ...ok, amount: '5.00' }, { tranId: 'T1', amount: 500 })).toBe('mismatch');
    expect(judgeTransaction({ ...ok, tran_id: 'T2' }, { tranId: 'T1', amount: 500 })).toBe('mismatch');
    expect(judgeTransaction({ ...ok, currency: 'USD' }, { tranId: 'T1', amount: 500 })).toBe('mismatch');
    expect(judgeTransaction({ ...ok, status: 'INVALID_TRANSACTION' }, { tranId: 'T1', amount: 500 })).toBe('not_valid');
    expect(judgeTransaction({ ...ok, risk_level: '1' }, { tranId: 'T1', amount: 500 })).toBe('risky');
    expect(judgeTransaction(null, { tranId: 'T1', amount: 500 })).toBe('not_valid');
  });
});

describe('verifyIpnSignature', () => {
  it('follows the SSLCommerz hash: listed keys + md5(store password), sorted, md5', () => {
    const post: Record<string, string> = { tran_id: 'T1', val_id: 'V1', amount: '500.00', status: 'VALID', verify_key: 'amount,status,tran_id,val_id' };
    const expected = md5(`amount=500.00&status=VALID&store_passwd=${md5('qwerty')}&tran_id=T1&val_id=V1`);
    expect(verifyIpnSignature({ ...post, verify_sign: expected }, 'qwerty')).toBe(true);
    expect(verifyIpnSignature({ ...post, amount: '5.00', verify_sign: expected }, 'qwerty')).toBe(false);
    expect(verifyIpnSignature({ ...post, verify_sign: expected }, 'other')).toBe(false);
    expect(verifyIpnSignature(post, 'qwerty')).toBe(false);
  });
});
