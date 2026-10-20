// Reads the school's routine sheet ("Class schedule 26") into a plan for a draft routine
// (docs/class-routine.md §7). Pure: the script (scripts/routine-import.ts) loads the workbook and
// writes the plan; anything the sheet does not say clearly goes to the fix list, never guessed.
//
// The sheet: a block-name row (HIFZ | QURAN | ARABIC | GENERAL | HIFZ), a time row, a length row,
// then bands of rows separated by empty rows. In one band, side by side: a Hifz group (merged over
// the morning Hifz periods), a Quran group (name, then teacher), an Arabic level group (level label
// merged down its letters A/B/C, then book lines and the teacher), and a class (name, room, one cell
// per general period). Below the grid, "Free Teachers" lists every teacher's short name.

export type Range = { top: number; left: number; bottom: number; right: number };
/** Cell texts by 0-based row and column ('' when empty; merged cells only at their top-left). */
export type Grid = { cells: string[][]; merges: Range[] };

export type PlanPeriod = { col: number; label: string; startsAt: number; endsAt: number };
export type PlanGroup = { name: string; kind: 'section' | 'level'; section: string; band: string; room: string; sort: number };
export type PlanAssignment = { cell: string; group: string; col: number; days: number[]; subject: string; note: string; teacher: string; ta: string | null };
export type Issue = { cell: string; text: string; problem: string };
export type Plan = {
  periods: PlanPeriod[];
  groups: PlanGroup[];
  rooms: { name: string; shared: boolean }[];
  assignments: PlanAssignment[];
  issues: Issue[];
  /** Names written as teachers that aren't on the list (for the name list draft). */
  unknownNames: string[];
};

/** A name as written → the teacher's short name, or null when it isn't a teacher. */
export type NameLookup = (written: string) => string | null;

const ALL = [0, 1, 2, 3, 4, 5];
const DAY_WORDS: Record<string, number> = { sat: 0, saturday: 0, sun: 1, sunday: 1, mon: 2, monday: 2, tue: 3, tues: 3, tuesday: 3, wed: 4, wednesday: 4, thu: 5, thur: 5, thurs: 5, thursday: 5 };
const TIME_RANGE = /^(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})$/;
const QURAN_GROUP = /qaida|ammapara|nazera|najera|hifz/i;
const HIFZ_GROUP = /hifz|najera|nazera/i;
const ARABIC_BOOK = /^(ra|ba)-?\d|^summary/i;
const PLACEHOLDER = /^(science|arts|hafiz|hafeza|arbi)-\d+$/i;

export const cellName = (row: number, col: number) => `${String.fromCharCode(65 + col)}${row + 1}`;
const clean = (s: string) => s.replace(/\s+/g, ' ').trim();
// NFC: Bengali letters such as য় can be typed as one character or two.
export const nameKey = (s: string) => clean(s).normalize('NFC').toLowerCase();
const title = (s: string) => clean(s).replace(/\S+/g, (w) => w[0].toUpperCase() + w.slice(1).toLowerCase());
export const isPlaceholder = (name: string) => PLACEHOLDER.test(clean(name));

/** "sun, mon, tue", "sat-mon", "Sat - tue", "ex tue" → days (0 = Saturday), or null. */
export function parseDays(text: string): number[] | null {
  const t = clean(text).toLowerCase();
  if (!t) return null;
  const except = /^(ex|except)\s+/.exec(t);
  const body = except ? t.slice(except[0].length) : t;
  const days = new Set<number>();
  for (const part of body.split(',').map((p) => p.trim()).filter(Boolean)) {
    const range = /^([a-z]+)\s*-\s*([a-z]+)$/.exec(part);
    if (range) {
      const from = DAY_WORDS[range[1]];
      const to = DAY_WORDS[range[2]];
      if (from === undefined || to === undefined || to < from) return null;
      for (let d = from; d <= to; d++) days.add(d);
    } else if (DAY_WORDS[part] !== undefined) {
      days.add(DAY_WORDS[part]);
    } else {
      return null;
    }
  }
  const list = [...days].sort((a, b) => a - b);
  return except ? ALL.filter((d) => !days.has(d)) : list;
}

/** "7:00-8:15" → minutes; the sheet writes 12-hour times without am/pm (1–6 are afternoon, as is an end before the start). */
export function parseTimeRange(text: string): { startsAt: number; endsAt: number } | null {
  const m = TIME_RANGE.exec(clean(text));
  if (!m) return null;
  const minutes = (h: number, min: number) => (h >= 1 && h <= 6 ? h + 12 : h) * 60 + min;
  const startsAt = minutes(Number(m[1]), Number(m[2]));
  let endsAt = minutes(Number(m[3]), Number(m[4]));
  if (endsAt <= startsAt && endsAt + 12 * 60 > startsAt) endsAt += 12 * 60; // "3:00-8:00" ends in the evening
  return endsAt > startsAt ? { startsAt, endsAt } : null;
}

const text = (g: Grid, r: number, c: number) => (g.cells[r]?.[c] ?? '').trim();
const mergeAt = (g: Grid, r: number, c: number) => g.merges.find((m) => r >= m.top && r <= m.bottom && c >= m.left && c <= m.right);
/** The text shown at a cell, merged ranges included. */
const shown = (g: Grid, r: number, c: number) => {
  const m = mergeAt(g, r, c);
  return m ? text(g, m.top, m.left) : text(g, r, c);
};

type Layout = {
  timeRow: number;
  dataStart: number;
  dataEnd: number;
  periods: (PlanPeriod & { block: string })[];
  classCol: number;
  roomCol: number;
  levelCol: number;
  letterCol: number;
  rosterRow: number;
  rosterCol: number;
};

function layout(g: Grid): Layout | null {
  const timeRow = g.cells.findIndex((row) => row.filter((c) => TIME_RANGE.test(clean(c))).length >= 3);
  if (timeRow < 1) return null;
  const row = g.cells[timeRow];
  // A block name covers the periods to its right until the next one (merged or not).
  let current = '';
  const periods = row
    .map((c, col) => ({ col, time: parseTimeRange(c), block: (current = shown(g, timeRow - 1, col) || current) }))
    .filter((p): p is { col: number; time: { startsAt: number; endsAt: number }; block: string } => !!p.time)
    .map(({ col, time, block }) => {
      const b = block.toUpperCase();
      const label = /HIFZ/.test(b) ? (time.startsAt >= 12 * 60 ? 'হিফয (বিকেল)' : 'হিফয') : /QURAN/.test(b) ? 'কুরআন' : /ARABIC/.test(b) ? 'আরবি' : '';
      return { col, label, block: b, ...time };
    });
  const classCol = row.findIndex((c) => /class\s*time/i.test(c));
  const arabic = periods.find((p) => /ARABIC/.test(p.block));
  const rosterRow = g.cells.findIndex((r, i) => i > timeRow && r.some((c) => /free teachers/i.test(c)));
  const stop = g.cells.findIndex((r, i) => i > timeRow && r.some((c) => /free teachers|no of classes/i.test(c)));
  const hasLength = (g.cells[timeRow + 1] ?? []).some((c) => /\b(min|hr)\b/i.test(c));
  if (classCol < 0 || !arabic) return null;
  return {
    timeRow,
    dataStart: timeRow + (hasLength ? 2 : 1),
    dataEnd: stop < 0 ? g.cells.length : stop,
    periods,
    classCol,
    roomCol: classCol + 1,
    levelCol: arabic.col - 2,
    letterCol: arabic.col - 1,
    rosterRow,
    rosterCol: rosterRow < 0 ? -1 : g.cells[rosterRow].findIndex((c) => /free teachers/i.test(c)),
  };
}

/** The short names under "Free Teachers" (the sheet's list of every teacher and open post). */
export function readRoster(g: Grid): string[] {
  const l = layout(g);
  if (!l || l.rosterRow < 0) return [];
  const names: string[] = [];
  for (let r = l.rosterRow + 1; r < g.cells.length; r++) {
    const name = text(g, r, l.rosterCol);
    if (name) names.push(clean(name));
    else if (names.length) break;
  }
  return names;
}

type Line = { subject: string; inline: string[]; days: number[] | null; note: string; raw: string };

const splitNames = (s: string) => s.split(/[/+&]/).map(clean).filter(Boolean);

/** A line of teacher names (days in brackets are the TA's), or null; one known name is enough. */
function teacherLine(raw: string, lookup: NameLookup): { names: string[]; days: number[] | null; paren: string } | null {
  const m = /^([^(:]*?)\s*(?:\(([^)]*)\))?\s*$/.exec(clean(raw));
  if (!m || !m[1]) return null;
  const names = splitNames(m[1]);
  if (!names.some((n) => lookup(n))) return null;
  return { names, days: m[2] ? parseDays(m[2]) : null, paren: m[2] ?? '' };
}

/** "Subject", "Subject (days)", "Subject: Teacher (days)", "Quran (Extra support)", "RA-1 (sun, mon, tue)". */
function subjectLine(raw: string, arabic: boolean): Line {
  const line = clean(raw);
  const [head = '', ...after] = clean(line.replace(/\([^)]*\)/g, ' ')).split(':');
  const inline = after.length ? splitNames(after.join(':')) : [];
  let days: number[] | null = null;
  const notes: string[] = [];
  for (const [, paren] of line.matchAll(/\(([^)]*)\)/g)) {
    const d = parseDays(paren);
    if (d && !days) days = d;
    else notes.push(clean(paren));
  }
  const subject = clean(head);
  if (arabic && ARABIC_BOOK.test(subject)) return { subject: 'Arabic', inline, days, note: [subject, ...notes].join(' '), raw: line };
  return { subject: title(subject), inline, days, note: notes.join(' '), raw: line };
}

/** The classes in one cell of one group: subject lines, then the teacher line(s) under them. */
function readCell(lines: string[], lookup: NameLookup, arabic: boolean, issue: (problem: string) => void, unknownName: (name: string) => void) {
  const subjects: Line[] = [];
  const teachers: string[] = [];
  let taDays: number[] | null = null;
  for (const raw of lines) {
    const t = teacherLine(raw, lookup);
    if (t) {
      teachers.push(...t.names);
      if (t.days && t.names.length > 1) taDays = t.days;
      else if (t.paren) issue(`"${clean(raw)}": বন্ধনীর লেখা ধরা হয়নি`);
    } else {
      subjects.push(subjectLine(raw, arabic));
    }
  }
  const out: Omit<PlanAssignment, 'cell' | 'group' | 'col'>[] = [];
  if (!subjects.length) {
    if (teachers.length) issue('শিক্ষকের নাম আছে, বিষয় নেই');
    return out;
  }
  // "Math (sat-mon) / Islam (tue-thu) / Rehnuma / Samia": as many teachers as subjects, one each in order.
  const shared = subjects.filter((s) => !s.inline.length);
  const paired = shared.length > 1 && teachers.length === shared.length;
  if (paired) issue(`"${teachers.join(' / ')}": বিষয়গুলোতে ক্রম অনুযায়ী একজন করে শিক্ষক বসানো হয়েছে`);
  const taken = new Set<number>();
  // Days given in the sheet first; a subject without days gets the days the others leave free.
  for (const s of subjects) s.days?.forEach((d) => taken.add(d));
  for (const [i, s] of subjects.entries()) {
    if (s.subject.includes('/')) {
      issue(`"${s.raw}": এক লাইনে দুটি বিষয়; আমদানি হয়নি, এডিটরে দিন অনুযায়ী আলাদা করুন`);
      continue;
    }
    if (!s.subject) {
      issue(`"${s.raw}": বিষয় পড়া যায়নি`);
      continue;
    }
    let days = s.days ?? (subjects.length === 1 ? ALL : ALL.filter((d) => !taken.has(d)));
    const earlier = new Set(subjects.slice(0, i).flatMap((p) => p.days ?? []));
    const overlap = s.days ? days.filter((d) => earlier.has(d)) : [];
    if (overlap.length) {
      issue(`"${s.raw}": দিন আগের লাইনের সাথে মিলে যায় (টাইপো?); মিলে যাওয়া দিন বাদ দেওয়া হয়েছে`);
      days = days.filter((d) => !earlier.has(d));
    }
    if (!days.length) {
      issue(`"${s.raw}": কোন দিন বোঝা যায়নি`);
      continue;
    }
    const names = s.inline.length ? s.inline : paired ? [teachers[shared.indexOf(s)]] : teachers;
    const unknown = names.filter((n) => !lookup(n));
    if (unknown.length) {
      unknown.forEach(unknownName);
      issue(`"${unknown.join(', ')}": শিক্ষকের তালিকায় নেই; নামের তালিকায় যোগ করে আবার চালান`);
    }
    const known = names.map(lookup).filter((n): n is string => !!n);
    if (!known.length) {
      issue(`"${s.raw}": শিক্ষকের নাম নেই; আমদানি হয়নি`);
      continue;
    }
    if (known.length > 2) issue(`"${known.join(' / ')}": দুজনের বেশি শিক্ষক; প্রথম দুজন নেওয়া হয়েছে`);
    else if (known.length === 2) issue(`"${known.join(' / ')}": দুজন শিক্ষক; প্রথমজন মূল, দ্বিতীয়জন সহকারী ধরা হয়েছে${taDays ? ' (সহকারী শুধু বন্ধনীর দিনগুলোতে)' : ''}`);
    const [teacher, ta = null] = known;
    const base = { subject: s.subject, note: s.note, teacher };
    if (ta && taDays && !s.inline.length) {
      const withTa = days.filter((d) => taDays!.includes(d));
      const without = days.filter((d) => !taDays!.includes(d));
      if (withTa.length) out.push({ ...base, days: withTa, ta });
      if (without.length) out.push({ ...base, days: without, ta: null });
    } else {
      out.push({ ...base, days, ta });
    }
  }
  return out;
}

const SECTION = { hifz: 'হিফয', quran: 'কুরআন', arabic: 'আরবি', general: 'জেনারেল' } as const;
const SECTION_ORDER = [SECTION.hifz, SECTION.quran, SECTION.arabic, SECTION.general];

export function readSheet(g: Grid, lookup: NameLookup): Plan {
  const l = layout(g);
  const issues: Issue[] = [];
  if (!l) return { periods: [], groups: [], rooms: [], assignments: [], unknownNames: [], issues: [{ cell: '', text: '', problem: 'শিটে সময়ের সারি, "Class Time" বা ARABIC কলাম পাওয়া যায়নি' }] };

  const groups = new Map<string, PlanGroup>();
  const roomsOf = new Map<string, Set<string>>();
  const assignments: PlanAssignment[] = [];
  const unknown = new Map<string, string>();
  const unknownName = (name: string) => unknown.set(nameKey(name), clean(name));
  const addGroup = (name: string, kind: PlanGroup['kind'], section: string, band: string, row: number, room = '') => {
    const key = nameKey(name);
    if (!groups.has(key)) groups.set(key, { name: clean(name), kind, section, band, room, sort: SECTION_ORDER.indexOf(section as never) * 1000 + row });
    if (room) roomsOf.set(room, (roomsOf.get(room) ?? new Set()).add(clean(name)));
    return groups.get(key)!.name;
  };
  const isTime = (r: number) => g.cells[r]?.filter((c) => TIME_RANGE.test(clean(c))).length >= 2;
  const blank = (r: number) => !(g.cells[r] ?? []).some((c) => c.trim());

  // Bands: runs of rows with text; a stray time row (a class with its own times) ends a band.
  const bands: [number, number][] = [];
  for (let r = l.dataStart; r < l.dataEnd; r++) {
    if (blank(r)) continue;
    if (isTime(r)) {
      const owner = bands.length ? text(g, bands[bands.length - 1][0], l.classCol) : '';
      issues.push({ cell: cellName(r, 0), text: g.cells[r].filter(Boolean).join(' | '), problem: `${owner || 'একটি ক্লাসের'} নিজের সময় দেওয়া আছে; ক্লাসগুলো স্কুলের পিরিয়ডে বসানো হয়েছে` });
      continue;
    }
    let end = r;
    while (end + 1 < l.dataEnd && !blank(end + 1) && !isTime(end + 1)) end++;
    bands.push([r, end]);
    r = end;
  }

  for (const [top, bottom] of bands) {
    const lines = (col: number) => {
      const out: string[] = [];
      for (let r = top; r <= bottom; r++) out.push(...text(g, r, col).split('\n').map(clean).filter(Boolean));
      return out;
    };
    const className = lines(l.classCol)[0] ?? '';
    const room = lines(l.roomCol)[0] ?? '';
    const roomName = room ? (/^hall$/i.test(room) ? 'Hall' : room) : '';
    const level = shown(g, top, l.levelCol);
    const letter = shown(g, top, l.letterCol);
    const done = new Set<number>();

    for (const p of l.periods) {
      if (done.has(p.col)) continue;
      const cellLines = lines(p.col);
      if (!cellLines.length) continue;
      const cell = cellName(top, p.col);
      const raw = cellLines.join(' / ');
      const issue = (problem: string) => {
        if (!issues.some((i) => i.cell === cell && i.problem === problem)) issues.push({ cell, text: raw, problem });
      };
      const place = (group: string, cols: number[], rows: ReturnType<typeof readCell>) => {
        for (const c of cols) for (const a of rows) assignments.push({ ...a, cell, group, col: c });
      };

      if (/HIFZ/.test(p.block) && HIFZ_GROUP.test(cellLines[0])) {
        // A Hifz group merged over several periods teaches in each of them.
        const m = mergeAt(g, top, p.col);
        const cols = l.periods.filter((q) => q.col >= p.col && q.col <= (m?.right ?? p.col)).map((q) => q.col);
        cols.forEach((c) => done.add(c));
        const group = addGroup(cellLines[0], 'level', SECTION.hifz, '', top);
        place(group, cols, readCell(['Hifz', ...cellLines.slice(1)], lookup, false, issue, unknownName));
      } else if (/QURAN/.test(p.block) && QURAN_GROUP.test(cellLines[0])) {
        const group = addGroup(cellLines[0], 'level', SECTION.quran, '', top);
        place(group, [p.col], readCell(['Quran', ...cellLines.slice(1)], lookup, false, issue, unknownName));
      } else if (/ARABIC/.test(p.block) && (level || letter)) {
        const n = /(\d+)/.exec(level)?.[1];
        if (!n) {
          issue(`লেভেল পড়া যায়নি ("${level}")`);
          continue;
        }
        const group = addGroup(letter ? `L-${n} ${letter}` : `L-${n}`, 'level', SECTION.arabic, `LEVEL-${n}`, top);
        place(group, [p.col], readCell(cellLines, lookup, true, issue, unknownName));
      } else if (className) {
        const group = addGroup(className, 'section', SECTION.general, '', top, roomName);
        place(group, [p.col], readCell(cellLines, lookup, false, issue, unknownName));
      } else {
        issue('কোন গ্রুপের ঘর বোঝা যায়নি');
      }
    }
  }

  // A room the sheet gives to two classes is marked shared, so the import can't clash on it.
  const rooms = [...roomsOf].map(([name, owners]) => ({ name, shared: owners.size > 1 }));
  for (const r of rooms.filter((x) => x.shared && x.name !== 'Hall')) {
    issues.push({ cell: '', text: `রুম ${r.name}: ${[...roomsOf.get(r.name)!].join(', ')}`, problem: 'একাধিক ক্লাসের একই রুম; "শেয়ার করা" করা হয়েছে, সেটআপে ঠিক করুন' });
  }
  return {
    periods: l.periods.map(({ col, label, startsAt, endsAt }) => ({ col, label, startsAt, endsAt })),
    groups: [...groups.values()],
    rooms,
    assignments,
    issues,
    unknownNames: [...unknown.values()],
  };
}
