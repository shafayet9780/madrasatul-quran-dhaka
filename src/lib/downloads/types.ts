import type { PortableTextBlock } from '@portabletext/types'
import type { MultilingualText, SanityImage } from '@/types/sanity'

export const DOWNLOAD_ACCESS_COOKIE = 'mq_download_access'
export const DOWNLOAD_TTL_DAYS = [1, 7, 30] as const
export const DOWNLOAD_LINK_LIFETIMES = [...DOWNLOAD_TTL_DAYS, 'never'] as const
export const MAX_DOWNLOAD_FILE_SIZE = 50 * 1024 * 1024

export type DownloadTtlDays = (typeof DOWNLOAD_TTL_DAYS)[number]
export type DownloadLinkLifetime = (typeof DOWNLOAD_LINK_LIFETIMES)[number]
export type DownloadScope = 'library' | 'category' | 'item'
export type DownloadUploadPurpose =
  | 'restricted-download'
  | 'public-prospectus'
  | 'public-curriculum'
  | 'public-code-of-conduct'

export interface VercelBlobFile {
  _type?: 'vercelBlobFile'
  pathname: string
  url: string
  downloadUrl?: string
  originalFilename: string
  contentType: string
  size: number
  etag: string
  uploadedAt: string
}

export interface DownloadCategory {
  _id: string
  _type: 'downloadCategory'
  name: MultilingualText
  description?: MultilingualText
  slug: { current: string }
  displayOrder: number
  shareVersion: number
}

export interface Downloadable {
  _id: string
  _type: 'downloadable'
  title: MultilingualText
  summary?: MultilingualText
  body?: {
    bengali?: PortableTextBlock[]
    english?: PortableTextBlock[]
  }
  slug: { current: string }
  category: DownloadCategory
  file: VercelBlobFile
  coverImage?: SanityImage
  displayOrder: number
  shareVersion: number
}

export interface LegacyDownloadAccessClaims {
  v: 1
  scope: DownloadScope
  targetId?: string
  iat: number
  exp: number
}

export interface CurrentDownloadAccessClaims {
  v: 2
  scope: DownloadScope
  targetId?: string
  shareVersion?: number
  iat: number
  exp: number | null
}

export type DownloadAccessClaims =
  | LegacyDownloadAccessClaims
  | CurrentDownloadAccessClaims

export type PublicDownloadKind = 'prospectus' | 'curriculum' | 'codeOfConduct'

export interface PublicDownloadSettings {
  _id: 'publicDownloadSettings'
  _type: 'publicDownloadSettings'
  prospectus?: VercelBlobFile
  curriculum?: VercelBlobFile
  codeOfConduct?: VercelBlobFile
}
