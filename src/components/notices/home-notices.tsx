import Link from '@/components/site/link';
import type { Locale } from '@/lib/i18n';
import type { NoticeIn } from '@/lib/notices/notices';
import { noticesIn, noticeWords } from './notice-data';
import { NoticeRow } from './notice-row';
import { Icon } from '@/components/site/icon';

/** The homepage's notice board: the three latest notices, pinned ones first, and a link to the board. Left out when there are none. */
export async function HomeNotices({ locale, raw }: { locale: Locale; raw: NoticeIn[] }) {
  const all = noticesIn(raw, locale);
  const latest = [...all.filter((n) => n.pinned), ...all.filter((n) => !n.pinned)].slice(0, 3);
  if (!latest.length) return null;
  const { t, labels } = await noticeWords(locale);
  return (
    <section aria-labelledby="home-notices" className="border-t border-line bg-paper text-ink">
      <div className="page-wrap grid items-start gap-6 py-section md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] md:gap-[clamp(32px,5vw,72px)]">
        <div className="flex flex-col gap-3.5">
          <h2 id="home-notices" className="m-0 text-h2 text-balance">
            {t('home.title')}
          </h2>
          <p className="m-0 text-17 text-ink-muted">{t('home.lead')}</p>
          <Link href={`/${locale}/notices`} className="mt-1.5 inline-flex items-center gap-2 self-start text-16 font-strong">
            {t('home.all')}
            <Icon name="arrow-right" />
          </Link>
        </div>
        <ul className="m-0 list-none divide-y divide-line overflow-hidden rounded-photo border border-line-strong bg-surface p-0">
          {latest.map((n) => (
            <li key={n.key}>
              <NoticeRow notice={n} locale={locale} labels={labels} excerpt={false} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
