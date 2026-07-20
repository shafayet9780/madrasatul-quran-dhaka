import Link from 'next/link'
import { ArrowRight, CalendarDays, FileText, FolderOpen } from 'lucide-react'
import { fileTypeLabel, formatFileSize } from '@/lib/downloads/format'
import type { Downloadable } from '@/lib/downloads/types'

export function DownloadCard({
  item,
  locale,
}: {
  item: Downloadable
  locale: string
}) {
  const bengali = locale === 'bengali'
  const title = bengali ? item.title.bengali : item.title.english
  const summary = bengali ? item.summary?.bengali : item.summary?.english
  const category = bengali ? item.category.name.bengali : item.category.name.english
  const uploadedAt = new Intl.DateTimeFormat(bengali ? 'bn-BD' : 'en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(item.file.uploadedAt))

  return (
    <article className="flex h-full flex-col border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-start gap-4">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center bg-primary-50 text-primary-700">
          <FileText aria-hidden="true" className="h-6 w-6" />
        </span>
        <div>
          <h2 className="text-lg font-semibold leading-snug text-gray-900">{title}</h2>
          {summary ? <p className="mt-2 line-clamp-2 text-sm leading-6 text-gray-600">{summary}</p> : null}
        </div>
      </div>
      <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-gray-100 pt-4 text-sm">
        <div>
          <dt className="flex items-center gap-1.5 text-gray-500">
            <FolderOpen aria-hidden="true" className="h-4 w-4" />
            {bengali ? 'বিভাগ' : 'Category'}
          </dt>
          <dd className="mt-1 text-gray-800">{category}</dd>
        </div>
        <div>
          <dt className="text-gray-500">{bengali ? 'ফাইল' : 'File'}</dt>
          <dd className="mt-1 text-gray-800">
            {fileTypeLabel(item.file.contentType, item.file.originalFilename)} · {formatFileSize(item.file.size)}
          </dd>
        </div>
        <div className="col-span-2">
          <dt className="flex items-center gap-1.5 text-gray-500">
            <CalendarDays aria-hidden="true" className="h-4 w-4" />
            {bengali ? 'আপলোড' : 'Uploaded'}
          </dt>
          <dd className="mt-1 text-gray-800">{uploadedAt}</dd>
        </div>
      </dl>
      <Link
        href={`/${locale}/downloads/${item.slug.current}`}
        className="mt-5 inline-flex items-center gap-2 border-t border-gray-100 pt-4 font-medium text-primary-700 hover:text-primary-900"
      >
        {bengali ? 'বিস্তারিত দেখুন' : 'View details'}
        <ArrowRight aria-hidden="true" className="h-4 w-4" />
      </Link>
    </article>
  )
}
