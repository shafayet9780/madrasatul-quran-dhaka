'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { useLocale } from 'next-intl';
import { usePathname } from 'next/navigation';
import type { Language } from '@/types';
import type { WhatsAppChooser } from '@/lib/site/whatsapp';
import { Icon } from '@/components/site/icon';
import { trackClickToWhatsapp } from '@/lib/analytics/track';
import { cn } from '@/lib/utils';
import { useApplyBarShown } from './apply-bar';

const CONTACT_PAGE = /^\/(bengali|english)\/contact\/?$/; // it has its own WhatsApp button at the top
const focusRing = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink';

/**
 * The office's WhatsApp in the corner of every page: a green bubble (above the phone apply bar while that is up) that
 * opens what to ask about. Each topic opens WhatsApp with its message typed in. Not a chat: the office replies there.
 * Escape, a click elsewhere or another page closes it.
 */
export function WhatsAppButton({ label, close, title, replies, hours, topics }: WhatsAppChooser) {
  const locale = useLocale() as Language;
  const pathname = usePathname();
  const lifted = useApplyBarShown();
  const [openOn, setOpenOn] = useState<string | null>(null); // the page it was opened on
  const open = openOn === pathname;
  const root = useRef<HTMLDivElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);
  const id = useId();

  useEffect(() => {
    if (!open) return;
    root.current?.querySelector<HTMLElement>('[data-topic]')?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      setOpenOn(null);
      toggle.current?.focus();
    };
    const onDown = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpenOn(null);
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onDown);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onDown);
    };
  }, [open]);

  if (CONTACT_PAGE.test(pathname)) return null;
  return (
    <div
      ref={root}
      className={cn(
        'fixed bottom-[calc(16px+env(safe-area-inset-bottom))] right-4 z-30 flex flex-col items-end gap-3 motion-safe:transition-[translate] motion-safe:duration-300 motion-safe:ease-out-expo sm:bottom-6 sm:right-6 print:hidden',
        lifted && 'max-sm:-translate-y-[68px]',
      )}
    >
      <div
        id={`${id}-panel`}
        role="region"
        aria-labelledby={`${id}-title`}
        hidden={!open}
        className="w-[min(340px,calc(100vw-32px))] rounded-card border border-line bg-surface p-2 text-ink shadow-photo motion-safe:animate-answer"
      >
        <div className="flex items-center gap-3 px-3 pb-3 pt-2.5">
          <span aria-hidden className="flex size-10 shrink-0 items-center justify-center rounded-full bg-whatsapp-brand">
            <Icon name="whatsapp-logo" size={22} />
          </span>
          <span className="flex min-w-0 flex-col leading-tight">
            <strong id={`${id}-title`} className="text-17 font-strong leading-tight">
              {title}
            </strong>
            <span className="mt-0.5 text-13 leading-snug text-ink-muted">{replies}</span>
            {hours && <span className="text-13 leading-snug text-ink-muted">{hours}</span>}
          </span>
        </div>
        <ul className="m-0 list-none border-t border-line p-0 pt-1">
          {topics.map((topic) => (
            <li key={topic.key}>
              <a
                href={topic.href}
                target="_blank"
                rel="noopener noreferrer"
                data-topic
                onClick={() => {
                  trackClickToWhatsapp({ ctaLocation: `floating_support_${topic.key}`, locale });
                  setOpenOn(null);
                }}
                className={cn('flex min-h-12 items-center gap-3 rounded-chip px-3 text-16 text-ink no-underline hover:bg-cream hover:text-rust', focusRing)}
              >
                <span className="min-w-0 flex-1">{topic.label}</span>
                <Icon name="arrow-right" size={18} className="shrink-0 text-ink-faint" />
              </a>
            </li>
          ))}
        </ul>
      </div>

      <div className="group relative">
        {!open && (
          <span
            aria-hidden
            className="pointer-events-none absolute right-full top-1/2 mr-3 -translate-y-1/2 whitespace-nowrap rounded-full bg-dark px-3 py-1.5 text-14 font-strong text-on-dark opacity-0 shadow-raise motion-safe:transition-opacity group-hover:opacity-100 group-has-[:focus-visible]:opacity-100"
          >
            {label}
          </span>
        )}
        <button
          ref={toggle}
          type="button"
          aria-expanded={open}
          aria-controls={`${id}-panel`}
          aria-label={open ? close : label}
          onClick={() => setOpenOn(open ? null : pathname)}
          className={cn(
            'flex size-14 items-center justify-center rounded-full bg-whatsapp-brand text-ink shadow-raise ring-[3px] ring-paper hover:bg-whatsapp-brand-deep motion-safe:animate-rise',
            focusRing,
          )}
        >
          <Icon name={open ? 'x' : 'whatsapp-logo'} size={open ? 24 : 28} />
        </button>
      </div>
    </div>
  );
}
