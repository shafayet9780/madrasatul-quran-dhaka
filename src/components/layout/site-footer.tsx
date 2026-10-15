import Image from 'next/image';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import type { Locale } from '@/lib/i18n';
import type { FooterSettings, SiteSettings } from '@/types/sanity';
import { urlFor } from '@/lib/sanity';
import { getAdmissionsContact } from '@/lib/admissions-contact';
import { sitePhone } from '@/lib/site/phone';
import { Icon, type IconName } from '@/components/site/icon';
import { navPages, siteNav } from '@/lib/site/nav';


const SOCIAL_ICONS: Partial<Record<string, IconName>> = { facebook: 'facebook-logo', youtube: 'youtube-logo' };

const APPS = [
  { label: 'Google Play', href: 'https://play.google.com/store/apps/details?id=com.eximusedu.app', icon: 'google-play-logo' },
  { label: 'App Store', href: 'https://apps.apple.com/us/app/eximusedu/id1459487310', icon: 'app-store-logo' },
] as const;

const pill = 'inline-flex min-h-11 items-center gap-2 rounded-full pl-3 pr-4 text-15 font-semibold text-on-dark no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bronze-light';
const heading = 'm-0 text-15 font-strong text-on-dark';
const pageLink = 'inline-flex min-h-[34px] items-center text-on-dark-body no-underline hover:text-on-dark';

/** The site footer. Contact details, links and the mission come from the CMS (site settings and footer). */
export async function SiteFooter({ locale, siteSettings, footerSettings }: { locale: Locale; siteSettings: SiteSettings | null; footerSettings: FooterSettings | null }) {
  const t = await getTranslations({ locale, namespace: 'site' });
  const contact = siteSettings?.contactInfo;
  const logo = siteSettings?.logo?.asset ? urlFor(siteSettings.logo).width(96).height(96).url() : null;
  const phones = (contact?.phone ?? []).filter((p) => p.isActive).flatMap((p) => {
    const phone = sitePhone(p.number, locale);
    return phone ? [{ ...phone, desk: p.label?.[locale] }] : [];
  });
  const emails = (contact?.email ?? []).filter((e) => e.isActive).map((e) => e.address);
  const whatsapp = sitePhone(getAdmissionsContact(contact).whatsapp ?? undefined, locale);
  const social = (siteSettings?.socialMedia ?? []).filter((s) => s.isActive).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const tagline = footerSettings?.subtitle?.[locale];
  const mission = footerSettings?.description?.[locale];
  const hours = contact?.officeHours?.[locale];
  const mapUrl = siteSettings?.locationInfo?.googleMapsUrl;
  const legal = [
    { label: t('footer.parentLogin'), href: 'https://www.eximusedu.com/go/mqd' },
    { label: t('footer.books'), href: 'https://alquranervasha.com/downloads' },
    { label: t('footer.privacy'), href: `/${locale}/privacy-policy` },
    { label: t('footer.cookies'), href: `/${locale}/cookie-policy` },
  ];

  return (
    <footer className="texture-dots bg-dark text-on-dark-body">
      <div className="page-wrap flex flex-col gap-11 pb-8 pt-[clamp(3rem,6vw,4.5rem)]">
        <div className="flex flex-wrap gap-x-14 gap-y-10">
          <div className="flex min-w-0 flex-[2_1_320px] flex-col gap-4">
            <span className="flex items-center gap-3">
              {logo && <Image src={logo} alt="" width={44} height={44} className="rounded-full bg-cream" />}
              <span className="flex flex-col leading-[1.2]">
                <strong className="text-19 leading-[1.2] text-on-dark">{t('schoolName')}</strong>
                {tagline && <span className="text-14 leading-[1.2] text-on-dark-muted">{tagline}</span>}
              </span>
            </span>
            {mission && <p className="m-0 max-w-[30em] text-15 leading-[1.65]">{mission}</p>}
            {social.length > 0 && (
              <div className="flex flex-wrap gap-2.5">
                {social.map((s) => {
                  const icon = SOCIAL_ICONS[s.icon];
                  return (
                    <a key={s.url} href={s.url} className={`${pill} border border-line-dark-strong hover:bg-panel`}>
                      {icon && <Icon name={icon} size={22} className="text-bronze" />}
                      {s.platform}
                    </a>
                  );
                })}
              </div>
            )}
            <div className="flex flex-col gap-2.5 border-t border-line-dark pt-4">
              <span className="text-15 font-strong text-on-dark">{t('footer.appTitle')}</span>
              <span className="text-14 leading-normal text-on-dark-muted">{t('footer.appText')}</span>
              <div className="flex flex-wrap gap-2.5">
                {APPS.map((a) => (
                  <a key={a.href} href={a.href} lang="en" className={`${pill} bg-panel hover:bg-line-dark`}>
                    <Icon name={a.icon} size={22} className="text-bronze" />
                    {a.label}
                  </a>
                ))}
              </div>
            </div>
          </div>

          <nav aria-label={t('footer.label')} className="flex flex-[1_1_170px] flex-col gap-0.5 text-15">
            <h2 className={`${heading} mb-2`}>{t('footer.pages')}</h2>
            {navPages(siteNav(locale, siteSettings?.navigationVisibility)).map((p) => (
              <Link key={p.key} href={p.href} className={pageLink}>
                {t(`nav.${p.key}`)}
              </Link>
            ))}
            <Link href={`/${locale}/pre-admission`} className={pageLink}>
              {t('footer.preAdmission')}
            </Link>
            {/* A file, not a page: a plain link downloads it. */}
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a href="/api/download-prospectus" className={pageLink}>
              {t('footer.prospectus')}
            </a>
          </nav>

          <div className="flex flex-[1_1_230px] flex-col gap-2.5 text-15">
            <h2 className={`${heading} mb-1`}>{t('footer.contact')}</h2>
            {phones.map((p) => (
              <a key={p.e164} href={p.tel} className="flex flex-col leading-[1.3] text-on-dark no-underline">
                <span className="font-semibold">{p.display}</span>
                {p.desk && <span className="text-13 text-on-dark-muted">{p.desk}</span>}
              </a>
            ))}
            {whatsapp && (
              <a href={`https://wa.me/${whatsapp.e164.slice(1)}`} className="inline-flex items-center gap-2 font-semibold text-on-dark no-underline">
                <Icon name="whatsapp-logo" className="text-bronze" />
                {t('footer.whatsapp', { number: whatsapp.display })}
              </a>
            )}
            {emails.map((e) => (
              <a key={e} href={`mailto:${e}`} lang="en" className="break-all text-on-dark no-underline">
                {e}
              </a>
            ))}
          </div>

          <div className="flex flex-[1_1_230px] flex-col gap-2.5 text-15">
            <h2 className={`${heading} mb-1`}>{t('footer.visit')}</h2>
            {contact?.address?.[locale] && <span className="leading-[1.6]">{contact.address[locale].trim()}</span>}
            {hours && <span className="leading-[1.6]">{hours}</span>}
            {mapUrl && (
              <a href={mapUrl} className="inline-flex min-h-8 items-center font-semibold text-on-dark underline-offset-4">
                {t('footer.map')}
              </a>
            )}
          </div>
        </div>

        <div className="flex flex-wrap justify-between gap-x-6 gap-y-2.5 border-t border-line-dark pt-5 text-14 text-on-dark-faint">
          {footerSettings?.copyright?.[locale] && <span>{footerSettings.copyright[locale]}</span>}
          <span className="flex flex-wrap gap-x-5 gap-y-1.5">
            {legal.map((l) =>
              l.href.startsWith('/') ? (
                <Link key={l.href} href={l.href} className="text-on-dark-faint underline-offset-[3px]">
                  {l.label}
                </Link>
              ) : (
                <a key={l.href} href={l.href} className="text-on-dark-faint underline-offset-[3px]">
                  {l.label}
                </a>
              ),
            )}
          </span>
        </div>
      </div>
    </footer>
  );
}
