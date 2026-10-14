'use client';

import { useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { usePathname } from 'next/navigation';
import type { Language } from '@/types';
import { ButtonLink } from '@/components/site/button';
import { trackAdmissionCta, useAdmissionCta } from './admission-cta-context';

/**
 * Phones only: the pre-admission bar at the foot of the screen. On a page with a hero ([data-hero]) it slides up
 * once the hero has scrolled away; elsewhere it is there from the start. It is fixed (html and body clip
 * overflow, which stops `sticky`), with a spacer at the page end so it never covers the footer.
 */
const HERO_PAGE = /^\/(bengali|english)\/?$/; // the homepage, whose hero has the apply button

export function ApplyBar() {
  const cta = useAdmissionCta();
  const locale = useLocale() as Language;
  const t = useTranslations('admissionCta');
  // Starts hidden on the hero page, so the server render does not show a bar that slides away on load.
  const pathname = usePathname();
  const [shown, setShown] = useState(!HERO_PAGE.test(pathname));

  useEffect(() => {
    const hero = document.querySelector('[data-hero]');
    if (!hero) return setShown(true);
    const io = new IntersectionObserver(([entry]) => setShown(!entry.isIntersecting));
    io.observe(hero);
    return () => io.disconnect();
  }, []);

  if (!cta) return null;
  const open = cta.state === 'open';
  return (
    <>
      <div aria-hidden className="h-[calc(68px+env(safe-area-inset-bottom))] bg-dark sm:hidden" />
      <div
        className={`fixed inset-x-0 bottom-0 z-40 bg-dark text-on-dark shadow-bar transition-transform duration-300 ease-out-expo sm:hidden ${shown ? '' : 'pointer-events-none translate-y-full'}`}
        aria-hidden={!shown}
        inert={!shown}
      >
        <div className="flex min-h-[68px] items-center gap-3 border-t border-line-dark px-4 pb-[env(safe-area-inset-bottom)]">
          <span className="flex min-w-0 flex-1 flex-col leading-tight">
            <strong className="text-16 font-bold leading-tight">{t('title', { session: cta.session })}</strong>
            <span className="truncate text-13 leading-tight text-on-dark-muted">{cta.status}</span>
          </span>
          <ButtonLink href={`/${locale}/pre-admission`} variant="light" size="md" className="font-bold" onClick={() => trackAdmissionCta('apply_bar', locale)}>
            {open ? t('apply') : t('details')}
          </ButtonLink>
        </div>
      </div>
    </>
  );
}
