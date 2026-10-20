import { getTranslations } from 'next-intl/server';
import type { PolicyView } from '@/lib/policies';
import type { Locale } from '@/lib/i18n';

/** A policy page's text (Studio → Privacy & cookie policies). */
export async function PolicyArticle({ policy, locale }: { policy: PolicyView; locale: Locale }) {
  const t = await getTranslations({ locale, namespace: 'analytics.policy' });
  return (
    <div className="container-custom py-12 md:py-16">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-3xl font-bold text-gray-900 md:text-4xl">{policy.title}</h1>
        {policy.updated && <p className="mt-3 text-sm text-gray-600">{t('updated', { date: policy.updated })}</p>}
        {policy.intro && <p className="mt-6 text-lg text-gray-700">{policy.intro}</p>}
        <div className="mt-10 space-y-8">
          {policy.sections.map((section) => (
            <section key={section.heading}>
              <h2 className="text-xl font-semibold text-gray-900">{section.heading}</h2>
              {section.body.map((p) => (
                <p key={p} className="mt-3 leading-relaxed text-gray-700">
                  {p}
                </p>
              ))}
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
