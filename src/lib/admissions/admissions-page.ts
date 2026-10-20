// What the public Admissions page shows from the published form and Fees, discounts & transport. Pure.
import { groupFees } from '@/lib/fees';
import type { FeePrice, FeeSettings, SchoolFee } from '@/types/fees';
import { taka, txt, type Locale } from './display';
import { fieldWithRole, type FormSnapshot } from './form-config';

export type ClassTile = {
  key: string;
  label: string;
  /** Whole years at the start of the session: [5] for 5-year-olds, [13, 14] for 13 and 14. Empty without a range. */
  ages: number[];
  closed: boolean;
  special: boolean;
  /** The class's requirements as the form states them ("শুধু মেয়েদের জন্য"). */
  requires: string[];
};

/**
 * Every class of the session, open and closed, youngest first (by the age range; classes without one keep
 * their place after). A closed class's requirements are left out, as the form leaves them.
 */
export function classTiles(snapshot: Pick<FormSnapshot, 'sections'>, locale: Locale): ClassTile[] {
  const field = fieldWithRole(snapshot, 'classApplied');
  const options = [...(field?.options ?? []).map((o) => ({ o, closed: false })), ...(field?.closedOptions ?? []).map((o) => ({ o, closed: true }))];
  return options
    .map(({ o, closed }, i) => ({ o, closed, i }))
    .sort((a, b) => (a.o.ageMin ?? Infinity) - (b.o.ageMin ?? Infinity) || a.i - b.i)
    .map(({ o, closed }) => {
      const from = o.ageMin ?? o.ageMax;
      const to = o.ageMax != null ? o.ageMax - 1 : o.ageMin;
      return {
        key: o.value,
        label: txt(o.label, locale),
        ages: from == null || to == null ? [] : from >= to ? [from] : [from, to],
        closed,
        special: !!o.special,
        requires: closed ? [] : (o.requires ?? []).map((r) => txt(r.message, locale)).filter(Boolean),
      };
    });
}

/** Keeps a hyphenated word on one line (ডে-কেয়ার), with word joiners around each hyphen. */
export const keepHyphens = (text: string) => text.replace(/-/g, '\u2060-\u2060');

export type FeeRow = { key: string; name: string; frequency: string; note?: string; prices: { text: string; amount: boolean }[] };
export type FeeGroup = { key: 'monthly' | 'admission' | 'custom'; rows: FeeRow[] };

/** A price as the table shows it: an amount (৳১০,০০০) or what stands in for one (প্রযোজ্য নয়). */
function priceText(price: FeePrice | undefined, locale: Locale, words: { notApplicable: string; contactOffice: string; free: string }) {
  if (price?.status === 'notApplicable') return { text: words.notApplicable, amount: false };
  if (price?.status !== 'priced' || typeof price.amount !== 'number' || !Number.isFinite(price.amount) || price.amount < 0)
    return { text: words.contactOffice, amount: false };
  if (price.amount === 0) return { text: words.free, amount: false };
  return { text: taka(price.amount, locale), amount: true };
}

/** The visible school fees in their groups (monthly, then one-time and annual, then other), each with both columns. */
export function feeGroups(
  settings: Pick<FeeSettings, 'fees'>,
  locale: Locale,
  words: { notApplicable: string; contactOffice: string; free: string; monthly: string; oneTime: string; annual: string },
): FeeGroup[] {
  const frequency = (fee: SchoolFee) => (fee.frequency === 'custom' ? txt(fee.customFrequency, locale) : words[fee.frequency]);
  return groupFees(settings.fees).map((g) => ({
    key: g.key as FeeGroup['key'],
    rows: g.items.map((fee) => ({
      key: fee._key,
      name: txt(fee.name, locale),
      frequency: frequency(fee),
      ...(txt(fee.note, locale) ? { note: txt(fee.note, locale) } : {}),
      prices: [priceText(fee.preHifz, locale, words), priceText(fee.hifz, locale, words)],
    })),
  }));
}
