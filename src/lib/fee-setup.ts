import type { FeeSettings } from '@/types/fees';
import { DEFAULT_WHATSAPP, getAdmissionsContact } from './admissions-contact';
const text = (english: string, bengali: string) => ({ english, bengali });
const priced = (amount: number) => ({ status: 'priced' as const, amount });
export const initialFeeSettings: FeeSettings = {
  _id: 'drafts.feeSettings',
  _type: 'feeSettings',
  heading: text('School fees', 'স্কুলের ফি'),
  introduction: text(
    'Fees for Pre-Hifz and Hifz, with each payment frequency shown below.',
    'প্রি-হিফজ ও হিফজের প্রতিটি ফি এবং প্রদানের সময়কাল নিচে দেওয়া হলো।'
  ),
  preHifzLabel: text('Pre-Hifz', 'প্রি-হিফজ'),
  hifzLabel: text('Hifz', 'হিফজ'),
  transportHeading: text('Transport', 'পরিবহন'),
  transportIntroduction: text(
    'Optional monthly transport is available. Contact the office for vehicle prices and availability.',
    'ঐচ্ছিক মাসিক পরিবহন সুবিধা রয়েছে। যানবাহনের ভাড়া ও প্রাপ্যতা জানতে অফিসে যোগাযোগ করুন।'
  ),
  discountsHeading: text('Discounts', 'ছাড়'),
  paymentHeading: text('Payment information', 'পেমেন্ট সম্পর্কিত তথ্য'),
  paymentInstructions: text(
    'Once your child is selected, complete payment at the school campus to confirm admission.',
    'আপনার সন্তান নির্বাচিত হলে ক্যাম্পাসে পেমেন্ট সম্পন্ন করে ভর্তি নিশ্চিত করুন।'
  ),
  unavailableMessage: text(
    'Please contact the office for current fee information.',
    'বর্তমান ফি জানতে অফিসে যোগাযোগ করুন।'
  ),
  faqQuestion: text(
    'What discounts are available?',
    'কী ধরনের ছাড় পাওয়া যায়?'
  ),
  faqAnswer: text(
    'Please review the current discount information below and contact the office to confirm eligibility and terms.',
    'বর্তমান ছাড়ের তথ্য দেখুন এবং যোগ্যতা ও শর্তাবলী নিশ্চিত করতে অফিসে যোগাযোগ করুন।'
  ),
  fees: [
    {
      _key: 'tuition',
      visible: true,
      name: text('Tuition', 'বেতন'),
      frequency: 'monthly',
      preHifz: priced(6000),
      hifz: priced(10000),
    },
    {
      _key: 'food',
      visible: true,
      name: text('Food', 'খাবার'),
      frequency: 'monthly',
      preHifz: { status: 'notApplicable' },
      hifz: priced(4000),
    },
    {
      _key: 'admission',
      visible: true,
      name: text('Admission', 'ভর্তি'),
      frequency: 'oneTime',
      preHifz: priced(20000),
      hifz: priced(23000),
    },
    {
      _key: 'session',
      visible: true,
      name: text('Session', 'সেশন'),
      frequency: 'annual',
      preHifz: priced(15000),
      hifz: priced(15000),
    },
  ],
  transport: [
    {
      _key: 'micro',
      visible: true,
      name: text('Micro', 'মাইক্রো'),
      price: { status: 'contactOffice' },
    },
    {
      _key: 'auto',
      visible: true,
      name: text('Auto', 'অটো'),
      price: { status: 'contactOffice' },
    },
  ],
  discounts: [
    {
      _key: 'sibling',
      visible: true,
      title: text('Sibling discount', 'ভাইবোন ছাড়'),
      description: text(
        'Sibling support is available for families with more than one child enrolled. Contact the office for details.',
        'একাধিক সন্তান ভর্তি থাকলে ভাইবোন ছাড়ের সুবিধা রয়েছে। বিস্তারিত জানতে অফিসে যোগাযোগ করুন।'
      ),
      conditions: text(
        'From the second child onward.',
        'দ্বিতীয় সন্তান থেকে প্রযোজ্য।'
      ),
      appliesTo: ['tuition'],
    },
  ],
  policies: [
    {
      _key: 'admission',
      text: text(
        'Admission fee is payable at the time of admission.',
        'ভর্তির সময় ভর্তি ফি প্রদান করতে হবে।'
      ),
    },
    {
      _key: 'monthly',
      text: text(
        'Monthly tuition is due by the 10th of each month.',
        'মাসিক বেতন প্রতি মাসের ১০ তারিখের মধ্যে প্রদান করতে হবে।'
      ),
    },
    {
      _key: 'refund',
      text: text(
        'Refunds are subject to the school authority’s decision.',
        'রিফান্ড স্কুল কর্তৃপক্ষের সিদ্ধান্তের উপর নির্ভরশীল।'
      ),
    },
  ],
};
// Pure preparation keeps setup testable without writing to a live dataset.
export function prepareContactDraft(draft: any, published: any) {
  const source = draft || published;
  if (!source) return null;
  const contact = { ...source.contactInfo };
  let changed = false;
  if (!contact.admissionsPhone) {
    const phone = getAdmissionsContact(contact).phone;
    if (phone) {
      contact.admissionsPhone = phone;
      changed = true;
    }
  }
  if (!contact.whatsappNumber) {
    contact.whatsappNumber = DEFAULT_WHATSAPP;
    changed = true;
  }
  if (!changed) return null;
  const document = { ...source };
  for (const key of ['_rev', '_createdAt', '_updatedAt']) delete document[key];
  return {
    ...document,
    _id: 'drafts.siteSettings',
    _type: 'siteSettings',
    contactInfo: contact,
  };
}
