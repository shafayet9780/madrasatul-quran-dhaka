import { getTranslations } from 'next-intl/server';
import type { FeeLocale, FeeSettings } from '@/types/fees';
import { usableFeeSettings } from '@/lib/fees';

export async function AdmissionsFaq({
  locale,
  settings,
}: {
  locale: FeeLocale;
  settings: FeeSettings | null;
}) {
  const t = await getTranslations({
    locale,
    namespace: 'admissions.importantDates',
  });
  const bn = locale === 'bengali';
  const valid = usableFeeSettings(settings);
  return (
    <section id="faq" className="scroll-mt-48">
      <h2 className="text-2xl font-bold text-primary-800">{t('faq.title')}</h2>
      <div className="mt-4 divide-y divide-gray-200 rounded-xl border border-gray-200 px-4 md:px-6">
        {[1, 2, 3, 4, 5, 6].map(n => (
          <details key={n} className="group py-1">
            <summary className="min-h-12 cursor-pointer py-3 font-semibold text-gray-900 focus-visible:outline-2">
              {n === 4
                ? valid
                  ? settings.faqQuestion?.[locale]
                  : bn
                    ? 'ছাড় সম্পর্কে কীভাবে জানব?'
                    : 'How can I find out about discounts?'
                : t(`faq.q${n}.question`)}
            </summary>
            <div className="pb-4 leading-relaxed text-gray-700">
              <p>
                {n === 4
                  ? valid
                    ? settings.faqAnswer?.[locale]
                    : bn
                      ? 'বর্তমান ছাড় ও শর্তাবলী জানতে অফিসে যোগাযোগ করুন।'
                      : 'Contact the office for current discounts and eligibility.'
                  : t(`faq.q${n}.answer`)}
              </p>
              {n === 4 && valid && settings.discounts?.some(d => d.visible) && (
                <a
                  className="inline-flex min-h-11 items-center font-semibold text-primary-700 underline"
                  href="#discounts"
                >
                  {bn ? 'ছাড়ের তথ্য দেখুন' : 'View discount information'} →
                </a>
              )}
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}
