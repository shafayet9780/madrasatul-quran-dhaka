import 'server-only';
import ExcelJS from 'exceljs';
import { readUpload } from './erp-file';
import { and, desc, eq, lt, notInArray, sql } from 'drizzle-orm';
import { getDb } from './db';
import { planImport, readTable, type ImportPlan } from './erp-import';
import { fetchClassMappings } from './sanity-source';
import { importRuns, students } from './schema';

/** More than a fifth of active students would become inactive: probably a partial list. */
export function isLargeDeactivation(plan: ImportPlan) {
  return plan.activeBefore > 0 && plan.deactivations.length / plan.activeBefore > 0.2;
}

async function buildPlan(file: File): Promise<{ plan: ImportPlan; sheetName?: string } | { error: string }> {
  const upload = await readUpload(file);
  if ('error' in upload) return upload;
  const read = readTable(upload.table);
  if ('error' in read) return read;
  const [classes, existing] = await Promise.all([
    fetchClassMappings(),
    getDb()
      .select({
        erpId: students.erpId,
        name: students.name,
        classKey: students.classKey,
        sectionKey: students.sectionKey,
        roll: students.roll,
        fatherName: students.fatherName,
        fatherMobile: students.fatherMobile,
        motherMobile: students.motherMobile,
        active: students.active,
      })
      .from(students),
  ]);
  return { plan: planImport(read, classes, existing), sheetName: upload.sheetName };
}

function summary(plan: ImportPlan) {
  return {
    rows: plan.rowCount,
    adds: plan.adds.length,
    updates: plan.updates.length,
    unchanged: plan.unchanged,
    deactivations: plan.deactivations.length,
    skipped: plan.problems.filter((p) => p.outcome === 'skipped').length,
    altered: plan.problems.filter((p) => p.outcome === 'altered').length,
  };
}

/** Dry run: plans the import and records it so the problem list can be downloaded. */
export async function previewImport(file: File): Promise<{ plan: ImportPlan; runId: number; sheetName?: string } | { error: string }> {
  const result = await buildPlan(file);
  if ('error' in result) return result;
  const [run] = await getDb()
    .insert(importRuns)
    .values({ fileName: file.name, status: 'dry_run', summary: summary(result.plan), problems: result.plan.problems })
    .returning({ id: importRuns.id });
  return { plan: result.plan, runId: run.id, sheetName: result.sheetName };
}

/**
 * Re-plans from the same file and applies it in one transaction, but only if the result still
 * matches the dry run the admin reviewed, and a large deactivation was explicitly confirmed.
 */
export async function applyImport(
  file: File,
  { previewRunId, confirmDeactivations }: { previewRunId: number; confirmDeactivations: boolean }
): Promise<{ ok: true; runId: number; summary: ReturnType<typeof summary> } | { ok: false; error: string }> {
  const result = await buildPlan(file);
  if ('error' in result) return { ok: false, error: result.error };
  const { plan } = result;
  if (!plan.students.length) return { ok: false, error: 'ফাইলে ইমপোর্ট করার মতো কোনো সারি নেই।' };
  const [preview] = await getDb()
    .select({ summary: importRuns.summary, status: importRuns.status })
    .from(importRuns)
    .where(eq(importRuns.id, previewRunId))
    .limit(1);
  // jsonb does not keep key order, so compare field by field.
  const current = summary(plan);
  const same = preview && Object.entries(current).every(([key, value]) => preview.summary[key] === value);
  if (!preview || preview.status !== 'dry_run' || !same) {
    return { ok: false, error: 'যাচাইয়ের পর ফাইল, শিক্ষার্থী তালিকা বা Studio-র শ্রেণি ম্যাপিং বদলেছে। আবার যাচাই করুন।' };
  }
  if (isLargeDeactivation(plan) && !confirmDeactivations) {
    return { ok: false, error: 'অনেক শিক্ষার্থী নিষ্ক্রিয় হবে; নিশ্চিত করার ঘরে টিক দিন।' };
  }
  const db = getDb();
  const appliedAt = new Date();
  const runSummary = current;
  const [, , run] = await db.batch([
    db
      .insert(students)
      .values(plan.students.map((s) => ({ ...s, active: true, updatedAt: appliedAt })))
      .onConflictDoUpdate({
        target: students.erpId,
        set: {
          name: sql`excluded.name`,
          classKey: sql`excluded.class_key`,
          sectionKey: sql`excluded.section_key`,
          roll: sql`excluded.roll`,
          fatherName: sql`excluded.father_name`,
          fatherMobile: sql`excluded.father_mobile`,
          motherMobile: sql`excluded.mother_mobile`,
          active: true,
          updatedAt: appliedAt,
        },
      }),
    db
      .update(students)
      .set({ active: false, updatedAt: appliedAt })
      .where(and(eq(students.active, true), notInArray(students.erpId, plan.fileIds))),
    db
      .insert(importRuns)
      .values({ fileName: file.name, status: 'applied', summary: runSummary, problems: plan.problems, appliedAt })
      .returning({ id: importRuns.id }),
  ]);
  return { ok: true, runId: run[0].id, summary: runSummary };
}

export async function lastAppliedImport() {
  const [run] = await getDb()
    .select({ appliedAt: importRuns.appliedAt, fileName: importRuns.fileName, summary: importRuns.summary })
    .from(importRuns)
    .where(eq(importRuns.status, 'applied'))
    .orderBy(desc(importRuns.appliedAt))
    .limit(1);
  return run ?? null;
}

/** The skipped and altered rows of an import run as an Excel file. */
export async function problemsWorkbook(runId: number): Promise<{ fileName: string; buffer: ArrayBuffer } | null> {
  const [run] = await getDb().select().from(importRuns).where(eq(importRuns.id, runId)).limit(1);
  if (!run) return null;
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('সমস্যা');
  sheet.columns = [
    { header: 'সারি', key: 'line', width: 8 },
    { header: 'ID', key: 'id', width: 14 },
    { header: 'নাম', key: 'name', width: 28 },
    { header: 'সমস্যা', key: 'issue', width: 50 },
    { header: 'কী হবে / করণীয়', key: 'action', width: 50 },
    { header: 'ফলাফল', key: 'outcome', width: 16 },
  ];
  sheet.getRow(1).font = { bold: true };
  for (const problem of run.problems as ImportPlan['problems']) {
    sheet.addRow({ ...problem, outcome: problem.outcome === 'skipped' ? 'বাদ' : 'নম্বর/রোল ছাড়া' });
  }
  const buffer = await workbook.xlsx.writeBuffer();
  const stem = run.fileName.replace(/\.[^.]+$/, '');
  return { fileName: `${stem}-problems.xlsx`, buffer: buffer as ArrayBuffer };
}

/** Dry runs are only needed for the preview's Excel link; the daily job drops those older than a day. */
export async function pruneDryRuns(now = new Date()) {
  const removed = await getDb()
    .delete(importRuns)
    .where(and(eq(importRuns.status, 'dry_run'), lt(importRuns.createdAt, new Date(now.getTime() - 24 * 60 * 60 * 1000))))
    .returning({ id: importRuns.id });
  return removed.length;
}
