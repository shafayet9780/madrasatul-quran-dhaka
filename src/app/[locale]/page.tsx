import { useTranslations } from 'next-intl';
import Header from '@/components/layout/header';

export default function Home() {
  const t = useTranslations('homepage');
  const tCommon = useTranslations('common');
  const tNav = useTranslations('navigation');

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-primary-700 mb-4">
            {t('hero.title')}
          </h1>
          <h2 className="text-xl md:text-2xl text-gray-700 mb-6">
            {t('hero.subtitle')}
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
            {t('hero.description')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-primary-600 hover:bg-primary-700 text-white px-8 py-3 rounded-lg font-medium transition-colors">
              {tNav('admissions')}
            </button>
            <button className="border border-primary-600 text-primary-600 hover:bg-primary-50 px-8 py-3 rounded-lg font-medium transition-colors">
              {tCommon('learnMore')}
            </button>
          </div>
        </div>

        {/* Mission Section */}
        <div className="mt-16 text-center">
          <h3 className="text-2xl md:text-3xl font-bold text-gray-800 mb-4">
            {t('mission.title')}
          </h3>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            {t('mission.description')}
          </p>
        </div>

        {/* Statistics Section */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="text-center">
            <div className="text-3xl md:text-4xl font-bold text-primary-600 mb-2">
              500+
            </div>
            <div className="text-gray-600">{t('statistics.students')}</div>
          </div>
          <div className="text-center">
            <div className="text-3xl md:text-4xl font-bold text-primary-600 mb-2">
              25+
            </div>
            <div className="text-gray-600">{t('statistics.teachers')}</div>
          </div>
          <div className="text-center">
            <div className="text-3xl md:text-4xl font-bold text-primary-600 mb-2">
              15+
            </div>
            <div className="text-gray-600">{t('statistics.years')}</div>
          </div>
          <div className="text-center">
            <div className="text-3xl md:text-4xl font-bold text-primary-600 mb-2">
              1000+
            </div>
            <div className="text-gray-600">{t('statistics.graduates')}</div>
          </div>
        </div>
      </main>
    </div>
  );
}
