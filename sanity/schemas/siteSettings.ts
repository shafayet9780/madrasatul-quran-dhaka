import { normalizePhone } from '../../src/lib/admissions-contact';
import { defineArrayMember, defineField, defineType, ALL_FIELDS_GROUP } from 'sanity'
import { mlString, mlText } from './shared'

/** What each school number is for: the site picks the admissions and transport numbers by it. */
export const PHONE_USES = [
  { title: 'Admissions', value: 'admissions' },
  { title: 'Transport', value: 'transport' },
  { title: 'Accounts', value: 'accounts' },
  { title: 'Office', value: 'office' },
]

const phoneRule = (value: string | undefined) =>
  !value || !!normalizePhone(value) || 'Write a Bangladeshi mobile number, e.g. +8801301226644 or 01301226644.'

/** Studio → School details: who the school is and how to reach it. Shown in the footer, the contact page and the PDFs. */
export const siteSettings = defineType({
  name: 'siteSettings',
  title: 'School details',
  type: 'document',
  groups: [
    // Hide the auto-generated "All fields" tab — every field is grouped below.
    { ...ALL_FIELDS_GROUP, hidden: true },
    { name: 'general', title: 'General', default: true },
    { name: 'contact', title: 'Contact' },
    { name: 'location', title: 'Location' },
    { name: 'social', title: 'Social' },
  ],
  fields: [
    defineField({
      name: 'logo',
      title: 'Logo',
      group: 'general',
      type: 'image',
      options: { hotspot: true },
      fields: [{ name: 'alt', type: 'string', title: 'Alternative Text', validation: (Rule) => Rule.required() }],
    }),
    defineField({
      name: 'favicon',
      title: 'Favicon',
      group: 'general',
      type: 'image',
      description: 'Small icon for browser tabs (32x32px recommended)',
    }),
    { ...mlString('tagline', 'Tagline', { required: true }), group: 'general', description: 'One line under the school’s name in the footer.' },
    { ...mlText('mission', 'Mission', { required: true }), group: 'general', description: 'A short paragraph in the footer.' },
    defineField({
      name: 'defaultMaleAvatar',
      title: 'Default Male Avatar',
      group: 'general',
      type: 'image',
      options: { hotspot: true },
      description: 'Placeholder shown for male directors/teachers who have no photo.',
    }),
    defineField({
      name: 'defaultFemaleAvatar',
      title: 'Default Female Avatar',
      group: 'general',
      type: 'image',
      options: { hotspot: true },
      description: 'Placeholder shown for female directors/teachers (per modesty guidelines).',
    }),
    defineField({
      name: 'contactInfo',
      title: 'Contact',
      group: 'contact',
      type: 'object',
      options: { collapsible: false },
      fields: [
        defineField({
          name: 'phone',
          title: 'Phone numbers',
          description: 'Every number the site shows, each with what it is for. The first Admissions number is the one the site and the application PDF give.',
          type: 'array',
          of: [
            defineArrayMember({
              type: 'object',
              fields: [
                defineField({ name: 'number', title: 'Number', type: 'string', validation: (Rule) => Rule.required().custom(phoneRule) }),
                defineField({ name: 'usedFor', title: 'Used for', type: 'string', options: { list: PHONE_USES, layout: 'radio', direction: 'horizontal' }, validation: (Rule) => Rule.required() }),
                mlString('label', 'Label (the desk’s name, as the footer and contact page show it)'),
                defineField({ name: 'isActive', title: 'Show on the site', type: 'boolean', initialValue: true }),
              ],
              preview: {
                select: { number: 'number', usedFor: 'usedFor', label: 'label.english', active: 'isActive' },
                prepare: ({ number, usedFor, label, active }) => ({
                  title: number,
                  subtitle: [PHONE_USES.find((u) => u.value === usedFor)?.title, label, active === false ? 'hidden' : null].filter(Boolean).join(' · '),
                }),
              },
            }),
          ],
        }),
        defineField({
          name: 'whatsappNumber',
          title: 'WhatsApp number',
          type: 'string',
          description: 'International format, for example +8801301226644',
          validation: (Rule) =>
            Rule.regex(/^\+[1-9]\d{7,14}$/, { name: 'international phone number' }).custom(
              (value: string | undefined) => !value || normalizePhone(value) === value || 'Use international format without the local leading zero, e.g. +8801301226644.',
            ),
        }),
        defineField({
          name: 'email',
          title: 'Email addresses',
          type: 'array',
          of: [
            defineArrayMember({
              type: 'object',
              fields: [
                defineField({ name: 'address', title: 'Email address', type: 'email', validation: (Rule) => Rule.required() }),
                defineField({ name: 'isActive', title: 'Show on the site', type: 'boolean', initialValue: true }),
              ],
              preview: { select: { title: 'address', active: 'isActive' }, prepare: ({ title, active }) => ({ title, subtitle: active === false ? 'hidden' : undefined }) },
            }),
          ],
        }),
        mlText('officeHours', 'Office hours', { rows: 2 }),
        mlText('address', 'Address', { rows: 3 }),
      ],
    }),
    defineField({
      name: 'locationInfo',
      title: 'Location',
      group: 'location',
      type: 'object',
      options: { collapsible: false },
      fields: [
        defineField({ name: 'googleMapsUrl', title: 'Google Maps link', type: 'url', description: 'The school’s pin, opened by “Map” in the footer and the homepage.' }),
        defineField({ name: 'mapEmbedUrl', title: 'Google Maps embed URL', type: 'url', description: 'The map on the contact page (Share → Embed a map → the src link).' }),
        defineField({
          name: 'landmarks',
          title: 'Nearby landmarks',
          description: 'Shown beside the map on the contact page.',
          type: 'array',
          of: [
            defineArrayMember({
              type: 'object',
              fields: [mlString('name', 'Name', { required: true }), defineField({ name: 'distance', title: 'Distance', type: 'string', description: 'e.g. 600m or 3 km' })],
              preview: { select: { title: 'name.bengali', subtitle: 'distance' } },
            }),
          ],
        }),
      ],
    }),
    defineField({
      name: 'socialMedia',
      title: 'Social Media Links',
      group: 'social',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            { name: 'platform', title: 'Platform Name', type: 'string', validation: (Rule) => Rule.required() },
            { name: 'url', title: 'URL', type: 'url', validation: (Rule) => Rule.required() },
            { name: 'icon', title: 'Icon Name', type: 'string', options: {
              list: [
                { title: 'Facebook', value: 'facebook' },
                { title: 'YouTube', value: 'youtube' },
                { title: 'Twitter', value: 'twitter' },
                { title: 'Instagram', value: 'instagram' },
                { title: 'LinkedIn', value: 'linkedin' }
              ]
            }},
            { name: 'isActive', title: 'Active', type: 'boolean', initialValue: true },
            { name: 'order', title: 'Display Order', type: 'number' }
          ],
          preview: {
            select: {
              title: 'platform',
              subtitle: 'url',
              media: 'icon'
            }
          }
        }
      ]
    }),
  ],
  preview: { prepare: () => ({ title: 'School details' }) },
})
