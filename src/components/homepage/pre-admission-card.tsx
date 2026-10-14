import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import type { Locale } from '@/lib/i18n';
import type { AdmissionCta } from '@/lib/admissions/intake';
import { num } from '@/lib/admissions/display';
import { ButtonLink } from '@/components/site/button';
import { Icon } from '@/components/site/icon';

/**
 * The page's close: the one rust block. The intake comes from the pre-admission form in the CMS (session, status, deadline);
 * when no intake is open or announced it points to the admissions page instead. Beside it, what admission needs.
 */
export async function PreAdmissionCard({ locale, cta }: { locale: Locale; cta: AdmissionCta | null }) {
  const t = await getTranslations({ locale, namespace: 'home.preAdmission' });
  const c = await getTranslations({ locale, namespace: 'admissionCta' });
  const docs = t.raw('docs') as string[];
  const open = cta?.state === 'open';
  return (
    <section className="bg-cream">
      <div className="page-wrap pb-section pt-[clamp(48px,6vw,80px)]">
        <div className="flex flex-wrap items-center gap-x-16 gap-y-8 rounded-panel bg-rust p-[clamp(24px,4vw,56px)] text-surface">
          <div className="flex min-w-0 flex-[3_1_420px] flex-col gap-4">
            <h2 className="m-0 text-[clamp(2rem,3.6vw,3rem)] leading-[1.1] font-extrabold text-balance">{cta ? c('title', { session: cta.session }) : c('fallbackTitle')}</h2>
            <p className="m-0 text-19 text-on-rust-soft">{cta ? t(open ? 'ledeOpen' : 'ledeNotOpen', { status: cta.status }) : c('fallbackLead')}</p>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-6 gap-y-3">
              <ButtonLink
                href={cta ? `/${locale}/pre-admission` : `/${locale}/admissions`}
                variant="light"
                className="min-h-[54px] gap-2.5 bg-paper px-7 text-17 font-bold text-rust-deep hover:bg-surface focus-visible:outline-surface"
              >
                {cta ? (open ? c('apply') : c('details')) : c('fallbackButton')}
                <Icon name="arrow-right" size={20} />
              </ButtonLink>
              <Link href={`/${locale}/campus`} className="inline-flex min-h-11 items-center font-strong text-surface underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-surface">
                {t('visit')}
              </Link>
            </div>
          </div>
          <div className="flex min-w-0 flex-[2_1_300px] flex-col gap-3.5 rounded-card bg-dark/28 px-6 py-[22px]">
            <h3 className="m-0 text-18 font-bold">{t('docsTitle')}</h3>
            <ol className="m-0 flex list-none flex-col gap-3 p-0">
              {docs.map((d, i) => (
                <li key={d} className="flex items-center gap-3 text-16 leading-[1.45]">
                  <span aria-hidden="true" className="flex size-7 shrink-0 items-center justify-center rounded-full bg-paper text-14 font-heading text-rust-deep">
                    {num(i + 1, locale)}
                  </span>
                  {d}
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
}
