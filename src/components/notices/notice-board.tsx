'use client';

import { useState } from 'react';
import type { Locale } from '@/lib/i18n';
import type { NoticeMonth, NoticeType } from '@/lib/notices/notices';
import { NoticeRow, type NoticeLabels } from './notice-row';
import { cn } from '@/lib/utils';

export type BoardLabels = NoticeLabels & {
  typesLabel: string;
  all: string;
  year: string;
  /** Per year, in the page's numerals: ২০২৬. */
  years: Record<string, string>;
  /** Per year, written out: ২০২৬ সালের নোটিশ. */
  titles: Record<string, string>;
  /** `আগের মাসের নোটিশ ({month})`. */
  more: string;
  none: string;
};

/** Months shown at first, and added by each press of the button. */
const STEP = 3;

/**
 * The notices of one year, month by month, under text tabs for the type and a year switch (once there are two years).
 * The newest three months show first, three more with each press of the button; the sitemap lists every notice.
 */
export function NoticeBoard({ months, locale, labels }: { months: NoticeMonth[]; locale: Locale; labels: BoardLabels }) {
  const years = [...new Set(months.map((m) => m.year))];
  const [year, setYear] = useState(years[0]);
  const [type, setType] = useState<NoticeType | null>(null);
  const [count, setCount] = useState(STEP);

  const shown = months
    .filter((m) => m.year === year)
    .map((m) => ({ ...m, notices: type ? m.notices.filter((n) => n.type === type) : m.notices }))
    .filter((m) => m.notices.length);
  const next = shown[count];
  const choose = (change: () => void) => {
    change();
    setCount(STEP);
  };

  return (
    <section aria-labelledby="notices-year" className="page-wrap">
      <div className="mb-[clamp(28px,3.5vw,44px)] flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-b border-line-strong">
        <div role="group" aria-label={labels.typesLabel} className="-mb-px flex min-w-0 gap-x-[26px] overflow-x-auto [scrollbar-width:none]">
          {([null, 'admission', 'holiday', 'exam', 'general'] as const).map((t) => (
            <button
              key={t ?? 'all'}
              type="button"
              aria-pressed={t === type}
              onClick={() => choose(() => setType(t))}
              className={cn(
                'inline-flex h-[46px] shrink-0 items-center whitespace-nowrap text-15 font-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink',
                t === type ? 'text-ink shadow-[inset_0_-2px_0_var(--color-ink)]' : 'text-ink-body hover:text-rust',
              )}
            >
              {t ? labels.types[t] : labels.all}
            </button>
          ))}
        </div>
        {years.length > 1 && (
          <label className="flex items-center gap-2.5 pb-1.5">
            <span className="text-14 text-ink-muted">{labels.year}</span>
            <select
              value={year}
              onChange={(e) => choose(() => setYear(e.target.value))}
              className="h-10 rounded-cell border-[1.5px] border-line-strong bg-surface pl-3.5 pr-8 text-15 font-strong text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
            >
              {years.map((y) => (
                <option key={y} value={y}>
                  {labels.years[y]}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      <h2 id="notices-year" className="sr-only">
        {labels.titles[year]}
      </h2>
      {shown.length ? (
        <div className="flex flex-col gap-11">
          {shown.slice(0, count).map((m) => (
            <div key={m.key}>
              <h3 className="m-0 mb-3.5 flex items-baseline gap-4 text-h4 after:h-px after:flex-1 after:bg-line-strong">{m.label}</h3>
              <ul className="m-0 list-none divide-y divide-line overflow-hidden rounded-photo border border-line-strong bg-surface p-0">
                {m.notices.map((n) => (
                  <li key={n.key}>
                    <NoticeRow notice={n} locale={locale} labels={labels} />
                  </li>
                ))}
              </ul>
            </div>
          ))}
          {next && (
            <button
              type="button"
              onClick={() => setCount((c) => c + STEP)}
              className="inline-flex min-h-12 items-center self-start rounded-full px-[22px] text-16 font-strong text-ink shadow-[inset_0_0_0_1.5px_var(--color-line-strong)] hover:bg-cream focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
            >
              {labels.more.replace('{month}', next.label)}
            </button>
          )}
        </div>
      ) : (
        <p className="m-0 text-17 text-ink-body">{labels.none}</p>
      )}
    </section>
  );
}
