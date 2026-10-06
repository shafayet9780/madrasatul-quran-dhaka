import 'server-only';
import ExcelJS from 'exceljs';
import { formatSheetTime } from './dates';
import { classReport, raterReport, studentReport } from './reports';
import { optionCounts } from './guardian-report-math';
import { allReportRounds, classGuardian, guardianItems, previousRound, studentGuardian, teachingQuality, withGuardian } from './guardian-reports';
import { displayMobile } from './labels';
import { loadGuardianTracker, loadTracker } from './tracker';
import type { surveyRounds } from './schema';

type Round = typeof surveyRounds.$inferSelect;
type Book = { fileName: string; buffer: ArrayBuffer };

const round1 = (n: number | null) => (n === null ? null : Math.round(n * 10) / 10);
const safeName = (text: string) => text.replace(/[\\/:*?"<>|]/g, '-');

async function book(fileName: string, sheets: { name: string; columns: { header: string; key: string; width: number }[]; rows: Record<string, unknown>[] }[]): Promise<Book> {
  const workbook = new ExcelJS.Workbook();
  for (const s of sheets) {
    const sheet = workbook.addWorksheet(s.name.slice(0, 31));
    sheet.columns = s.columns;
    sheet.getRow(1).font = { bold: true };
    sheet.views = [{ state: 'frozen', ySplit: 1 }];
    for (const row of s.rows) sheet.addRow(row);
  }
  return { fileName: safeName(fileName), buffer: (await workbook.xlsx.writeBuffer()) as ArrayBuffer };
}

const FORM_LABEL = { verified: 'যাচাইকৃত', unverified: 'অযাচাইকৃত', none: 'সাড়া নেই' } as const;

export async function classWorkbook(round: Round, classKey: string, sectionKey: string, verifiedOnly = false): Promise<Book | null> {
  const [report, rounds] = await Promise.all([classReport(round, classKey, sectionKey), allReportRounds()]);
  if (!report) return null;
  const guardian = await classGuardian(round, rounds, { classKey, sectionKey }, { verifiedOnly });
  const rows = withGuardian(report.rows, guardian);
  const g2 = guardian.g2.round;
  const answers = g2 ? optionCounts(await guardianItems([g2.id], { verifiedOnly }, { classKey, sectionKey }), g2.snapshot.template.questions) : [];
  const teacherAreas = new Map(report.areas.map((a) => [a.areaKey, a]));
  return book(`${report.label} - ${round.label}.xlsx`, [
    {
      name: 'শিক্ষার্থী',
      columns: [
        { header: 'রোল', key: 'roll', width: 8 },
        { header: 'ID', key: 'erpId', width: 14 },
        { header: 'নাম', key: 'name', width: 28 },
        { header: 'শিক্ষকদের গড় (/১০)', key: 'mean', width: 18 },
        { header: 'মার্ক সংখ্যা', key: 'n', width: 12 },
        { header: 'শিক্ষক', key: 'teachers', width: 10 },
        ...(guardian.g2.round
          ? [
              { header: 'অভিভাবক (G2, /১০)', key: 'guardian', width: 18 },
              { header: 'পার্থক্য (অভিভাবক − শিক্ষক, পয়েন্ট ০–১০০)', key: 'gap', width: 26 },
              { header: 'অভিভাবকের ফর্ম', key: 'form', width: 16 },
            ]
          : []),
        { header: 'ফ্ল্যাগ', key: 'flags', width: 40 },
      ],
      rows: rows.map((r) => ({ ...r, mean: round1(r.mean), guardian: round1(r.guardian), gap: r.gap === null ? null : Math.round(r.gap), form: FORM_LABEL[r.form], flags: r.flags.map((f) => f.label).join('; ') })),
    },
    {
      name: 'ক্ষেত্র',
      columns: [
        { header: 'ক্ষেত্র', key: 'name', width: 28 },
        { header: 'শিক্ষকদের ক্লাস গড় (/১০)', key: 'mean', width: 22 },
        { header: 'শিক্ষার্থী (শিক্ষক)', key: 'students', width: 16 },
        { header: 'অভিভাবকদের ক্লাস গড় (/১০)', key: 'guardian', width: 24 },
        { header: 'শিক্ষার্থী (অভিভাবক)', key: 'guardianStudents', width: 18 },
      ],
      rows: guardian.areas.map((g) => {
        const t = teacherAreas.get(g.areaKey);
        return {
          name: g.name,
          mean: round1(t?.mean ?? null),
          students: t?.students ?? 0,
          guardian: round1(g.mean),
          guardianStudents: g.students,
        };
      }),
    },
    ...(g2
      ? [
          {
            name: 'অভিভাবকের উত্তর (G2)',
            columns: [
              { header: 'প্রশ্ন', key: 'question', width: 44 },
              { header: 'উত্তর', key: 'answer', width: 28 },
              { header: 'মার্ক', key: 'mark', width: 8 },
              { header: 'শিক্ষার্থী', key: 'count', width: 10 },
            ],
            rows: answers,
          },
        ]
      : []),
  ]);
}

export async function studentWorkbook(round: Round, erpId: string): Promise<Book | null> {
  const [report, rounds] = await Promise.all([studentReport(round, erpId), allReportRounds()]);
  if (!report) return null;
  const guardian = await studentGuardian(round, rounds, erpId, report.student, { verifiedOnly: false });
  return book(`${report.student.name} - ${round.label}.xlsx`, [
    {
      name: 'বিষয় × প্রশ্ন',
      columns: [
        { header: 'বিষয়', key: 'subject', width: 16 },
        { header: 'শিক্ষক', key: 'teacher', width: 24 },
        ...report.questions.map((q) => ({ header: `${q.n}. ${q.label}`, key: `q${q.n}`, width: 14 })),
      ],
      rows: report.grid.map((g) => ({ subject: g.subject, teacher: g.teacher, ...Object.fromEntries(report.questions.map((q, i) => [`q${q.n}`, g.marks?.[i] ?? null])) })),
    },
    {
      name: 'ক্ষেত্র',
      columns: [
        { header: 'ক্ষেত্র', key: 'name', width: 28 },
        { header: 'শিক্ষকদের গড় (/১০)', key: 'mean', width: 18 },
        { header: 'ক্লাসের গড় (/১০)', key: 'classMean', width: 18 },
        { header: 'মার্ক সংখ্যা', key: 'n', width: 12 },
      ],
      rows: report.areas.map((a) => ({ ...a, mean: round1(a.mean), classMean: round1(a.classMean) })),
    },
    {
      name: 'নোট',
      columns: [
        { header: 'শিক্ষক', key: 'teacherName', width: 24 },
        { header: 'বিষয়', key: 'subjectName', width: 16 },
        { header: 'সময়', key: 'when', width: 18 },
        { header: 'নোট', key: 'note', width: 80 },
      ],
      rows: report.notes.map((n) => ({ ...n, when: n.submittedAt ? formatSheetTime(n.submittedAt) : '' })),
    },
    {
      name: 'অভিভাবকের উত্তর',
      columns: [
        { header: 'প্রশ্ন', key: 'label', width: 40 },
        { header: 'উত্তর', key: 'answer', width: 28 },
        { header: 'মার্ক', key: 'mark', width: 10 },
      ],
      rows: [
        ...guardian.answers,
        ...(guardian.form
          ? [{ label: 'জমা দিয়েছেন', answer: `${guardian.form.who}${guardian.form.relation ? ` (${guardian.form.relation})` : ''} · ${guardian.form.verified ? 'যাচাইকৃত' : 'অযাচাইকৃত'}`, mark: null }]
          : []),
        ...(guardian.form?.comment ? [{ label: 'মন্তব্য', answer: guardian.form.comment, mark: null }] : []),
      ],
    },
  ]);
}

export async function ratersWorkbook(round: Round): Promise<Book> {
  const rows = await raterReport(round);
  const marks = round.snapshot.template.scale;
  return book(`শিক্ষকদের রেটিং প্যাটার্ন - ${round.label}.xlsx`, [
    {
      name: 'শিক্ষক',
      columns: [
        { header: 'শিক্ষক', key: 'name', width: 26 },
        { header: 'ব্যাচ', key: 'batches', width: 8 },
        { header: 'শিক্ষার্থী', key: 'students', width: 10 },
        { header: 'গড় মার্ক', key: 'mean', width: 10 },
        ...marks.map((m) => ({ header: `${m} মার্ক (সংখ্যা)`, key: `m${m}`, width: 14 })),
        { header: 'সহকর্মীদের তুলনায় (মার্ক)', key: 'leniency', width: 22 },
        { header: 'তুলনার শিক্ষার্থী', key: 'paired', width: 16 },
        { header: 'একই মার্কের ব্যাচ', key: 'flat', width: 40 },
      ],
      rows: rows.map((r) => ({
        name: r.name,
        batches: r.batches,
        students: r.students,
        mean: round1(r.mean),
        ...Object.fromEntries(r.distribution.map((d) => [`m${d.mark}`, d.count])),
        leniency: r.leniency ? round1(r.leniency.delta) : null,
        paired: r.leniency?.pairedStudents ?? null,
        flat: r.flatBatches.map((b) => b.label).join('; '),
      })),
    },
  ]);
}

export async function trackerWorkbook(roundId: string): Promise<Book | null> {
  const data = await loadTracker(roundId);
  if (!data) return null;
  const LABEL = { done: 'জমা', draft: 'খসড়া', dup: 'ডুপ্লিকেট', todo: 'বাকি', na: '' } as const;
  return book(`রেসপন্স ট্র্যাকার - ${data.round.label}.xlsx`, [
    {
      name: 'কভারেজ',
      columns: [{ header: 'শ্রেণি', key: 'label', width: 16 }, ...data.coverage.subjects.map((s) => ({ header: s.name, key: s.key, width: 22 }))],
      rows: data.coverage.rows.map((r) => ({
        label: r.label,
        ...Object.fromEntries(r.cells.map((c) => [c.subjectKey, c.state === 'na' ? '' : `${LABEL[c.state]}${c.teachers.length ? ` · ${c.teachers.join(', ')}` : ''}`])),
      })),
    },
    {
      name: 'খসড়া',
      columns: [
        { header: 'ক্লাস ও বিষয়', key: 'title', width: 24 },
        { header: 'শিক্ষক', key: 'teacherName', width: 24 },
        { header: 'সম্পন্ন', key: 'done', width: 10 },
        { header: 'মোট', key: 'total', width: 8 },
        { header: 'শেষ সম্পাদনা', key: 'when', width: 18 },
        { header: 'ডিভাইস', key: 'device', width: 20 },
      ],
      rows: data.drafts.map((d) => ({ ...d, when: formatSheetTime(d.updatedAt) })),
    },
  ]);
}

export async function guardianTrackerWorkbook(roundId: string): Promise<Book | null> {
  const data = await loadGuardianTracker(roundId);
  if (!data) return null;
  const who = (f: { who: string; relation: string }) => `${f.who} (${f.relation})`;
  return book(`অভিভাবক ট্র্যাকার - ${data.round.label}.xlsx`, [
    {
      name: 'বাকি',
      columns: [
        { header: 'শ্রেণি', key: 'place', width: 16 },
        { header: 'রোল', key: 'roll', width: 8 },
        { header: 'শিক্ষার্থী ID', key: 'erpId', width: 14 },
        { header: 'শিক্ষার্থী', key: 'name', width: 28 },
        { header: 'বাবার মোবাইল', key: 'father', width: 18 },
        { header: 'মায়ের মোবাইল', key: 'mother', width: 18 },
      ],
      rows: data.places.flatMap((p) =>
        p.pending.map((c) => ({ place: p.label, roll: c.roll, erpId: c.erpId, name: c.name, father: displayMobile(c.fatherMobile, false), mother: displayMobile(c.motherMobile, false) }))
      ),
    },
    {
      name: 'অযাচাইকৃত',
      columns: [
        { header: 'শ্রেণি', key: 'place', width: 16 },
        { header: 'শিক্ষার্থী', key: 'name', width: 28 },
        { header: 'প্রদানকারী', key: 'who', width: 28 },
        { header: 'মোবাইল', key: 'mobile', width: 18 },
        { header: 'জমার সময়', key: 'when', width: 18 },
      ],
      rows: data.unverified.map((f) => ({ place: f.place, name: f.child.name, who: who(f), mobile: displayMobile(f.mobile, false), when: formatSheetTime(f.submittedAt) })),
    },
    {
      name: 'একাধিক জমা',
      columns: [
        { header: 'শ্রেণি', key: 'place', width: 16 },
        { header: 'শিক্ষার্থী', key: 'name', width: 28 },
        { header: 'অবস্থা', key: 'status', width: 10 },
        { header: 'প্রদানকারী', key: 'who', width: 28 },
        { header: 'মোবাইল', key: 'mobile', width: 16 },
        { header: 'যাচাই', key: 'verified', width: 12 },
        { header: 'জমার সময়', key: 'when', width: 18 },
      ],
      rows: data.multiple.flatMap((m) =>
        m.forms.map((f) => ({ place: m.place, name: m.child.name, status: f.current ? 'গণ্য' : 'আগের', who: who(f), mobile: displayMobile(f.mobile, false), verified: f.verified ? 'যাচাইকৃত' : 'অযাচাইকৃত', when: formatSheetTime(f.submittedAt) }))
      ),
    },
  ]);
}

/** R2 heatmap as a table: mean, respondents and share of ১০ per class × subject; hidden below 3. */
export async function teachingWorkbook(roundId: string, compareId: string | null, areaKey: string | undefined, verifiedOnly: boolean): Promise<Book | null> {
  const rounds = await allReportRounds();
  const g1 = rounds.find((r) => r.id === roundId && r.kind === 'G1');
  if (!g1) return null;
  const compare = compareId === 'none' ? undefined : (rounds.find((r) => r.id === compareId && r.kind === 'G1' && r.opensAt < g1.opensAt) ?? previousRound(rounds, g1));
  const report = await teachingQuality(g1, compare, { verifiedOnly, areaKey });
  const rows = report.rows.flatMap((row) =>
    row.cells
      .filter((cell): cell is NonNullable<typeof cell> => cell !== null)
      .map((cell) => ({
        place: row.label,
        subject: report.subjects.find((s) => s.key === cell.subjectKey)?.name ?? cell.subjectKey,
        mean: cell.reliable ? round1(cell.mean) : null,
        respondents: cell.respondents,
        top: cell.reliable && cell.topShare !== null ? Math.round(cell.topShare * 100) : null,
        delta: cell.reliable ? cell.delta : null,
      }))
  );
  return book(`শিক্ষার মান - ${g1.label}.xlsx`, [
    {
      name: 'শ্রেণি × বিষয়',
      columns: [
        { header: 'শ্রেণি', key: 'place', width: 16 },
        { header: 'বিষয়', key: 'subject', width: 22 },
        { header: 'গড় মার্ক', key: 'mean', width: 10 },
        { header: 'উত্তরদাতা', key: 'respondents', width: 11 },
        { header: '১০ (%)', key: 'top', width: 9 },
        { header: compare ? `পরিবর্তন (${compare.label})` : 'পরিবর্তন', key: 'delta', width: 22 },
      ],
      rows,
    },
    { name: 'ক্ষেত্র', columns: [{ header: 'ক্ষেত্র', key: 'name', width: 26 }, { header: 'গড় মার্ক', key: 'mean', width: 10 }], rows: report.areas.map((a) => ({ name: a.name, mean: round1(a.mean) })) },
  ]);
}
