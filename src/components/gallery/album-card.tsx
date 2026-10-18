import Image from 'next/image';
import Link from 'next/link';
import type { Album } from '@/lib/gallery/albums';
import { Icon } from '@/components/site/icon';

/**
 * An album in a month row: its cover with two sheets behind it, so it reads as a set, the number of photos, then the
 * name, the day and the topic. The badge shows the number; `count` (১৮টি ছবি) is read out in its place. `topic` comes in written out.
 */
export function AlbumCard({ album, href, number, count, topic, sizes }: { album: Album; href: string; number: string; count: string; topic: string; sizes: string }) {
  const cover = album.photos[0];
  return (
    <Link
      href={href}
      className="group flex flex-col gap-3.5 text-ink no-underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink"
    >
      <span className="relative mt-2.5 block aspect-[4/3] before:absolute before:inset-x-[18px] before:-top-2.5 before:h-10 before:rounded-photo before:bg-sand-deep before:content-[''] after:absolute after:inset-x-[9px] after:-top-[5px] after:h-10 after:rounded-photo after:bg-line-strong after:content-['']">
        <span className="absolute inset-0 z-[1] overflow-hidden rounded-photo bg-sand-pale">
          {cover && <Image src={cover.src} alt="" fill sizes={sizes} className="object-cover motion-safe:transition-transform motion-safe:duration-500 group-hover:scale-[1.03]" style={{ objectPosition: cover.position }} />}
        </span>
        <span className="absolute bottom-3 left-3 z-[2] inline-flex h-7 items-center gap-1.5 rounded-full bg-surface/90 px-2.5 text-13 font-strong text-ink">
          <Icon name="image" size={16} />
          <span aria-hidden="true">{number}</span>
          <span className="sr-only">{count}</span>
        </span>
      </span>
      <span className="flex flex-col gap-1">
        <span className="text-17 font-bold leading-snug text-ink group-hover:text-rust sm:text-19">{album.title}</span>
        <span className="flex flex-wrap gap-x-3 gap-y-1 text-13 text-ink-muted sm:text-14">
          <span>{album.dayText || album.dateText}</span>
          <span>{topic}</span>
        </span>
      </span>
    </Link>
  );
}
