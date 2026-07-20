import { del } from '@vercel/blob'
import { isValidSignature, SIGNATURE_HEADER_NAME } from '@sanity/webhook'
import { revalidateTag } from 'next/cache'
import { NextRequest, NextResponse } from 'next/server'
import {
  deleteUnreferencedBlobs,
  replacedBlobPathnames,
} from '@/lib/downloads/cleanup'
import type { VercelBlobFile } from '@/lib/downloads/types'
import { getPublishedBlobReferences } from '@/lib/queries/downloads'

interface DownloadWebhookPayload {
  afterId?: string | null
  beforeFiles?: Array<VercelBlobFile | null>
  afterFiles?: Array<VercelBlobFile | null>
}

export async function POST(request: NextRequest) {
  const secret = process.env.SANITY_DOWNLOADS_WEBHOOK_SECRET
  if (!secret) {
    return NextResponse.json({ error: 'Webhook is not configured' }, { status: 503 })
  }

  const rawBody = await request.text()
  const signature = request.headers.get(SIGNATURE_HEADER_NAME)
  if (!(await isValidSignature(rawBody, signature || '', secret))) {
    return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 401 })
  }

  let payload: DownloadWebhookPayload
  try {
    payload = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'Invalid webhook payload' }, { status: 400 })
  }

  if (!payload.afterId) {
    return NextResponse.json({ ok: true, deleted: [], skipped: 'deleted or unpublished document' })
  }

  const candidates = replacedBlobPathnames(
    payload.beforeFiles || [],
    payload.afterFiles || [],
  )

  try {
    const referenced = await getPublishedBlobReferences()
    const deleted = await deleteUnreferencedBlobs({
      candidates,
      referenced,
      remove: (pathname) => del(pathname),
    })
    revalidateTag('downloads', 'max')
    revalidateTag('download-categories', 'max')
    revalidateTag('public-download-settings', 'max')
    return NextResponse.json({ ok: true, deleted })
  } catch (error) {
    console.error('Downloads cleanup webhook failed:', error)
    return NextResponse.json({ error: 'Cleanup failed; delivery should be retried' }, { status: 503 })
  }
}
