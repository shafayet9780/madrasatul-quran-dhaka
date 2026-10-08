import { NextResponse, after, type NextRequest } from 'next/server';
import { eq } from 'drizzle-orm';
import { getAdmissionsDb } from '@/lib/admissions/db';
import { sendConfirmationEmail } from '@/lib/admissions/mail';
import { closePayment, confirmPayment, type SettleResult } from '@/lib/admissions/payments';
import { copyPendingToSheet } from '@/lib/admissions/sheet-copy';
import { applications } from '@/lib/admissions/schema';
import { sslConfigFromEnv, verifyIpnSignature } from '@/lib/admissions/sslcommerz';

// SSLCommerz posts here: the guardian's browser returns to success/fail/cancel, and the server-to-
// server IPN arrives at ipn. None of these posts is trusted: the payment is decided by the
// validation API (success, IPN) or by a transaction query (fail, cancel), inside payments.ts.

const EVENTS = new Set(['success', 'fail', 'cancel', 'ipn']);

/** Once paid: make the PDF and email it, and copy to the Sheet, after the response (the guardian does not wait). */
function afterPaid(result: SettleResult, origin: string) {
  if (result.outcome !== 'paid' || !result.applicationId) return;
  const id = result.applicationId;
  after(() => sendConfirmationEmail(id, origin).then((r) => !r.ok && console.warn('Admissions: confirmation email not sent', r)).catch((e) => console.error('Admissions: confirmation email failed', e)));
  after(() => copyPendingToSheet({ limit: 10, budgetMs: 15_000 }).catch(() => undefined));
}

async function formFields(request: NextRequest): Promise<Record<string, string>> {
  const form = await request.formData().catch(() => null);
  const out: Record<string, string> = {};
  form?.forEach((value, key) => {
    if (typeof value === 'string') out[key] = value;
  });
  return out;
}

/** Back to the guardian's status page, in the language they applied in (303: the browser GETs it). */
async function backToStatus(request: NextRequest, result: SettleResult, extra = '') {
  let locale = 'bengali';
  if (result.applicationId) {
    const [app] = await getAdmissionsDb().select({ locale: applications.locale }).from(applications).where(eq(applications.id, result.applicationId));
    if (app?.locale === 'english') locale = 'english';
  }
  const path = result.applicationId ? `/${locale}/pre-admission/status${extra}` : `/${locale}/pre-admission`;
  return NextResponse.redirect(new URL(path, request.url), 303);
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ event: string }> }) {
  const { event } = await params;
  if (!EVENTS.has(event)) return new NextResponse('Not found', { status: 404 });
  const post = await formFields(request);
  const tranId = post.tran_id?.trim();

  if (event === 'ipn') {
    if (!tranId) return new NextResponse('Invalid data', { status: 400 });
    const cfg = sslConfigFromEnv();
    if (cfg && post.verify_sign && !verifyIpnSignature(post, cfg.storePassword)) {
      console.warn('Admissions: IPN signature did not match; checking with the validation API anyway', { tranId });
    }
    const status = String(post.status ?? '').toUpperCase();
    const result =
      (status === 'VALID' || status === 'VALIDATED') && post.val_id
        ? await confirmPayment(tranId, post.val_id, 'ipn')
        : await closePayment(tranId, status === 'CANCELLED' ? 'cancelled' : 'failed');
    console.info('Admissions: IPN', { tranId, status, outcome: result.outcome });
    afterPaid(result, request.nextUrl.origin);
    return new NextResponse(result.outcome, { status: result.outcome === 'unreachable' ? 503 : 200 });
  }

  if (!tranId) return NextResponse.redirect(new URL('/bengali/pre-admission', request.url), 303);
  if (event === 'success') {
    const result = post.val_id ? await confirmPayment(tranId, post.val_id, 'return') : await closePayment(tranId, 'failed');
    afterPaid(result, request.nextUrl.origin);
    return backToStatus(request, result);
  }
  const result = await closePayment(tranId, event === 'cancel' ? 'cancelled' : 'failed');
  return backToStatus(request, result);
}
