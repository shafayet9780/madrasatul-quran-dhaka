'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

/** The same page in the other language. */
export function LanguageLink({ locale, short, long, className }: { locale: string; short: string; long: string; className?: string }) {
  const pathname = usePathname();
  const other = locale === 'english' ? 'bengali' : 'english';
  const href = pathname.replace(/^\/(bengali|english)(?=\/|$)/, `/${other}`);
  return (
    <Link
      href={href}
      lang={other === 'english' ? 'en' : 'bn'}
      className={cn('inline-flex h-10 min-w-10 items-center justify-center rounded-lg px-2.5 text-[13.5px] font-semibold hover:bg-muted', className)}
    >
      <span className="md:hidden">{short}</span>
      <span className="hidden md:inline">{long}</span>
    </Link>
  );
}
