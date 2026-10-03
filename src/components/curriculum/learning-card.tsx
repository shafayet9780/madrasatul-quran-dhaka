import Image from 'next/image';
import { curriculumImage } from '@/lib/curriculum-images';
import type { FeeLocale } from '@/types/fees';

export function LearningCard({
  imageKey,
  title,
  description,
  locale,
}: {
  imageKey: string;
  title: string;
  description: string;
  locale: FeeLocale;
}) {
  const image = curriculumImage(imageKey);
  return (
    <article className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <Image
        src={image.src}
        alt={image.alt[locale]}
        width={768}
        height={512}
        sizes="(min-width: 1024px) 352px, (min-width: 640px) calc((100vw - 48px) / 2), calc(100vw - 32px)"
        loading="lazy"
        className="aspect-[3/2] w-full object-cover bg-secondary-50"
      />
      <div className="p-5 md:p-6">
        <h3 className="text-lg font-semibold leading-relaxed text-[var(--color-text-primary)]">
          {title}
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-[var(--color-text-secondary)]">
          {description}
        </p>
      </div>
    </article>
  );
}
