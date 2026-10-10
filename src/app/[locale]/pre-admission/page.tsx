import type { Metadata } from 'next';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { ArrowRight, Camera, ChevronDown, Clock, FileText, Smartphone } from 'lucide-react';
import { Button } from '@/components/shadcn/button';
import { getContentService } from '@/lib/content-service';
import { urlFor } from '@/lib/sanity';
import { fieldWithRole } from '@/lib/admissions/form-config';
import { asLocale, num, taka, txt, type Locale } from '@/lib/admissions/display';
import { intakeStatus } from '@/lib/admissions/intake';
import { flowPath, safeCurrentCycle } from '@/lib/admissions/pages';
import { currentApplication } from '@/lib/admissions/session';
import type { CycleState } from '@/lib/admissions/cycle';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = asLocale((await params).locale);
  const t = await getTranslations({ locale, namespace: 'preAdmission.intro' });
  const cycle = await safeCurrentCycle();
  const session = num(cycle?.session ?? '2027', locale);
  return { title: t('metaTitle', { session }), description: t('metaDescription', { session }) };
}

function statusLine(cycle: CycleState | null, locale: Locale, t: Awaited<ReturnType<typeof getTranslations>>): { text: string; open: boolean } {
  const settings = cycle?.snapshot.settings;
  const state = !cycle || !cycle.enabled ? 'off' : cycle.window;
  return { text: intakeStatus({ state, opensAt: settings?.opensAt, closesAt: settings?.closesAt }, locale, t), open: state === 'open' };
}

export default async function PreAdmissionIntro({ params }: Props) {
  const locale = asLocale((await params).locale);
  const t = await getTranslations({ locale, namespace: 'preAdmission.intro' });
  const [cycle, current, facilities] = await Promise.all([
    safeCurrentCycle(),
    currentApplication().catch(() => null),
    getContentService(false).getFeaturedFacilities().catch(() => []),
  ]);
  const status = statusLine(cycle, locale, t);
  const settings = cycle?.snapshot.settings;
  const session = num(cycle?.session ?? '2027', locale);
  const fee = settings ? taka(settings.applicationFee, locale) : '';
  const evalFee = settings ? taka(settings.evaluationFee, locale) : '';
  const classes = cycle ? (fieldWithRole(cycle.snapshot, 'classApplied')?.options ?? []) : [];
  const regular = classes.filter((o) => !o.special).map((o) => txt(o.label, locale));
  const special = classes.filter((o) => o.special).map((o) => txt(o.label, locale));
  const resumable = current && (current.app.status === 'draft' || current.app.status === 'unpaid');
  const photo = (facilities ?? []).find((f) => f.images?.length)?.images[0];

  const steps = [1, 2, 3, 4, 5, 6].map((n) => ({
    n: num(n, locale),
    title: t(`step${n}`),
    note: t(`step${n}Note`, { fee: n === 5 ? evalFee : fee }),
  }));
  const faq = [
    { q: t('faqRefundQ'), a: [txt(settings?.refundNote, locale), t('faqRefundA')].filter(Boolean).join(' ') },
    { q: t('faqResumeQ'), a: t('faqResumeA') },
    { q: t('faqScheduleQ'), a: t('faqScheduleA') },
    { q: t('faqPaymentQ'), a: t('faqPaymentA') },
  ];

  return (
    <div className="adm [font-family:var(--font-english),var(--font-bengali),system-ui,sans-serif]">
      <section className="border-b bg-card">
        <div className="mx-auto grid max-w-[1200px] items-center gap-12 px-4 py-7 md:px-8 md:py-16 lg:grid-cols-2">
          <div className="flex flex-col gap-4 md:gap-5">
            <span className="inline-flex h-[26px] items-center gap-1.5 self-start rounded-lg border bg-card px-2.5 text-[13px] font-medium">
              <Clock className={`size-3.5 ${status.open ? 'text-success' : 'text-muted-foreground'}`} aria-hidden />
              {status.text}
            </span>
            <h1 className="text-[30px] font-bold leading-[1.3] tracking-[-0.015em] md:text-5xl md:leading-[1.2] md:tracking-[-0.02em]">
              {t('heading', { session })}
            </h1>
            <p className="max-w-[40ch] text-base leading-relaxed text-muted-foreground md:text-lg">{status.open ? t('lead') : t('closedLead')}</p>
            <div className="mt-1 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:gap-2.5">
              {resumable ? (
                <Button asChild className="h-11 px-4 text-[15px]">
                  <Link href={flowPath(locale, '/form')}>
                    {t('continue')} <ArrowRight aria-hidden />
                  </Link>
                </Button>
              ) : status.open ? (
                <Button asChild className="h-11 px-4 text-[15px]">
                  <Link href={flowPath(locale, '/start')}>
                    {t('start')} <ArrowRight aria-hidden />
                  </Link>
                </Button>
              ) : null}
              <Button asChild variant="outline" className="h-11 bg-card px-4 text-[15px] shadow-none">
                <Link href={flowPath(locale, '/find')}>{t('find')}</Link>
              </Button>
            </div>
          </div>
          {photo && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={urlFor(photo).width(1200).height(900).url()}
              alt={t('campusPhoto')}
              className="hidden aspect-[4/3] w-full rounded-xl border object-cover lg:block"
            />
          )}
        </div>
      </section>

      <div className="mx-auto max-w-[1200px] px-4 md:px-8">
        {settings && (
          <section className="grid gap-12 pt-7 md:grid-cols-2 md:pt-16">
            <div>
              <h2 className="text-lg font-semibold tracking-[-0.01em]">{t('feesTitle')}</h2>
              <dl className="mt-3 grid grid-cols-[1fr_auto] gap-x-4 md:mt-4 md:gap-x-6">
                <dt className="flex flex-col gap-0.5 pb-3.5">
                  <span className="text-[15px] font-medium md:text-base">{t('applicationFee')}</span>
                  <span className="text-[13px] text-muted-foreground md:text-sm">{t('applicationFeeNote')}</span>
                </dt>
                <dd className="pb-3.5 text-base font-semibold md:text-lg">{fee}</dd>
                <dt className="flex flex-col gap-0.5 border-t pt-3.5">
                  <span className="text-[15px] font-medium md:text-base">{t('evaluationFee')}</span>
                  <span className="text-[13px] text-muted-foreground md:text-sm">{t('evaluationFeeNote')}</span>
                </dt>
                <dd className="border-t pt-3.5 text-base font-semibold md:text-lg">{evalFee}</dd>
              </dl>
            </div>
            <div>
              <h2 className="text-lg font-semibold tracking-[-0.01em]">{t('readyTitle')}</h2>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground md:text-[15px]">{t('readyLead')}</p>
              <ul className="mt-4 flex flex-col gap-3.5">
                {[
                  { Icon: Camera, title: t('readyPhotos'), note: t('readyPhotosNote') },
                  { Icon: FileText, title: t('readyCertificate'), note: t('readyCertificateNote') },
                  { Icon: Smartphone, title: t('readyContact'), note: t('readyContactNote') },
                ].map(({ Icon, title, note }) => (
                  <li key={title} className="flex gap-3">
                    <Icon className="mt-[3px] size-[18px] flex-none text-muted-foreground" aria-hidden />
                    <span className="flex flex-col">
                      <span className="text-[15px]">{title}</span>
                      <span className="text-[13px] text-muted-foreground">{note}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}

        <section className="pt-7 md:pt-12">
          <h2 className="mb-4 text-lg font-semibold tracking-[-0.01em] md:mb-6">{t('stepsTitle')}</h2>
          <ol className="md:hidden">
            {steps.map((s, i) => (
              <li key={s.n} className="grid grid-cols-[28px_1fr] gap-x-3">
                <div className="flex flex-col items-center">
                  <span className="flex size-6 items-center justify-center rounded-full border border-input bg-card text-[12.5px] font-semibold">{s.n}</span>
                  {i < steps.length - 1 && <span className="w-px flex-1 bg-border" />}
                </div>
                <div className="flex flex-col gap-0.5 pb-[18px] pt-px">
                  <span className="text-[15px] font-medium">{s.title}</span>
                  <span className="text-[13.5px] leading-normal text-muted-foreground">{s.note}</span>
                </div>
              </li>
            ))}
          </ol>
          <ol className="hidden border-t md:grid md:grid-cols-3 lg:grid-cols-6">
            {steps.map((s) => (
              <li key={s.n} className="flex flex-col gap-1.5 pr-5 pt-[18px]">
                <span className="text-[13px] font-semibold text-muted-foreground">{s.n}</span>
                <span className="text-base font-medium">{s.title}</span>
                <span className="text-sm leading-relaxed text-muted-foreground">{s.note}</span>
              </li>
            ))}
          </ol>
        </section>

        {regular.length > 0 && (
          <section className="pt-7 md:pt-10">
            <h2 className="mb-3 text-lg font-semibold tracking-[-0.01em]">{t('classesTitle')}</h2>
            <p className="text-[15px] leading-loose md:text-[15.5px]">
              {regular.join(', ')}
              {special.length > 0 && (
                <>
                  <br />
                  <span className="text-muted-foreground">{t('classesSpecial', { classes: special.join(', ') })}</span>
                </>
              )}
            </p>
          </section>
        )}

        <section className="max-w-[840px] pb-8 pt-7 md:pb-18 md:pt-12">
          <h2 className="text-lg font-semibold tracking-[-0.01em]">{t('faqTitle')}</h2>
          {faq.map((item) => (
            <details key={item.q} className="group border-b">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 py-3.5 text-[15px] font-medium [&::-webkit-details-marker]:hidden">
                {item.q}
                <ChevronDown className="size-4 flex-none transition-transform group-open:rotate-180" aria-hidden />
              </summary>
              <p className="mb-3.5 text-sm leading-relaxed text-muted-foreground">{item.a}</p>
            </details>
          ))}
          <p className="mt-4 text-sm text-muted-foreground">
            {t('moreQuestions')}{' '}
            <Link href={`/${locale}/contact`} className="font-medium text-foreground underline underline-offset-[3px]">
              {t('contactUs')}
            </Link>
          </p>
        </section>
      </div>
    </div>
  );
}
