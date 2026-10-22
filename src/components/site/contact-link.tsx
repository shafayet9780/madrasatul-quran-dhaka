'use client';

import type { ComponentProps } from 'react';
import type { Locale } from '@/lib/i18n';
import { trackClickToCall, trackClickToEmail, trackClickToWhatsapp } from '@/lib/analytics/track';
import { ButtonLink } from '@/components/site/button';

const TRACK = { call: trackClickToCall, whatsapp: trackClickToWhatsapp, email: trackClickToEmail };

type Props = ComponentProps<'a'> & {
  href: string;
  kind: keyof typeof TRACK;
  /** Where on the site the link sits, for analytics. */
  where: string;
  locale: Locale;
} & Pick<ComponentProps<typeof ButtonLink>, 'variant' | 'size'>;

/** A call, WhatsApp or email link whose clicks are counted (analytics). With a `variant` it is a pill button. */
export function ContactLink({ kind, where, locale, variant, size, ...props }: Props) {
  const onClick = () => TRACK[kind]({ ctaLocation: where, locale });
  return variant ? <ButtonLink {...props} variant={variant} size={size} onClick={onClick} /> : <a {...props} onClick={onClick} />;
}
