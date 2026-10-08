import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import QRCode from 'qrcode';
import { CircleAlert, CircleCheck, Clock, ShieldCheck } from 'lucide-react';
import { ConfirmationTasks, CopyId } from '@/components/pre-admission/confirmation-tasks';
import { FlowShell } from '@/components/pre-admission/flow-shell';
import { PayButton } from '@/components/pre-admission/pay-button';
import { Button } from '@/components/shadcn/button';
import { asLocale, dateTime, taka, txt, type Locale } from '@/lib/admissions/display';
import { loadById, type Application } from '@/lib/admissions/drafts';
import { fieldWithRole, type FormSnapshot } from '@/lib/admissions/form-config';
import { flowPath } from '@/lib/admissions/pages';
import { latestPayment, paymentGateway, reconcilePayment, type Payment } from '@/lib/admissions/payments';
import { currentApplication, siteOrigin } from '@/lib/admissions/session';
import { afterPaid } from '@/lib/admissions/after-paid';

type Props = { params: Promise<{ locale: string }>; searchParams: Promise<{ payment?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const t = await getTranslations({ locale: asLocale((await params).locale), namespace: 'preAdmission.status' });
  return { title: t('submittedTitle'), robots: { index: false } };
}

function studentLine(app: Application, snapshot: FormSnapshot, locale: Locale) {
  const classField = fieldWithRole(snapshot, 'classApplied');
  const option = classField?.options.find((o) => o.value === app.answers[classField.key]);
  return [app.studentNameBn, option && txt(option.label, locale)].filter(Boolean).join(', ');
}

/** "BKASH-BKash" → "BKash"; "VISA-Dutch Bangla" → "VISA". */
const methodName = (cardType: string | null) => (cardType ? (cardType.split('-').at(-1) ?? cardType).trim() : '');

export default async function StatusPage({ params, searchParams }: Props) {
  const locale = asLocale((await params).locale);
  const { payment: notice } = await searchParams;
  const t = await getTranslations({ locale, namespace: 'preAdmission' });
  const current = await currentApplication().catch(() => null);
  if (!current) redirect(flowPath(locale, '/start'));
  let { app } = current;
  const { snapshot } = current;
  if (app.status === 'draft') redirect(flowPath(locale, '/form'));

  // A payment still open: ask SSLCommerz what happened before showing anything.
  let payment = await latestPayment(app.id);
  if (app.status === 'unpaid' && payment?.status === 'initiated') {
    const settled = await reconcilePayment(payment).catch((e) => console.error('Admissions: reconcile on status page failed', e));
    if (settled?.outcome === 'paid') afterPaid(app.id, await siteOrigin());
    app = (await loadById(app.id))?.app ?? app;
    payment = await latestPayment(app.id);
  }

  const fee = taka(snapshot.settings.applicationFee, locale);
  const shell = (children: React.ReactNode) => (
    <FlowShell locale={locale} session={snapshot.settings.session} back={{ href: flowPath(locale), label: t('back') }}>
      {children}
    </FlowShell>
  );

  if (app.status !== 'unpaid') return shell(await Confirmation({ app, snapshot, payment, locale, fee }));

  const configured = !!paymentGateway();
  const state = payment?.status === 'held' ? 'held' : payment?.status === 'initiated' ? 'pending' : payment && payment.status !== 'valid' ? 'failed' : 'due';
  const icon = {
    held: <ShieldCheck className="size-7 text-muted-foreground" aria-hidden />,
    pending: <Clock className="size-7 text-warning" aria-hidden />,
    failed: <CircleAlert className="size-7 text-warning" aria-hidden />,
    due: <CircleCheck className="size-7 text-success" aria-hidden />,
  }[state];
  const title = { held: t('status.heldTitle'), pending: t('status.pendingTitle'), failed: t('status.failedTitle'), due: t('status.submittedTitle') }[state];
  const lead = {
    held: t('status.heldLead'),
    pending: t('status.pendingLead'),
    failed: t('status.failedLead'),
    due: configured ? t('status.submittedLead') : t('status.notConfiguredLead'),
  }[state];
  const deadline = snapshot.settings.closesAt;

  return shell(
    <main className="mx-auto flex w-full max-w-[560px] flex-col gap-5 px-4 pb-10 pt-8 md:py-16">
      {notice && (
        <p role="alert" className="flex gap-2.5 rounded-lg border bg-card p-3 text-[13.5px] leading-relaxed">
          <CircleAlert className="mt-0.5 size-4 flex-none text-destructive" aria-hidden />
          {notice === 'busy' ? t('rateLimited') : t('status.gatewayError')}
        </p>
      )}
      <div className="flex flex-col gap-2.5">
        {icon}
        <h1 className="text-2xl font-bold leading-[1.35] tracking-[-0.01em] md:text-[30px]">{title}</h1>
        <p className="text-[15px] leading-relaxed text-muted-foreground">{lead}</p>
      </div>

      <dl className="grid grid-cols-[110px_1fr] gap-x-3 gap-y-2 rounded-xl border bg-card p-4 text-sm">
        <dt className="text-muted-foreground">{t('status.student')}</dt>
        <dd>{studentLine(app, snapshot, locale)}</dd>
        <dt className="text-muted-foreground">{t('status.state')}</dt>
        <dd className="font-medium text-warning">{t('status.feeDue')}</dd>
        {deadline && (
          <>
            <dt className="text-muted-foreground">{t('status.deadline')}</dt>
            <dd>{dateTime(deadline, locale)}</dd>
          </>
        )}
      </dl>

      {(state === 'failed' || state === 'pending') && <p className="text-[13.5px] leading-relaxed text-muted-foreground">{t('status.deductedNote')}</p>}

      <div className="flex flex-col gap-2 pt-2">
        {configured && state === 'pending' && (
          <Button asChild className="h-11 text-[15px]">
            <Link href={flowPath(locale, '/status')}>{t('status.refresh')}</Link>
          </Button>
        )}
        {configured && state !== 'held' && (
          <PayButton
            locale={locale}
            variant={state === 'pending' ? 'outline' : 'default'}
            label={state === 'failed' ? t('status.retry') : state === 'pending' ? t('status.payAgain') : t('status.payNow', { fee })}
          />
        )}
        {state !== 'held' && (
          <Button asChild variant="outline" className="h-11 bg-card text-[15px] shadow-none">
            <Link href={flowPath(locale, '/review')}>{t('status.editApplication')}</Link>
          </Button>
        )}
        <p className="py-2 text-center text-sm">
          {t('status.help')}{' '}
          <Link href={`/${locale}/contact`} className="underline underline-offset-[3px]">
            {t('status.contact')}
          </Link>
        </p>
      </div>
    </main>,
  );
}

async function Confirmation({ app, snapshot, payment, locale, fee }: { app: Application; snapshot: FormSnapshot; payment: Payment | null; locale: Locale; fee: string }) {
  const t = await getTranslations({ locale, namespace: 'preAdmission.status' });
  const whatsappUrl = snapshot.settings.whatsappUrl || null;
  const qrSvg = whatsappUrl ? await QRCode.toString(whatsappUrl, { type: 'svg', margin: 0, errorCorrectionLevel: 'M' }) : null;
  const paid = payment?.status === 'valid' ? payment : null;
  const evalFee = taka(snapshot.settings.evaluationFee, locale);
  const instructions = txt(snapshot.settings.pdfInstructions, locale);

  return (
    <main className="mx-auto flex w-full max-w-[1040px] flex-col gap-4 px-4 pb-10 pt-7 md:gap-6 md:px-8 md:py-12">
      <div className="flex flex-col gap-2">
        <CircleCheck className="size-7 text-success" aria-hidden />
        <h1 className="text-[22px] font-bold leading-[1.4] tracking-[-0.01em] md:text-[30px] md:leading-[1.3]">{t('paidTitle')}</h1>
        <p className="text-[14.5px] text-muted-foreground md:text-[15px]">{t('paidLead', { fee })}</p>
      </div>

      <div className="flex items-center justify-between gap-3 rounded-xl border bg-card py-3.5 pl-4 pr-3.5 md:max-w-[500px]">
        <div className="flex flex-col gap-0.5">
          <span className="text-[13px] text-muted-foreground">{t('applicationId')}</span>
          <span className="font-[family-name:var(--font-english)] text-[32px] font-bold leading-[1.15] tracking-[0.02em]">{app.publicRef}</span>
          <span className="text-[13.5px] text-muted-foreground">{studentLine(app, snapshot, locale)}</span>
        </div>
        <CopyId value={app.publicRef ?? ''} label={t('copyId')} />
      </div>

      <ConfirmationTasks locale={locale} publicRef={app.publicRef ?? ''} pdfUrl="/api/admissions/pdf" whatsappUrl={whatsappUrl} qrSvg={qrSvg} emailed={!!app.confirmationEmailAt} />

      <div className="grid gap-8 border-t pt-6 md:grid-cols-2 md:gap-10">
        <section className="flex flex-col gap-2.5">
          <h2 className="text-[17px] font-semibold">{t('bringTitle')}</h2>
          <ol className="list-decimal pl-5 text-[14.5px] leading-[1.9]">
            <li>{t('bringPrint')}</li>
            <li>{t('bringCertificate')}</li>
            <li>{t('bringFee', { fee: evalFee })}</li>
          </ol>
          {instructions && <p className="text-[13.5px] leading-relaxed text-muted-foreground">{instructions}</p>}
        </section>
        {paid && (
          <section className="flex flex-col gap-2.5">
            <h2 className="text-[17px] font-semibold">{t('receiptTitle')}</h2>
            <dl className="grid grid-cols-[110px_1fr] gap-x-3 gap-y-2 text-sm">
              <dt className="text-muted-foreground">{t('amount')}</dt>
              <dd>{t('paidAmount', { fee: taka(paid.amount, locale) })}</dd>
              {paid.cardType && (
                <>
                  <dt className="text-muted-foreground">{t('method')}</dt>
                  <dd>{methodName(paid.cardType)}</dd>
                </>
              )}
              <dt className="text-muted-foreground">{t('transactionId')}</dt>
              <dd className="break-all font-[family-name:var(--font-english)]">{paid.bankTranId || paid.tranId}</dd>
              {paid.completedAt && (
                <>
                  <dt className="text-muted-foreground">{t('time')}</dt>
                  <dd>{dateTime(paid.completedAt.toISOString(), locale)}</dd>
                </>
              )}
            </dl>
          </section>
        )}
      </div>
    </main>
  );
}
