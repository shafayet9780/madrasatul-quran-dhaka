'use server';

import { revalidatePath } from 'next/cache';
import { titleCase, toBengaliDigits as bn } from '@/lib/survey/normalise';
import { assertAdmin } from '@/lib/survey/admin-auth';
import type { Change, ImportPlan } from '@/lib/survey/erp-import';
import { applyImport, previewImport } from '@/lib/survey/erp-import-server';
import { fetchClassMappings } from '@/lib/survey/sanity-source';
import type { ApplyResult, PreviewResult } from './types';

const CHANGE_WORDS: Record<Change, string> = {
  roll: 'রোল',
  mobile: 'মোবাইল',
  section: 'শাখা',
  class: 'শ্রেণি',
  name: 'নাম',
  father: 'পিতার নাম',
  reactivated: 'আবার সক্রিয়',
};

function fileFrom(form: FormData): File | null {
  const file = form.get('file');
  return file instanceof File && file.size > 0 ? file : null;
}

function updateSummary(plan: ImportPlan): string {
  const counts = new Map<Change, number>();
  for (const update of plan.updates) for (const change of update.changes) counts.set(change, (counts.get(change) ?? 0) + 1);
  return [...counts]
    .map(([change, n]) => (change === 'reactivated' ? `${bn(n)} জন আবার সক্রিয়` : `${bn(n)} জনের ${CHANGE_WORDS[change]}`))
    .join(', ');
}

export async function previewImportAction(form: FormData): Promise<PreviewResult> {
  await assertAdmin();
  const file = fileFrom(form);
  if (!file) return { ok: false, error: 'একটি ফাইল বাছাই করুন।' };
  const [result, classes] = await Promise.all([previewImport(file), fetchClassMappings()]);
  if ('error' in result) return { ok: false, error: result.error };
  const { plan, runId } = result;
  const labelOf = (classKey: string | null, sectionKey: string) => {
    const cls = classes.find((c) => c.key === classKey);
    if (!cls) return null;
    const section = cls.sections.find((s) => s.key === sectionKey);
    return section ? `${cls.name} ${section.name}` : cls.name;
  };
  return {
    ok: true,
    preview: {
      runId,
      fileName: file.name,
      rowCount: plan.rowCount,
      columns: plan.columns,
      ignoredColumns: plan.ignoredColumns,
      counts: {
        adds: plan.adds.length,
        updates: plan.updates.length,
        unchanged: plan.unchanged,
        deactivations: plan.deactivations.length,
        problems: plan.problems.length,
        skipped: plan.problems.filter((p) => p.outcome === 'skipped').length,
      },
      problems: plan.problems.map((p) => ({ ...p, name: titleCase(p.name) })),
      mapping: plan.mapping.map((m) => ({ erp: m.erp, label: labelOf(m.classKey, m.sectionKey), count: m.count })),
      addNames: plan.adds.map((s) => `${titleCase(s.name)} (${labelOf(s.classKey, s.sectionKey) ?? s.classKey})`),
      updateSummary: updateSummary(plan),
      deactivationNames: plan.deactivations.map((s) => `${titleCase(s.name)} (${labelOf(s.classKey, s.sectionKey) ?? s.classKey})`),
      largeDeactivation: plan.activeBefore > 0 && plan.deactivations.length / plan.activeBefore > 0.2,
    },
  };
}

export async function applyImportAction(form: FormData): Promise<ApplyResult> {
  await assertAdmin();
  const file = fileFrom(form);
  if (!file) return { ok: false, error: 'একটি ফাইল বাছাই করুন।' };
  const result = await applyImport(file);
  if (!result.ok) return result;
  revalidatePath('/admin/import');
  const s = result.summary;
  return {
    ok: true,
    message: `ইমপোর্ট সম্পন্ন: ${bn(s.adds)} জন নতুন, ${bn(s.updates)} জন হালনাগাদ, ${bn(s.deactivations)} জন নিষ্ক্রিয়, ${bn(s.skipped)}টি সারি বাদ।`,
  };
}
