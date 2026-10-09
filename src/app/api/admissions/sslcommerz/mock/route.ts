import type { NextRequest } from 'next/server';
import { localOverrides } from '@/lib/admissions/local';
import type { MockGateway, MockOutcome } from '@/lib/admissions/testing/mock-gateway';

// Local preview only: plays the SSLCommerz hosted checkout page for the stand-in gateway, then
// posts back to our success/fail/cancel URLs the way SSLCommerz does. 404 everywhere else.

function mock(): MockGateway | null {
  const gateway = localOverrides()?.gateway as MockGateway | undefined;
  return gateway && 'complete' in gateway ? gateway : null;
}

const html = (body: string) =>
  new Response(`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Test payment</title>
<style>body{font-family:system-ui,sans-serif;max-width:420px;margin:40px auto;padding:0 16px;color:#171717}button{display:block;width:100%;height:44px;margin:8px 0;border-radius:8px;border:1px solid #d4d4d4;background:#fff;font-size:15px}button.pay{background:#7a4d32;color:#fff;border:0}</style></head><body>${body}</body></html>`, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });

const escape = (s: string) => s.replace(/[&<>"]/g, (c) => `&#${c.charCodeAt(0)};`);

export async function GET(request: NextRequest) {
  const gateway = mock();
  const tranId = request.nextUrl.searchParams.get('tran_id') ?? '';
  const attempt = gateway?.attempts.get(tranId);
  if (!gateway || !attempt) return new Response('Not found', { status: 404 });
  return html(`<h1>Test payment</h1><p>Local preview: no money moves. Amount ৳${attempt.amount}, transaction ${escape(tranId)}.</p>
<form method="post">${(['pay', 'fail', 'cancel', 'risky'] as MockOutcome[])
    .map((o) => `<button name="outcome" value="${o}" class="${o === 'pay' ? 'pay' : ''}">${{ pay: 'Pay', fail: 'Fail', cancel: 'Cancel', risky: 'Pay (flagged as risky)', wrong_amount: '' }[o]}</button>`)
    .join('')}<input type="hidden" name="tran_id" value="${escape(tranId)}"></form>`);
}

export async function POST(request: NextRequest) {
  const gateway = mock();
  const form = await request.formData();
  const tranId = String(form.get('tran_id') ?? '');
  const outcome = String(form.get('outcome') ?? '') as MockOutcome;
  const attempt = gateway?.attempts.get(tranId);
  if (!gateway || !attempt) return new Response('Not found', { status: 404 });
  const valId = gateway.complete(tranId, outcome);
  const target = outcome === 'fail' ? attempt.request.failUrl : outcome === 'cancel' ? attempt.request.cancelUrl : attempt.request.successUrl;
  const fields = { tran_id: tranId, val_id: valId ?? '', status: outcome === 'fail' ? 'FAILED' : outcome === 'cancel' ? 'CANCELLED' : 'VALID', amount: String(attempt.amount) };
  return html(`<p>Returning to the school website…</p><form id="f" method="post" action="${escape(target)}">${Object.entries(fields)
    .map(([k, v]) => `<input type="hidden" name="${k}" value="${escape(v)}">`)
    .join('')}</form><script>document.getElementById('f').submit()</script>`);
}
