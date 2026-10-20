import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import type { Locale } from '@/lib/i18n';
import { pageMetadata } from '@/lib/page-seo';
import { getDirectors } from '@/lib/queries/directors';
import { getAdvisors } from '@/lib/queries/advisors';
import { getPeoplePageData } from '@/lib/queries/site';
import { isSectionVisible } from '@/lib/nav-visibility';
import { txt } from '@/lib/admissions/display';
import { profileHref, splitBoard } from '@/lib/about/people';
import { PersonBand } from '@/components/about/person-band';
import { Portraits } from '@/components/about/portraits';
import { QuoteText } from '@/components/site/quote-text';
import { ButtonLink } from '@/components/site/button';
import { Icon } from '@/components/site/icon';
import { cn } from '@/lib/utils';

type Props = { params: Promise<{ locale: Locale }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'about.meta' });
  return pageMetadata({ page: 'about', title: t('title'), description: t('description'), locale, path: '/about' });
}

/**
 * About us: the chairman alone at the top (his rule), then the board's portraits in Studio's order and the members
 * without a photo by name, then the advisors. People, roles and photos come from Studio (Directors, Advisors); the
 * chairman's words are the homepage founder quote. Shown while Pages on/off shows Our people and the board or the
 * advisors; each section follows its own switch.
 */
export default async function AboutPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [directors, advisors, { visibility }] = await Promise.all([getDirectors(), getAdvisors(), getPeoplePageData()]);
  const showBoard = isSectionVisible('directors', visibility);
  const showAdvisors = isSectionVisible('advisors', visibility);
  if (!isSectionVisible('people', visibility) || !(showBoard || showAdvisors)) notFound();

  const t = await getTranslations({ locale, namespace: 'about' });
  const founder = await getTranslations({ locale, namespace: 'home.founder' });
  const { chairman, leaders, members } = splitBoard(directors);
  const chairmanHref = chairman && profileHref(chairman, locale);

  return (
    <>
      <section className="bg-paper text-ink">
        <div className="page-wrap flex flex-col gap-3.5 pb-[clamp(28px,4vw,48px)] pt-[clamp(32px,5vw,64px)]">
          <h1 className="m-0 text-hero text-balance">{t('hero.title')}</h1>
          <p className="m-0 text-lead text-ink-body">{t('hero.lede')}</p>
        </div>
      </section>

      {showBoard && chairman && (
        <PersonBand photo={chairman.photo} kicker={`${txt(chairman.designation, locale)} · ${t('chairman.role')}`} name={txt(chairman.name, locale)} priority>
          {/* Tiro Bangla for the Bengali quotation only; English quotations stay in Anek. */}
          <blockquote className={cn('m-0 mt-2 max-w-[30em] text-[clamp(1.25rem,2.2vw,1.625rem)] leading-[1.65] text-on-dark-body', locale === 'bengali' && 'font-quote')}>
            <QuoteText text={founder('quote')} />
          </blockquote>
          {chairmanHref && (
            <ButtonLink href={chairmanHref} variant="light" size="lg" className="mt-2">
              {t('chairman.more')}
              <Icon name="arrow-right" />
            </ButtonLink>
          )}
        </PersonBand>
      )}

      {showBoard && (leaders.length > 0 || members.length > 0) && (
        <section id="board" className="bg-paper text-ink">
          <div className="page-wrap flex flex-col gap-8 py-section">
            <h2 className="m-0 text-h2">{t('board.title')}</h2>
            {leaders.length > 0 && (
              <Portraits
                people={leaders.map((d) => ({ key: d._id, name: txt(d.name, locale), role: txt(d.designation, locale), photo: d.photo, href: profileHref(d, locale) }))}
              />
            )}
            {members.length > 0 && (
              <div className="flex flex-col gap-2.5 border-t border-line pt-5">
                <h3 className="m-0 text-16 font-strong text-ink-muted">{t('board.members')}</h3>
                <ul className="m-0 grid list-none grid-cols-[repeat(auto-fill,minmax(min(100%,240px),1fr))] gap-x-8 gap-y-2.5 p-0">
                  {members.map((d) => (
                    <li key={d._id} className="flex flex-col">
                      <span className="text-17 font-strong">{txt(d.name, locale)}</span>
                      <span className="text-14 text-ink-muted">{txt(d.designation, locale)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </section>
      )}

      {showAdvisors && advisors.length > 0 && (
        <section id="advisors" className="bg-dark text-on-dark">
          <div className="page-wrap flex flex-col gap-8 py-section">
            <h2 className="m-0 text-h2">{t('advisors.title')}</h2>
            <Portraits tone="dark" people={advisors.map((a) => ({ key: a._id, name: txt(a.name, locale), note: txt(a.summary, locale), photo: a.photo }))} />
          </div>
        </section>
      )}

      <section className="bg-paper text-ink">
        <div className="page-wrap flex flex-wrap items-center gap-3 py-[clamp(48px,6vw,80px)]">
          <h2 className="m-0 mr-6 text-h3">{t('more.title')}</h2>
          <ButtonLink href={`/${locale}/curriculum`} variant="outline">
            {t('more.curriculum')}
          </ButtonLink>
          <ButtonLink href={`/${locale}/admissions`} variant="outline">
            {t('more.admissions')}
          </ButtonLink>
          <ButtonLink href={`/${locale}/contact`} variant="outline">
            {t('more.contact')}
          </ButtonLink>
        </div>
      </section>
    </>
  );
}
