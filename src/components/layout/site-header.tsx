import Image from 'next/image';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import type { Locale } from '@/lib/i18n';
import type { SiteSettings } from '@/types/sanity';
import { urlFor } from '@/lib/sanity';
import { LanguageSwitch } from './language-switch';

const NAV = [
  { key: 'curriculum', path: '/curriculum' },
  { key: 'campus', path: '/campus' },
  { key: 'admissions', path: '/admissions' },
  { key: 'about', path: '/about' },
  { key: 'contact', path: '/contact' },
] as const;

/** The site header: logo and name, the five main pages, the language switch. On phones the links scroll sideways. */
export async function SiteHeader({ locale, siteSettings }: { locale: Locale; siteSettings: SiteSettings | null }) {
  const t = await getTranslations({ locale, namespace: 'site' });
  const logo = siteSettings?.logo?.asset ? urlFor(siteSettings.logo).width(96).height(96).url() : null;
  return (
    <header className="border-b border-line bg-paper text-ink">
      <div className="page-wrap flex flex-wrap items-center gap-x-9">
        <Link href={`/${locale}`} className="flex min-h-[72px] shrink-0 items-center gap-3 text-ink no-underline">
          {logo && <Image src={logo} alt="" width={42} height={42} priority />}
          <span className="flex flex-col leading-[1.15]">
            <span className="text-18 font-bold leading-[1.15]">{t('schoolName')}</span>
            <span className="text-13 leading-[1.15] text-ink-muted">{t('place')}</span>
          </span>
        </Link>
        <div className="flex min-w-0 flex-[1_1_520px] items-center gap-4">
          <nav
            aria-label={t('navLabel')}
            className="flex min-w-0 flex-auto gap-x-7 gap-y-1 overflow-x-auto whitespace-nowrap pr-7 text-16 [mask-image:linear-gradient(to_right,#000_calc(100%-28px),transparent)]"
          >
            {NAV.map((n) => (
              <Link key={n.key} href={`/${locale}${n.path}`} className="inline-flex min-h-11 items-center text-ink no-underline hover:text-rust">
                {t(`nav.${n.key}`)}
              </Link>
            ))}
          </nav>
          <LanguageSwitch locale={locale} label={t('switchLang')} title={t('switchLangLabel')} />
        </div>
      </div>
    </header>
  );
}
