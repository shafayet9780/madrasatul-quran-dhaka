import Image from 'next/image'
import Link from 'next/link'
import { PortableText } from '@portabletext/react'
import { CalendarDays, Download, FileText, FolderOpen, LockKeyhole } from 'lucide-react'
import { urlFor } from '@/lib/sanity'
import { fileTypeLabel, formatFileSize } from '@/lib/downloads/format'
import type { Downloadable } from '@/lib/downloads/types'

export function DownloadDetail({ item, locale }: { item: Downloadable; locale: string }) {
  const bengali = locale === 'bengali'
  const title = bengali ? item.title.bengali : item.title.english
  const summary = bengali ? item.summary?.bengali : item.summary?.english
  const body = bengali ? item.body?.bengali : item.body?.english
  const category = bengali ? item.category.name.bengali : item.category.name.english
  const uploadedAt = new Intl.DateTimeFormat(bengali ? 'bn-BD' : 'en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(item.file.uploadedAt))

  return (
    <main className="bg-white">
      <div className="border-b border-gray-100 bg-gray-50">
        <div className="container-custom py-4 text-sm text-gray-600">
          <Link href={`/${locale}/downloads`} className="text-primary-700 hover:underline">
            {bengali ? 'ডাউনলোড' : 'Downloads'}
          </Link>
          <span className="mx-2">/</span>
          <span>{category}</span>
        </div>
      </div>
      <section className="py-12 md:py-18">
        <div className="container-custom grid gap-10 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div>
            <div className="flex items-start gap-5">
              <span className="flex h-16 w-16 shrink-0 items-center justify-center border border-primary-200 bg-primary-50 text-primary-700">
                <FileText aria-hidden="true" className="h-8 w-8" />
              </span>
              <div>
                <h1 className="text-3xl font-bold leading-tight text-primary-900 md:text-5xl">
                  {title}
                </h1>
                {summary ? <p className="mt-5 max-w-3xl text-lg leading-8 text-gray-600">{summary}</p> : null}
              </div>
            </div>

            <dl className="mt-9 grid gap-5 border-y border-gray-200 py-6 sm:grid-cols-4">
              <div>
                <dt className="flex items-center gap-2 text-sm text-gray-500">
                  <FolderOpen className="h-4 w-4" /> {bengali ? 'বিভাগ' : 'Category'}
                </dt>
                <dd className="mt-2 font-medium text-gray-900">{category}</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">{bengali ? 'ফাইলের ধরন' : 'File type'}</dt>
                <dd className="mt-2 font-medium text-gray-900">
                  {fileTypeLabel(item.file.contentType, item.file.originalFilename)}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">{bengali ? 'আকার' : 'Size'}</dt>
                <dd className="mt-2 font-medium text-gray-900">{formatFileSize(item.file.size)}</dd>
              </div>
              <div>
                <dt className="flex items-center gap-2 text-sm text-gray-500">
                  <CalendarDays className="h-4 w-4" /> {bengali ? 'আপলোড' : 'Uploaded'}
                </dt>
                <dd className="mt-2 font-medium text-gray-900">{uploadedAt}</dd>
              </div>
            </dl>

            <div className="mt-7 flex flex-wrap items-center gap-5">
              <a
                href={`/api/downloads/file/${encodeURIComponent(item._id)}`}
                className="inline-flex items-center gap-2 bg-primary-700 px-6 py-3 font-semibold text-white hover:bg-primary-800"
              >
                <Download aria-hidden="true" className="h-5 w-5" />
                {bengali ? 'ফাইল ডাউনলোড করুন' : 'Download file'}
              </a>
              <span className="inline-flex items-center gap-2 text-sm text-gray-600">
                <LockKeyhole aria-hidden="true" className="h-4 w-4 text-primary-700" />
                {bengali ? 'আপনার শেয়ার করা লিংকের মাধ্যমে উপলব্ধ।' : 'Available through your shared link.'}
              </span>
            </div>

            {body?.length ? (
              <div className="mt-12">
                <h2 className="border-b border-accent-300 pb-3 text-2xl font-semibold text-primary-900">
                  {bengali ? 'এই শিক্ষাসামগ্রী সম্পর্কে' : 'About this resource'}
                </h2>
                <div className="prose prose-lg mt-6 max-w-none text-gray-700">
                  <PortableText value={body} />
                </div>
              </div>
            ) : null}
          </div>

          {item.coverImage?.asset?._ref ? (
            <div className="relative aspect-[4/5] overflow-hidden border border-gray-200 bg-gray-50">
              <Image
                src={urlFor(item.coverImage).width(720).height(900).fit('crop').url()}
                alt={item.coverImage.alt || title}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 360px"
              />
            </div>
          ) : null}
        </div>
      </section>
    </main>
  )
}
