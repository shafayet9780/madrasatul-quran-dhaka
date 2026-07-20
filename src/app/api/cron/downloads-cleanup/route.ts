import { del, list, type ListBlobResultBlob } from '@vercel/blob'
import { NextRequest, NextResponse } from 'next/server'
import {
  deleteUnreferencedBlobs,
  isAuthorizedCleanupRequest,
  orphanGraceDays,
  selectOrphanedBlobPathnames,
} from '@/lib/downloads/cleanup'
import { CLEANUP_ELIGIBLE_BLOB_PREFIX } from '@/lib/downloads/blob'
import { getAllBlobReferences } from '@/lib/queries/downloads'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const MAX_SCANNED_BLOBS_PER_RUN = 1000
const MAX_DELETIONS_PER_RUN = 100

async function listManagedDownloadBlobs(): Promise<ListBlobResultBlob[]> {
  const page = await list({
    prefix: CLEANUP_ELIGIBLE_BLOB_PREFIX,
    limit: MAX_SCANNED_BLOBS_PER_RUN,
  })
  if (page.hasMore) {
    throw new Error(
      `Managed Blob count exceeds the ${MAX_SCANNED_BLOBS_PER_RUN}-object automatic cleanup limit`,
    )
  }
  return page.blobs
}

export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret) {
    return NextResponse.json({ error: 'Scheduled cleanup is not configured' }, { status: 503 })
  }
  if (!isAuthorizedCleanupRequest(request.headers.get('authorization'), cronSecret)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const graceDays = orphanGraceDays(process.env.DOWNLOADS_ORPHAN_GRACE_DAYS)
    const cutoff = new Date(Date.now() - graceDays * 24 * 60 * 60 * 1000)

    // Fetch references first. If Sanity is unavailable, fail before listing or deleting anything.
    const referenced = await getAllBlobReferences()
    const blobs = await listManagedDownloadBlobs()
    const eligibleCandidates = selectOrphanedBlobPathnames({ blobs, referenced, cutoff })
    const candidates = eligibleCandidates.slice(0, MAX_DELETIONS_PER_RUN)
    const deleted = await deleteUnreferencedBlobs({
      candidates,
      referenced,
      remove: (pathname) => del(pathname),
    })

    return NextResponse.json({
      ok: true,
      scanned: blobs.length,
      referenced: referenced.size,
      candidates: eligibleCandidates.length,
      deleted: deleted.length,
      deferred: eligibleCandidates.length - candidates.length,
      graceDays,
      cutoff: cutoff.toISOString(),
    })
  } catch (error) {
    console.error('Scheduled downloads cleanup failed:', error)
    return NextResponse.json({ error: 'Scheduled cleanup failed' }, { status: 503 })
  }
}
