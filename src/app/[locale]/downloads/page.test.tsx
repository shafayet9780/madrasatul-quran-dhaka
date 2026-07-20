import { render } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createDownloadAccessToken } from '@/lib/downloads/access'
import { DOWNLOAD_ACCESS_COOKIE } from '@/lib/downloads/types'

const {
  cookieGet,
  downloadDetail,
  downloadLibrary,
  getCategoryById,
  getCategoryBySlug,
  getCategories,
  getItemById,
  getItemBySlug,
  getItems,
} = vi.hoisted(() => ({
  cookieGet: vi.fn(),
  downloadDetail: vi.fn(() => null),
  downloadLibrary: vi.fn(() => null),
  getCategoryById: vi.fn(),
  getCategoryBySlug: vi.fn(),
  getCategories: vi.fn(),
  getItemById: vi.fn(),
  getItemBySlug: vi.fn(),
  getItems: vi.fn(),
}))

vi.mock('next/headers', () => ({
  cookies: vi.fn(async () => ({ get: cookieGet })),
}))
vi.mock('next/navigation', () => ({
  notFound: vi.fn(() => {
    throw new Error('not found')
  }),
}))
vi.mock('@/components/downloads', () => ({
  DownloadDetail: downloadDetail,
  DownloadInvalid: vi.fn(() => null),
  DownloadLibrary: downloadLibrary,
}))
vi.mock('@/lib/queries/downloads', () => ({
  getDownloadCategories: getCategories,
  getDownloadCategoryById: getCategoryById,
  getDownloadCategoryBySlug: getCategoryBySlug,
  getDownloadableById: getItemById,
  getDownloadableBySlug: getItemBySlug,
  getDownloadables: getItems,
}))

import DownloadDetailPage from './[slug]/page'
import DownloadsPage from './page'

const secret = 'a-download-signing-secret-with-more-than-32-bytes'

const category = {
  _id: 'category-1',
  shareVersion: 2,
  slug: { current: 'lesson-plans' },
  name: { bengali: 'পাঠ পরিকল্পনা', english: 'Lesson plans' },
}
const item = {
  _id: 'item-1',
  shareVersion: 3,
  slug: { current: 'grade-one-plan' },
  category,
  title: { bengali: 'প্রথম শ্রেণি', english: 'Grade one' },
  file: {
    originalFilename: 'grade-one.pdf',
    contentType: 'application/pdf',
    size: 100,
    uploadedAt: '2026-07-19T00:00:00.000Z',
  },
}

function grantAccess(
  options: Omit<Parameters<typeof createDownloadAccessToken>[0], 'secret'>,
) {
  vi.stubEnv('DOWNLOADS_LINK_SIGNING_SECRET', secret)
  const { token } = createDownloadAccessToken({ ...options, secret })
  cookieGet.mockImplementation((name) =>
    name === DOWNLOAD_ACCESS_COOKIE ? { value: token } : undefined,
  )
}

afterEach(() => {
  vi.unstubAllEnvs()
  vi.clearAllMocks()
})

describe('valid downloads page access', () => {
  it('renders the complete library in Bengali with a valid library link', async () => {
    grantAccess({ scope: 'library' })
    getCategories.mockResolvedValue([category])
    getItems.mockResolvedValue([item])

    render(await DownloadsPage({
      params: Promise.resolve({ locale: 'bengali' }),
      searchParams: Promise.resolve({}),
    }))

    expect(downloadLibrary).toHaveBeenCalledWith(
      expect.objectContaining({
        locale: 'bengali',
        categories: [category],
        items: [item],
        categoryLocked: false,
      }),
      undefined,
    )
  })

  it('honors a direct category URL without expanding its scope', async () => {
    grantAccess({
      scope: 'category',
      targetId: category._id,
      targetShareVersion: category.shareVersion,
    })
    getCategoryById.mockResolvedValue(category)
    getItems.mockResolvedValue([item])

    render(await DownloadsPage({
      params: Promise.resolve({ locale: 'english' }),
      searchParams: Promise.resolve({ category: category.slug.current }),
    }))

    expect(getItems).toHaveBeenCalledWith(category._id)
    expect(downloadLibrary).toHaveBeenCalledWith(
      expect.objectContaining({
        categories: [category],
        activeCategory: category,
        categoryLocked: true,
      }),
      undefined,
    )
  })

  it('renders an individually shared item detail in either locale', async () => {
    grantAccess({
      scope: 'item',
      targetId: item._id,
      targetShareVersion: item.shareVersion,
    })
    getItemBySlug.mockResolvedValue(item)

    render(await DownloadDetailPage({
      params: Promise.resolve({ locale: 'bengali', slug: item.slug.current }),
    }))

    expect(downloadDetail).toHaveBeenCalledWith(
      expect.objectContaining({ item, locale: 'bengali' }),
      undefined,
    )
  })
})
