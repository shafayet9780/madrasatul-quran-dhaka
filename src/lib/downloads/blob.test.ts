import { describe, expect, it } from 'vitest'
import {
  isCleanupEligibleBlobPathname,
  trustedPublicBlobUrl,
} from './blob'

const store = 'https://school.public.blob.vercel-storage.com'

describe('trusted Blob delivery', () => {
  it('builds a URL only from a trusted public Blob origin and allowed pathname', () => {
    expect(trustedPublicBlobUrl({
      baseUrl: store,
      pathname: 'downloads/library/lesson-plan.pdf',
      allowed: (pathname) => pathname.startsWith('downloads/library/'),
    })).toBe(`${store}/downloads/library/lesson-plan.pdf`)
  })

  it('rejects untrusted origins, traversal, and paths outside the allowed scope', () => {
    const input = {
      pathname: 'downloads/library/lesson-plan.pdf',
      allowed: (pathname: string) => pathname.startsWith('downloads/library/'),
    }
    expect(trustedPublicBlobUrl({ ...input, baseUrl: 'https://attacker.example' })).toBeNull()
    expect(trustedPublicBlobUrl({
      baseUrl: store,
      pathname: 'downloads/library/../private.txt',
      allowed: input.allowed,
    })).toBeNull()
    expect(trustedPublicBlobUrl({
      baseUrl: store,
      pathname: 'prospectus/unmanaged.pdf',
      allowed: input.allowed,
    })).toBeNull()
  })

  it('makes only safe objects under downloads/ eligible for cleanup', () => {
    expect(isCleanupEligibleBlobPathname('downloads/public/prospectus/file.pdf')).toBe(true)
    expect(isCleanupEligibleBlobPathname('downloads/library/file.pdf')).toBe(true)
    expect(isCleanupEligibleBlobPathname('prospectus/file.pdf')).toBe(false)
    expect(isCleanupEligibleBlobPathname('curriculum/file.pdf')).toBe(false)
    expect(isCleanupEligibleBlobPathname('images/file.webp')).toBe(false)
    expect(isCleanupEligibleBlobPathname('documents/file.pdf')).toBe(false)
    expect(isCleanupEligibleBlobPathname('downloads-archive/file.pdf')).toBe(false)
    expect(isCleanupEligibleBlobPathname('downloads/../outside.pdf')).toBe(false)
  })
})
