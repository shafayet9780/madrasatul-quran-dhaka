import type { ContactInfo } from '@/types/sanity';
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
export function getAdmissionsContact(contact?: ContactInfo) {
  const active = contact?.phone?.filter(p => p.isActive) || [];
  const fallback =
    active.find(p => p.type === 'admission') || active.find(p => p.isPrimary);
  return {
    phone: normalizePhone(contact?.admissionsPhone ?? fallback?.number),
    whatsapp: normalizePhone(contact?.whatsappNumber ?? DEFAULT_WHATSAPP),
    officeHours: contact?.officeHours,
  };
}
