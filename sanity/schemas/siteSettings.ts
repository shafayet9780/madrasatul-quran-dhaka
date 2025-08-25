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
      name: 'heroImages',
      title: 'Homepage Hero Images',
      description: 'Images for the homepage hero section gallery (recommended: 5 images)',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            {
              name: 'image',
              title: 'Image',
              type: 'image',
              options: {
                hotspot: true,
              },
              validation: (Rule) => Rule.required(),
            },
            {
              name: 'alt',
              title: 'Alternative Text',
              type: 'string',
              validation: (Rule) => Rule.required(),
            },
            {
              name: 'title',
              title: 'Image Title',
              type: 'object',
              fields: [
                {
                  name: 'bengali',
                  title: 'Bengali Title',
                  type: 'string',
                },
                {
                  name: 'english',
                  title: 'English Title',
                  type: 'string',
                },
              ],
            },
            {
              name: 'description',
              title: 'Description',
              type: 'object',
              fields: [
                {
                  name: 'bengali',
                  title: 'Bengali Description',
                  type: 'text',
                  rows: 2,
                },
                {
                  name: 'english',
                  title: 'English Description',
                  type: 'text',
                  rows: 2,
                },
              ],
            },
            {
              name: 'order',
              title: 'Display Order',
              type: 'number',
              description: 'Order in which this image appears in the gallery (1, 2, 3, etc.)',
            },
          ],
          preview: {
            select: {
              title: 'title.english',
              subtitle: 'title.bengali',
              media: 'image',
            },
          },
        },
      ],
      validation: (Rule) => Rule.max(10).min(1),
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
                {
                  name: 'type',
                  title: 'Phone Type',
                  type: 'string',
                  options: {
                    list: [
                      { title: 'Main Office', value: 'main' },
                      { title: 'Admission Office', value: 'admission' },
                      { title: 'Principal Office', value: 'principal' },
                      { title: 'Emergency', value: 'emergency' },
                      { title: 'Department', value: 'department' }
                    ]
                  },
                  initialValue: 'main'
                },
                {
                  name: 'isPrimary',
                  title: 'Primary Contact',
                  type: 'boolean',
                  description: 'Mark as primary contact number for display in header/footer',
                  initialValue: false
                },
                {
                  name: 'isActive',
                  title: 'Active',
                  type: 'boolean',
                  initialValue: true
                }
              ],
              preview: {
                select: {
                  title: 'label.english',
                  subtitle: 'number',
                  description: 'type'
                }
              }
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
                {
                  name: 'type',
                  title: 'Email Type',
                  type: 'string',
                  options: {
                    list: [
                      { title: 'General Info', value: 'info' },
                      { title: 'Admissions', value: 'admission' },
                      { title: 'Principal', value: 'principal' },
                      { title: 'Academic', value: 'academic' },
                      { title: 'Support', value: 'support' }
                    ]
                  },
                  initialValue: 'info'
                },
                {
                  name: 'isPrimary',
                  title: 'Primary Contact',
                  type: 'boolean',
                  description: 'Mark as primary email for display in header/footer',
                  initialValue: false
                },
                {
                  name: 'isActive',
                  title: 'Active',
                  type: 'boolean',
                  initialValue: true
                }
              ],
              preview: {
                select: {
                  title: 'label.english',
                  subtitle: 'address',
                  description: 'type'
                }
              }
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
      title: 'Social Media Links',
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
      name: 'prayerTimes',
      title: 'Prayer Times',
      description: 'Daily prayer times displayed across the site',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            { 
              name: 'prayerName', 
              title: 'Prayer Name', 
              type: 'object', 
              fields: [
                { name: 'bengali', title: 'Bengali Name', type: 'string' },
                { name: 'english', title: 'English Name', type: 'string' }
              ]
            },
            { name: 'time', title: 'Time', type: 'string', validation: (Rule) => Rule.required() },
            { name: 'isActive', title: 'Active', type: 'boolean', initialValue: true },
            { name: 'order', title: 'Display Order', type: 'number' }
          ],
          preview: {
            select: {
              title: 'prayerName.english',
              subtitle: 'time'
            }
          }
        }
      ],
      validation: (Rule) => Rule.max(5)
    }),
    defineField({
      name: 'departments',
      title: 'Department Contacts',
      description: 'Contact information for different departments',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            {
              name: 'name',
              title: 'Department Name',
              type: 'object',
              fields: [
                { name: 'bengali', title: 'Bengali Name', type: 'string' },
                { name: 'english', title: 'English Name', type: 'string' }
              ],
              validation: (Rule) => Rule.required()
            },
            {
              name: 'head',
              title: 'Department Head',
              type: 'object',
              fields: [
                { name: 'bengali', title: 'Bengali Name', type: 'string' },
                { name: 'english', title: 'English Name', type: 'string' }
              ]
            },
            {
              name: 'phone',
              title: 'Phone Number',
              type: 'string'
            },
            {
              name: 'email',
              title: 'Email Address',
              type: 'email'
            },
            {
              name: 'type',
              title: 'Department Type',
              type: 'string',
              options: {
                list: [
                  { title: 'Academic', value: 'academic' },
                  { title: 'Islamic Studies', value: 'islamic' },
                  { title: 'Student Affairs', value: 'student' },
                  { title: 'Finance', value: 'finance' },
                  { title: 'Administration', value: 'administration' }
                ]
              }
            },
            {
              name: 'isActive',
              title: 'Active',
              type: 'boolean',
              initialValue: true
            }
          ],
          preview: {
            select: {
              title: 'name.english',
              subtitle: 'head.english',
              description: 'type'
            }
          }
        }
      ]
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