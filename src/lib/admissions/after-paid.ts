import 'server-only';
import { after } from 'next/server';
import { sendConfirmationEmail } from './mail';
import { copyPendingToSheet } from './sheet-copy';

/**
 * Once an application gets its ID, whichever way (IPN, browser return, status-page check, office
 * acceptance, submit after a reopen): the confirmation email with the PDF and the Sheet row, sent
 * after the response. The daily job retries both.
 */
export function afterPaid(applicationId: string, origin: string) {
  after(() =>
    sendConfirmationEmail(applicationId, origin)
      .then((r) => !r.ok && console.warn('Admissions: confirmation email not sent', r))
      .catch((e) => console.error('Admissions: confirmation email failed', e)),
  );
  after(() => copyPendingToSheet({ limit: 10, budgetMs: 15_000 }).catch(() => undefined));
}
