import type { Locale } from '@/lib/i18n';
import type { SiteSettings } from '@/types/sanity';
import { getAdmissionsContact } from '@/lib/admissions-contact';
import { num, txt } from '@/lib/admissions/display';
import { sitePhone } from '@/lib/site/phone';

export const DIRECTIONS_URL = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent('Madrasatul Quran Dhaka')}`;

const UNITS: Record<Locale, { m: string; km: string }> = {
  bengali: { m: 'মি.', km: 'কিমি' },
  english: { m: 'm', km: 'km' },
};

/** A landmark's distance as Studio holds it ("600m", "3 km"), in the page's language; anything else is shown as typed. */
export function distanceLabel(raw: string | undefined, locale: Locale): string {
  if (!raw) return '';
  const match = /^\s*(\d+(?:\.\d+)?)\s*(km|m)\s*$/i.exec(raw);
  if (!match) return num(raw.trim(), locale);
  return `${num(match[1], locale)} ${UNITS[locale][match[2].toLowerCase() as 'm' | 'km']}`;
}

/** The walk from the metro (School details → Location), for the drawing and the campus tour; null until both are filled in. */
function metroWalk(location: SiteSettings['locationInfo'], locale: Locale): { station: string; walk: string } | null {
  const station = txt(location?.metroStation, locale).trim();
  const walk = distanceLabel(location?.metroWalk, locale);
  return station && walk ? { station, walk } : null;
}

/** Only Google's embed address may fill the map frame. */
export function mapEmbed(url: string | undefined): string | null {
  return url?.startsWith('https://www.google.com/maps/embed') ? url : null;
}

/**
 * Everything the Contact page shows from School details → contact and location: the active desks with their numbers, the
 * WhatsApp number, the active emails, the office hours and address, how to get here, the walk from the metro (while both
 * its station and distance are filled in) and the landmarks. Numbers that don't parse are left out.
 */
export function contactDetails(settings: SiteSettings | null | undefined, locale: Locale) {
  const contact = settings?.contactInfo;
  const office = getAdmissionsContact(contact);
  const location = settings?.locationInfo;
  return {
    phone: sitePhone(office.phone ?? undefined, locale),
    whatsapp: sitePhone(office.whatsapp ?? undefined, locale),
    desks: (contact?.phone ?? [])
      .filter((p) => p.isActive)
      .flatMap((p) => {
        const phone = sitePhone(p.number, locale);
        return phone ? [{ ...phone, desk: txt(p.label, locale) }] : [];
      }),
    emails: (contact?.email ?? []).filter((e) => e.isActive && e.address).map((e) => e.address),
    hours: txt(office.officeHours, locale),
    address: txt(contact?.address, locale),
    gettingHere: txt(location?.gettingHere, locale),
    metro: metroWalk(location, locale),
    landmarks: (location?.landmarks ?? [])
      .map((l) => ({ name: txt(l.name, locale), distance: distanceLabel(l.distance, locale) }))
      .filter((l) => l.name),
    mapEmbed: mapEmbed(location?.mapEmbedUrl),
    mapUrl: location?.googleMapsUrl,
  };
}
