import Link from 'next/link';
import type { Locale } from '@/lib/i18n';
import type { Notice, NoticeType } from '@/lib/notices/notices';
import { Icon } from '@/components/site/icon';
import { cn } from '@/lib/utils';

export type NoticeLabels = {
  /** `নং {number}`. */
  number: string;
  new: string;
  pinned: string;
  pdf: string;
  picture: string;
  types: Record<NoticeType, string>;
};

/** Where the notice's own language differs from the page's (a Bengali notice on an English page). */
export const noticeLang = (n: Notice, locale: Locale) => (n.lang === locale ? undefined : 'bn');

/** The notice's number and type, its pin and the নতুন mark: plain words, no coloured tags. */
export function NoticeMeta({ notice, labels, className }: { notice: Notice; labels: NoticeLabels; className?: string }) {
  return (
    <span className={cn('flex flex-wrap items-center gap-x-2.5 gap-y-1 text-14 text-ink-muted', className)}>
      <span className="font-strong tabular-nums text-ink">{labels.number.replace('{number}', notice.number)}</span>
      <span aria-hidden="true" className="text-ink-faint">·</span>
      <span>{labels.types[notice.type]}</span>
      {notice.pinned && (
        <>
          <span aria-hidden="true" className="text-ink-faint">·</span>
          <span className="inline-flex items-center gap-1 font-bold text-ink">
            <Icon name="push-pin" size={15} />
            {labels.pinned}
          </span>
        </>
      )}
      {notice.isNew && <span className="inline-flex h-5 items-center rounded-[4px] border border-ink px-1.5 text-12 font-strong text-ink">{labels.new}</span>}
    </span>
  );
}

/** PDF and picture marks, so a parent knows what opening the notice brings. */
export function NoticeMarks({ notice, labels, className }: { notice: Notice; labels: NoticeLabels; className?: string }) {
  if (!notice.files.length && !notice.pictures.length) return null;
  return (
    <span className={cn('flex flex-wrap gap-x-3.5 gap-y-1 text-14 font-strong text-ink-muted', className)}>
      {notice.files.length > 0 && (
        <span className="inline-flex items-center gap-1.5">
          <Icon name="file-pdf" size={16} />
          {labels.pdf}
        </span>
      )}
      {notice.pictures.length > 0 && (
        <span className="inline-flex items-center gap-1.5">
          <Icon name="image" size={16} />
          {labels.picture}
        </span>
      )}
    </span>
  );
}

/**
 * One notice in a list (the board, the homepage): the day large with its weekday, then its number and type, its title
 * and the start of its text, and its PDF / picture marks. The whole row is the link.
 */
export function NoticeRow({ notice, locale, labels, excerpt = true }: { notice: Notice; locale: Locale; labels: NoticeLabels; excerpt?: boolean }) {
  const lang = noticeLang(notice, locale);
  return (
    <Link
      href={`/${locale}/notices/${notice.slug}`}
      className="group grid grid-cols-[58px_minmax(0,1fr)] items-start gap-3.5 px-4 py-4 font-normal text-ink no-underline hover:bg-paper focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ink md:grid-cols-[92px_minmax(0,1fr)_auto] md:items-center md:gap-6 md:px-[26px] md:py-5"
    >
      <span className="flex flex-col gap-0.5 border-r border-line pr-3 md:pr-5">
        <span className="text-[28px] font-extrabold leading-none text-ink md:text-[34px]">{notice.day}</span>
        <span className="text-12 text-ink-muted md:text-14">{notice.weekday}</span>
      </span>
      <span className="flex min-w-0 flex-col gap-1.5">
        <NoticeMeta notice={notice} labels={labels} />
        <span lang={lang} className="text-17 font-bold leading-snug text-ink group-hover:text-rust md:text-19">
          {notice.title}
        </span>
        {excerpt && notice.excerpt && (
          <span lang={lang} className="line-clamp-2 text-15 text-ink-muted md:truncate">
            {notice.excerpt}
          </span>
        )}
        <NoticeMarks notice={notice} labels={labels} className="md:hidden" />
      </span>
      <span className="hidden items-center gap-[18px] text-ink-muted md:flex">
        <NoticeMarks notice={notice} labels={labels} />
        <Icon name="caret-right" />
      </span>
    </Link>
  );
}
