import { expect, it } from 'vitest';
import { prepareContactDraft, initialFeeSettings } from './fee-setup';
it('preserves existing draft edits and contact destinations', () => {
  const draft = {
    _id: 'drafts.siteSettings',
    title: 'Editor draft',
    contactInfo: {
      admissionsPhone: '+441234567890',
      whatsappNumber: '+441234567891',
    },
  };
  expect(
    prepareContactDraft(draft, { _id: 'siteSettings', title: 'Published' })
  ).toBeNull();
});
it('copies published settings into a draft without losing unrelated content', () => {
  const published = {
    _id: 'siteSettings',
    _rev: 'rev',
    title: 'School',
    contactInfo: {
      address: { english: 'Dhaka' },
      phone: [{ number: '01301226644', type: 'admission', isActive: true }],
    },
  };
  const draft = prepareContactDraft(null, published);
  expect(draft).toMatchObject({
    _id: 'drafts.siteSettings',
    title: 'School',
    contactInfo: {
      address: { english: 'Dhaka' },
      admissionsPhone: '+8801301226644',
      whatsappNumber: '+8801301226644',
    },
  });
  expect(draft).not.toHaveProperty('_rev');
  expect(published).not.toHaveProperty('contactInfo.whatsappNumber');
});
it('initializes descriptive discounts and contact-office transport without aggregate values', () => {
  expect(
    initialFeeSettings.transport.every(v => v.price.status === 'contactOffice')
  ).toBe(true);
  expect(initialFeeSettings.discounts[0].appliesTo).toEqual(['tuition']);
  expect(JSON.stringify(initialFeeSettings)).not.toMatch(/25%|total|estimate/i);
});
