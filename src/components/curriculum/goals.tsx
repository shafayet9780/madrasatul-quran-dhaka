import { getTranslations } from 'next-intl/server';
import type { Locale } from '@/lib/i18n';
import type { Plan } from '@/lib/curriculum/plan';

/** The ten-year goals in Islamic studies (Studio → Curriculum), on `dark`. A goal with a figure (৯০%+, ৩০০+) carries the লক্ষ্য tag: a target, not a result. */
export async function Goals({ locale, goals: items }: { locale: Locale; goals: Plan['goals'] }) {
  const t = await getTranslations({ locale, namespace: 'curriculum.goals' });
  return (
    <section id="goals" className="bg-dark text-on-dark">
      <div className="page-wrap flex flex-col gap-9 py-section">
        <h2 className="m-0 max-w-narrow text-h2 text-balance">{t('title')}</h2>
        <ul className="m-0 grid list-none grid-cols-[repeat(auto-fill,minmax(max(260px,calc(33.3%-12px)),1fr))] gap-3.5 p-0">
          {items.map((g) => (
            <li key={g.title} className="flex flex-col gap-2 rounded-card bg-panel p-6 shadow-[inset_0_0_0_1px_var(--color-line-dark)]">
              <div className="flex items-baseline justify-between gap-3">
                <h3 className="m-0 text-19 leading-[1.3] font-bold">{g.title}</h3>
                {g.figure && <span className="text-figure-md text-bronze">{g.figure}</span>}
              </div>
              <p className="m-0 text-16 leading-[1.6] text-on-dark-body">{g.text}</p>
              {g.figure && <span className="mt-auto self-start rounded-chip bg-sand-deep px-2 py-px text-12 font-strong text-dark">{t('goalTag')}</span>}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
