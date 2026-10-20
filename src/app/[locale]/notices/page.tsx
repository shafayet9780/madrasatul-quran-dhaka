import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import type { Locale } from '@/lib/i18n';
import { pageMetadata } from '@/lib/page-seo';
import { getContentService } from '@/lib/content-service';
import { isSectionVisible } from '@/lib/nav-visibility';
import { num } from '@/lib/gallery/albums';
import { noticeMonths } from '@/lib/notices/notices';
import { noticesIn, noticeWords, officeContact } from '@/components/notices/notice-data';
import { NoticeMarks, noticeLang } from '@/components/notices/notice-row';
import { NoticeBoard } from '@/components/notices/notice-board';
import { Icon } from '@/components/site/icon';

type Props = { params: Promise<{ locale: Locale }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'notices.meta' });
  return pageMetadata({ page: 'notices', title: t('title'), description: t('description'), locale, path: '/notices' });
}

/**
 * The notice board (docs/notices.md): the heading, the pinned notices as cards, then every notice month by month under
 * the type tabs and the year switch, and who to call. Notices come from Studio → Notices; the page shows once Site
 * Settings switches the notice board on.
 */
export default async function NoticesPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const content = getContentService(false);
  const [settings, raw] = await Promise.all([content.getSiteSettings(), content.getNotices()]);
  if (!isSectionVisible('notices', settings?.navigationVisibility)) notFound();

  const notices = noticesIn(raw, locale);
  const months = noticeMonths(notices, locale);
  const pinned = notices.filter((n) => n.pinned);
  const { t, labels } = await noticeWords(locale);
  const years = [...new Set(months.map((m) => m.year))];
  const office = officeContact(settings, locale);

  return (
    <>
      <section className="bg-paper text-ink">
        <div className="page-wrap flex flex-col gap-[clamp(28px,3vw,40px)] pb-[clamp(40px,5vw,64px)] pt-[clamp(36px,4vw,64px)]">
          <div className="flex flex-col gap-3.5">
            <h1 className="m-0 text-hero text-balance">{t('board.title')}</h1>
            <p className="m-0 max-w-[40em] text-lead text-ink-body">{t('board.lead')}</p>
          </div>

          {pinned.length > 0 && (
            <section aria-labelledby="notices-pinned">
              <h2 id="notices-pinned" className="sr-only">
                {t('board.pinnedTitle')}
              </h2>
              <ul className="m-0 grid list-none gap-3.5 p-0 md:grid-cols-2 md:gap-5">
                {pinned.map((n) => {
                  const lang = noticeLang(n, locale);
                  return (
                    <li key={n.key} className="flex">
                      <Link
                        href={`/${locale}/notices/${n.slug}`}
                        className="group flex w-full flex-col gap-3 rounded-photo bg-surface px-[18px] pb-[18px] pt-5 font-normal text-ink no-underline shadow-[inset_0_3px_0_var(--color-ink),inset_0_0_0_1.5px_var(--color-line-strong)] hover:bg-paper focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink md:px-[26px] md:pb-5 md:pt-[22px]"
                      >
                        <span className="flex flex-wrap items-center justify-between gap-2">
                          <span className="inline-flex items-center gap-1.5 text-14 font-bold text-ink">
                            <Icon name="push-pin" size={16} />
                            {labels.pinned}
                          </span>
                          <span className="flex flex-wrap items-center gap-x-2.5 text-14 text-ink-muted">
                            <span className="font-strong tabular-nums text-ink">{labels.number.replace('{number}', n.number)}</span>
                            <span aria-hidden="true" className="text-ink-faint">
                              ·
                            </span>
                            <span>{labels.types[n.type]}</span>
                          </span>
                        </span>
                        <span lang={lang} className="text-h4 text-ink group-hover:text-rust">
                          {n.title}
                        </span>
                        {n.excerpt && (
                          <span lang={lang} className="line-clamp-2 text-15 text-ink-muted">
                            {n.excerpt}
                          </span>
                        )}
                        <span className="mt-auto flex flex-wrap items-center justify-between gap-2.5 border-t border-line pt-3.5">
                          <span className="text-14 text-ink-muted">
                            {n.dateText}, {n.weekday}
                          </span>
                          <NoticeMarks notice={n} labels={labels} />
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}
        </div>
      </section>

      <div className="bg-paper pb-section text-ink">
        {notices.length ? (
          <NoticeBoard
            months={months}
            locale={locale}
            labels={{
              ...labels,
              typesLabel: t('board.types'),
              all: t('board.all'),
              year: t('board.year'),
              years: Object.fromEntries(years.map((y) => [y, num(Number(y), locale)])),
              titles: Object.fromEntries(years.map((y) => [y, t('board.yearNotices', { year: num(Number(y), locale) })])),
              more: t.raw('board.more') as string,
              none: t('board.none'),
            }}
          />
        ) : (
          <p className="page-wrap m-0 text-17 text-ink-body">{t('board.empty')}</p>
        )}
        {office.phone && (
          <p className="page-wrap m-0 mt-10 text-15 text-ink-muted">
            {t('board.ask')}{' '}
            <a href={office.phone.tel} className="font-strong text-rust hover:text-rust-deep">
              {office.phone.display}
            </a>
            {office.hours && ` (${office.hours})`}
          </p>
        )}
      </div>
    </>
  );
}
