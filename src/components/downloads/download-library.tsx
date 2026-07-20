import Link from 'next/link'
import { Info } from 'lucide-react'
import { PageHero } from '@/components/ui/page-hero'
import type { DownloadCategory, Downloadable } from '@/lib/downloads/types'
import { DownloadCard } from './download-card'

export function DownloadLibrary({
  locale,
  categories,
  items,
  activeCategory,
  categoryLocked,
}: {
  locale: string
  categories: DownloadCategory[]
  items: Downloadable[]
  activeCategory?: DownloadCategory
  categoryLocked: boolean
}) {
  const bengali = locale === 'bengali'
  return (
    <main>
      <PageHero
        language={bengali ? 'bengali' : 'english'}
        title={bengali ? 'ডাউনলোড' : 'Downloads'}
        subtitle={
          bengali
            ? 'মাদরাসাতুল কুরআনের শেয়ার করা শিক্ষাসামগ্রী'
            : 'Shared resources from Madrasatul Quran'
        }
      />
      <section className="bg-gray-50 py-12 md:py-16">
        <div className="container-custom">
          <div className="flex items-start gap-3 border border-primary-100 bg-primary-50 px-4 py-3 text-sm text-primary-900">
            <Info aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
            <p>
              {bengali
                ? 'এই সংগ্রহটি একটি শেয়ার করা লিংকের মাধ্যমে পাওয়া যাচ্ছে।'
                : 'This library is available through a shared link.'}
            </p>
          </div>

          <nav aria-label={bengali ? 'ডাউনলোড বিভাগ' : 'Download categories'} className="mt-8">
            <div className="flex flex-wrap gap-2">
              {!categoryLocked ? (
                <Link
                  href={`/${locale}/downloads`}
                  className={`border px-4 py-2 text-sm font-medium ${
                    !activeCategory
                      ? 'border-primary-700 bg-primary-700 text-white'
                      : 'border-gray-300 bg-white text-gray-700 hover:border-primary-500'
                  }`}
                >
                  {bengali ? 'সব শিক্ষাসামগ্রী' : 'All resources'}
                </Link>
              ) : null}
              {categories.map((category) => {
                const active = activeCategory?._id === category._id
                return (
                  <Link
                    key={category._id}
                    href={`/${locale}/downloads?category=${encodeURIComponent(category.slug.current)}`}
                    aria-current={active ? 'page' : undefined}
                    className={`border px-4 py-2 text-sm font-medium ${
                      active
                        ? 'border-primary-700 bg-primary-700 text-white'
                        : 'border-gray-300 bg-white text-gray-700 hover:border-primary-500'
                    }`}
                  >
                    {bengali ? category.name.bengali : category.name.english}
                  </Link>
                )
              })}
            </div>
          </nav>

          {items.length ? (
            <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {items.map((item) => (
                <DownloadCard key={item._id} item={item} locale={locale} />
              ))}
            </div>
          ) : (
            <div className="mt-8 border border-gray-200 bg-white px-6 py-14 text-center text-gray-600">
              {bengali ? 'এই বিভাগে এখন কোনো ফাইল নেই।' : 'There are no files in this category yet.'}
            </div>
          )}
        </div>
      </section>
    </main>
  )
}
