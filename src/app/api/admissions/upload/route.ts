import { NextResponse, type NextRequest } from 'next/server';
import { currentApplication, withinLimit } from '@/lib/admissions/session';
import { MAX_BYTES } from '@/lib/admissions/files';
import { uploadDocument } from '@/lib/admissions/uploads';

/** Guardian document upload (multipart: field, file) into the private store, for this device's draft. */
export async function POST(request: NextRequest) {
  if (!(await withinLimit('upload'))) return NextResponse.json({ ok: false, error: 'rate_limited' }, { status: 429 });
  const current = await currentApplication();
  if (!current) return NextResponse.json({ ok: false, error: 'expired' }, { status: 401 });
  if (Number(request.headers.get('content-length') ?? 0) > MAX_BYTES.document + 64 * 1024) {
    return NextResponse.json({ ok: false, error: 'too_large' }, { status: 413 });
  }
  const form = await request.formData().catch(() => null);
  const field = form?.get('field');
  const file = form?.get('file');
  if (typeof field !== 'string' || !(file instanceof File)) return NextResponse.json({ ok: false, error: 'empty' }, { status: 400 });
  try {
    const result = await uploadDocument(current.app, current.snapshot, field, new Uint8Array(await file.arrayBuffer()), file.name);
    if (!result.ok) return NextResponse.json({ ok: false, error: result.error }, { status: result.error === 'locked' ? 409 : 400 });
    return NextResponse.json({ ok: true, file: result.file });
  } catch (e) {
    console.error('Admissions: upload failed', e);
    return NextResponse.json({ ok: false, error: 'failed' }, { status: 500 });
  }
}
