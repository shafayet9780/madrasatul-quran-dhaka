import {
  MAX_DOWNLOAD_FILE_SIZE,
  type DownloadUploadPurpose,
} from './types'

export const DOWNLOAD_FILE_TYPES = {
  'application/pdf': ['pdf'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['docx'],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['xlsx'],
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['pptx'],
  'image/jpeg': ['jpg', 'jpeg'],
  'image/png': ['png'],
  'image/webp': ['webp'],
} as const

export const PDF_FILE_TYPES = {
  'application/pdf': ['pdf'],
} as const

const PUBLIC_PURPOSES: DownloadUploadPurpose[] = [
  'public-prospectus',
  'public-curriculum',
  'public-code-of-conduct',
]

export function isUploadPurpose(value: unknown): value is DownloadUploadPurpose {
  return value === 'restricted-download' || PUBLIC_PURPOSES.includes(value as DownloadUploadPurpose)
}

export function allowedContentTypes(purpose: DownloadUploadPurpose): string[] {
  return Object.keys(purpose === 'restricted-download' ? DOWNLOAD_FILE_TYPES : PDF_FILE_TYPES)
}

export function extensionOf(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() || ''
}

export function isStableDownloadSlug(value: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value)
}

export function sanitizeBlobFilename(filename: string): string {
  const extension = extensionOf(filename)
  const stem = filename
    .slice(0, extension ? -(extension.length + 1) : undefined)
    .normalize('NFKD')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase()
    .slice(0, 80) || 'file'
  return extension ? `${stem}.${extension}` : stem
}

export function validateUpload({
  purpose,
  filename,
  contentType,
  size,
}: {
  purpose: DownloadUploadPurpose
  filename: string
  contentType: string
  size: number
}): string | null {
  if (!filename || !contentType || !Number.isFinite(size) || size <= 0) return 'Invalid file metadata'
  if (size > MAX_DOWNLOAD_FILE_SIZE) return 'Files must be 50 MB or smaller'

  const map = purpose === 'restricted-download' ? DOWNLOAD_FILE_TYPES : PDF_FILE_TYPES
  const extensions = map[contentType as keyof typeof map] as readonly string[] | undefined
  if (!extensions) return 'This file type is not allowed'
  if (!extensions.includes(extensionOf(filename))) return 'The file extension does not match its type'
  return null
}

export function uploadPathPrefix(purpose: DownloadUploadPurpose): string {
  if (purpose === 'restricted-download') return 'downloads/library'
  return `downloads/public/${purpose.replace('public-', '')}`
}
