import { defineField, defineType } from 'sanity';
import { FeeTargetsInput } from '../components/FeeTargetsInput';
import { validateDiscountTargets } from '../../src/lib/fees';
import type { FeeSettings, FeeDiscount, FeePrice } from '../../src/types/fees';

const bilingual = (name: string, title: string, required = true) =>
  defineField({
    name,
    title,
    type: 'object',
    fields: ['bengali', 'english'].map(language =>
      defineField({
        name: language,
        title: language === 'bengali' ? 'Bengali' : 'English',
        type: 'text',
        rows: 2,
        validation: rule => (required ? rule.required() : rule),
      })
    ),
    validation: rule => (required ? rule.required() : rule),
  });
const price = (name: string, title: string) =>
  defineField({
    name,
    title,
    type: 'object',
    fields: [
      defineField({
        name: 'status',
        title: 'Price status',
        type: 'string',
        options: {
          list: [
            { title: 'Priced', value: 'priced' },
            { title: 'Not applicable', value: 'notApplicable' },
            { title: 'Contact office', value: 'contactOffice' },
          ],
        },
        validation: r => r.required(),
      }),
      defineField({
        name: 'amount',
        title: 'Amount (BDT)',
        type: 'number',
        hidden: ({ parent }) => parent?.status !== 'priced',
      }),
    ],
    validation: rule =>
      rule.required().custom(value => {
        const p = value as FeePrice | undefined;
        return (
          p?.status !== 'priced' ||
          (typeof p.amount === 'number' &&
            Number.isFinite(p.amount) &&
            p.amount >= 0) ||
          'Enter a nonnegative amount. Zero means free.'
        );
      }),
  });
const visible = defineField({
  name: 'visible',
  title: 'Show on website',
  type: 'boolean',
  initialValue: true,
});
const entryPreview = {
  select: { title: 'name.english', subtitle: 'name.bengali' },
};
export const feeSettings = defineType({
  name: 'feeSettings',
  title: 'Fees & Discounts',
  type: 'document',
  groups: [
    { name: 'general', title: 'General text', default: true },
    { name: 'fees', title: 'School fees' },
    { name: 'transport', title: 'Transport' },
    { name: 'discounts', title: 'Discounts' },
    { name: 'payment', title: 'Payment policies' },
    { name: 'faq', title: 'Financial FAQ' },
  ],
  fields: [
    ...[
      ['heading', 'School fees heading'],
      ['introduction', 'Introduction'],
      ['preHifzLabel', 'Pre-Hifz display name'],
      ['hifzLabel', 'Hifz display name'],
      ['unavailableMessage', 'Unavailable message'],
    ].map(([n, t]) => ({ ...bilingual(n, t), group: 'general' })),
    defineField({
      name: 'fees',
      title: 'School fees',
      type: 'array',
      group: 'fees',
      description:
        'Monthly fees appear first, then one-time/annual, then custom. Your order is preserved within each group.',
      validation: r => r.required(),
      of: [
        {
          type: 'object',
          fields: [
            visible,
            bilingual('name', 'Fee name'),
            bilingual('note', 'Note', false),
            defineField({
              name: 'frequency',
              title: 'Billing frequency',
              type: 'string',
              options: {
                list: [
                  { title: 'Monthly', value: 'monthly' },
                  { title: 'One-time', value: 'oneTime' },
                  { title: 'Annual', value: 'annual' },
                  { title: 'Custom', value: 'custom' },
                ],
              },
              validation: r => r.required(),
            }),
            {
              ...bilingual('customFrequency', 'Custom frequency', false),
              hidden: ({ parent }: any) => parent?.frequency !== 'custom',
              validation: (r: any) =>
                r.custom(
                  (value: any, context: any) =>
                    context.parent?.frequency !== 'custom' ||
                    (value?.bengali?.trim() && value?.english?.trim()
                      ? true
                      : 'Enter the custom frequency in both languages.')
                ),
            },
            price('preHifz', 'Pre-Hifz'),
            price('hifz', 'Hifz'),
          ],
          preview: entryPreview,
        },
      ],
    }),
    {
      ...bilingual('transportHeading', 'Transport heading'),
      group: 'transport',
    },
    {
      ...bilingual('transportIntroduction', 'Transport introduction'),
      group: 'transport',
    },
    defineField({
      name: 'transport',
      title: 'Vehicles — optional monthly transport',
      type: 'array',
      group: 'transport',
      of: [
        {
          type: 'object',
          fields: [
            visible,
            bilingual('name', 'Vehicle name'),
            bilingual('note', 'Note', false),
            price('price', 'Monthly price (both programs)'),
          ],
          preview: entryPreview,
        },
      ],
    }),
    {
      ...bilingual('discountsHeading', 'Discounts heading'),
      group: 'discounts',
    },
    defineField({
      name: 'discounts',
      title: 'Discounts',
      type: 'array',
      group: 'discounts',
      of: [
        {
          type: 'object',
          fields: [
            visible,
            bilingual('title', 'Title'),
            bilingual('description', 'Description'),
            bilingual('conditions', 'Eligibility conditions'),
            defineField({
              name: 'appliesTo',
              title: 'Applies to',
              type: 'array',
              of: [{ type: 'string' }],
              components: { input: FeeTargetsInput },
              validation: r =>
                r.custom((value, context) => {
                  if (!(context.parent as FeeDiscount)?.visible) return true;
                  return validateDiscountTargets(
                    value as string[],
                    context.document as unknown as FeeSettings
                  );
                }),
            }),
          ],
          preview: {
            select: { title: 'title.english', subtitle: 'title.bengali' },
          },
        },
      ],
    }),
    { ...bilingual('paymentHeading', 'Payment heading'), group: 'payment' },
    {
      ...bilingual('paymentInstructions', 'Payment instructions'),
      group: 'payment',
    },
    defineField({
      name: 'policies',
      title: 'Payment policies',
      type: 'array',
      group: 'payment',
      of: [
        {
          type: 'object',
          fields: [bilingual('text', 'Policy')],
          preview: { select: { title: 'text.english' } },
        },
      ],
    }),
    { ...bilingual('faqQuestion', 'Question'), group: 'faq' },
    { ...bilingual('faqAnswer', 'Answer'), group: 'faq' },
  ],
  preview: { prepare: () => ({ title: 'Fees & Discounts' }) },
});
