// The Curriculum page's class-by-class plan, from the prospectus's ten-year table. Pure; labels live in messages
// (curriculum.plan, home.plan). Classes are indexed as in home/plan: 0 Nursery, 1 KG, 2 Class 1 … 9 Class 8,
// 10 and 11 Dakhil (Classes 9 and 10), 12 Mutawassita (Class 11).
import { BOARD_BLOCKS, STAGE_CLASSES, STRANDS } from '@/lib/home/plan';

export type Subject = 'bangla' | 'english' | 'maths' | 'science' | 'bgs';

export type PlanRow =
  | { kind: 'class'; i: number; quran?: string; level: string; general: Subject[]; limited: boolean }
  | { kind: 'dakhil' | 'mutawassita'; i: number };

/** The stage a class belongs to (an index into STAGE_CLASSES). */
export const stageOf = (i: number) => STAGE_CLASSES.findIndex(([a, b]) => i >= a && i < b);

/** A class's Arabic and Islamic studies level, as the books are named: N, KG, then the class number (1 to 8). */
export const level = (i: number) => (i === 0 ? 'N' : i === 1 ? 'KG' : String(i - 1));

/** A class's Quran portion (a key in home.plan.segments); none after Class 5. */
export const quranOf = (i: number) => STRANDS.find((s) => s.strand === 'quran')?.segments.find((s) => i >= s.from && i < s.to)?.label;

/** Bangla, English and maths throughout; science from Class 5, BGS from Class 6. */
export const generalOf = (i: number): Subject[] => ['bangla', 'english', 'maths', ...(i >= 6 ? (['science'] as const) : []), ...(i >= 7 ? (['bgs'] as const) : [])];

/** The plan's rows by stage. During hifz the general subjects are taught limited, on a special syllabus. */
export function planRows(): PlanRow[][] {
  const [dakhil, mutawassita] = BOARD_BLOCKS;
  return STAGE_CLASSES.map(([a, b]) =>
    Array.from({ length: b - a }, (_, n): PlanRow => {
      const i = a + n;
      if (i >= mutawassita[0]) return { kind: 'mutawassita', i };
      if (i >= dakhil[0]) return { kind: 'dakhil', i };
      return { kind: 'class', i, quran: quranOf(i), level: level(i), general: generalOf(i), limited: stageOf(i) === 1 };
    }),
  );
}
