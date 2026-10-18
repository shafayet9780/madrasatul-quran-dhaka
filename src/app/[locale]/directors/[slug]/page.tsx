import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import type { Locale } from '@/lib/i18n';
import { urlFor } from '@/lib/sanity';
import { getDirectorBySlug, getDirectors } from '@/lib/queries/directors';
import { getPeoplePageData } from '@/lib/queries/site';
import { isSectionVisible } from '@/lib/nav-visibility';
import { num, txt } from '@/lib/admissions/display';
import { tidyBio } from '@/lib/about/bio';
import { profileHref } from '@/lib/about/people';
import { generatePageMetadata } from '@/lib/page-metadata';
import { generatePersonStructuredData, generateBreadcrumbStructuredData, serializeJsonLd } from '@/lib/seo';
import { PersonBand } from '@/components/about/person-band';
import { Portraits } from '@/components/about/portraits';
import { ProfileText } from '@/components/about/profile-text';
import { ButtonLink } from '@/components/site/button';
import { Icon } from '@/components/site/icon';

type Props = { params: Promise<{ locale: Locale; slug: string }> };

// Built on its first visit, then cached and refreshed from the CMS like the other pages.
export function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const director = await getDirectorBySlug(slug, locale);
  if (!director || director.showDetailPage === false) return {};
  const t = await getTranslations({ locale, namespace: 'about.profile' });
  const who = { name: txt(director.name, locale), role: txt(director.designation, locale) };
  return generatePageMetadata({
    title: t('title', who),
    // Who they are at the school, then their Studio summary (too short alone for a search result).
    description: [t('description', who), txt(director.summary, locale)].filter(Boolean).join(' '),
    locale,
    path: `/directors/${slug}`,
  });
}

/**
 * A director's profile, in the About page's style: the person on `dark` (portrait, role, name, summary, education,
 * what they do, their links), their message on `cream` and their biography on `paper` when Studio has them, then the
 * rest of the board's portraits. The biography is tidied for reading (emoji headings, blank lines: `tidyBio`).
 */
export default async function DirectorProfile({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const [director, directors, { visibility }] = await Promise.all([getDirectorBySlug(slug, locale), getDirectors(), getPeoplePageData()]);
  if (!director || director.showDetailPage === false || !isSectionVisible('directors', visibility)) notFound();

  const t = await getTranslations({ locale, namespace: 'about.profile' });
  const about = await getTranslations({ locale, namespace: 'about' });
  const name = txt(director.name, locale);
  const role = txt(director.designation, locale);
  const summary = txt(director.summary, locale);
  const qualifications = director.qualifications?.[locale]?.map((q) => q.trim()).filter(Boolean) ?? [];
  const links = (director.socialLinks ?? []).filter((l) => l.url);
  const message = director.message?.[locale];
  const bio = tidyBio(director.fullBio?.[locale]);
  const others = directors.filter((d) => d._id !== director._id && d.photo?.asset && profileHref(d, locale));

  const personLd = generatePersonStructuredData(
    { name, jobTitle: role, description: summary, imageUrl: director.photo?.asset ? urlFor(director.photo).width(400).height(400).url() : undefined, url: `/${locale}/directors/${slug}` },
    locale,
  );
  const breadcrumbLd = generateBreadcrumbStructuredData(
    [
      { name: t('home'), url: `/${locale}` },
      { name: about('hero.title'), url: `/${locale}/about` },
      { name, url: `/${locale}/directors/${slug}` },
    ],
    locale,
  );

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(personLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(breadcrumbLd) }} />
      <div className="bg-paper">
        <div className="page-wrap py-2">
          <Link
            href={`/${locale}/about`}
            className="inline-flex min-h-11 items-center gap-1.5 text-15 font-strong text-rust no-underline hover:text-rust-deep focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
          >
            <Icon name="arrow-right" size={18} className="-scale-x-100" />
            {t('back')}
          </Link>
        </div>
      </div>

      <PersonBand photo={director.photo} kicker={`${role} · ${t('board')}`} name={name} heading="h1" priority>
        {summary && <p className="m-0 max-w-[32em] text-lead text-on-dark-body">{summary}</p>}
        {(director.education?.length || qualifications.length > 0) && (
          <dl className="m-0 mt-2 flex w-full max-w-[40em] flex-col gap-4 border-t border-line-dark pt-4">
            {director.education && director.education.length > 0 && (
              <div className="flex flex-col gap-1">
                <dt className="text-14 text-on-dark-muted">{t('education')}</dt>
                {director.education.map((e, i) => (
                  <dd key={i} className="m-0 text-17 font-strong">
                    {[txt(e.degree, locale), txt(e.institution, locale)].filter(Boolean).join(', ')}
                    {e.year ? ` (${num(e.year, locale)})` : ''}
                  </dd>
                ))}
              </div>
            )}
            {qualifications.length > 0 && (
              <div className="flex flex-col gap-2">
                <dt className="text-14 text-on-dark-muted">{t('qualifications')}</dt>
                <dd className="m-0">
                  <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
                    {qualifications.map((q) => (
                      <li key={q} className="rounded-chip border border-line-dark-strong px-2.5 py-1 text-15">
                        {q}
                      </li>
                    ))}
                  </ul>
                </dd>
              </div>
            )}
          </dl>
        )}
        {links.length > 0 && (
          <ul aria-label={t('links')} className="m-0 mt-1 flex list-none flex-wrap gap-2.5 p-0">
            {links.map((l) => (
              <li key={l.url}>
                <ButtonLink
                  href={l.platform === 'email' && !l.url.startsWith('mailto:') ? `mailto:${l.url}` : l.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  variant="outline-dark"
                >
                  {l.platform === 'facebook' && <Icon name="facebook-logo" className="text-bronze-light" />}
                  {t(`platform.${l.platform}`)}
                </ButtonLink>
              </li>
            ))}
          </ul>
        )}
      </PersonBand>

      {message && message.length > 0 && (
        <section className="bg-cream text-ink">
          <div className="page-wrap flex flex-col gap-5 py-section">
            <h2 className="m-0 text-h2">{t('message')}</h2>
            <ProfileText value={message} />
          </div>
        </section>
      )}

      {bio.length > 0 && (
        <section className="bg-paper text-ink">
          <div className="page-wrap flex flex-col gap-5 py-section">
            <h2 className="m-0 text-h2">{t('bio')}</h2>
            <ProfileText value={bio} />
          </div>
        </section>
      )}

      <section className="bg-dark text-on-dark">
        <div className="page-wrap flex flex-col gap-7 py-section">
          <h2 className="m-0 text-h2">{t('board')}</h2>
          {others.length > 0 && (
            <Portraits tone="dark" people={others.map((d) => ({ key: d._id, name: txt(d.name, locale), role: txt(d.designation, locale), photo: d.photo, href: profileHref(d, locale) }))} />
          )}
          <ButtonLink href={`/${locale}/about`} variant="outline-dark" size="lg" className="self-start border-[1.5px]">
            {t('all')}
          </ButtonLink>
        </div>
      </section>
    </>
  );
}
