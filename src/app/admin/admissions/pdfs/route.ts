import { NextResponse, type NextRequest } from 'next/server';
import { and, inArray, isNotNull } from 'drizzle-orm';
import { PDFDocument } from 'pdf-lib';
import { loadSnapshot } from '@/lib/admissions/cycle';
import { getAdmissionsDb } from '@/lib/admissions/db';
import { ensureApplicationPdf, readStoredPdf } from '@/lib/admissions/pdf';
import { applications } from '@/lib/admissions/schema';
import { assertAdmin, requestOrigin } from '@/lib/survey/admin-auth';

export const runtime = 'nodejs';
export const maxDuration = 60;

const MAX = 25;
const BUDGET_MS = 45_000;

/**
 * Selected applications' PDFs merged into one file (list order), for printing. PDFs not made yet
 * are made and stored first; when that takes too long, the office is asked to try again, which is
 * then quick because the finished ones are stored.
 */
export async function GET(request: NextRequest) {
  try {
    await assertAdmin();
  } catch {
    return new NextResponse('Authentication required', { status: 401 });
  }
  const ids = (request.nextUrl.searchParams.get('ids') ?? '').split(',').filter((id) => /^[0-9a-f-]{36}$/i.test(id));
  if (!ids.length || ids.length > MAX) return new NextResponse(`Choose 1 to ${MAX} applications.`, { status: 400 });
  const start = Date.now();
  const rows = await getAdmissionsDb()
    .select()
    .from(applications)
    .where(and(inArray(applications.id, ids), isNotNull(applications.publicRef)));
  rows.sort((a, b) => (a.classCode ?? '').localeCompare(b.classCode ?? '') || (a.serial ?? 0) - (b.serial ?? 0));
  const origin = await requestOrigin();
  const merged = await PDFDocument.create();
  try {
    for (const app of rows) {
      if (Date.now() - start > BUDGET_MS) {
        return new NextResponse('Some application PDFs are still being made. Please go back and download again in a minute.', { status: 503, headers: { 'Retry-After': '30' } });
      }
      const snapshot = await loadSnapshot(app.cycleId, app.snapshotVersion);
      if (!snapshot) continue;
      const { key, bytes } = await ensureApplicationPdf(app, snapshot, origin);
      const pdf = bytes ?? (await readStoredPdf(key));
      if (!pdf) continue;
      const doc = await PDFDocument.load(pdf);
      for (const page of await merged.copyPages(doc, doc.getPageIndices())) merged.addPage(page);
    }
  } catch (e) {
    console.error('Admissions: bulk PDF failed', e);
    return new NextResponse('The application PDFs could not be made right now. Please try again in a minute.', { status: 503 });
  }
  if (!merged.getPageCount()) return new NextResponse('Not found', { status: 404 });
  return new NextResponse(Buffer.from(await merged.save()), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="applications-${rows.length}.pdf"`,
      'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
