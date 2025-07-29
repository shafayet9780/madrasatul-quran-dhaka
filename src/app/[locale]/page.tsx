import { useTranslations } from 'next-intl';

export default function Home() {
  const t = useTranslations('homepage');

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-primary-700 mb-4 font-bengali">
            {t('hero.title')}
          </h1>
          <h2 className="text-xl md:text-2xl text-gray-700 mb-6 font-english">
            {t('hero.subtitle')}
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
            {t('hero.description')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-primary-600 hover:bg-primary-700 text-white px-8 py-3 rounded-lg font-medium transition-colors">
              Admissions
            </button>
            <button className="border border-primary-600 text-primary-600 hover:bg-primary-50 px-8 py-3 rounded-lg font-medium transition-colors">
              Learn More
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
