import { getFontClass, type Language } from '@/lib/sanity-utils';

interface PeopleHeroProps {
  title: string;
  subtitle?: string;
  language: Language;
}

export function PeopleHero({ title, subtitle, language }: PeopleHeroProps) {
  const font = getFontClass(language);
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-primary-700 via-primary-800 to-primary-900 py-16 md:py-24">
      <div className="absolute inset-0 opacity-10 [background-image:radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] [background-size:24px_24px]" />
      <div className="container-custom relative text-center text-white">
        <h1 className={`mb-4 text-3xl font-bold md:text-5xl ${font}`}>{title}</h1>
        {subtitle && (
          <p className={`mx-auto max-w-2xl text-base text-white/80 md:text-lg ${font}`}>{subtitle}</p>
        )}
        <div className="mx-auto mt-6 h-1 w-24 rounded-full bg-accent-400" />
      </div>
    </section>
  );
}
