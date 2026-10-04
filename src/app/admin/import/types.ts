import type { ImportProblem } from '@/lib/survey/erp-import';

export type ImportPreview = {
  runId: number;
  fileName: string;
  /** The .xlsx sheet that was read. */
  sheetName?: string;
  rowCount: number;
  columns: string[];
  ignoredColumns: string[];
  counts: { adds: number; updates: number; unchanged: number; deactivations: number; problems: number; skipped: number };
  problems: ImportProblem[];
  mapping: { erp: string; label: string | null; count: number }[];
  addNames: string[];
  updateSummary: string;
  deactivationNames: string[];
  /** More than a fifth of active students would become inactive: probably a partial file. */
  largeDeactivation: boolean;
};

export type PreviewResult = { ok: true; preview: ImportPreview } | { ok: false; error: string };
export type ApplyResult = { ok: true; message: string } | { ok: false; error: string };
