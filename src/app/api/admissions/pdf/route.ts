import { NextResponse, type NextRequest } from 'next/server';
import { ensureApplicationPdf, pdfFileName, readStoredPdf } from '@/lib/admissions/pdf';
import { currentApplication, siteOrigin } from '@/lib/admissions/session';

export const runtime = 'nodejs';
export const maxDuration = 60;

/** The application PDF of this device's paid application (made on first request, then stored). */
export async function GET(request: NextRequest) {
  const current = await currentApplication();
  if (!current?.app.publicRef) return NextResponse.redirect(new URL('/bengali/pre-admission', request.url));
  try {
    const { key, bytes } = await ensureApplicationPdf(current.app, current.snapshot, await siteOrigin());
    const pdf = bytes ?? (await readStoredPdf(key));
    if (!pdf) return new NextResponse('Not found', { status: 404 });
    const inline = request.nextUrl.searchParams.get('view') === '1';
    return new NextResponse(Buffer.from(pdf), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `${inline ? 'inline' : 'attachment'}; filename="${pdfFileName(current.app.publicRef)}"`,
        'Cache-Control': 'private, no-store',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (e) {
    console.error('Admissions: PDF failed', e);
    return new NextResponse('The application PDF could not be made right now. Please try again in a minute.', { status: 503 });
  }
}
