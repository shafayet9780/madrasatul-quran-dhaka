import Image from 'next/image';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import type { Locale } from '@/lib/i18n';
import type { SiteSettings } from '@/types/sanity';
import { urlFor } from '@/lib/sanity';
import { isMenu, siteNav, type NavLink, type NavMenu } from '@/lib/site/nav';
import { getPeopleNav, type PeopleNavData } from '@/lib/queries/site';
import { resolveProfileImage } from '@/lib/profile-avatar';
import { getLocalizedSlug, getLocalizedText } from '@/lib/sanity-utils';
import { LanguageSwitch } from './language-switch';
import { SiteNav, type NavColumn } from './site-nav';

/** The site header: logo and name, the main menu (Site Settings decides which sections show), the language switch. */
export async function SiteHeader({ locale, siteSettings }: { locale: Locale; siteSettings: SiteSettings | null }) {
  const t = await getTranslations({ locale, namespace: 'site' });
  const logo = siteSettings?.logo?.asset ? urlFor(siteSettings.logo).width(96).height(96).url() : null;
  const entry = (l: NavLink) => ({ key: l.key, label: t(`nav.${l.key}`), href: l.href, external: l.external });
  const nav = siteNav(locale, siteSettings?.navigationVisibility);
  // If the people query fails, the menu falls back to plain links rather than taking the page down.
  const people = nav.some((i) => i.key === 'people') ? await getPeopleNav().catch(() => null) : null;
  const items = nav.map((i) =>
    isMenu(i)
      ? { key: i.key, label: t(`nav.${i.key}`), items: i.items.map(entry), columns: i.key === 'people' && people ? peopleColumns(i, people) : undefined }
      : entry(i),
  );

  // The wide Our people menu, as on the live site: featured directors and advisors with their photos, the teacher
  // departments, each column ending in "All …". Only the columns Site Settings shows.
  function peopleColumns(menu: NavMenu, data: PeopleNavData): NavColumn[] {
    const photo = (p: PeopleNavData['directors'][number]) => {
      const image = resolveProfileImage(p.photo, p.gender, data.placeholders);
      return image?.asset ? urlFor(image).width(72).height(72).fit('crop').url() : undefined;
    };
    const all = (key: NavLink['key'], label: string) => ({ key, label, href: menu.items.find((l) => l.key === key)!.href });
    return menu.items.map((l): NavColumn => {
      if (l.key === 'directors')
        return {
          key: l.key,
          title: t('nav.directors'),
          people: data.directors.map((d) => ({
            key: d._id,
            label: getLocalizedText(d.name, locale),
            href: d.showDetailPage !== false && d.slug ? `${l.href}/${getLocalizedSlug(d.slug, locale)}` : undefined,
            photo: photo(d),
          })),
          all: all('directors', t('nav.allDirectors')),
        };
      if (l.key === 'advisors')
        return {
          key: l.key,
          title: t('nav.advisors'),
          people: data.advisors.map((a) => ({ key: a._id, label: getLocalizedText(a.name, locale), photo: photo(a) })),
          all: all('advisors', t('nav.allAdvisors')),
        };
      return {
        key: l.key,
        title: t('nav.teachers'),
        links: data.departments.map((d) => ({ key: d._id, label: getLocalizedText(d.name, locale), href: `${l.href}?department=${getLocalizedSlug(d.slug, locale)}` })),
        all: all('teachers', t('nav.allTeachers')),
      };
    });
  }
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
