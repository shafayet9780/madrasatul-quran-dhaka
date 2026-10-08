import 'server-only';
import { and, eq, isNull, lt, isNotNull } from 'drizzle-orm';
import { getAdmissionsDb } from './db';
import { dateTime, type Locale } from './display';
import { label, logEvent, type Application } from './drafts';
import { loadSnapshot } from './cycle';
import { localOverrides } from './local';
import { confirmationEmail, resumeEmail } from './mail-templates';
import { ensureApplicationPdf, pdfFileName, readStoredPdf } from './pdf';
import { applications } from './schema';

// Admissions email through Resend (installed from the Vercel Marketplace: RESEND_API_KEY), sent
// from ADMISSIONS_EMAIL_FROM on the school's verified domain. Best effort: a failure is logged and
// the confirmation is retried by the daily job; it never blocks the guardian.

export type MailMessage = { to: string; subject: string; html: string; text: string; attachments?: { filename: string; content: Uint8Array }[] };
export type MailResult = { ok: true; id?: string } | { ok: false; reason: string };
export type Mailer = (message: MailMessage) => Promise<MailResult>;

export const DEFAULT_FROM = 'Madrasatul Quran <admissions@madrasatulquranbd.com>';

/** The local preview's outbox, or Resend when configured; null when email is not set up. */
export function mailer(): Mailer | null {
  const local = localOverrides();
  if (local?.outbox) {
    const outbox = local.outbox;
    return async (m) => {
      outbox.push(m);
      return { ok: true, id: `local-${outbox.length}` };
    };
  }
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  const from = process.env.ADMISSIONS_EMAIL_FROM || DEFAULT_FROM;
  return async (m) => {
    try {
      const { Resend } = await import('resend');
      const { data, error } = await new Resend(key).emails.send({
        from,
        to: m.to,
        subject: m.subject,
        html: m.html,
        text: m.text,
        attachments: m.attachments?.map((a) => ({ filename: a.filename, content: Buffer.from(a.content) })),
      });
      return error ? { ok: false, reason: error.message } : { ok: true, id: data?.id };
    } catch (e) {
      return { ok: false, reason: e instanceof Error ? e.message : 'send failed' };
    }
  };
}

const asLocale = (value: string): Locale => (value === 'english' ? 'english' : 'bengali');

/** Start page: the resume link (the token is known only now, so this is not retried). */
export async function sendResumeEmail(app: Application, token: string, origin: string, send = mailer()): Promise<MailResult> {
  if (!send) return { ok: false, reason: 'not_configured' };
  const snapshot = await loadSnapshot(app.cycleId, app.snapshotVersion);
  const locale = asLocale(app.locale);
  const closesAt = snapshot?.settings.closesAt;
  const email = resumeEmail({
    locale,
    session: snapshot?.settings.session ?? '',
    resumeUrl: `${origin}/${locale}/pre-admission/resume?t=${token}`,
    deadline: closesAt ? dateTime(closesAt, locale) : null,
  });
  const result = await send({ to: app.email, ...email });
  if (result.ok) await getAdmissionsDb().update(applications).set({ resumeEmailAt: new Date() }).where(eq(applications.id, app.id));
  else await logEvent(app.id, label(app), 'email_failed', 'system', { email: 'resume', reason: result.reason });
  return result;
}

/** After payment: ID, WhatsApp link and the application PDF attached. Sent once, or `again` from the admin. */
export async function sendConfirmationEmail(applicationId: string, origin: string, send = mailer(), again = false): Promise<MailResult> {
  if (!send) return { ok: false, reason: 'not_configured' };
  const db = getAdmissionsDb();
  const [app] = await db.select().from(applications).where(eq(applications.id, applicationId));
  if (!app?.publicRef) return { ok: false, reason: 'not_paid' };
  if (app.confirmationEmailAt && !again) return { ok: true };
  const snapshot = await loadSnapshot(app.cycleId, app.snapshotVersion);
  if (!snapshot) return { ok: false, reason: 'no_form' };
  const locale = asLocale(app.locale);

  let attachment: Uint8Array | null = null;
  try {
    const pdf = await ensureApplicationPdf(app, snapshot, origin);
    attachment = pdf.bytes ?? (await readStoredPdf(pdf.key));
  } catch (e) {
    // Better an email with the ID and links now than none; the PDF stays downloadable.
    console.error('Admissions: PDF for the confirmation email failed', e);
  }
  const email = confirmationEmail({
    locale,
    session: snapshot.settings.session,
    publicRef: app.publicRef,
    studentName: app.studentNameBn ?? '',
    whatsappUrl: snapshot.settings.whatsappUrl || null,
    statusUrl: `${origin}/${locale}/pre-admission/find`,
    evaluationFee: snapshot.settings.evaluationFee,
  });
  const result = await send({ to: app.email, ...email, attachments: attachment ? [{ filename: pdfFileName(app.publicRef), content: attachment }] : undefined });
  if (result.ok) {
    await db.update(applications).set({ confirmationEmailAt: new Date() }).where(and(eq(applications.id, app.id), isNull(applications.confirmationEmailAt)));
    await logEvent(app.id, app.publicRef, 'email_confirmation', again ? 'admin' : 'system', { to: app.email, pdf: !!attachment });
  } else {
    await logEvent(app.id, app.publicRef, 'email_failed', 'system', { email: 'confirmation', reason: result.reason });
  }
  return result;
}

/** Daily job: confirmations not sent yet (paid more than 10 minutes ago), within `budgetMs`. */
export async function retryConfirmationEmails(origin: string, budgetMs = 20_000, send = mailer()): Promise<{ sent: number; failed: number } | { skipped: string }> {
  if (!send) return { skipped: 'email is not configured' };
  const stopAt = Date.now() + budgetMs;
  const due = await getAdmissionsDb()
    .select({ id: applications.id })
    .from(applications)
    .where(and(isNotNull(applications.publicRef), isNull(applications.confirmationEmailAt), lt(applications.paidAt, new Date(Date.now() - 10 * 60 * 1000))))
    .limit(30);
  let sent = 0;
  let failed = 0;
  for (const { id } of due) {
    if (Date.now() > stopAt) break;
    if ((await sendConfirmationEmail(id, origin, send)).ok) sent += 1;
    else failed += 1;
  }
  return { sent, failed };
}
