import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import type { Locale } from '@/lib/i18n';
import { pageMetadata } from '@/lib/page-seo';
import { getContentService } from '@/lib/content-service';
import { isSectionVisible } from '@/lib/nav-visibility';
import { getSiteUrl } from '@/lib/site-url';
import { dhakaToday, noticeNeighbours, parseNoticeSlug, toNotice, type Notice } from '@/lib/notices/notices';
import { noticesIn, noticeShareImage, noticeWords, officeContact, pictureFull, pictureSrc } from '@/components/notices/notice-data';
import { noticeLang } from '@/components/notices/notice-row';
import { PrintButton } from '@/components/notices/print-button';
import { ShareLinks } from '@/components/site/share-links';
import { Icon } from '@/components/site/icon';

type Props = { params: Promise<{ locale: Locale; slug: string }> };

// Built on its first visit, then cached and refreshed from the CMS like the other pages.
export function generateStaticParams() {
  return [];
}

/** The notice this link names, in the page's language, or null. */
async function load(slug: string, locale: Locale): Promise<Notice | null> {
  const number = parseNoticeSlug(slug);
  if (!number) return null;
  const raw = await getContentService(false).getNotice(number.year, number.serial);
  return raw && toNotice(raw, locale, dhakaToday());
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const notice = await load(slug, locale);
  if (!notice) return {};
  const t = await getTranslations({ locale, namespace: 'notices.meta' });
  // The date first (the link preview shows it), then the start of the text, cut at a word.
  const room = 155 - notice.dateText.length;
  const text = notice.excerpt.length > room ? `${notice.excerpt.slice(0, room).replace(/\s+\S*$/, '')}…` : notice.excerpt;
  return pageMetadata({
    title: t('notice', { number: notice.number, title: notice.title }),
    description: t('noticeDescription', { date: notice.dateText, text: text || t('description') }),
    locale,
    path: `/notices/${notice.slug}`,
    share: noticeShareImage(notice),
  });
}

const pill =
  'inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-15 font-strong text-ink no-underline shadow-[inset_0_0_0_1.5px_var(--color-line-strong)] hover:bg-ink/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink';

/**
 * One notice (docs/notices.md): an article on a sheet, with a slim letterhead (the school, the notice's number and
 * date), its type, title and text, its attachments (PDFs to view or download, pictures full width), then sharing and
 * the older and newer notices. Printing gives the sheet alone.
 */
export default async function NoticePage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const content = getContentService(false);
  const [settings, notice, list] = await Promise.all([content.getSiteSettings(), load(slug, locale), content.getNotices()]);
  if (!isSectionVisible('notices', settings?.navigationVisibility) || !notice) notFound();

  const { t, labels } = await noticeWords(locale);
  const site = await getTranslations({ locale, namespace: 'site' });
  const { older, newer } = noticeNeighbours(noticesIn(list, locale), notice.slug);
  const lang = noticeLang(notice, locale);
  const office = officeContact(settings, locale);
  const url = `${getSiteUrl()}/${locale}/notices/${notice.slug}`;

  return (
    <div className="bg-cream text-ink print:bg-transparent">
      <div className="page-wrap flex flex-col gap-5 pb-section pt-[clamp(24px,3vw,40px)]">
        <div className="mx-auto flex w-full max-w-[860px] flex-wrap items-center justify-between gap-3 print:hidden">
          <Link href={`/${locale}/notices`} className="inline-flex items-center gap-2 text-16 font-strong">
            <Icon name="arrow-left" />
            {t('notice.back')}
          </Link>
          <PrintButton label={t('notice.print')} />
        </div>

        {lang && (
          <p className="mx-auto m-0 flex w-full max-w-[860px] items-start gap-2.5 rounded-cell bg-surface px-4 py-3 text-15 text-ink-body shadow-[inset_0_0_0_1px_var(--color-line-strong)] print:hidden">
            <Icon name="translate" className="mt-0.5 shrink-0 text-ink-muted" />
            <span>{office.phone ? t('notice.onlyBengaliCall', { phone: office.phone.display }) : t('notice.onlyBengali')}</span>
          </p>
        )}

        <article data-print-sheet className="mx-auto flex w-full max-w-[860px] flex-col gap-7 rounded-card bg-surface px-[clamp(20px,5vw,64px)] py-[clamp(24px,4.5vw,56px)] shadow-[inset_0_0_0_1px_var(--color-line-strong)] print:p-0 print:shadow-none">
          <header className="flex flex-wrap items-baseline justify-between gap-x-5 gap-y-1.5 border-b-[1.5px] border-ink pb-3.5">
            <p className="m-0 text-16 font-heading text-ink">
              {site('schoolName')} <span className="font-normal text-ink-muted">· {site('place')}</span>
            </p>
            <p className="m-0 text-15 text-ink-body">
              <span className="font-strong text-ink">{t('notice.numberLabel')}</span> <span className="tabular-nums">{notice.number}</span>
              <span className="text-ink-faint"> · </span>
              <time dateTime={notice.date}>
                {notice.dateText}, {notice.weekday}
              </time>
            </p>
          </header>

          <div className="flex flex-col gap-3">
            <p className="m-0 flex flex-wrap items-center gap-x-2.5 text-14 text-ink-muted">
              <span>{labels.types[notice.type]}</span>
              {notice.pinned && (
                <>
                  <span aria-hidden="true" className="text-ink-faint">
                    ·
                  </span>
                  <span className="inline-flex items-center gap-1 font-bold text-ink">
                    <Icon name="push-pin" size={15} />
                    {labels.pinned}
                  </span>
                </>
              )}
            </p>
            <h1 lang={lang} className="m-0 text-h2 text-balance">
              {notice.title}
            </h1>
          </div>

          {notice.body.length > 0 && (
            <div lang={lang} className="flex flex-col gap-4 text-17 leading-[1.75] text-ink-body md:text-19">
              {notice.body.map((p, i) => (
                <p key={i} className="m-0 whitespace-pre-line">
                  {p}
                </p>
              ))}
            </div>
          )}

          {(notice.files.length > 0 || notice.pictures.length > 0) && (
            <section aria-labelledby="notice-attachments" className="flex flex-col gap-3.5">
              <h2 id="notice-attachments" className="m-0 text-17 font-bold text-ink">
                {t('notice.attachments')}
              </h2>
              {notice.files.map((f) => (
                <div key={f.key} className="grid grid-cols-[44px_minmax(0,1fr)] items-center gap-4 rounded-photo bg-paper p-4 shadow-[inset_0_0_0_1px_var(--color-line)] sm:grid-cols-[48px_minmax(0,1fr)_auto]">
                  <span aria-hidden="true" className="flex size-11 items-center justify-center rounded-cell bg-cream text-ink shadow-[inset_0_0_0_1px_var(--color-line-strong)] sm:size-12">
                    <Icon name="file-pdf" size={22} />
                  </span>
                  <span lang={lang} className="flex min-w-0 flex-col gap-0.5">
                    <span className="text-17 font-bold leading-snug text-ink">{f.name}</span>
                    <span className="text-14 text-ink-muted">{[labels.pdf, f.size].filter(Boolean).join(' · ')}</span>
                  </span>
                  <span className="col-span-2 flex flex-wrap gap-2 sm:col-span-1 print:hidden">
                    <a href={f.url} target="_blank" rel="noopener noreferrer" aria-label={`${t('notice.view')}: ${f.name}`} className={pill}>
                      <Icon name="eye" size={18} />
                      {t('notice.view')}
                    </a>
                    <a href={f.url.startsWith('https://cdn.sanity.io/') ? `${f.url}?dl=` : f.url} download aria-label={`${t('notice.download')}: ${f.name}`} className={pill}>
                      <Icon name="download-simple" size={18} />
                      {t('notice.download')}
                    </a>
                  </span>
                </div>
              ))}
              {notice.pictures.map((p) => (
                <figure key={p.key} className="m-0 flex max-w-[620px] flex-col gap-2.5">
                  <a href={pictureFull(p.attachment)} target="_blank" rel="noopener noreferrer" className="relative block overflow-hidden rounded-cell border border-line-strong">
                    <Image
                      src={pictureSrc(p.attachment)}
                      alt={p.alt || t('notice.pictureAlt')}
                      width={1400}
                      height={Math.round(1400 / p.ratio)}
                      sizes="(min-width: 900px) 620px, 100vw"
                      // The notice itself: loaded at once, so it prints even when not yet scrolled to.
                      loading="eager"
                      className="block h-auto w-full"
                    />
                    <span className="absolute right-3 top-3 inline-flex h-9 items-center gap-1.5 rounded-full bg-surface px-3 text-14 font-strong text-ink shadow-[inset_0_0_0_1px_var(--color-line-strong)] print:hidden">
                      <Icon name="arrows-out-simple" size={16} />
                      {t('notice.zoom')}
                    </span>
                  </a>
                  <figcaption className="text-14 text-ink-muted print:hidden">{t('notice.tapHint')}</figcaption>
                </figure>
              ))}
            </section>
          )}

          <div className="flex flex-wrap items-center gap-3 border-t border-line pt-6 print:hidden">
            <span className="text-15 font-strong text-ink">{t('notice.share')}</span>
            <ShareLinks title={`${labels.number.replace('{number}', notice.number)}, ${notice.title}`} url={url} labels={{ share: t('notice.whatsapp'), copy: t('notice.copy'), copied: t('notice.copied') }} />
          </div>
        </article>

        {(older || newer) && (
          <nav aria-label={t('notice.neighbours')} className="mx-auto grid w-full max-w-[860px] gap-4 sm:grid-cols-2 print:hidden">
            {[
              { n: older, label: t('notice.older'), end: false },
              { n: newer, label: t('notice.newer'), end: true },
            ].map(({ n, label, end }) =>
              n ? (
                <Link
                  key={label}
                  href={`/${locale}/notices/${n.slug}`}
                  className={`flex flex-col gap-1 border-t-[1.5px] border-ink py-3.5 text-16 font-bold leading-snug text-ink no-underline hover:text-rust ${end ? 'sm:col-start-2 sm:items-end sm:text-right' : ''}`}
                >
                  <span className="text-13 font-strong text-ink-muted">
                    {label} · {labels.number.replace('{number}', n.number)}
                  </span>
                  <span lang={noticeLang(n, locale)}>{n.title}</span>
                </Link>
              ) : null,
            )}
          </nav>
        )}
      </div>
    </div>
  );
}
