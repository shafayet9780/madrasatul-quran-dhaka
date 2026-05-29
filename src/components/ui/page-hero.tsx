import type { ReactNode } from 'react';
import { getFontClass, type Language } from '@/lib/sanity-utils';

export interface PageHeroChip {
  icon?: ReactNode;
  label: string;
}

interface PageHeroProps {
  title: string;
  subtitle?: string;
  language: Language;
  /** Optional eyebrow icon shown in a circular badge above the title. */
  icon?: ReactNode;
  /** Optional feature chips shown below the accent bar. */
  chips?: PageHeroChip[];
  /** Optional breadcrumb node rendered in a slim bar beneath the hero. */
  breadcrumb?: ReactNode;
}

/**
 * Unified page hero: dark primary gradient, subtle dot pattern, centered
 * title/subtitle, accent underline, with optional eyebrow icon, feature chips,
 * and a breadcrumb strip. Used across content pages and the people list pages.
 */
export function PageHero({ title, subtitle, language, icon, chips, breadcrumb }: PageHeroProps) {
  const font = getFontClass(language);
  return (
    <>
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-700 via-primary-800 to-primary-900 py-16 md:py-24">
        <div className="absolute inset-0 opacity-10 [background-image:radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] [background-size:24px_24px]" />
        <div className="container-custom relative text-center text-white">
          {icon && (
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/20 backdrop-blur-sm">
              {icon}
            </div>
          )}
          <h1 className={`mb-4 text-3xl font-bold md:text-5xl ${font}`}>{title}</h1>
          {subtitle && (
            <p className={`mx-auto max-w-2xl text-base text-white/80 md:text-lg ${font}`}>{subtitle}</p>
          )}
          <div className="mx-auto mt-6 h-1 w-24 rounded-full bg-accent-400" />
          {chips && chips.length > 0 && (
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              {chips.map((chip, i) => (
                <span
                  key={i}
                  className={`inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-sm text-white/90 ring-1 ring-white/20 backdrop-blur-sm ${font}`}
                >
                  {chip.icon}
                  {chip.label}
                </span>
              ))}
            </div>
          )}
        </div>
      </section>
      {breadcrumb && (
        <div className="border-b border-gray-100 bg-white">
          <div className="container-custom py-3">{breadcrumb}</div>
        </div>
      )}
    </>
  );
}
