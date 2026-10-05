import 'server-only';
import { previewClient } from '@/lib/sanity';
import type { ListsSource, RoundSource } from './build-round';

// Published documents only, never cached: opening a round must see what was just published.
const sanity = previewClient.withConfig({ perspective: 'published', useCdn: false });
const fresh = { cache: 'no-store' } as const;

const LISTS = `
  "areas": *[_type == "surveyArea"] | order(order asc) { key, name, group },
  "classes": *[_type == "surveyClass"] | order(order asc) { key, name, sections[] { key, name }, subjects[] { key, name } },
  "teachers": *[_type == "surveyTeacher" && active != false] | order(name asc) { key, name }
`;

export function fetchRoundSource(sanityRoundId: string): Promise<RoundSource> {
  return sanity.fetch(
    `{
      "round": *[_type == "surveyRound" && _id == $id][0] {
        _id, label, "slug": slug.current, plannedOpensAt, plannedClosesAt,
        "template": template-> {
          _id, kind, version, title, intro, commentLabel, layout, scale,
          questions[] { key, text, shortLabel, hint, type, options[] { key, label, mark }, "areaKey": area->key, required, allowNA, naLabel }
        }
      },
      ${LISTS}
    }`,
    { id: sanityRoundId },
    fresh
  );
}

export function fetchListsSource(): Promise<ListsSource> {
  return sanity.fetch(`{ ${LISTS} }`, {}, fresh);
}

export type UnopenedRound = {
  _id: string;
  label: string | null;
  slug: string | null;
  kind: 'T1' | 'G1' | 'G2' | null;
  plannedOpensAt: string | null;
  plannedClosesAt: string | null;
};

/** Published rounds that have not been opened yet. */
export function fetchUnopenedRounds(openedIds: string[]): Promise<UnopenedRound[]> {
  return sanity.fetch(
    `*[_type == "surveyRound" && !(_id in $opened)] | order(plannedOpensAt desc) {
      _id, label, "slug": slug.current, "kind": template->kind, plannedOpensAt, plannedClosesAt
    }`,
    { opened: openedIds },
    fresh
  );
}

export type OfficePhone = { label: string | null; number: string };

/** The school's main office number for help lines on survey pages. */
export async function fetchOfficePhone(): Promise<OfficePhone | null> {
  const phones: { label?: { bengali?: string }; number?: string; isActive?: boolean; isPrimary?: boolean; type?: string }[] | null =
    await sanity.fetch(`*[_id == "siteSettings"][0].contactInfo.phone`, {}, { next: { revalidate: 3600 } });
  const usable = (phones ?? []).filter((p) => p.number && p.isActive !== false);
  const best = usable.find((p) => p.type === 'main' && p.isPrimary) ?? usable[0];
  return best ? { label: best.label?.bengali ?? null, number: best.number! } : null;
}

/** Classes with their ERP labels, for the student import. */
export function fetchClassMappings(): Promise<import('./erp-import').ClassMapping[]> {
  return sanity.fetch(
    `*[_type == "surveyClass"] | order(order asc) {
      key, name, "erpClassNames": coalesce(erpClassNames, []),
      "sections": coalesce(sections[] { key, name, "erpSectionNames": coalesce(erpSectionNames, []) }, [])
    }`,
    {},
    fresh
  );
}
