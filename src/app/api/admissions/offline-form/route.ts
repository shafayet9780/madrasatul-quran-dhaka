import { NextResponse, type NextRequest } from 'next/server';
import { getCurrentCycle } from '@/lib/admissions/cycle';
import { ensureOfflinePdf } from '@/lib/admissions/pdf';
import { siteOrigin } from '@/lib/admissions/session';

export const runtime = 'nodejs';
export const maxDuration = 60;

/**
 * The printable offline form for the current form version (made on the first download, then
 * stored). Public: linked from the pre-admission intro page and from admin for printing copies.
 */
export async function GET(request: NextRequest) {
  try {
    const cycle = await getCurrentCycle();
    if (!cycle) return NextResponse.redirect(new URL('/bengali/pre-admission', request.url));
    const { name, bytes } = await ensureOfflinePdf(cycle, await siteOrigin());
    const inline = request.nextUrl.searchParams.get('view') === '1';
    return new NextResponse(Buffer.from(bytes), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `${inline ? 'inline' : 'attachment'}; filename="${name}"`,
        'Cache-Control': 'public, max-age=300',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (e) {
    console.error('Admissions: offline form failed', e);
    return new NextResponse('The offline form could not be made right now. Please try again in a minute.', { status: 503 });
  }
}
