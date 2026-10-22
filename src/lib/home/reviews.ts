// Guardians' words on the homepage (Studio → Guardian reviews).
import type { Locale } from '@/lib/i18n';
import type { Testimonial } from '@/types/home';

/** `language` is the language of `text`, which is not always the page's. */
export type Review = { id: string; text: string; language: Locale; who: string; classLine: string; translated: boolean };

/**
 * Reviews with recorded consent that are not hidden, at most three. The text is the guardian's own words; in the other
 * language a translation is used when there is one (marked as translated), else the original words.
 */
export function reviewsFor(list: Testimonial[], locale: Locale): Review[] {
  return list
    .filter((r) => r.consent === true && r.show !== false)
    .flatMap((r) => {
      const original = r.originalLanguage ?? 'bengali';
      const own = r.quote?.[locale]?.trim();
      const text = own || r.quote?.[original]?.trim();
      const who = r.who?.[locale]?.trim() || r.who?.[original]?.trim();
      const classLine = r.classLine?.[locale]?.trim() || r.classLine?.[original]?.trim();
      return text && who && classLine ? [{ id: r._id, text, language: own ? locale : original, who, classLine, translated: !!own && locale !== original }] : [];
    })
    .slice(0, 3);
}
