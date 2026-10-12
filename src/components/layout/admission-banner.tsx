'use client';

import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { ArrowRight, X } from 'lucide-react';
import type { Language } from '@/types';
import { trackAdmissionCta, useAdmissionCta } from './admission-cta-context';

// Site-wide pre-admission banner: shown while the form is open or announced with an opening date
// (Studio → Pre-admission form: Enable Form, opens at / closes at), hidden otherwise.

export default function AdmissionBanner({ onDismiss }: { onDismiss: () => void }) {
  const cta = useAdmissionCta();
  const locale = useLocale() as Language;
  const t = useTranslations('admissionCta');
  if (!cta) return null;
  const open = cta.state === 'open';

  return (
    <div className="bg-primary-800 text-white">
      <div className="container-custom flex h-12 items-center gap-3">
        <span aria-hidden className={`size-2 shrink-0 rounded-full ${open ? 'bg-emerald-400' : 'bg-secondary-200'}`} />
        <p className="min-w-0 flex-1 truncate text-sm md:text-base">
          <strong className="font-semibold">{t('title', { session: cta.session })}</strong>
          {!open && <span className="sm:hidden"> · {t('notOpenShort')}</span>}
          <span className="hidden text-white/85 sm:inline"> · {cta.status}</span>
        </p>
        <Link
          href={`/${locale}/pre-admission`}
          onClick={() => trackAdmissionCta('admission_banner', locale)}
          className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full bg-white px-3.5 text-sm sm:px-4 font-semibold text-primary-800 transition-colors hover:bg-secondary-50"
        >
          {open ? t('apply') : t('details')}
          <ArrowRight className="hidden size-4 sm:block" aria-hidden />
        </Link>
        <button
          type="button"
          onClick={onDismiss}
          aria-label={t('dismiss')}
          className="-mr-3 grid size-11 shrink-0 place-items-center rounded-full text-white/80 transition-colors hover:text-white"
        >
          <X className="size-4" aria-hidden />
        </button>
      </div>
    </div>
  );
}
