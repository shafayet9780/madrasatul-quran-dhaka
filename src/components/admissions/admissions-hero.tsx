import { getTranslations } from 'next-intl/server';
import type { Locale } from '@/lib/i18n';
import type { IntakeState } from '@/lib/admissions/intake';
import { ButtonLink } from '@/components/site/button';
import { Icon } from '@/components/site/icon';
import { OnThisPage } from '@/components/site/on-this-page';
import { cn } from '@/lib/utils';

export type IntakeFacts = { session: string; applicationFee: string; evaluationFee: string };

/**
 * The page's opening, on `paper`: the H1, a lead and the actions, with the intake beside it (its title, status line
 * with the green dot while open, and two fees); under it, links to each section of the page. With no intake open or
 * announced (and so no site banner) the status line sits above the H1 instead.
 * While the form is open the rust button applies; while it is announced it shows the details; otherwise it points
 * to the contact page. The intake comes from the published pre-admission form, never a placeholder.
 */
export async function AdmissionsHero({
  locale,
  state,
  status,
  facts,
  links,
}: {
  locale: Locale;
  state: IntakeState;
  status: string;
  /** The intake's session and fees, while it is open or announced. */
  facts?: IntakeFacts;
  links: { id: string; label: string }[];
}) {
  const t = await getTranslations({ locale, namespace: 'admissions.page' });
  const intro = await getTranslations({ locale, namespace: 'preAdmission.intro' });
  const cta = await getTranslations({ locale, namespace: 'admissionCta' });
  const home = await getTranslations({ locale, namespace: 'home.hero' });
  const open = state === 'open';
  const statusLine = (className: string) => (
    <p className={cn('m-0 inline-flex items-center gap-2.5 text-15 leading-[1.35] text-ink-body', className)}>
      <span aria-hidden="true" className={cn('size-2 shrink-0 rounded-full', open ? 'bg-open' : 'bg-ink-faint')} />
      {status}
    </p>
  );
  const fee = (label: string, note: string, amount: string) => (
    <div className="flex items-start justify-between gap-4 border-t border-line py-4 first:border-t-0 first:pt-0 last:pb-0">
      <dt className="flex min-w-0 flex-col gap-0.5">
        <span className="text-17 font-strong text-ink">{label}</span>
        <span className="text-14 leading-[1.45] text-ink-muted">{note}</span>
      </dt>
      <dd className="m-0 text-[1.625rem] leading-none font-heading text-ink">{amount}</dd>
    </div>
  );

  return (
    <section className="bg-paper text-ink">
      <div className="page-wrap flex flex-col gap-[clamp(2rem,4vw,3rem)] pb-8 pt-[clamp(2rem,5vw,4.5rem)]">
        <div className="flex flex-wrap items-end gap-x-16 gap-y-10">
          <div className="flex min-w-0 flex-[3_1_440px] flex-col items-start gap-5">
            {!facts && statusLine('rounded-full border border-line-strong bg-surface py-1.5 pl-3 pr-4')}
            <h1 className="m-0 text-hero text-balance">{t('title')}</h1>
            <p className="m-0 max-w-[34em] text-lead text-ink-body">{facts ? intro('lead') : cta('fallbackLead')}</p>
            <div className="mt-1 flex flex-wrap gap-3">
              {facts ? (
                <ButtonLink href={`/${locale}/pre-admission`} variant={open ? 'primary' : 'outline'} size="lg">
                  {open ? cta('apply') : cta('details')}
                  <Icon name="arrow-right" />
                </ButtonLink>
              ) : (
                <ButtonLink href={`/${locale}/contact`} variant="outline" size="lg">
                  {t('contactAdmissions')}
                  <Icon name="arrow-right" />
                </ButtonLink>
              )}
              <ButtonLink href="/api/download-prospectus" variant="outline" size="lg" className="px-6">
                <Icon name="download-simple" />
                {home('prospectus')}
              </ButtonLink>
            </div>
          </div>
          {facts && (
            <div className="flex min-w-0 flex-[2_1_320px] flex-col gap-4 rounded-card border border-line bg-surface p-[clamp(20px,2.4vw,28px)]">
              <div className="flex flex-col gap-1.5">
                <h2 className="m-0 text-h4">{cta('title', { session: facts.session })}</h2>
                {statusLine('items-start [&>span]:mt-[0.45em]')}
              </div>
              <dl className="m-0 flex flex-col">
                {fee(intro('applicationFee'), intro('applicationFeeNote'), facts.applicationFee)}
                {fee(intro('evaluationFee'), intro('evaluationFeeNote'), facts.evaluationFee)}
              </dl>
            </div>
          )}
        </div>
        <OnThisPage label={t('onThisPage')} links={links} />
      </div>
    </section>
  );
}
