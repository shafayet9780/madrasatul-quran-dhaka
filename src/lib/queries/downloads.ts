import { client, previewClient } from '@/lib/sanity'
import { sanityFetch } from '@/lib/sanity-fetch'
import type {
  DownloadCategory,
  Downloadable,
  PublicDownloadSettings,
} from '@/lib/downloads/types'

const published = `!(_id in path("drafts.**"))`
const categoryProjection = `{
  _id,
  _type,
  name,
  description,
  slug,
  "displayOrder": coalesce(displayOrder, 0),
  "shareVersion": coalesce(shareVersion, 1)
}`
const safeFileProjection = `{
  originalFilename,
  contentType,
  size,
  uploadedAt
}`
const deliverableFileProjection = `{
  pathname,
  originalFilename,
  contentType,
  size,
  etag,
  uploadedAt
}`
const downloadableListProjection = `{
  _id,
  _type,
  title,
  summary,
  slug,
  "category": category->${categoryProjection},
  "file": file${safeFileProjection},
  "displayOrder": coalesce(displayOrder, 0),
  "shareVersion": coalesce(shareVersion, 1)
}`
const downloadableDetailProjection = `{
  _id,
  _type,
  title,
  summary,
  body,
  slug,
  "category": category->${categoryProjection},
  "file": file${safeFileProjection},
  coverImage,
  "displayOrder": coalesce(displayOrder, 0),
  "shareVersion": coalesce(shareVersion, 1)
}`
const completeDownloadableProjection = `{
  _id,
  _type,
  title,
  summary,
  body,
  slug,
  "category": category->${categoryProjection},
  "file": file${deliverableFileProjection},
  coverImage,
  "displayOrder": coalesce(displayOrder, 0),
  "shareVersion": coalesce(shareVersion, 1)
}`

function freshPublishedFetch<T>(query: string, params: Record<string, string>): Promise<T> {
  return client
    .withConfig({ useCdn: false, perspective: 'published' })
    .fetch<T>(query, params, { cache: 'no-store' })
}

export function getDownloadCategories(): Promise<DownloadCategory[]> {
  return sanityFetch({
    query: `*[_type == "downloadCategory" && ${published}] | order(coalesce(displayOrder, 0) asc, name.english asc) ${categoryProjection}`,
    tags: ['downloads', 'download-categories'],
  })
}

export function getDownloadCategoryBySlug(slug: string): Promise<DownloadCategory | null> {
  return sanityFetch({
    query: `*[_type == "downloadCategory" && ${published} && slug.current == $slug][0] ${categoryProjection}`,
    params: { slug },
    tags: ['downloads', 'download-categories'],
  })
}

export function getDownloadCategoryById(id: string): Promise<DownloadCategory | null> {
  return freshPublishedFetch(
    `*[_type == "downloadCategory" && ${published} && _id == $id][0] ${categoryProjection}`,
    { id },
  )
}

export function getDownloadables(categoryId?: string): Promise<Downloadable[]> {
  return sanityFetch({
    query: `*[
      _type == "downloadable" &&
      ${published} &&
      defined(file.pathname) &&
      defined(category->._id) &&
      (!defined($categoryId) || category._ref == $categoryId)
    ] | order(coalesce(displayOrder, 0) asc, file.uploadedAt desc) ${downloadableListProjection}`,
    params: { categoryId: categoryId ?? null },
    tags: ['downloads'],
  })
}

export function getDownloadableBySlug(slug: string): Promise<Downloadable | null> {
  return freshPublishedFetch(
    `*[
      _type == "downloadable" &&
      ${published} &&
      slug.current == $slug &&
      defined(file.pathname) &&
      defined(category->._id)
    ][0] ${downloadableDetailProjection}`,
    { slug },
  )
}

export function getDownloadableById(id: string): Promise<Downloadable | null> {
  return freshPublishedFetch(
    `*[
      _type == "downloadable" &&
      ${published} &&
      _id == $id &&
      defined(file.pathname) &&
      defined(category->._id)
    ][0] ${completeDownloadableProjection}`,
    { id },
  )
}

export function getPublicDownloadSettings(): Promise<PublicDownloadSettings | null> {
  return sanityFetch({
    query: `*[_type == "publicDownloadSettings" && ${published} && _id == "publicDownloadSettings"][0]`,
    tags: ['public-download-settings'],
  })
}

export async function getPublishedBlobReferences(): Promise<Set<string>> {
  const result = await client.withConfig({ useCdn: false, perspective: 'published' }).fetch<{
    downloadables: Array<{ pathname?: string }>
    settings: Array<{
      prospectus?: { pathname?: string }
      curriculum?: { pathname?: string }
      codeOfConduct?: { pathname?: string }
    }>
  }>(
    `{
      "downloadables": *[_type == "downloadable" && ${published}]{ "pathname": file.pathname },
      "settings": *[_type == "publicDownloadSettings" && ${published}]{
        prospectus,
        curriculum,
        codeOfConduct
      }
    }`,
    {},
    { cache: 'no-store' },
  )

  return new Set(
    [
      ...result.downloadables.map((entry) => entry.pathname),
      ...result.settings.flatMap((entry) => [
        entry.prospectus?.pathname,
        entry.curriculum?.pathname,
        entry.codeOfConduct?.pathname,
      ]),
    ].filter((pathname): pathname is string => Boolean(pathname)),
  )
}

export async function getAllBlobReferences(): Promise<Set<string>> {
  if (!process.env.SANITY_API_TOKEN) {
    throw new Error('SANITY_API_TOKEN is required for orphan cleanup')
  }

  const result = await previewClient.withConfig({ perspective: 'raw' }).fetch<{
    downloadables: Array<{ pathname?: string }>
    settings: Array<{
      prospectus?: { pathname?: string }
      curriculum?: { pathname?: string }
      codeOfConduct?: { pathname?: string }
    }>
  }>(
    `{
      "downloadables": *[_type == "downloadable"]{ "pathname": file.pathname },
      "settings": *[_type == "publicDownloadSettings"]{
        prospectus,
        curriculum,
        codeOfConduct
      }
    }`,
    {},
    { cache: 'no-store' },
  )

  return new Set(
    [
      ...result.downloadables.map((entry) => entry.pathname),
      ...result.settings.flatMap((entry) => [
        entry.prospectus?.pathname,
        entry.curriculum?.pathname,
        entry.codeOfConduct?.pathname,
      ]),
    ].filter((pathname): pathname is string => Boolean(pathname)),
  )
}
