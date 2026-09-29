import { describe, expect, it } from 'vitest';
import {
  formatPrice,
  groupFees,
  applicableNames,
  validateDiscountTargets,
} from './fees';
import { normalizePhone, getAdmissionsContact } from './admissions-contact';

const name = (english: string) => ({ english, bengali: english });
const rows = [
  {
    _key: 'admission',
    name: name('Admission'),
    frequency: 'oneTime',
    visible: true,
  },
  {
    _key: 'tuition',
    name: name('Tuition renamed'),
    frequency: 'monthly',
    visible: true,
  },
  {
    _key: 'hidden',
    name: name('Hidden'),
    frequency: 'monthly',
    visible: false,
  },
  { _key: 'exam', name: name('Exam'), frequency: 'custom', visible: true },
] as any;
describe('financial display rules', () => {
  it('groups visible fees without changing editor order within a group', () => {
    expect(groupFees(rows).map(g => g.items.map(f => f._key))).toEqual([
      ['tuition'],
      ['admission'],
      ['exam'],
    ]);
  });
  it('never mistakes missing or invalid amounts for free', () => {
    for (const amount of [undefined, NaN, -1, Infinity])
      expect(formatPrice({ status: 'priced', amount }, 'english')).toBe(
        'Contact office'
      );
    expect(formatPrice({ status: 'priced', amount: 0 }, 'english')).toBe(
      'Free'
    );
    expect(formatPrice({ status: 'notApplicable' }, 'english')).toBe(
      'Not applicable'
    );
    expect(
      formatPrice({ status: 'priced', amount: 6000 }, 'english')
    ).toContain('6,000');
    expect(
      formatPrice({ status: 'priced', amount: 6000 }, 'bengali')
    ).toContain('৬,০০০');
  });
  it('resolves renamed fees by key and excludes stale or hidden targets', () => {
    const settings = { fees: rows, transport: [] } as any;
    expect(
      applicableNames(['tuition', 'hidden', 'missing'], settings, 'english')
    ).toEqual(['Tuition renamed']);
    expect(validateDiscountTargets(['tuition'], settings)).toBe(true);
    expect(validateDiscountTargets(['hidden'], settings)).not.toBe(true);
    expect(validateDiscountTargets(['missing'], settings)).not.toBe(true);
  });
});
describe('contact destinations', () => {
  it('normalizes Bangladesh local and international numbers without a duplicate zero', () => {
    expect(normalizePhone('01301 226644')).toBe('+8801301226644');
    expect(normalizePhone('+880 1301-226644')).toBe('+8801301226644');
    expect(normalizePhone('8801301226644')).toBe('+8801301226644');
    expect(normalizePhone('+88001301226644')).toBe('+8801301226644');
    expect(normalizePhone('88001301226644')).toBe('+8801301226644');
    expect(normalizePhone('javascript:alert(1)')).toBeNull();
  });
  it('prefers configured destinations and omits invalid explicit values', () => {
    expect(
      getAdmissionsContact({
        admissionsPhone: 'bad',
        whatsappNumber: 'bad',
      } as any)
    ).toMatchObject({ phone: null, whatsapp: null });
    expect(
      getAdmissionsContact({
        phone: [{ number: '01301226644', type: 'admission', isActive: true }],
      } as any).phone
    ).toBe('+8801301226644');
  });
});
