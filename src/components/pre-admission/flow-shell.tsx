import Link from 'next/link';
import type { ReactNode } from 'react';
import { ChevronLeft } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { getContentService } from '@/lib/content-service';
import { num, type Locale } from '@/lib/admissions/display';
import { LanguageLink } from './language-link';
import { SaveIndicator, SaveStatusProvider } from './save-status';

type Props = {
  locale: Locale;
  session: string;
  /** Page title in the phone header; desktop shows the school and session instead. */
  title?: string;
  back?: { href: string; label: string };
  /** Shows the autosave state in the header (chapter and hub pages). */
  saving?: boolean;
  children: ReactNode;
};

/** Focused layout for the application flow: no site menu, footer or chat button. */
export async function FlowShell({ locale, session, title, back, saving, children }: Props) {
  const t = await getTranslations('preAdmission');
  const site = await getContentService(false).getSiteSettings().catch(() => null);
  const logo = site?.logo?.asset?._ref ? `/api/image/${site.logo.asset._ref}?w=80&h=80` : null;
  const sessionTitle = t('title', { session: num(session, locale) });
  const intro = `/${locale}/pre-admission`;

  const body = (
    <div className="adm flex min-h-dvh flex-col text-foreground [font-family:var(--font-english),var(--font-bengali),system-ui,sans-serif]">
      <header className="sticky top-0 z-30 border-b bg-card">
        <div className="grid h-14 grid-cols-[48px_1fr_48px] items-center px-1 md:hidden">
          {back ? (
            <Link href={back.href} aria-label={back.label} className="inline-flex size-10 items-center justify-center rounded-lg hover:bg-muted">
              <ChevronLeft className="size-5" aria-hidden />
            </Link>
          ) : (
            <span />
          )}
          <span className="truncate text-center text-[15px] font-semibold">{title ?? sessionTitle}</span>
          <LanguageLink locale={locale} short={t('otherLanguageShort')} long={t('otherLanguage')} />
        </div>
        <div className="mx-auto hidden h-16 max-w-[1240px] items-center justify-between px-8 md:flex">
          <Link href={intro} className="flex items-center gap-3">
            {logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logo} alt="" className="size-9 rounded-lg object-cover" />
            ) : null}
            <span className="text-[15px] font-semibold">
              {t('brand')} <span className="font-normal text-muted-foreground">/ {sessionTitle}</span>
            </span>
          </Link>
          <div className="flex items-center gap-5">
            {saving && <SaveIndicator />}
            <LanguageLink locale={locale} short={t('otherLanguageShort')} long={t('otherLanguage')} />
          </div>
        </div>
      </header>
      {children}
    </div>
  );
  return saving ? <SaveStatusProvider>{body}</SaveStatusProvider> : body;
}
