import { NextResponse, type NextRequest } from 'next/server';
import { loadById } from '@/lib/admissions/drafts';
import { ensureApplicationPdf, pdfFileName, readStoredPdf } from '@/lib/admissions/pdf';
import { assertAdmin, requestOrigin } from '@/lib/survey/admin-auth';

export const runtime = 'nodejs';
export const maxDuration = 60;

/** The application PDF of a paid application, for the office. */
export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await assertAdmin();
  } catch {
    return new NextResponse('Authentication required', { status: 401 });
  }
  const { id } = await params;
  const found = /^[0-9a-f-]{36}$/i.test(id) ? await loadById(id) : null;
  if (!found?.app.publicRef) return new NextResponse('Not found', { status: 404 });
  try {
    const { key, bytes } = await ensureApplicationPdf(found.app, found.snapshot, await requestOrigin());
    const pdf = bytes ?? (await readStoredPdf(key));
    if (!pdf) return new NextResponse('Not found', { status: 404 });
    return new NextResponse(Buffer.from(pdf), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${pdfFileName(found.app)}"`,
        'Cache-Control': 'private, no-store',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (e) {
    console.error('Admissions: admin PDF failed', e);
    return new NextResponse('The application PDF could not be made right now. Please try again in a minute.', { status: 503 });
  }
}
