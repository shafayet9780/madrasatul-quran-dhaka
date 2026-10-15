import Link from 'next/link';
import type { ComponentProps } from 'react';
import { cn } from '@/lib/utils';

// Pill links from the homepage canvas. `primary` (rust) is the apply action and nothing else.
const VARIANTS = {
  primary: 'bg-rust text-surface shadow-button hover:bg-rust-deep focus-visible:outline-ink',
  outline: 'border-[1.5px] border-ink text-ink hover:bg-ink/5 focus-visible:outline-ink',
  // On dark sections and bars.
  light: 'bg-cream text-dark hover:bg-surface focus-visible:outline-bronze-light',
  'outline-dark': 'border border-line-dark-strong text-on-dark hover:bg-panel focus-visible:outline-bronze-light',
  // WhatsApp links only: its own green, so it reads as WhatsApp at a glance.
  whatsapp: 'bg-whatsapp-brand text-ink hover:bg-whatsapp-brand-deep focus-visible:outline-ink',
  // The language switch.
  quiet: 'border border-line-strong text-rust-deep hover:bg-cream focus-visible:outline-ink',
} as const;

const SIZES = {
  lg: 'min-h-14 gap-2.5 px-7 text-18 font-strong',
  md: 'min-h-11 gap-2 px-4 text-15 font-strong',
  sm: 'min-h-[34px] gap-2 px-4 text-14 font-strong',
} as const;

type Props = ComponentProps<'a'> & { href: string; variant?: keyof typeof VARIANTS; size?: keyof typeof SIZES };

/** Pages of the site go through next/link; files (/api/…), downloads and other sites are plain links. */
export function ButtonLink({ variant = 'primary', size = 'md', className, href, ...props }: Props) {
  const classes = cn(
    'inline-flex shrink-0 items-center justify-center rounded-full leading-tight no-underline focus-visible:outline-2 focus-visible:outline-offset-2',
    VARIANTS[variant],
    SIZES[size],
    className,
  );
  const page = href.startsWith('/') && !href.startsWith('/api/') && props.download === undefined;
  return page ? <Link href={href} className={classes} {...props} /> : <a href={href} className={classes} {...props} />;
}
