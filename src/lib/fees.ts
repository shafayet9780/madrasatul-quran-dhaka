import type { FeeLocale, FeePrice, FeeSettings, SchoolFee } from '@/types/fees';

export function formatPrice(
  price: FeePrice | undefined,
  locale: FeeLocale
): string {
  const bn = locale === 'bengali';
  if (price?.status === 'notApplicable')
    return bn ? 'প্রযোজ্য নয়' : 'Not applicable';
  if (
    price?.status !== 'priced' ||
    typeof price.amount !== 'number' ||
    !Number.isFinite(price.amount) ||
    price.amount < 0
  )
    return bn ? 'অফিসে যোগাযোগ করুন' : 'Contact office';
  if (price.amount === 0) return bn ? 'বিনামূল্যে' : 'Free';
  return new Intl.NumberFormat(bn ? 'bn-BD' : 'en-BD', {
    style: 'currency',
    currency: 'BDT',
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  }).format(price.amount);
}
export function groupFees(fees: SchoolFee[] = []) {
  return [
    {
      key: 'monthly',
      items: fees.filter(f => f.visible && f.frequency === 'monthly'),
    },
    {
      key: 'admission',
      items: fees.filter(
        f => f.visible && ['oneTime', 'annual'].includes(f.frequency)
      ),
    },
    {
      key: 'custom',
      items: fees.filter(f => f.visible && f.frequency === 'custom'),
    },
  ].filter(g => g.items.length);
}
export function applicableNames(
  keys: string[] = [],
  settings: Pick<FeeSettings, 'fees' | 'transport'>,
  locale: FeeLocale
) {
  const entries = [...(settings.fees || []), ...(settings.transport || [])];
  return keys.flatMap(key => {
    const entry = entries.find(e => e._key === key && e.visible);
    return entry?.name?.[locale] ? [entry.name[locale]] : [];
  });
}
export function validateDiscountTargets(
  keys: string[] | undefined,
  settings: Pick<FeeSettings, 'fees' | 'transport'>
): true | string {
  const entries = [...(settings.fees || []), ...(settings.transport || [])];
  if (!keys?.length) return 'Select at least one applicable fee or vehicle.';
  return (
    keys.every(key => entries.some(e => e._key === key && e.visible)) ||
    'A selected fee or vehicle is hidden or deleted. Update the selection or hide this discount.'
  );
}
export function usableFeeSettings(
  settings: FeeSettings | null
): settings is FeeSettings {
  return (
    !!settings?.heading?.bengali &&
    !!settings.heading.english &&
    Array.isArray(settings.fees)
  );
}
