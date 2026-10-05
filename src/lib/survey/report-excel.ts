import 'server-only';
import ExcelJS from 'exceljs';
import { formatSheetTime } from './dates';
import { classReport, raterReport, studentReport } from './reports';
import { loadTracker } from './tracker';
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

export async function classWorkbook(round: Round, classKey: string, sectionKey: string): Promise<Book | null> {
  const report = await classReport(round, classKey, sectionKey);
  if (!report) return null;
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
        { header: 'ফ্ল্যাগ', key: 'flags', width: 40 },
      ],
      rows: report.rows.map((r) => ({ ...r, mean: round1(r.mean), flags: r.flags.map((f) => f.label).join('; ') })),
    },
    {
      name: 'ক্ষেত্র',
      columns: [
        { header: 'ক্ষেত্র', key: 'name', width: 28 },
        { header: 'ক্লাসের গড় (/১০)', key: 'mean', width: 18 },
        { header: 'শিক্ষার্থী', key: 'students', width: 12 },
        { header: 'যথেষ্ট উত্তর (n≥৩)', key: 'reliable', width: 18 },
      ],
      rows: report.areas.map((a) => ({ ...a, mean: round1(a.mean), reliable: a.reliable ? 'হ্যাঁ' : 'না' })),
    },
  ]);
}

export async function studentWorkbook(round: Round, erpId: string): Promise<Book | null> {
  const report = await studentReport(round, erpId);
  if (!report) return null;
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
