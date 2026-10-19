/**
 * One-time import of the school's routine sheet into a DRAFT routine (docs/class-routine.md §7).
 *
 *   pnpm routine:import "<path>/Class schedule.xlsx"            # dry run: names draft + report
 *   pnpm routine:import "<path>/Class schedule.xlsx" --apply    # writes a draft routine
 *   options: --name "২০২৭ (শিট থেকে)"  --dir <folder for names.json and report.md>
 *
 * Everything it writes locally goes to <folder of the xlsx>/routine-import/ (never into this public
 * repo): names.json (short name → full name in "Profile all", gender, other spellings; edit it) and
 * report.md (what would be created, and the fix list). --apply writes to the database in
 * .env.local (DATABASE_URL) through the admin's own data layer, so clashes are refused the same way;
 * the routine is created as a draft, to check and make active in /admin/routine/setup.
 */
import { config } from 'dotenv';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import ExcelJS from 'exceljs';
import { isPlaceholder, nameKey, readRoster, readSheet, type Grid, type Issue, type Plan } from '../src/lib/routine/sheet-import';
import type { TeacherSeed } from '../src/lib/routine/sheet-import-apply';

config({ path: '.env.local' });

// fullName and erpId come from the school's ERP teacher list; profile names a row in "Profile all"
// (qualification, phone, salary; also the full name when fullName is empty).
type NameEntry = { profile: string | null; fullName?: string; erpId?: string | null; gender: '' | 'male' | 'female'; vacancy: boolean; aliases: string[] };
export type Names = { teachers: Record<string, NameEntry> };
type Profile = { fullName: string; qualification: string; experienceYears: number | null; designation: string; department: string; phone: string; salary: number | null };

const args = process.argv.slice(2);
const file = args.find((a) => !a.startsWith('--') && args[args.indexOf(a) - 1] !== '--name' && args[args.indexOf(a) - 1] !== '--dir');
const option = (name: string) => (args.includes(name) ? args[args.indexOf(name) + 1] : undefined);
const apply = args.includes('--apply');

function cellText(c: ExcelJS.Cell): string {
  const v = c.value as unknown;
  if (v && typeof v === 'object' && 'richText' in (v as object)) return (v as { richText: { text: string }[] }).richText.map((t) => t.text).join('');
  if (v && typeof v === 'object' && 'result' in (v as object)) return String((v as { result: unknown }).result ?? '');
  return c.text ?? '';
}

export function toGrid(ws: ExcelJS.Worksheet): Grid {
  const cells: string[][] = [];
  ws.eachRow({ includeEmpty: true }, (row, r) => {
    row.eachCell({ includeEmpty: false }, (c, col) => {
      if (c.isMerged && c.master !== c) return;
      (cells[r - 1] ??= [])[col - 1] = cellText(c);
    });
  });
  // Rows without cells are holes in the array; Array.from turns them into undefined.
  const width = Math.max(0, ...Array.from(cells, (r) => r?.length ?? 0));
  for (let r = 0; r < cells.length; r++) cells[r] = Array.from({ length: width }, (_, c) => cells[r]?.[c] ?? '');
  const col = (s: string) => s.split('').reduce((n, ch) => n * 26 + ch.charCodeAt(0) - 64, 0) - 1;
  const merges = ((ws.model as { merges?: string[] }).merges ?? []).map((m) => {
    const [a, b] = m.split(':').map((x) => /^([A-Z]+)(\d+)$/.exec(x)!);
    return { top: Number(a[2]) - 1, left: col(a[1]), bottom: Number(b[2]) - 1, right: col(b[1]) };
  });
  return { cells, merges };
}

export function readProfiles(ws: ExcelJS.Worksheet | undefined): Map<string, Profile> {
  const out = new Map<string, Profile>();
  if (!ws) return out;
  const g = toGrid(ws);
  const headerRow = g.cells.findIndex((r) => r.some((c) => c.trim() === 'নাম') && r.some((c) => /বেতন/.test(c)));
  if (headerRow < 0) return out;
  const h = g.cells[headerRow].map((c) => c.trim());
  const at = (label: RegExp) => h.findIndex((c) => label.test(c));
  const [name, qual, exp, desig, dept, phone, salary] = [/^নাম$/, /যোগ্যতা/, /অভিজ্ঞতা/, /পদবী/, /বিভাগ/, /মোবাইল/, /বেতন/].map(at);
  const num = (s: string) => (s.trim() && Number.isFinite(Number(s)) ? Number(s) : null);
  for (const row of g.cells.slice(headerRow + 1)) {
    const fullName = row[name]?.replace(/\s+/g, ' ').trim();
    if (!fullName) continue;
    out.set(nameKey(fullName), {
      fullName,
      qualification: row[qual]?.trim() ?? '',
      experienceYears: num(row[exp] ?? ''),
      designation: row[desig]?.trim() ?? '',
      department: row[dept]?.trim() ?? '',
      phone: row[phone]?.replace(/\p{Cf}/gu, '').trim() ?? '',
      salary: num(row[salary] ?? ''),
    });
  }
  return out;
}

const title = (s: string) => s.replace(/\s+/g, ' ').trim().replace(/\S+/g, (w) => w[0].toUpperCase() + w.slice(1));

function lookupFrom(names: Names) {
  const map = new Map<string, string>();
  for (const [short, e] of Object.entries(names.teachers)) {
    map.set(nameKey(short), short);
    for (const a of e.aliases) map.set(nameKey(a), short);
  }
  return (written: string) => map.get(nameKey(written)) ?? null;
}

/** Problems in names.json; the first kind blocks --apply, the second is only a note. */
function nameProblems(names: Names, profiles: Map<string, Profile>) {
  const blocking = Object.entries(names.teachers).flatMap(([short, e]) => [
    ...(e.gender !== 'male' && e.gender !== 'female' ? [`${short}: gender দেওয়া নেই ("male" বা "female")`] : []),
    ...(e.profile && !profiles.has(nameKey(e.profile)) ? [`${short}: "${e.profile}" নামটি Profile all-এ নেই`] : []),
  ]);
  const notes = Object.entries(names.teachers)
    .filter(([, e]) => !e.profile && !e.fullName && !e.vacancy)
    .map(([short]) => `${short}: পূর্ণ নাম দেওয়া নেই (ছোট নামই পূর্ণ নাম হিসেবে যাবে)`);
  return { blocking, notes };
}

export function teacherSeeds(names: Names, profiles: Map<string, Profile>): TeacherSeed[] {
  return Object.entries(names.teachers).map(([shortName, e]) => {
    const p = e.profile ? profiles.get(nameKey(e.profile)) : undefined;
    return {
      fullName: e.fullName || p?.fullName || shortName,
      shortName,
      gender: e.gender as 'male' | 'female',
      designation: p?.designation ?? '',
      department: p?.department ?? '',
      qualification: p?.qualification ?? '',
      experienceYears: p?.experienceYears ?? null,
      phone: p?.phone ?? '',
      salary: p?.salary ?? null,
      targetPeriods: null,
      bio: '',
      erpId: e.erpId || null,
      isVacancy: e.vacancy,
      active: true,
    };
  });
}

const DAY = ['শনি', 'রবি', 'সোম', 'মঙ্গল', 'বুধ', 'বৃহঃ'];

const issueTable = (issues: Issue[]) => ['| ঘর | শিটে লেখা | কী হয়েছে |', '|---|---|---|', ...issues.map((i) => `| ${i.cell} | ${i.text.replace(/\|/g, '/')} | ${i.problem} |`)];

function report(plan: Plan, names: Names, profiles: Map<string, Profile>, file: string): string {
  const lines: string[] = [];
  const period = (col: number) => plan.periods.find((p) => p.col === col)!;
  const time = (m: number) => `${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}`;
  const { blocking, notes } = nameProblems(names, profiles);
  lines.push(`# রুটিন আমদানি: পরীক্ষা (${new Date().toISOString().slice(0, 16).replace('T', ' ')})`, '', `ফাইল: ${file}`, '');
  lines.push('## যা তৈরি হবে', '');
  lines.push(`- পিরিয়ড ${plan.periods.length}টি: ${plan.periods.map((p) => `${time(p.startsAt)}–${time(p.endsAt)}${p.label ? ` (${p.label})` : ''}`).join(', ')}`);
  for (const section of [...new Set(plan.groups.map((g) => g.section))]) {
    lines.push(`- ${section}: ${plan.groups.filter((g) => g.section === section).map((g) => g.name + (g.room ? ` (রুম ${g.room})` : '')).join(', ')}`);
  }
  lines.push(`- রুম: ${plan.rooms.map((r) => r.name + (r.shared ? ' (শেয়ার করা)' : '')).join(', ')}`);
  lines.push(`- শিক্ষক ${Object.keys(names.teachers).length} জন (শূন্য পদ ${Object.values(names.teachers).filter((e) => e.vacancy).length}টি)`);
  lines.push(`- ক্লাস (দিনসহ সারি) ${plan.assignments.length}টি`, '');
  lines.push('## নামের তালিকা (names.json)', '', ...(blocking.length ? ['ঠিক না করা পর্যন্ত --apply চলবে না:', '', ...blocking.map((p) => `- ${p}`), ''] : []), ...notes.map((p) => `- ${p}`), '');
  lines.push(`## যেগুলো দেখে নিতে হবে (${plan.issues.length}টি)`, '', ...issueTable(plan.issues));
  // Days a group has no class in a period where the sheet names days (e.g. Arabic "sun–tue" + "wed, thu" leaves Saturday).
  const gaps = new Map<string, string[]>();
  for (const a of plan.assignments) {
    const k = `${a.group}\u0000${a.col}`;
    if (!gaps.has(k)) {
      const days = new Set(plan.assignments.filter((b) => b.group === a.group && b.col === a.col).flatMap((b) => b.days));
      const missing = DAY.filter((_, d) => !days.has(d));
      if (missing.length) gaps.set(k, [`${a.group} ${time(period(a.col).startsAt)}`, missing.join(', ')]);
    }
  }
  lines.push('', `## যে ক্লাসে কিছু দিন ফাঁকা (${gaps.size}টি)`, '', '| গ্রুপ ও সময় | ফাঁকা দিন |', '|---|---|', ...[...gaps.values()].map(([g, d]) => `| ${g} | ${d} |`));
  lines.push('', '## সব ক্লাস', '', '| ঘর | গ্রুপ | সময় | দিন | বিষয় | মূল | সহকারী | নোট |', '|---|---|---|---|---|---|---|---|');
  for (const a of plan.assignments) {
    const p = period(a.col);
    lines.push(`| ${a.cell} | ${a.group} | ${time(p.startsAt)} | ${a.days.length === 6 ? 'প্রতিদিন' : a.days.map((d) => DAY[d]).join(', ')} | ${a.subject} | ${a.teacher} | ${a.ta ?? ''} | ${a.note} |`);
  }
  return lines.join('\n') + '\n';
}

async function main() {
  if (!file) throw new Error('Usage: pnpm routine:import "<file>.xlsx" [--apply] [--name "…"] [--dir <folder>]');
  const path = resolve(file);
  const dir = resolve(option('--dir') ?? join(dirname(path), 'routine-import'));
  mkdirSync(dir, { recursive: true });
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(path);
  const sheet = wb.worksheets.find((w) => /class schedule/i.test(w.name)) ?? wb.worksheets[0];
  const grid = toGrid(sheet);
  const profiles = readProfiles(wb.worksheets.find((w) => /profile/i.test(w.name)));

  // The name list: drafted from "Free Teachers" (plus names the grid uses that aren't there), then edited by hand.
  const namesFile = join(dir, 'names.json');
  let names: Names;
  if (existsSync(namesFile)) {
    names = JSON.parse(readFileSync(namesFile, 'utf8'));
  } else {
    names = { teachers: {} };
    for (const n of readRoster(grid)) names.teachers[title(n)] = { profile: null, gender: '', vacancy: isPlaceholder(n), aliases: n === title(n) ? [] : [n] };
    for (const n of readSheet(grid, lookupFrom(names)).unknownNames) names.teachers[title(n)] = { profile: null, gender: '', vacancy: false, aliases: [] };
    writeFileSync(namesFile, JSON.stringify(names, null, 2) + '\n');
    console.log(`Name list drafted: ${namesFile}`);
  }

  const plan = readSheet(grid, lookupFrom(names));
  writeFileSync(join(dir, 'report.md'), report(plan, names, profiles, path));
  console.log(`Report: ${join(dir, 'report.md')}`);
  console.log(`${plan.periods.length} periods, ${plan.groups.length} groups, ${plan.rooms.length} rooms, ${plan.assignments.length} classes, ${plan.issues.length} to check.`);
  if (!apply) return;

  const { blocking } = nameProblems(names, profiles);
  if (blocking.length) throw new Error(`Fix names.json first:\n${blocking.join('\n')}`);
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not set (.env.local)');
  console.log(`Writing to ${new URL(process.env.DATABASE_URL).host} …`);
  // Loaded only here: the data layer needs the database settings above.
  const { applyPlan } = await import('../src/lib/routine/sheet-import-apply');
  const name = option('--name') ?? `শিট থেকে (${new Date().toISOString().slice(0, 10)})`;
  const result = await applyPlan(plan, teacherSeeds(names, profiles), name);
  const c = result.created;
  writeFileSync(
    join(dir, 'applied.md'),
    [`# রুটিন আমদানি: "${name}" (খসড়া)`, '', `নতুন: বিষয় ${c.subjects}, রুম ${c.rooms}, গ্রুপ ${c.groups}, শিক্ষক ${c.teachers}, ক্লাস ${c.classes}`, '', `## বসানো যায়নি (${result.refused.length}টি)`, '', ...issueTable(result.refused), ''].join('\n'),
  );
  console.log(`Draft routine "${name}": ${c.classes} classes; new subjects ${c.subjects}, rooms ${c.rooms}, groups ${c.groups}, teachers ${c.teachers}.`);
  console.log(`${result.refused.length} not placed: ${join(dir, 'applied.md')}`);
}

// Only when run as a script; the rehearsal test imports the helpers.
if (process.argv[1]?.endsWith('routine-import.ts')) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
