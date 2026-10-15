import { getTranslations } from 'next-intl/server';
import type { Locale } from '@/lib/i18n';
import { cn } from '@/lib/utils';

/** After Dakhil, on `dark`: the prospectus's two ways (Mutawassita here, Kafiya at a Qawmi madrasa) and college. The way here is marked. */
export async function HigherEducation({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: 'curriculum.after' });
  const items = t.raw('items') as { tag: string; title: string; text: string }[];
  return (
    <section id="after" className="bg-dark text-on-dark">
      <div className="page-wrap flex flex-col gap-8 py-section">
        <div className="flex max-w-narrow flex-col gap-3.5">
          <h2 className="m-0 text-h2 text-balance">{t('title')}</h2>
          <p className="m-0 text-19 leading-[1.65] text-on-dark-body">{t('lead')}</p>
        </div>
        <ol className="m-0 grid list-none grid-cols-1 gap-3.5 p-0 sm:grid-cols-2 min-[1000px]:grid-cols-3">
          {items.map((x, i) => (
            <li
              key={x.title}
              className={cn(
                'flex flex-col gap-2.5 rounded-card bg-panel p-6 sm:max-[999px]:last:col-span-2',
                i === 0 ? 'shadow-[inset_0_0_0_1px_var(--color-line-dark-strong)]' : 'shadow-[inset_0_0_0_1px_var(--color-line-dark)]',
              )}
            >
              <span
                className={cn(
                  'self-start rounded-chip px-2 py-px text-13 font-strong',
                  i === 0 ? 'border border-sand-deep bg-sand-deep text-dark' : 'border border-line-dark-strong text-on-dark-muted',
                )}
              >
                {x.tag}
              </span>
              <h3 className="m-0 text-h4">{x.title}</h3>
              <p className="m-0 text-16 leading-[1.65] text-on-dark-body">{x.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
