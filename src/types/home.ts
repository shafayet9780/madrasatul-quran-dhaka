import type { DayPart, StepKind } from '@/lib/home/day';
import type { SanityImage, SchoolStatistics } from './sanity';

// Studio → Homepage and Guardian reviews (sanity/schemas/homePage.ts, testimonial.ts).
type Bilingual = { bengali?: string; english?: string };

export type HomeRoutinePart = { part?: DayPart; name?: Bilingual; steps?: { kind?: StepKind; time?: Bilingual; title?: Bilingual; gloss?: Bilingual }[] };
export type HomePhoto = Omit<SanityImage, 'alt'> & { alt?: Bilingual };
export type HomeFaqItem = { question?: Bilingual; answer?: Bilingual };

export interface HomePage {
  heroImages?: { image: SanityImage; alt: string; title?: Bilingual }[];
  statistics?: SchoolStatistics;
  routine?: HomeRoutinePart[];
  playSpaces?: { roof?: HomePhoto; field?: HomePhoto };
  faq?: HomeFaqItem[];
}

export interface Testimonial {
  _id: string;
  originalLanguage?: 'bengali' | 'english';
  quote?: Bilingual;
  who?: Bilingual;
  classLine?: Bilingual;
  consent?: boolean;
  show?: boolean;
}
