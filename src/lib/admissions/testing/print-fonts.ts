// The PDFs are printed on the server with only the embedded fonts (pdf.ts: Noto Sans Bengali's
// Bengali subset, Inter's Latin subset); a character outside them prints as a box.

const RANGES: [number, number][] = [
  [0x0000, 0x00ff],
  [0x0131, 0x0131],
  [0x0152, 0x0153],
  [0x02bb, 0x02bc],
  [0x02c6, 0x02c6],
  [0x02da, 0x02da],
  [0x02dc, 0x02dc],
  [0x0951, 0x0952],
  [0x0964, 0x0965],
  [0x0980, 0x09fe],
  [0x2000, 0x206f],
  [0x20ac, 0x20ac],
  [0x20b9, 0x20b9],
  [0x2122, 0x2122],
  [0x2191, 0x2191],
  [0x2193, 0x2193],
  [0x2212, 0x2212],
  [0x2215, 0x2215],
  [0x25cc, 0x25cc],
  [0xfeff, 0xfeff],
];

/** Characters of the printed text (styles, drawings and tags left out) that no embedded font has. */
export function missingGlyphs(html: string): string[] {
  const text = html
    .replace(/<style[\s\S]*?<\/style>/g, '')
    .replace(/<svg[\s\S]*?<\/svg>/g, '')
    .replace(/<[^>]+>/g, '')
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)));
  const covered = (c: number) => RANGES.some(([a, b]) => c >= a && c <= b);
  return [...new Set([...text].filter((c) => !covered(c.codePointAt(0)!)))];
}
