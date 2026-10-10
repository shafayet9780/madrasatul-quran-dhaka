import { NextResponse, type NextRequest } from 'next/server';
import { localOverrides } from '@/lib/admissions/local';
import { loadSurveyFixtures } from '@/lib/survey/testing/dev-fixtures';

/** Local preview only: reloads the sample survey data (?mode=remove|rate-limits). 404 everywhere else. */
export async function POST(request: NextRequest) {
  if (!localOverrides()?.surveyDb) return new NextResponse('Not found', { status: 404 });
  const mode = request.nextUrl.searchParams.get('mode');
  return NextResponse.json({ done: await loadSurveyFixtures(mode === 'remove' || mode === 'rate-limits' ? mode : 'load') });
}
