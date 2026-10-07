import { NextResponse, type NextRequest } from 'next/server';
import { getByToken } from '@/lib/admissions/drafts';
import { asLocale } from '@/lib/admissions/display';
import { flowPath } from '@/lib/admissions/pages';
import { setSessionToken } from '@/lib/admissions/session';
import { cleanToken } from '@/lib/admissions/tokens';

/** Resume link (emailed, copied from the hub): remembers the application on this device. */
export async function GET(request: NextRequest, { params }: { params: Promise<{ locale: string }> }) {
  const locale = asLocale((await params).locale);
  const token = cleanToken(request.nextUrl.searchParams.get('t'));
  const app = token ? await getByToken(token).catch(() => null) : null;
  if (!token || !app) return NextResponse.redirect(new URL(flowPath(locale, '/find?link=invalid'), request.url));
  await setSessionToken(token);
  const paid = app.status !== 'draft' && app.status !== 'unpaid';
  const response = NextResponse.redirect(new URL(flowPath(locale, paid ? '/status' : '/form'), request.url));
  response.headers.set('Referrer-Policy', 'no-referrer');
  return response;
}
