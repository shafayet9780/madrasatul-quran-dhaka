import { NextResponse, type NextRequest } from 'next/server';
import { getCurrentCycle } from '@/lib/admissions/cycle';
import { ensureOfflinePdf } from '@/lib/admissions/pdf';
import { siteOrigin } from '@/lib/admissions/session';
import { assertAdmin } from '@/lib/survey/admin-auth';

export const runtime = 'nodejs';
export const maxDuration = 60;

/**
 * The printable offline form for the current form version (made on the first download, then
 * stored). Staff only: the office prints it for families who apply at the campus, so it sits under
 * /admin (Studio login) and is never linked from the public site.
 */
export async function GET(request: NextRequest) {
  try {
    await assertAdmin();
  } catch {
    return new NextResponse('Authentication required', { status: 401 });
  }
  try {
    const cycle = await getCurrentCycle();
    if (!cycle) return new NextResponse('Not found', { status: 404 });
    const { name, bytes } = await ensureOfflinePdf(cycle, await siteOrigin());
    const inline = request.nextUrl.searchParams.get('view') === '1';
    return new NextResponse(Buffer.from(bytes), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `${inline ? 'inline' : 'attachment'}; filename="${name}"`,
        'Cache-Control': 'private, no-store',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (e) {
    console.error('Admissions: offline form failed', e);
    return new NextResponse('The offline form could not be made right now. Please try again in a minute.', { status: 503 });
  }
}
