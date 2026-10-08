import { NextResponse, type NextRequest } from 'next/server';
import { eq } from 'drizzle-orm';
import { getAdmissionsDb } from '@/lib/admissions/db';
import { applications } from '@/lib/admissions/schema';
import { blobStore } from '@/lib/admissions/uploads';
import { assertAdmin } from '@/lib/survey/admin-auth';

/** A document of any application, for the office (under /admin, so behind the admin login). */
export async function GET(request: NextRequest) {
  try {
    await assertAdmin();
  } catch {
    return new NextResponse('Authentication required', { status: 401 });
  }
  const id = request.nextUrl.searchParams.get('id') ?? '';
  const key = request.nextUrl.searchParams.get('key') ?? '';
  if (!/^[0-9a-f-]{36}$/i.test(id) || !key.startsWith(`admissions/${id}/`)) return new NextResponse('Not found', { status: 404 });
  const [app] = await getAdmissionsDb().select({ answers: applications.answers }).from(applications).where(eq(applications.id, id));
  const listed = app && Object.values(app.answers).some((v) => typeof v === 'object' && !Array.isArray(v) && v.key === key);
  if (!listed) return new NextResponse('Not found', { status: 404 });
  const file = await blobStore().get(key);
  if (!file) return new NextResponse('Not found', { status: 404 });
  return new NextResponse(file.stream, {
    headers: { 'Content-Type': file.contentType, 'Cache-Control': 'private, max-age=600', 'X-Content-Type-Options': 'nosniff', 'Content-Disposition': 'inline' },
  });
}
