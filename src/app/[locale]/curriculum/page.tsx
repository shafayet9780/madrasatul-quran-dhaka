import Link from 'next/link';
import { getTranslations } from 'next-intl/server';

export const metadata = { title: 'Curriculum' };

export default async function CurriculumPage() {
  const t = await getTranslations('curriculum');

  return (
    <main className="container-custom py-16">
      <h1 className="text-3xl md:text-4xl font-extrabold text-primary-800 mb-6">
        {t('title', { default: 'আমাদের কারিকুলাম' })}
      </h1>
      <p className="text-secondary-900 max-w-3xl mb-8">
        {t('intro', { default: 'কুরআন-সুন্নাহ ভিত্তিক তারবিয়াহ্‌, আরবী ও দীনী শিক্ষা এবং NCTB একাডেমিকের সমন্বয়ে পরিকল্পিত সমন্বিত কারিকুলাম।' })}
      </p>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="card">
          <h2 className="text-xl font-bold text-primary-800 mb-2">{t('pillar_quran', { default: 'কুরআন ও তাজবীদ' })}</h2>
          <p className="text-secondary-900">{t('pillar_quran_desc', { default: 'হিফজ/নজিরাহ, তাজবীদ ও দৈনিক তিলাওয়াতের উন্নত কাঠামো।' })}</p>
        </div>
        <div className="card">
          <h2 className="text-xl font-bold text-primary-800 mb-2">{t('pillar_arabic', { default: 'আরবী ও তারবিয়াহ' })}</h2>
          <p className="text-secondary-900">{t('pillar_arabic_desc', { default: 'আরবী ভাষা, আকীদাহ, সীরাহ, আদব-আখলাক; চরিত্র গঠন।' })}</p>
        </div>
        <div className="card">
          <h2 className="text-xl font-bold text-primary-800 mb-2">{t('pillar_nctb', { default: 'NCTB একাডেমিক' })}</h2>
          <p className="text-secondary-900">{t('pillar_nctb_desc', { default: 'বাংলাদেশ জাতীয় শিক্ষাক্রমের সাথে একীভূত মানসম্পন্ন পাঠদান।' })}</p>
        </div>
      </div>

      <div className="text-center mt-12">
        <Link href="/admissions" className="inline-flex items-center px-6 py-3 rounded-xl bg-primary-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all">
          {t('cta', { default: 'ভর্তির জন্য আবেদন করুন' })}
          <svg className="w-4 h-4 ml-2" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
    </main>
  );
}


