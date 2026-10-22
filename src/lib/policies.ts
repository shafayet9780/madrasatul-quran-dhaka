import { longDate, txt, type Locale } from '@/lib/admissions/display';
import type { Policies, SiteSettings } from '@/types/sanity';

export type PolicyKind = 'privacy' | 'cookies';
export type PolicyView = { title: string; intro: string; updated?: string; sections: { heading: string; body: string[] }[] };

/**
 * A policy page from Studio → Privacy & cookie policies, in the page's language: {email} becomes the school's first
 * email (School details), and each text splits into paragraphs at blank lines. Null while the policy has no title.
 */
export function policyView(doc: Policies | null | undefined, kind: PolicyKind, locale: Locale, settings?: SiteSettings | null): PolicyView | null {
  const policy = doc?.[kind];
  const title = txt(policy?.title, locale).trim();
  if (!title) return null;
  const email = settings?.contactInfo?.email?.find((e) => e.isActive !== false && e.address)?.address ?? '';
  const fill = (value: Parameters<typeof txt>[0]) => txt(value, locale).replaceAll('{email}', email).trim();
  return {
    title,
    intro: fill(policy?.intro),
    updated: doc?.updatedAt ? longDate(doc.updatedAt, locale) : undefined,
    sections: (policy?.sections ?? [])
      .map((s) => ({ heading: fill(s.heading), body: fill(s.body).split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean) }))
      .filter((s) => s.heading && s.body.length),
  };
}
