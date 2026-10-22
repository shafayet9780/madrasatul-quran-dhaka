import Image from 'next/image';
import type { ReactNode } from 'react';
import type { SanityImage } from '@/types/sanity';
import { urlFor } from '@/lib/sanity';
import { cn } from '@/lib/utils';

/**
 * A person alone on `dark`: a 4:5 portrait (`shadow-frame-dark`) and, beside it, a `bronze-light` line (their role),
 * their name and whatever follows. The chairman on the About page (his own rule: alone, never beside the others) and
 * each director's profile page. The portrait comes first on phones.
 */
export function PersonBand({
  photo,
  kicker,
  name,
  heading: Heading = 'h2',
  priority = false,
  children,
}: {
  photo?: SanityImage;
  kicker: string;
  name: string;
  heading?: 'h1' | 'h2';
  priority?: boolean;
  children?: ReactNode;
}) {
  return (
    <section className="bg-dark text-on-dark">
      <div className="page-wrap flex flex-wrap items-center gap-x-[72px] gap-y-8 py-[clamp(40px,6vw,88px)]">
        {photo?.asset && (
          <div className="relative aspect-[4/5] min-w-0 max-w-[420px] flex-[1_1_280px] overflow-hidden rounded-card shadow-frame-dark">
            <Image
              src={urlFor(photo).width(840).height(1050).fit('crop').url()}
              alt={name}
              fill
              priority={priority}
              fetchPriority={priority ? 'high' : undefined}
              sizes="(min-width: 900px) 420px, 100vw"
              className="object-cover"
            />
          </div>
        )}
        <div className="flex min-w-0 flex-[2_1_420px] flex-col items-start gap-4">
          <p className="m-0 text-15 font-strong text-bronze-light">{kicker}</p>
          <Heading className={cn('m-0 text-balance', Heading === 'h1' ? 'text-hero' : 'text-h2')}>{name}</Heading>
          {children}
        </div>
      </div>
    </section>
  );
}
