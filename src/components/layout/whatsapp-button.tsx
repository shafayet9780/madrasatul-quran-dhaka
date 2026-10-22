'use client';

import { useLocale } from 'next-intl';
import { usePathname } from 'next/navigation';
import type { Language } from '@/types';
import { Icon } from '@/components/site/icon';
import { trackClickToWhatsapp } from '@/lib/analytics/track';
import { cn } from '@/lib/utils';
import { useApplyBarShown } from './apply-bar';

const CONTACT_PAGE = /^\/(bengali|english)\/contact\/?$/; // it has its own WhatsApp button at the top

/**
 * The office's WhatsApp in the corner of every page, with the greeting typed in. A green disc on phones and tablets
 * (above the apply bar while that is up), and a labelled pill on wide screens.
 */
export function WhatsAppButton({ href, label }: { href: string; label: string }) {
  const locale = useLocale() as Language;
  const pathname = usePathname();
  const lifted = useApplyBarShown();
  if (CONTACT_PAGE.test(pathname)) return null;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      onClick={() => trackClickToWhatsapp({ ctaLocation: 'floating_support', locale })}
      className={cn(
        'group fixed bottom-[calc(16px+env(safe-area-inset-bottom))] right-4 z-30 flex items-center rounded-full text-ink no-underline shadow-raise motion-safe:animate-rise motion-safe:transition-[translate,background-color,border-color] motion-safe:duration-300 motion-safe:ease-out-expo focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink sm:bottom-6 sm:right-6',
        'size-14 justify-center bg-whatsapp-brand ring-[3px] ring-paper hover:bg-whatsapp-brand-deep',
        'min-[1180px]:size-auto min-[1180px]:gap-3 min-[1180px]:border min-[1180px]:border-line min-[1180px]:bg-surface min-[1180px]:py-1.5 min-[1180px]:pl-1.5 min-[1180px]:pr-5 min-[1180px]:ring-0 min-[1180px]:hover:-translate-y-0.5 min-[1180px]:hover:border-line-strong min-[1180px]:hover:bg-surface',
        lifted && 'max-sm:-translate-y-[68px]',
      )}
    >
      <span className="flex items-center justify-center rounded-full min-[1180px]:size-11 min-[1180px]:bg-whatsapp-brand min-[1180px]:group-hover:bg-whatsapp-brand-deep">
        <Icon name="whatsapp-logo" size={28} className="min-[1180px]:size-6" />
      </span>
      <span aria-hidden className="hidden text-15 font-strong leading-tight min-[1180px]:block">
        {label}
      </span>
    </a>
  );
}
