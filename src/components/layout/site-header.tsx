import Image from 'next/image';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import type { Locale } from '@/lib/i18n';
import type { SiteSettings } from '@/types/sanity';
import { urlFor } from '@/lib/sanity';
import { isMenu, siteNav, type NavLink } from '@/lib/site/nav';
import { LanguageSwitch } from './language-switch';
import { SiteNav } from './site-nav';

/** The site header: logo and name, the main menu (Pages on/off decides which sections show), the language switch. */
export async function SiteHeader({ locale, siteSettings }: { locale: Locale; siteSettings: SiteSettings | null }) {
  const t = await getTranslations({ locale, namespace: 'site' });
  const logo = siteSettings?.logo?.asset ? urlFor(siteSettings.logo).width(96).height(96).url() : null;
  const entry = (l: NavLink) => ({ key: l.key, label: t(`nav.${l.key}`), href: l.href, external: l.external });
  const items = siteNav(locale, siteSettings?.navigationVisibility, siteSettings?.links?.books).map((i) =>
    isMenu(i) ? { key: i.key, label: t(`nav.${i.key}`), items: i.items.map(entry) } : entry(i),
  );
  return (
    <header className="relative border-b border-line bg-paper text-ink">
      <div className="page-wrap flex items-center gap-x-3 min-[1180px]:gap-x-9">
        <Link href={`/${locale}`} className="flex min-h-[72px] shrink-0 items-center gap-3 text-ink no-underline">
          {logo && <Image src={logo} alt="" width={42} height={42} priority />}
          <span className="flex flex-col leading-[1.15]">
            <span className="text-18 font-bold leading-[1.15]">{t('schoolName')}</span>
            <span className="text-13 leading-[1.15] text-ink-muted">{t('place')}</span>
          </span>
        </Link>
        <SiteNav
          items={items}
          label={t('navLabel')}
          menuLabel={t('nav.menu')}
          language={<LanguageSwitch locale={locale} label={t('switchLang')} title={t('switchLangLabel')} />}
        />
      </div>
    </header>
  );
}
