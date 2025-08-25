import { defineType, defineField } from 'sanity';

const multilingualTextFields = `
  bengali,
  english
`;

const multilingualTextObject = {
  type: 'object',
  fields: [
    { name: 'bengali', title: 'Bengali', type: 'string' },
    { name: 'english', title: 'English', type: 'string' }
  ]
};

export const footer = defineType({
  name: 'footer',
  title: 'Footer Settings',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Footer Title',
      description: 'Main title displayed in the footer',
      type: 'object',
      fields: [
        { name: 'bengali', title: 'Bengali Title', type: 'string' },
        { name: 'english', title: 'English Title', type: 'string' }
      ],
      validation: (Rule) => Rule.required()
    }),

    defineField({
      name: 'subtitle',
      title: 'Footer Subtitle',
      description: 'Subtitle displayed below the main title',
      type: 'object',
      fields: [
        { name: 'bengali', title: 'Bengali Subtitle', type: 'string' },
        { name: 'english', title: 'English Subtitle', type: 'string' }
      ]
    }),

    defineField({
      name: 'description',
      title: 'Footer Description',
      description: 'Description text displayed in the footer',
      type: 'object',
      fields: [
        { name: 'bengali', title: 'Bengali Description', type: 'text', rows: 3 },
        { name: 'english', title: 'English Description', type: 'text', rows: 3 }
      ]
    }),

    defineField({
      name: 'useGlobalContactInfo',
      title: 'Use Global Contact Information',
      description: 'Use contact information from Site Settings instead of custom footer contact info',
      type: 'boolean',
      initialValue: true
    }),

    defineField({
      name: 'useGlobalSocialLinks',
      title: 'Use Global Social Media Links',
      description: 'Use social media links from Site Settings instead of custom footer links',
      type: 'boolean',
      initialValue: true
    }),

    defineField({
      name: 'useGlobalPrayerTimes',
      title: 'Use Global Prayer Times',
      description: 'Use prayer times from Site Settings instead of custom footer prayer times',
      type: 'boolean',
      initialValue: true
    }),

    defineField({
      name: 'quickLinks',
      title: 'Quick Links',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            { name: 'label', title: 'Link Label', type: 'object', fields: [
              { name: 'bengali', title: 'Bengali Label', type: 'string' },
              { name: 'english', title: 'English Label', type: 'string' }
            ]},
            { name: 'url', title: 'URL', type: 'string', validation: (Rule) => Rule.required() },
            { name: 'isActive', title: 'Active', type: 'boolean', initialValue: true },
            { name: 'order', title: 'Display Order', type: 'number' }
          ],
          preview: {
            select: {
              title: 'label.english',
              subtitle: 'url'
            }
          }
        }
      ]
    }),

    defineField({
      name: 'legalLinks',
      title: 'Legal Links',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            { name: 'label', title: 'Link Label', type: 'object', fields: [
              { name: 'bengali', title: 'Bengali Label', type: 'string' },
              { name: 'english', title: 'English Label', type: 'string' }
            ]},
            { name: 'url', title: 'URL', type: 'string', validation: (Rule) => Rule.required() },
            { name: 'isActive', title: 'Active', type: 'boolean', initialValue: true }
          ],
          preview: {
            select: {
              title: 'label.english',
              subtitle: 'url'
            }
          }
        }
      ]
    }),

    defineField({
      name: 'copyright',
      title: 'Copyright Text',
      type: 'object',
      fields: [
        { name: 'bengali', title: 'Bengali Copyright', type: 'string' },
        { name: 'english', title: 'English Copyright', type: 'string' }
      ]
    }),

    defineField({
      name: 'isActive',
      title: 'Active',
      description: 'Enable or disable this footer configuration',
      type: 'boolean',
      initialValue: true
    })
  ],
  preview: {
    select: {
      title: 'title.english',
      subtitle: 'subtitle.english'
    }
  }
});

