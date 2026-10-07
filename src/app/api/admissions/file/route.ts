import type { NextRequest } from 'next/server';
import { ownsFile } from '@/lib/admissions/drafts';
import { currentApplication } from '@/lib/admissions/session';
import { blobStore } from '@/lib/admissions/uploads';

/** A document of this device's own application (photo previews on the chapter and review pages). */
export async function GET(request: NextRequest) {
  const key = request.nextUrl.searchParams.get('key') ?? '';
  const current = await currentApplication();
  const owned = current && Object.values(current.app.answers).some((v) => typeof v === 'object' && !Array.isArray(v) && v.key === key);
  if (!current || !owned || !ownsFile(current.app.id)({ key, name: '', size: 0, type: '' })) return new Response('Not found', { status: 404 });
  const file = await blobStore().get(key);
  if (!file) return new Response('Not found', { status: 404 });
  return new Response(file.stream, {
    headers: { 'Content-Type': file.contentType, 'Cache-Control': 'private, max-age=3600', 'X-Content-Type-Options': 'nosniff' },
  });
}
