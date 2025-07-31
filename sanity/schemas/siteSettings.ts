import { defineField, defineType } from 'sanity'

export const siteSettings = defineType({
  name: 'siteSettings',
  title: 'Site Settings',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Site Title',
      type: 'object',
      fields: [
        {
          name: 'bengali',
          title: 'Bengali',
          type: 'string',
          validation: (Rule) => Rule.required(),
        },
        {
          name: 'english',
          title: 'English',
          type: 'string',
          validation: (Rule) => Rule.required(),
        },
      ],
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'description',
      title: 'Site Description',
      type: 'object',
      fields: [
        {
          name: 'bengali',
          title: 'Bengali',
          type: 'text',
          rows: 3,
        },
        {
          name: 'english',
          title: 'English',
          type: 'text',
          rows: 3,
        },
      ],
    }),
    defineField({
      name: 'logo',
      title: 'Logo',
      type: 'image',
      options: {
        hotspot: true,
      },
      fields: [
        {
          name: 'alt',
          type: 'string',
          title: 'Alternative Text',
          validation: (Rule) => Rule.required(),
        },
      ],
    }),
    defineField({
      name: 'favicon',
      title: 'Favicon',
      type: 'image',
      description: 'Small icon for browser tabs (32x32px recommended)',
    }),
    defineField({
      name: 'contactInfo',
      title: 'Contact Information',
      type: 'object',
      fields: [
        {
          name: 'address',
          title: 'Address',
          type: 'object',
          fields: [
            {
              name: 'bengali',
              title: 'Bengali',
              type: 'text',
              rows: 3,
            },
            {
              name: 'english',
              title: 'English',
              type: 'text',
              rows: 3,
            },
          ],
        },
        {
          name: 'phone',
          title: 'Phone Numbers',
          type: 'array',
          of: [
            {
              type: 'object',
              fields: [
                {
                  name: 'label',
                  title: 'Label',
                  type: 'object',
                  fields: [
                    {
                      name: 'bengali',
                      title: 'Bengali',
                      type: 'string',
                    },
                    {
                      name: 'english',
                      title: 'English',
                      type: 'string',
                    },
                  ],
                },
                {
                  name: 'number',
                  title: 'Phone Number',
                  type: 'string',
                  validation: (Rule) => Rule.required(),
                },
              ],
            },
          ],
        },
        {
          name: 'email',
          title: 'Email Addresses',
          type: 'array',
          of: [
            {
              type: 'object',
              fields: [
                {
                  name: 'label',
                  title: 'Label',
                  type: 'object',
                  fields: [
                    {
                      name: 'bengali',
                      title: 'Bengali',
                      type: 'string',
                    },
                    {
                      name: 'english',
                      title: 'English',
                      type: 'string',
                    },
                  ],
                },
                {
                  name: 'address',
                  title: 'Email Address',
                  type: 'email',
                  validation: (Rule) => Rule.required(),
                },
              ],
            },
          ],
        },
        {
          name: 'officeHours',
          title: 'Office Hours',
          type: 'object',
          fields: [
            {
              name: 'bengali',
              title: 'Bengali',
              type: 'text',
              rows: 3,
            },
            {
              name: 'english',
              title: 'English',
              type: 'text',
              rows: 3,
            },
          ],
        },
      ],
    }),
    defineField({
      name: 'socialMedia',
      title: 'Social Media',
      type: 'object',
      fields: [
        {
          name: 'facebook',
          title: 'Facebook URL',
          type: 'url',
        },
        {
          name: 'youtube',
          title: 'YouTube URL',
          type: 'url',
        },
        {
          name: 'instagram',
          title: 'Instagram URL',
          type: 'url',
        },
        {
          name: 'twitter',
          title: 'Twitter URL',
          type: 'url',
        },
      ],
    }),
    defineField({
      name: 'admissionInfo',
      title: 'Admission Information',
      type: 'object',
      fields: [
        {
          name: 'admissionPhone',
          title: 'Admission Office Phone',
          type: 'string',
        },
        {
          name: 'admissionEmail',
          title: 'Admission Office Email',
          type: 'email',
        },
        {
          name: 'admissionHours',
          title: 'Admission Office Hours',
          type: 'object',
          fields: [
            {
              name: 'bengali',
              title: 'Bengali',
              type: 'text',
              rows: 2,
            },
            {
              name: 'english',
              title: 'English',
              type: 'text',
              rows: 2,
            },
          ],
        },
      ],
    }),
    defineField({
      name: 'seo',
      title: 'SEO Settings',
      type: 'object',
      fields: [
        {
          name: 'metaTitle',
          title: 'Default Meta Title',
          type: 'object',
          fields: [
            {
              name: 'bengali',
              title: 'Bengali',
              type: 'string',
              validation: (Rule) => Rule.max(60),
            },
            {
              name: 'english',
              title: 'English',
              type: 'string',
              validation: (Rule) => Rule.max(60),
            },
          ],
        },
        {
          name: 'metaDescription',
          title: 'Default Meta Description',
          type: 'object',
          fields: [
            {
              name: 'bengali',
              title: 'Bengali',
              type: 'text',
              validation: (Rule) => Rule.max(160),
            },
            {
              name: 'english',
              title: 'English',
              type: 'text',
              validation: (Rule) => Rule.max(160),
            },
          ],
        },
        {
          name: 'ogImage',
          title: 'Default Open Graph Image',
          type: 'image',
          options: {
            hotspot: true,
          },
        },
        {
          name: 'keywords',
          title: 'Keywords',
          type: 'object',
          fields: [
            {
              name: 'bengali',
              title: 'Bengali Keywords',
              type: 'array',
              of: [{ type: 'string' }],
            },
            {
              name: 'english',
              title: 'English Keywords',
              type: 'array',
              of: [{ type: 'string' }],
            },
          ],
        },
      ],
    }),
    defineField({
      name: 'statistics',
      title: 'School Statistics',
      type: 'object',
      fields: [
        {
          name: 'yearsOfService',
          title: 'Years of Service',
          type: 'number',
        },
        {
          name: 'totalStudents',
          title: 'Total Students',
          type: 'number',
        },
        {
          name: 'graduationRate',
          title: 'Graduation Rate (%)',
          type: 'number',
          validation: (Rule) => Rule.min(0).max(100),
        },
        {
          name: 'teacherCount',
          title: 'Number of Teachers',
          type: 'number',
        },
        {
          name: 'achievements',
          title: 'Key Achievements',
          type: 'array',
          of: [
            {
              type: 'object',
              fields: [
                {
                  name: 'title',
                  title: 'Achievement Title',
                  type: 'object',
                  fields: [
                    {
                      name: 'bengali',
                      title: 'Bengali',
                      type: 'string',
                    },
                    {
                      name: 'english',
                      title: 'English',
                      type: 'string',
                    },
                  ],
                },
                {
                  name: 'value',
                  title: 'Value/Number',
                  type: 'string',
                },
              ],
            },
          ],
        },
      ],
    }),
  ],
  preview: {
    select: {
      title: 'title.english',
      media: 'logo',
    },
  },
})