import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import {
  DownloadInvalid,
  DownloadLibrary,
} from '@/components/downloads'
import {
  canAccessDownloadable,
  canAccessDownloadTarget,
  readDownloadAccess,
} from '@/lib/downloads/access'
import { DOWNLOAD_ACCESS_COOKIE } from '@/lib/downloads/types'
import {
  getDownloadCategories,
  getDownloadCategoryById,
  getDownloadCategoryBySlug,
  getDownloadableById,
  getDownloadableBySlug,
  getDownloadables,
} from '@/lib/queries/downloads'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: { index: false, follow: false, noimageindex: true },
  },
}

export default async function DownloadsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ category?: string }>
}) {
  const [{ locale }, { category: categorySlug }, cookieStore] = await Promise.all([
    params,
    searchParams,
    cookies(),
  ])
  const claims = readDownloadAccess(cookieStore.get(DOWNLOAD_ACCESS_COOKIE)?.value)
  if (!claims) return <DownloadInvalid locale={locale} />

  if (claims.scope === 'item') {
    const scoped = await getDownloadableById(claims.targetId!)
    if (!scoped || !canAccessDownloadable(claims, scoped)) {
      return <DownloadInvalid locale={locale} />
    }
    const safeItem = await getDownloadableBySlug(scoped.slug.current)
    if (!safeItem) notFound()
    return (
      <DownloadLibrary
        locale={locale}
        categories={[safeItem.category]}
        items={[safeItem]}
        activeCategory={safeItem.category}
        categoryLocked
      />
    )
  }

  if (claims.scope === 'category') {
    const category = await getDownloadCategoryById(claims.targetId!)
    if (!category || !canAccessDownloadTarget(claims, category)) {
      return <DownloadInvalid locale={locale} />
    }
    if (categorySlug && categorySlug !== category.slug.current) return <DownloadInvalid locale={locale} />
    const items = await getDownloadables(category._id)
    return (
      <DownloadLibrary
        locale={locale}
        categories={[category]}
        items={items}
        activeCategory={category}
        categoryLocked
      />
    )
  }

  const [categories, activeCategory] = await Promise.all([
    getDownloadCategories(),
    categorySlug ? getDownloadCategoryBySlug(categorySlug) : Promise.resolve(undefined),
  ])
  if (categorySlug && !activeCategory) notFound()
  const items = await getDownloadables(activeCategory?._id)
  return (
    <DownloadLibrary
      locale={locale}
      categories={categories}
      items={items}
      activeCategory={activeCategory || undefined}
      categoryLocked={false}
    />
  )
}
