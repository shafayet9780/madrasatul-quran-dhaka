import Image from 'next/image';
import Link from '@/components/site/link';
import type { SanityImage } from '@/types/sanity';
import { urlFor } from '@/lib/sanity';
import { Icon } from '@/components/site/icon';
import { cn } from '@/lib/utils';

export type Portrait = { key: string; name: string; photo?: SanityImage; role?: string; note?: string; href?: string };

// A tile is never wider than this, so a short row (one or two people) keeps its portraits at a sensible size.
const TILE = 320;

/**
 * People as 4:5 portraits in a row: photo, then the role (`rust` on light, `bronze-light` on dark), the name, and a
 * one-line note under it. Two to a row on phones (from 320px). A portrait with a profile page links to it.
 */
export function Portraits({ people, tone = 'light' }: { people: Portrait[]; tone?: 'light' | 'dark' }) {
  const dark = tone === 'dark';
  return (
    <ul
      className="m-0 grid list-none grid-cols-[repeat(auto-fit,minmax(min(100%,130px),1fr))] gap-x-[clamp(14px,2vw,24px)] gap-y-7 p-0"
      style={{ maxWidth: Math.max(people.length, 2) * TILE }}
    >
      {people.map((p) => {
        const body = (
          <>
            <span className={cn('relative block aspect-[4/5] overflow-hidden rounded-card', dark ? 'bg-panel shadow-frame-dark' : 'bg-sand-pale')}>
              {p.photo?.asset ? (
                <Image src={urlFor(p.photo).width(480).height(600).fit('crop').url()} alt="" fill sizes="(min-width: 900px) 320px, 50vw" className="object-cover" />
              ) : (
                <Icon name="user" size={48} className={cn('absolute inset-0 m-auto', dark ? 'text-on-dark-faint' : 'text-ink-faint')} />
              )}
            </span>
            <span className="flex flex-col gap-0.5">
              {p.role && <span className={cn('text-14 font-strong', dark ? 'text-bronze-light' : 'text-rust')}>{p.role}</span>}
              <span className="text-[clamp(1.0625rem,1.5vw,1.3125rem)] font-heading leading-[1.3]">{p.name}</span>
              {p.note && <span className={cn('text-14 leading-normal', dark ? 'text-on-dark-muted' : 'text-ink-muted')}>{p.note}</span>}
            </span>
          </>
        );
        return (
          <li key={p.key}>
            {p.href ? (
              <Link
                href={p.href}
                className={cn(
                  'flex flex-col gap-3 no-underline focus-visible:outline-2 focus-visible:outline-offset-4',
                  dark ? 'text-on-dark focus-visible:outline-bronze-light' : 'text-ink hover:text-rust-deep focus-visible:outline-ink',
                )}
              >
                {body}
              </Link>
            ) : (
              <div className="flex flex-col gap-3">{body}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
