import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import type { Locale } from '@/lib/i18n';
import type { SocialMediaLink } from '@/types/sanity';
import { ButtonLink } from '@/components/site/button';
import { Icon, type IconName } from '@/components/site/icon';

const SOCIAL_ICONS: Partial<Record<string, IconName>> = { facebook: 'facebook-logo', youtube: 'youtube-logo' };

const row =
  'flex min-h-14 items-center justify-between gap-4 border-t border-line text-18 font-strong text-ink no-underline hover:text-rust-deep focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink';

/** The page's close, on `paper`: where to read more (Admissions, Curriculum, the prospectus), and the school's pages (Site Settings → social media). */
export async function ContactMore({ locale, social }: { locale: Locale; social: SocialMediaLink[] }) {
  const t = await getTranslations({ locale, namespace: 'contact.more' });
  const links = [
    { label: t('admissions'), href: `/${locale}/admissions`, icon: 'arrow-right' },
    { label: t('curriculum'), href: `/${locale}/curriculum`, icon: 'arrow-right' },
    { label: t('prospectus'), href: '/api/download-prospectus', icon: 'download-simple' },
  ] as const;
  return (
    <section className="bg-paper text-ink">
      <div className="page-wrap flex flex-wrap items-start gap-x-16 gap-y-12 py-[clamp(56px,7vw,96px)]">
        <div className="flex min-w-0 flex-[3_1_420px] flex-col gap-4">
          <h2 className="m-0 text-h3">{t('title')}</h2>
          <ul className="m-0 flex list-none flex-col border-b border-line p-0">
            {links.map((l) => (
              <li key={l.href}>
                {/* The prospectus is a file, not a page: a plain link downloads it. */}
                {l.href.startsWith('/api/') ? (
                  <a href={l.href} className={row}>
                    {l.label}
                    <Icon name={l.icon} className="shrink-0 text-rust" />
                  </a>
                ) : (
                  <Link href={l.href} className={row}>
                    {l.label}
                    <Icon name={l.icon} className="shrink-0 text-rust" />
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </div>
        {social.length > 0 && (
          <div className="flex min-w-0 flex-[2_1_300px] flex-col gap-4">
            <h2 className="m-0 text-h3">{t('newsTitle')}</h2>
            <p className="m-0 text-17 leading-[1.6] text-ink-body">{t('newsText')}</p>
            <div className="flex flex-wrap gap-2.5">
              {social.map((s) => {
                const icon = SOCIAL_ICONS[s.icon];
                return (
                  <ButtonLink key={s.url} href={s.url} target="_blank" rel="noopener noreferrer" variant="quiet" className="text-ink" lang="en">
                    {icon && <Icon name={icon} size={22} className="text-rust" />}
                    {s.platform}
                  </ButtonLink>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
