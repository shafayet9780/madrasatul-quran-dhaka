import type { ContactInfo, PhoneUse } from '@/types/sanity';
export const DEFAULT_WHATSAPP = '+8801301226644';
export function normalizePhone(value?: string): string | null {
  if (!value || !/^[+\d\s()-]+$/.test(value)) return null;
  let number = value.replace(/[\s()-]/g, '');
  // Accept the common pasted form: country code followed by a local mobile number.
  number = number.replace(/^\+?8800(?=1\d{9}$)/, '+880');
  if (/^01\d{9}$/.test(number)) number = '+880' + number.slice(1);
  if (/^8801\d{9}$/.test(number)) number = '+' + number;
  return /^\+[1-9]\d{7,14}$/.test(number) ? number : null;
}
/** The first number shown for this use (Studio → School details → Phone numbers). */
export function phoneFor(contact: ContactInfo | undefined, use: PhoneUse): string | undefined {
  return contact?.phone?.find((p) => p.isActive && p.usedFor === use)?.number;
}
/**
 * What an old phone entry (before "Used for") was for: the old admissions number or an admission line, else by its
 * English label. The clean-up script writes this; until it has run, the site reads the old entries the same way.
 */
export function phoneUse(phone: { number?: string; usedFor?: PhoneUse; type?: string; label?: { english?: string } }, admissionsPhone?: string): PhoneUse {
  const number = normalizePhone(phone.number);
  if (phone.usedFor) return phone.usedFor;
  if (phone.type === 'admission' || (number && number === normalizePhone(admissionsPhone))) return 'admissions';
  const label = phone.label?.english ?? '';
  if (/transport/i.test(label)) return 'transport';
  if (/account/i.test(label)) return 'accounts';
  return 'office';
}
/** The admissions number (else the first number shown), the WhatsApp number and the office hours. */
export function getAdmissionsContact(contact?: ContactInfo) {
  return {
    phone: normalizePhone(phoneFor(contact, 'admissions') ?? contact?.phone?.find((p) => p.isActive)?.number),
    whatsapp: normalizePhone(contact?.whatsappNumber ?? DEFAULT_WHATSAPP),
    officeHours: contact?.officeHours,
  };
}
