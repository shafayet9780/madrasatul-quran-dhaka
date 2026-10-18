import Image from 'next/image';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import type { Locale } from '@/lib/i18n';
import type { Album } from '@/lib/gallery/albums';

/** The all-time albums, on `paper`: the campus, the Quran classes, the play spaces. Large tiles, the name on the photo. */
export async function GalleryEver({ locale, albums, counts }: { locale: Locale; albums: Album[]; counts: Record<string, string> }) {
  const t = await getTranslations({ locale, namespace: 'gallery.ever' });
  const shown = albums.filter((a) => a.photos.length);
  if (!shown.length) return null;
  return (
    <section aria-labelledby="gallery-ever" className="bg-paper text-ink">
      <div className="page-wrap flex flex-col gap-9 py-section">
        <div className="flex max-w-[720px] flex-col gap-3">
          <h2 id="gallery-ever" className="m-0 text-h2 text-balance">
            {t('title')}
          </h2>
          <p className="m-0 text-lead text-ink-body">{t('lead')}</p>
        </div>
        <ul className="m-0 grid list-none gap-6 p-0 md:grid-cols-3">
          {shown.map((a) => (
            <li key={a.slug}>
              <Link
                href={`/${locale}/gallery/${a.slug}`}
                className="group relative block h-[220px] overflow-hidden rounded-panel bg-sand-pale no-underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink md:h-[340px]"
              >
                <Image src={a.photos[0].src} alt="" fill sizes="(min-width: 768px) 400px, 100vw" className="object-cover motion-safe:transition-transform motion-safe:duration-500 group-hover:scale-[1.03]" style={{ objectPosition: a.photos[0].position }} />
                <span aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(180deg,rgb(44_31_21/0)_45%,rgb(44_31_21/0.82)_100%)]" />
                <span className="absolute inset-x-[22px] bottom-5 flex flex-col gap-1.5 text-cream">
                  <span className="text-h4 text-cream">{a.title}</span>
                  <span className="text-14 text-on-dark-body">{counts[a.slug]}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
