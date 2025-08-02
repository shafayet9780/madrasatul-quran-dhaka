import { useTranslations } from 'next-intl';
import { MainLayout } from '@/components/layout';

export default function Home() {
  const t = useTranslations('homepage');
  const tCommon = useTranslations('common');
  const tNav = useTranslations('navigation');

  return (
    <MainLayout>
      <div className="bg-sand-light min-h-screen">
        <div className="container-custom py-8 md:py-16">
        <div className="text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-primary-700 mb-4 drop-shadow-sm px-2">
            {t('hero.title')}
          </h1>
          <h2 className="text-xl sm:text-2xl md:text-3xl text-text-primary font-semibold mb-6 px-2">
            {t('hero.subtitle')}
          </h2>
          <p className="text-lg md:text-xl text-text-secondary max-w-2xl mx-auto mb-8 leading-relaxed px-4">
            {t('hero.description')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center px-4">
            <button className="btn-primary">
              {tNav('admissions')}
            </button>
            <button className="btn-secondary">
              {tCommon('learnMore')}
            </button>
          </div>
        </div>

        {/* Mission Section */}
        <div className="mt-12 md:mt-16 text-center">
          <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold text-primary-700 mb-4 px-2">
            {t('mission.title')}
          </h3>
          <p className="text-lg md:text-xl text-text-secondary max-w-3xl mx-auto leading-relaxed px-4">
            {t('mission.description')}
          </p>
        </div>

        {/* Statistics Section */}
        <div className="mt-12 md:mt-16 grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
          <div className="stats-card">
            <div className="stats-number text-2xl sm:text-3xl md:text-4xl lg:text-5xl">
              500+
            </div>
            <div className="stats-label text-xs sm:text-sm">{t('statistics.students')}</div>
          </div>
          <div className="stats-card">
            <div className="stats-number text-2xl sm:text-3xl md:text-4xl lg:text-5xl">
              25+
            </div>
            <div className="stats-label text-xs sm:text-sm">{t('statistics.teachers')}</div>
          </div>
          <div className="stats-card">
            <div className="stats-number text-2xl sm:text-3xl md:text-4xl lg:text-5xl">
              15+
            </div>
            <div className="stats-label text-xs sm:text-sm">{t('statistics.years')}</div>
          </div>
          <div className="stats-card">
            <div className="stats-number text-2xl sm:text-3xl md:text-4xl lg:text-5xl">
              1000+
            </div>
            <div className="stats-label text-xs sm:text-sm">{t('statistics.graduates')}</div>
          </div>
        </div>
        </div>
      </div>
    </MainLayout>
  );
}
