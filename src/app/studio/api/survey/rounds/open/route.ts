import { NextRequest, NextResponse } from 'next/server'
import { isAuthorizedStudioAdminRequest } from '@/lib/studio-auth'
import { openRound, surveyPath } from '@/lib/survey/rounds'

// Studio "Open round" action. dryRun validates and returns the summary without opening.
export async function POST(request: NextRequest) {
  if (!isAuthorizedStudioAdminRequest(request)) {
    return NextResponse.json({ error: 'Studio authorization required' }, { status: 401 })
  }

  let input: { sanityRoundId?: unknown; dryRun?: unknown }
  try {
    input = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
  if (typeof input.sanityRoundId !== 'string' || !input.sanityRoundId || input.sanityRoundId.startsWith('drafts.')) {
    return NextResponse.json({ error: 'A published round is required' }, { status: 400 })
  }

  const result = await openRound(input.sanityRoundId, { dryRun: input.dryRun === true })
  if (!result.ok) return NextResponse.json(result, { status: 422 })
  const { linkKey, ...rest } = result
  const url = linkKey ? new URL(surveyPath(result.slug, linkKey), request.nextUrl.origin).toString() : undefined
  return NextResponse.json({ ...rest, url })
}
