'use client';

import { useLocale, useTranslations } from 'next-intl';
import type { Language } from '@/types';
import { ButtonLink } from '@/components/site/button';
import { trackAdmissionCta, useAdmissionCta } from './admission-cta-context';

// Site-wide pre-admission banner: shown while the form is open or announced with an opening date
// (Studio → Pre-admission form: Enable Form, opens at / closes at), hidden otherwise. Not on phones: the ApplyBar carries it there.
export default function AdmissionBanner() {
  const cta = useAdmissionCta();
  const locale = useLocale() as Language;
  const t = useTranslations('admissionCta');
  if (!cta) return null;
  const open = cta.state === 'open';
  return (
    <div className="bg-dark text-on-dark max-sm:hidden">
      <div className="page-wrap flex min-h-[46px] items-center gap-3">
        <span aria-hidden className={`size-2 shrink-0 rounded-full ${open ? 'bg-open' : 'bg-on-dark-faint'}`} />
        <p className="m-0 min-w-0 flex-1 py-2 text-15 leading-[1.35]">
          <strong className="font-strong">{t('title', { session: cta.session })}</strong>
          <span className="text-on-dark-muted"> · {cta.status}</span>
        </p>
        <ButtonLink
          href={`/${locale}/pre-admission`}
          variant="light"
          size="sm"
          onClick={() => trackAdmissionCta('admission_banner', locale)}
        >
          {open ? t('apply') : t('details')}
        </ButtonLink>
      </div>
    </div>
  );
}
