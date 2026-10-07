import { randomBytes } from 'node:crypto';
import type { Gateway, GatewayTransaction, SessionRequest } from '../sslcommerz';

// A stand-in for SSLCommerz with the same API, for database tests and the local preview (where
// /api/admissions/sslcommerz/mock plays the hosted checkout page). Never used on Vercel.

export type MockOutcome = 'pay' | 'fail' | 'cancel' | 'risky' | 'wrong_amount';
type Attempt = { request: SessionRequest; status: string; valId?: string; amount: number; risk: string };

export type MockGateway = Gateway & {
  attempts: Map<string, Attempt>;
  /** What the guardian did on the checkout page; returns the val_id SSLCommerz would post back. */
  complete(tranId: string, outcome: MockOutcome): string | null;
  /** Make the gateway unreachable (timeouts) until called again with false. */
  setDown(down: boolean): void;
};

export function mockGateway(): MockGateway {
  const attempts = new Map<string, Attempt>();
  let down = false;
  const tx = (tranId: string, a: Attempt): GatewayTransaction => ({
    status: a.status,
    tran_id: tranId,
    val_id: a.valId,
    amount: a.amount.toFixed(2),
    store_amount: (a.amount * 0.975).toFixed(2),
    currency: 'BDT',
    bank_tran_id: a.valId ? `BANK${a.valId.slice(-6)}` : undefined,
    card_type: 'BKASH-BKash',
    risk_level: a.risk,
    risk_title: a.risk === '1' ? 'Risky' : 'Safe',
    tran_date: new Date().toISOString(),
    value_a: a.request.reference,
  });

  return {
    attempts,
    setDown: (value) => void (down = value),
    async createSession(request) {
      if (down) return { ok: false, reason: 'unreachable' };
      attempts.set(request.tranId, { request, status: 'PENDING', amount: request.amount, risk: '0' });
      const origin = new URL(request.successUrl).origin;
      return { ok: true, gatewayUrl: `${origin}/api/admissions/sslcommerz/mock?tran_id=${encodeURIComponent(request.tranId)}`, sessionKey: `MOCK${request.tranId}` };
    },
    complete(tranId, outcome) {
      const a = attempts.get(tranId);
      if (!a) return null;
      if (outcome === 'fail') a.status = 'FAILED';
      else if (outcome === 'cancel') a.status = 'CANCELLED';
      else {
        a.status = 'VALID';
        a.valId = `MOCKVAL${randomBytes(6).toString('hex')}`;
        if (outcome === 'risky') a.risk = '1';
        if (outcome === 'wrong_amount') a.amount = 5;
      }
      return a.valId ?? null;
    },
    async validate(valId) {
      if (down) return null;
      for (const [tranId, a] of attempts) {
        if (a.valId === valId) {
          const result = tx(tranId, a);
          if (a.status === 'VALID') a.status = 'VALIDATED';
          return result;
        }
      }
      return { status: 'INVALID_TRANSACTION' };
    },
    async queryByTranId(tranId) {
      if (down) return null;
      const a = attempts.get(tranId);
      return a && a.status !== 'PENDING' ? [tx(tranId, a)] : [];
    },
  };
}
