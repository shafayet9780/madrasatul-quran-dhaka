import { Link2Off } from 'lucide-react'

export function DownloadInvalid({ locale }: { locale: string }) {
  const bengali = locale === 'bengali'
  return (
    <main className="bg-gray-50 py-20 md:py-28">
      <div className="container-custom">
        <div className="mx-auto max-w-xl border border-gray-200 bg-white px-6 py-14 text-center shadow-sm md:px-12">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary-50 text-primary-700">
            <Link2Off aria-hidden="true" className="h-7 w-7" />
          </span>
          <h1 className="mt-6 text-2xl font-bold text-gray-900 md:text-3xl">
            {bengali ? 'লিংকটি অবৈধ অথবা মেয়াদ শেষ' : 'Link invalid or expired'}
          </h1>
          <p className="mt-4 leading-7 text-gray-600">
            {bengali
              ? 'এই ডাউনলোড সংগ্রহটি দেখতে একটি সক্রিয় শেয়ার করা লিংক প্রয়োজন। নতুন লিংকের জন্য যিনি এটি শেয়ার করেছেন তার সাথে যোগাযোগ করুন।'
              : 'An active shared link is required to view this downloads library. Ask the person who shared it for a new link.'}
          </p>
        </div>
      </div>
    </main>
  )
}
