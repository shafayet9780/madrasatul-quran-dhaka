import { NextResponse } from 'next/server';
import { localOverrides } from '@/lib/admissions/local';

/** Local preview only: the emails that would have been sent (newest first). 404 everywhere else. */
export async function GET() {
  const outbox = localOverrides()?.outbox;
  if (!outbox) return new NextResponse('Not found', { status: 404 });
  return NextResponse.json(
    [...outbox].reverse().map((m) => ({ to: m.to, subject: m.subject, text: m.text, attachments: m.attachments?.map((a) => ({ filename: a.filename, bytes: a.content.length })) ?? [] })),
  );
}
