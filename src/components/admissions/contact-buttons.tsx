'use client';

import type { Locale } from '@/lib/i18n';
import { trackClickToCall, trackClickToWhatsapp } from '@/lib/analytics/track';
import { ButtonLink } from '@/components/site/button';
import { Icon } from '@/components/site/icon';

/** The admissions office's call and WhatsApp buttons on a dark card; each click is counted (analytics). */
export function ContactButtons({
  locale,
  phone,
  whatsapp,
  labels,
}: {
  locale: Locale;
  phone?: { tel: string; display: string } | null;
  /** In E.164 (+8801…). */
  whatsapp?: string | null;
  labels: { call: string; whatsapp: string };
}) {
  return (
    <>
      {phone && (
        <ButtonLink href={phone.tel} variant="light" size="lg" onClick={() => trackClickToCall({ ctaLocation: 'admissions_contact', locale })}>
          <Icon name="phone" />
          {labels.call}
        </ButtonLink>
      )}
      {whatsapp && (
        <ButtonLink
          href={`https://wa.me/${whatsapp.slice(1)}`}
          target="_blank"
          rel="noopener noreferrer"
          variant="outline-dark"
          size="lg"
          onClick={() => trackClickToWhatsapp({ ctaLocation: 'admissions_contact', locale })}
        >
          <Icon name="whatsapp-logo" />
          {labels.whatsapp}
        </ButtonLink>
      )}
    </>
  );
}
