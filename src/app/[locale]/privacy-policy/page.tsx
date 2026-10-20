import { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import type { Locale } from '@/lib/i18n';
import { pageMetadata } from '@/lib/page-seo';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'analytics.policy' });

  const title = t('privacyTitle');
  // The shared helper adds the canonical link and hreflang; the title keeps the site's ending (the school's name).
  return pageMetadata({ title, description: t('privacyIntro'), locale: locale as Locale, path: '/privacy-policy', withSiteName: true });
}

export default async function PrivacyPolicyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'analytics.policy' });

  const sections = [
    { title: t('dataCollectedTitle'), body: t('dataCollectedBody') },
    { title: t('analyticsToolsTitle'), body: t('analyticsToolsBody') },
    { title: t('childrenTitle'), body: t('childrenBody') },
    { title: t('contactTitle'), body: t('contactBody') },
  ];

  return (
    <div className="container-custom py-12 md:py-16">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-3xl font-bold text-gray-900 md:text-4xl">{t('privacyTitle')}</h1>
        <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {t('legalReviewNotice')}
        </p>
        <p className="mt-6 text-lg text-gray-700">{t('privacyIntro')}</p>
        <div className="mt-10 space-y-8">
          {sections.map((section) => (
            <section key={section.title}>
              <h2 className="text-xl font-semibold text-gray-900">{section.title}</h2>
              <p className="mt-3 leading-relaxed text-gray-700">{section.body}</p>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
