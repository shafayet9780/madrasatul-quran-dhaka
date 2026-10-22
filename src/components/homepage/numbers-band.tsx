import { getTranslations } from 'next-intl/server';
import type { Locale } from '@/lib/i18n';
import type { SchoolStatistics } from '@/types/sanity';
import { homeStats } from '@/lib/home/stats';
import { CountUp } from '@/components/site/count-up';

/** The school in numbers, from Studio → Homepage (see homeStats for what shows and how it rounds). */
export async function NumbersBand({ locale, statistics }: { locale: Locale; statistics?: SchoolStatistics }) {
  const t = await getTranslations({ locale, namespace: 'home.stats' });
  const stats = homeStats(statistics, locale, { students: t('students'), teachers: t('teachers'), ratio: t('ratio') });
  if (stats.length === 0) return null;
  return (
    <section aria-label={t('label')} className="bg-dark text-on-dark">
      <dl className="page-wrap my-0 grid grid-cols-[repeat(auto-fit,minmax(min(220px,42%),1fr))] gap-x-6 gap-y-8 py-[clamp(2.5rem,5vw,4rem)]">
        {stats.map((s) => (
          <div key={s.label} className="flex flex-col gap-2 border-l border-line-dark-strong pl-[clamp(14px,1.6vw,22px)]">
            <dt className="text-15 leading-[1.45] text-on-dark-muted">{s.label}</dt>
            <dd className="order-first m-0 text-figure-lg">
              {s.countTo !== undefined ? (
                <CountUp to={s.countTo} bengali={locale === 'bengali'} suffix="+">
                  {s.value}
                </CountUp>
              ) : (
                s.value
              )}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
