import { getTranslations } from 'next-intl/server';
import type { Locale } from '@/lib/i18n';
import type { ClassTile } from '@/lib/admissions/admissions-page';
import { num } from '@/lib/admissions/display';
import { cn } from '@/lib/utils';

/**
 * The session's classes on `dark`, youngest first, each with the age it takes (counted on 1 January of the session).
 * A class by special consideration carries that tag and the form's requirements; a class closed this session stays
 * in its place, quieter, so parents see it is not offered this time. All of it comes from the published form.
 */
export async function AdmissionClasses({ locale, classes, year }: { locale: Locale; classes: ClassTile[]; year: string }) {
  const t = await getTranslations({ locale, namespace: 'admissions.page' });
  const age = (ages: number[]) =>
    ages.length === 1 ? t('ageOne', { age: num(ages[0], locale) }) : t('ageRange', { from: num(ages[0], locale), to: num(ages[1], locale) });
  return (
    <section id="classes" className="bg-dark text-on-dark">
      <div className="page-wrap flex flex-col gap-9 py-section">
        <div className="flex flex-col gap-3">
          <h2 className="m-0 text-h2 text-balance">{t('classesTitle')}</h2>
          <p className="m-0 text-19 text-on-dark-body">{t('ageNote', { year: num(year, locale) })}</p>
        </div>
        <ul className="m-0 grid list-none grid-cols-2 items-start gap-3 p-0 sm:grid-cols-[repeat(auto-fill,minmax(210px,1fr))]">
          {classes.map((c) => (
            <li
              key={c.key}
              className={cn(
                'flex min-w-0 flex-col gap-1.5 rounded-card px-[clamp(14px,2vw,20px)] pb-5 pt-[18px]',
                c.closed ? 'border border-dashed border-line-dark-strong' : 'bg-panel shadow-[inset_0_0_0_1px_var(--color-line-dark)]',
              )}
            >
              <h3 className={cn('m-0 text-h4', c.closed && 'text-on-dark-muted')}>{c.label}</h3>
              {c.ages.length > 0 && <p className={cn('m-0 text-18 font-strong', c.closed ? 'text-on-dark-faint' : 'text-bronze-light')}>{age(c.ages)}</p>}
              {(c.closed || c.special) && (
                <p className="m-0 mt-1.5 self-start rounded-chip border border-line-dark-strong px-2 py-0.5 text-13 font-strong text-on-dark-muted">
                  {c.closed ? t('closed') : t('special')}
                </p>
              )}
              {c.requires.length > 0 && (
                <ul className="m-0 mt-1 flex list-disc flex-col gap-0.5 pl-5 text-15 leading-[1.5] text-on-dark-body marker:text-bronze">
                  {c.requires.map((r) => (
                    <li key={r}>{r}</li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
