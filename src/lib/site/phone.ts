import type { Locale } from '@/lib/i18n';
import { normalizePhone } from '@/lib/admissions-contact';
import { num } from '@/lib/admissions/display';

/** A CMS phone number as people dial it here (০১৩০১-২২৬৬৪৪ on Bengali pages) and as a tel: link. */
export function sitePhone(raw: string | undefined, locale: Locale): { display: string; tel: string; e164: string } | null {
  const e164 = normalizePhone(raw);
  if (!e164) return null;
  const mobile = /^\+880(1\d{3})(\d{6})$/.exec(e164);
  const local = mobile ? `0${mobile[1]}-${mobile[2]}` : e164;
  return { display: num(local, locale), tel: `tel:${e164}`, e164 };
}
