import { PageHero } from '@/components/ui/page-hero';
import type { Language } from '@/lib/sanity-utils';

interface PeopleHeroProps {
  title: string;
  subtitle?: string;
  language: Language;
}

/** Thin wrapper kept for the directors/teachers list pages. */
export function PeopleHero({ title, subtitle, language }: PeopleHeroProps) {
  return <PageHero title={title} subtitle={subtitle} language={language} />;
}
