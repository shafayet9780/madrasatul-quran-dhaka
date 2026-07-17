import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'analytics.policy' });

  return {
    title: t('cookieTitle'),
    description: t('cookieIntro'),
  };
}

export default async function CookiePolicyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'analytics.policy' });

  const sections = [
    { title: t('toolsTitle'), body: t('toolsBody') },
    { title: t('retentionTitle'), body: t('retentionBody') },
    { title: t('preferencesTitle'), body: t('preferencesBody') },
  ];

  return (
    <div className="container-custom py-12 md:py-16">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-3xl font-bold text-gray-900 md:text-4xl">{t('cookieTitle')}</h1>
        <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {t('legalReviewNotice')}
        </p>
        <p className="mt-6 text-lg text-gray-700">{t('cookieIntro')}</p>
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
