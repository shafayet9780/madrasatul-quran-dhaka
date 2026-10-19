import type { Grid, NameLookup } from '../sheet-import';

// A small made-up sheet in the school's layout (names invented), for the import tests.

const address = (a: string) => {
  const [, col, row] = /^([A-Z])(\d+)$/.exec(a)!;
  return { row: Number(row) - 1, col: col.charCodeAt(0) - 65 };
};

export function gridOf(cells: Record<string, string>, merges: string[] = []): Grid {
  const out: string[][] = [];
  for (const [a, text] of Object.entries(cells)) {
    const { row, col } = address(a);
    (out[row] ??= [])[col] = text;
  }
  const width = Math.max(...Array.from(out, (r) => r?.length ?? 0));
  return {
    cells: Array.from(out, (r) => Array.from({ length: width }, (_, c) => r?.[c] ?? '')),
    merges: merges.map((m) => {
      const [a, b] = m.split(':').map(address);
      return { top: a.row, left: a.col, bottom: b.row, right: b.col };
    }),
  };
}

export const SAMPLE_SHEET = gridOf(
  {
    B3: 'HIFZ', D3: 'QURAN', H3: 'ARABIC', L3: 'GENERAL', O3: 'HIFZ',
    B4: '7:00-8:15', C4: '8:15-9:00', D4: '9:00-9:45', H4: '10:00-10:45', J4: 'Class Time', L4: '10:45-11:30', M4: '11:30-12:15', O4: '3:00-8:00',
    B5: '1 hr 15 min', C5: '45 min', D5: '45 min', H5: '45 min', L5: '45 min', M5: '45 min', O5: '5 hr',

    B7: 'hifz (m)', B8: 'Ruhul + Hamid',
    D7: 'Qaida-A', D8: 'Moin',
    F7: 'LEVEL-1', G7: 'A', H7: 'RA-1 (sun, mon, tue)', H8: 'Islam (wed, thu)', H9: 'Karim',
    J7: 'Nursery-A', K7: '402', L7: 'Math', L8: 'Tania/sadia (mon-thu)', M7: 'Math (sat-mon)', M8: 'islam (tue-thu)', M9: 'Rina/salma',
    O7: 'hifz (m)', O8: 'Ruhul (sat-mon)',

    G11: 'B', H11: 'English/Math', H12: 'Farah / fatema',
    J11: 'Nursery-B', K11: '402', L11: 'Bangla: Sadia (sat, sun)', L12: 'English: Ghost (mon-thu)', M11: 'English (ex tue)', M12: 'Science-1',

    D15: 'Free Teachers', D16: 'Moin', D17: 'Ruhul', D18: 'tania', D19: 'Science-1',
  },
  ['B7:C8', 'F7:F12'],
);

export const SAMPLE_NAMES = ['Ruhul', 'Hamid', 'Moin', 'Karim', 'Tania', 'Sadia', 'Rina', 'Salma', 'Farah', 'Fatema', 'Science-1'];

export const sampleLookup: NameLookup = (written) => SAMPLE_NAMES.find((n) => n.toLowerCase() === written.trim().toLowerCase()) ?? null;
