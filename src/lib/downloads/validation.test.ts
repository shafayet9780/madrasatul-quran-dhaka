import { describe, expect, it } from 'vitest'
import {
  isStableDownloadSlug,
  sanitizeBlobFilename,
  validateUpload,
} from './validation'

describe('download upload validation', () => {
  it.each([
    ['file.pdf', 'application/pdf'],
    ['guide.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    ['sheet.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
    ['slides.pptx', 'application/vnd.openxmlformats-officedocument.presentationml.presentation'],
    ['cover.jpeg', 'image/jpeg'],
    ['cover.png', 'image/png'],
    ['cover.webp', 'image/webp'],
  ])('accepts restricted file %s', (filename, contentType) => {
    expect(validateUpload({ purpose: 'restricted-download', filename, contentType, size: 100 })).toBeNull()
  })

  it('limits public purposes to PDF and rejects extension/type mismatches', () => {
    expect(validateUpload({
      purpose: 'public-prospectus',
      filename: 'prospectus.pdf',
      contentType: 'application/pdf',
      size: 100,
    })).toBeNull()
    expect(validateUpload({
      purpose: 'public-curriculum',
      filename: 'curriculum.docx',
      contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      size: 100,
    })).toMatch(/not allowed/)
    expect(validateUpload({
      purpose: 'restricted-download',
      filename: 'renamed.pdf',
      contentType: 'image/png',
      size: 100,
    })).toMatch(/extension/)
  })

  it('rejects files above 50 MB', () => {
    expect(validateUpload({
      purpose: 'restricted-download',
      filename: 'large.pdf',
      contentType: 'application/pdf',
      size: 50 * 1024 * 1024 + 1,
    })).toMatch(/50 MB/)
  })

  it('sanitizes immutable pathname names and validates stable slugs', () => {
    expect(sanitizeBlobFilename('  Lesson Plan (Grade 3).PDF')).toBe('lesson-plan-grade-3.pdf')
    expect(isStableDownloadSlug('grade-3-lesson-plan')).toBe(true)
    expect(isStableDownloadSlug('Grade 3')).toBe(false)
    expect(isStableDownloadSlug('বাংলা')).toBe(false)
  })
})
