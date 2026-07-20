import { timingSafeEqual } from 'node:crypto'
import type { VercelBlobFile } from './types'
import { isCleanupEligibleBlobPathname } from './blob'

export const DEFAULT_ORPHAN_GRACE_DAYS = 7

export interface ManagedDownloadBlob {
  pathname: string
  uploadedAt: Date
}

function blobPathnames(files: Array<VercelBlobFile | null | undefined>): Set<string> {
  return new Set(files.map((file) => file?.pathname).filter((value): value is string => Boolean(value)))
}

export function replacedBlobPathnames(
  beforeFiles: Array<VercelBlobFile | null | undefined>,
  afterFiles: Array<VercelBlobFile | null | undefined>,
): string[] {
  const before = blobPathnames(beforeFiles)
  const after = blobPathnames(afterFiles)
  return [...before].filter((pathname) => !after.has(pathname))
}

export async function deleteUnreferencedBlobs({
  candidates,
  referenced,
  remove,
}: {
  candidates: string[]
  referenced: Set<string>
  remove: (pathname: string) => Promise<void>
}): Promise<string[]> {
  const deleted: string[] = []
  for (const pathname of new Set(candidates)) {
    if (!isCleanupEligibleBlobPathname(pathname) || referenced.has(pathname)) continue
    await remove(pathname)
    deleted.push(pathname)
  }
  return deleted
}

export function orphanGraceDays(value: string | undefined): number {
  if (!value) return DEFAULT_ORPHAN_GRACE_DAYS
  const days = Number(value)
  if (!Number.isInteger(days) || days < 1) {
    throw new Error('DOWNLOADS_ORPHAN_GRACE_DAYS must be a positive integer')
  }
  return days
}

export function selectOrphanedBlobPathnames({
  blobs,
  referenced,
  cutoff,
}: {
  blobs: ManagedDownloadBlob[]
  referenced: Set<string>
  cutoff: Date
}): string[] {
  return blobs
    .filter((blob) =>
      isCleanupEligibleBlobPathname(blob.pathname) &&
      blob.uploadedAt <= cutoff &&
      !referenced.has(blob.pathname),
    )
    .map((blob) => blob.pathname)
}

export function isAuthorizedCleanupRequest(
  authorization: string | null,
  secret: string | undefined,
): boolean {
  if (!authorization || !secret) return false
  const expected = Buffer.from(`Bearer ${secret}`, 'utf8')
  const supplied = Buffer.from(authorization, 'utf8')
  return supplied.length === expected.length && timingSafeEqual(supplied, expected)
}
