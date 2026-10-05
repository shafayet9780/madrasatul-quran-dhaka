import { NextResponse, type NextRequest } from 'next/server';
import { assertAdmin } from '@/lib/survey/admin-auth';
import { classWorkbook, ratersWorkbook, studentWorkbook, trackerWorkbook } from '@/lib/survey/report-excel';
import { pickRound, t1Rounds } from '@/lib/survey/reports';

// Excel downloads for the report tables (admin only: under /admin and checked here).
export async function GET(request: NextRequest) {
  try {
    await assertAdmin();
  } catch {
    return new NextResponse('Authentication required', { status: 401 });
  }
  const q = request.nextUrl.searchParams;
  const rounds = await t1Rounds();
  const round = pickRound(rounds, q.get('round') ?? undefined);
  if (!round || round.id !== q.get('round')) return new NextResponse('Not found', { status: 404 });

  const kind = q.get('kind');
  const file =
    kind === 'class'
      ? await classWorkbook(round, q.get('class') ?? '', q.get('section') ?? '')
      : kind === 'student'
        ? await studentWorkbook(round, q.get('student') ?? '')
        : kind === 'raters'
          ? await ratersWorkbook(round)
          : kind === 'tracker'
            ? await trackerWorkbook(round.id)
            : null;
  if (!file) return new NextResponse('Not found', { status: 404 });
  return new NextResponse(file.buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(file.fileName)}`,
      'Cache-Control': 'no-store',
    },
  });
}
