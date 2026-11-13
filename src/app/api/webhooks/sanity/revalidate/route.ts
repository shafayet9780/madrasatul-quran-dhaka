import { isValidSignature, SIGNATURE_HEADER_NAME } from '@sanity/webhook'
import { revalidateTag } from 'next/cache'
import { NextRequest, NextResponse } from 'next/server'
import { SANITY_TAG } from '@/lib/sanity-fetch'

/**
 * Sanity webhook: a publish refreshes the site's content at once (every published fetch carries SANITY_TAG), so the
 * pages can keep their content for an hour otherwise. Set up in docs/vercel-usage.md.
 */
export async function POST(request: NextRequest) {
  const secret = process.env.SANITY_REVALIDATE_WEBHOOK_SECRET
  if (!secret) {
    return NextResponse.json({ error: 'Webhook is not configured' }, { status: 503 })
  }

  const rawBody = await request.text()
  const signature = request.headers.get(SIGNATURE_HEADER_NAME)
  if (!(await isValidSignature(rawBody, signature || '', secret))) {
    return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 401 })
  }

  // Expired now, not served stale once more: the editor sees the change on the next visit.
  revalidateTag(SANITY_TAG, { expire: 0 })
  return NextResponse.json({ ok: true })
}
