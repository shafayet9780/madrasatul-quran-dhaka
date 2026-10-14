// The homepage FAQ: from the CMS (Studio → Homepage) when it has questions in this language, otherwise the launch questions.
import type { Locale } from '@/lib/i18n';
import type { HomeFaqItem } from '@/types/home';

export type FaqItem = { q: string; a: string };

export function faqFor(cms: HomeFaqItem[] | undefined, locale: Locale, copy: FaqItem[]): FaqItem[] {
  const fromCms = (cms ?? []).flatMap((i) => {
    const q = i.question?.[locale]?.trim();
    const a = i.answer?.[locale]?.trim();
    return q && a ? [{ q, a }] : [];
  });
  return fromCms.length ? fromCms : copy;
}
