import { encodeSignatureHeader, isValidSignature } from '@sanity/webhook'
import { describe, expect, it, vi } from 'vitest'
import {
  DEFAULT_ORPHAN_GRACE_DAYS,
  deleteUnreferencedBlobs,
  isAuthorizedCleanupRequest,
  orphanGraceDays,
  replacedBlobPathnames,
  selectOrphanedBlobPathnames,
} from './cleanup'

function file(pathname: string) {
  return { pathname } as never
}

describe('downloads cleanup', () => {
  it('accepts a valid Sanity webhook signature and rejects an altered body', async () => {
    const body = JSON.stringify({ beforeFiles: [], afterFiles: [] })
    const secret = 'webhook-test-secret'
    const signature = await encodeSignatureHeader(body, Date.now(), secret)
    await expect(isValidSignature(body, signature, secret)).resolves.toBe(true)
    await expect(isValidSignature(`${body} `, signature, secret)).resolves.toBe(false)
  })

  it('finds only changed or removed pathnames', () => {
    expect(replacedBlobPathnames(
      [file('old.pdf'), file('same.pdf')],
      [file('new.pdf'), file('same.pdf')],
    )).toEqual(['old.pdf'])
  })

  it('does not delete a pathname that still has a published reference', async () => {
    const remove = vi.fn(async () => {})
    const deleted = await deleteUnreferencedBlobs({
      candidates: [
        'downloads/library/old.pdf',
        'downloads/library/unused.pdf',
        'prospectus/madrasatul-quran-prospectus.pdf',
        'curriculum/public.pdf',
        'images/public.webp',
        'documents/public.pdf',
      ],
      referenced: new Set(['downloads/library/old.pdf']),
      remove,
    })
    expect(deleted).toEqual(['downloads/library/unused.pdf'])
    expect(remove).toHaveBeenCalledOnce()
  })

  it('is idempotent for duplicate candidates and propagates transient failures for retry', async () => {
    const remove = vi.fn(async () => {})
    await expect(deleteUnreferencedBlobs({
      candidates: ['downloads/library/old.pdf', 'downloads/library/old.pdf'],
      referenced: new Set(),
      remove,
    })).resolves.toEqual(['downloads/library/old.pdf'])
    expect(remove).toHaveBeenCalledOnce()

    await expect(deleteUnreferencedBlobs({
      candidates: ['downloads/library/retry.pdf'],
      referenced: new Set(),
      remove: async () => { throw new Error('transient') },
    })).rejects.toThrow('transient')
  })

  it('selects only old, unreferenced blobs in the cleanup-eligible downloads prefix', () => {
    const cutoff = new Date('2026-07-12T00:00:00.000Z')
    expect(selectOrphanedBlobPathnames({
      blobs: [
        { pathname: 'downloads/library/orphan.pdf', uploadedAt: new Date('2026-07-01') },
        { pathname: 'downloads/library/referenced.pdf', uploadedAt: new Date('2026-07-01') },
        { pathname: 'downloads/library/recent.pdf', uploadedAt: new Date('2026-07-18') },
        { pathname: 'other/unmanaged.pdf', uploadedAt: new Date('2026-07-01') },
        { pathname: 'images/public.webp', uploadedAt: new Date('2026-07-01') },
        { pathname: 'downloads-archive/public.pdf', uploadedAt: new Date('2026-07-01') },
      ],
      referenced: new Set(['downloads/library/referenced.pdf']),
      cutoff,
    })).toEqual(['downloads/library/orphan.pdf'])
  })

  it('validates the cleanup grace period', () => {
    expect(orphanGraceDays(undefined)).toBe(DEFAULT_ORPHAN_GRACE_DAYS)
    expect(orphanGraceDays('14')).toBe(14)
    expect(() => orphanGraceDays('0')).toThrow()
    expect(() => orphanGraceDays('1.5')).toThrow()
  })

  it('requires the exact cron bearer token', () => {
    expect(isAuthorizedCleanupRequest('Bearer cron-secret', 'cron-secret')).toBe(true)
    expect(isAuthorizedCleanupRequest('Bearer wrong', 'cron-secret')).toBe(false)
    expect(isAuthorizedCleanupRequest(null, 'cron-secret')).toBe(false)
  })
})
