import type { Locale } from '@/lib/i18n';
import type { Director } from '@/types/sanity';

/** A director's profile page, when they have one (Studio → the director → Show detail page, and a slug). */
export function profileHref(director: Pick<Director, 'slug' | 'showDetailPage'>, locale: Locale): string | undefined {
  const slug = director.slug?.[locale]?.current;
  return director.showDetailPage !== false && slug ? `/${locale}/directors/${slug}` : undefined;
}

/**
 * The board as the About page shows it, in Studio's order: the first director is the chairman, alone at the top (his
 * own rule); the others with a photo are the portraits; the rest are listed by name.
 */
export function splitBoard<T extends Pick<Director, 'photo'>>(directors: T[]) {
  const [chairman, ...rest] = directors;
  return {
    chairman: chairman ?? null,
    leaders: rest.filter((d) => d.photo?.asset),
    members: rest.filter((d) => !d.photo?.asset),
  };
}
