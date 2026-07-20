import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import { DownloadDetail, DownloadInvalid } from '@/components/downloads'
import {
  canAccessDownloadable,
  readDownloadAccess,
} from '@/lib/downloads/access'
import { DOWNLOAD_ACCESS_COOKIE } from '@/lib/downloads/types'
import { getDownloadableBySlug } from '@/lib/queries/downloads'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: { index: false, follow: false, noimageindex: true },
  },
}

export default async function DownloadDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}) {
  const [{ locale, slug }, cookieStore] = await Promise.all([params, cookies()])
  const claims = readDownloadAccess(cookieStore.get(DOWNLOAD_ACCESS_COOKIE)?.value)
  if (!claims) return <DownloadInvalid locale={locale} />

  const item = await getDownloadableBySlug(slug)
  if (!item) notFound()
  if (!canAccessDownloadable(claims, item)) return <DownloadInvalid locale={locale} />
  return <DownloadDetail item={item} locale={locale} />
}
