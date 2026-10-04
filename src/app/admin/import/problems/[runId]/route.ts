import { NextResponse } from 'next/server';
import { assertAdmin } from '@/lib/survey/admin-auth';
import { problemsWorkbook } from '@/lib/survey/erp-import-server';

// Excel list of skipped and altered rows from an import run (dry run or applied).
export async function GET(_request: Request, { params }: { params: Promise<{ runId: string }> }) {
  try {
    await assertAdmin();
  } catch {
    return new NextResponse('Authentication required', { status: 401 });
  }
  const runId = Number((await params).runId);
  const file = Number.isInteger(runId) && runId > 0 ? await problemsWorkbook(runId) : null;
  if (!file) return new NextResponse('Not found', { status: 404 });
  return new NextResponse(file.buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(file.fileName)}`,
      'Cache-Control': 'no-store',
    },
  });
}
