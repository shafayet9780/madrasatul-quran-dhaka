import { NextResponse } from 'next/server';
import { and, asc, eq, isNotNull } from 'drizzle-orm';
import ExcelJS from 'exceljs';
import { adminCycle } from '@/lib/admissions/admin';
import { getAdmissionsDb } from '@/lib/admissions/db';
import { exportHeader, exportRow, type ExportPayment } from '@/lib/admissions/export-rows';
import { applications, payments } from '@/lib/admissions/schema';
import { assertAdmin } from '@/lib/survey/admin-auth';

export const runtime = 'nodejs';

/** Every paid application of the current session, one column per form field (for the ERP import). */
export async function GET() {
  try {
    await assertAdmin();
  } catch {
    return new NextResponse('Authentication required', { status: 401 });
  }
  const cycle = await adminCycle();
  if (!cycle) return new NextResponse('Not found', { status: 404 });
  const db = getAdmissionsDb();
  const [rows, paid] = await Promise.all([
    db
      .select()
      .from(applications)
      .where(and(eq(applications.cycleId, cycle.cycleId), isNotNull(applications.publicRef)))
      .orderBy(asc(applications.classCode), asc(applications.serial)),
    db
      .select({ applicationId: payments.applicationId, amount: payments.amount, tranId: payments.tranId, bankTranId: payments.bankTranId, cardType: payments.cardType })
      .from(payments)
      .innerJoin(applications, eq(applications.id, payments.applicationId))
      .where(and(eq(applications.cycleId, cycle.cycleId), eq(payments.status, 'valid')))
      .orderBy(asc(payments.completedAt)),
  ]);
  const byApp = new Map<string, ExportPayment>();
  for (const p of paid) if (!byApp.has(p.applicationId)) byApp.set(p.applicationId, p);

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('আবেদন');
  const header = exportHeader(cycle.snapshot);
  sheet.addRow(header);
  sheet.getRow(1).font = { bold: true };
  sheet.views = [{ state: 'frozen', ySplit: 1, xSplit: 1 }];
  header.forEach((h, i) => (sheet.getColumn(i + 1).width = Math.min(40, Math.max(12, h.length + 4))));
  for (const app of rows) sheet.addRow(exportRow(cycle.snapshot, app, byApp.get(app.id) ?? null));
  const buffer = await workbook.xlsx.writeBuffer();
  const name = `pre-admission-${cycle.session}-${new Date().toISOString().slice(0, 10)}.xlsx`;
  return new NextResponse(buffer as ArrayBuffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${name}"`,
      'Cache-Control': 'private, no-store',
    },
  });
}
