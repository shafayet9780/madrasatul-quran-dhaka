import type { ContactInfo } from '@/types/sanity';

type Phone = NonNullable<ContactInfo['phone']>[number];

/**
 * Active phone numbers for display, primary first, original order otherwise.
 * Inactive numbers are dropped. Returns [] when none configured.
 */
export function activePhones(contactInfo?: ContactInfo): Phone[] {
  const phones = contactInfo?.phone ?? [];
  return phones
    .filter((p) => p.isActive)
    .sort((a, b) => (b.isPrimary ? 1 : 0) - (a.isPrimary ? 1 : 0));
}
