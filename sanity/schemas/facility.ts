import { defineField, defineType } from 'sanity'

export const facility = defineType({
  name: 'facility',
  title: 'Facility',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'Facility Name',
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
      name: 'slug',
      title: 'Slug',
      type: 'object',
      fields: [
        {
          name: 'bengali',
          title: 'Bengali Slug',
          type: 'slug',
          options: {
            source: 'name.bengali',
            maxLength: 96,
          },
          validation: (Rule) => Rule.required(),
        },
        {
          name: 'english',
          title: 'English Slug',
          type: 'slug',
          options: {
            source: 'name.english',
            maxLength: 96,
          },
          validation: (Rule) => Rule.required(),
        },
      ],
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'object',
      fields: [
        {
          name: 'bengali',
          title: 'Bengali',
          type: 'text',
          rows: 4,
        },
        {
          name: 'english',
          title: 'English',
          type: 'text',
          rows: 4,
        },
      ],
    }),
    defineField({
      name: 'category',
      title: 'Category',
      type: 'string',
      options: {
        list: [
          { title: 'Academic', value: 'academic' },
          { title: 'Islamic', value: 'islamic' },
          { title: 'Recreational', value: 'recreational' },
          { title: 'Administrative', value: 'administrative' },
          { title: 'Support', value: 'support' },
        ],
        layout: 'radio',
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'images',
      title: 'Images',
      type: 'array',
      of: [
        {
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
            {
              name: 'caption',
              type: 'object',
              title: 'Caption',
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
          ],
        },
      ],
      validation: (Rule) => Rule.min(1).error('At least one image is required'),
    }),
    defineField({
      name: 'capacity',
      title: 'Capacity',
      type: 'number',
      description: 'Number of students/people the facility can accommodate',
    }),
    defineField({
      name: 'features',
      title: 'Features',
      type: 'object',
      fields: [
        {
          name: 'bengali',
          title: 'Bengali Features',
          type: 'array',
          of: [{ type: 'string' }],
          description: 'List of facility features in Bengali',
        },
        {
          name: 'english',
          title: 'English Features',
          type: 'array',
          of: [{ type: 'string' }],
          description: 'List of facility features in English',
        },
      ],
    }),
    defineField({
      name: 'specifications',
      title: 'Technical Specifications',
      type: 'object',
      fields: [
        {
          name: 'area',
          title: 'Area (sq ft)',
          type: 'number',
        },
        {
          name: 'equipment',
          title: 'Equipment',
          type: 'object',
          fields: [
            {
              name: 'bengali',
              title: 'Bengali',
              type: 'array',
              of: [{ type: 'string' }],
            },
            {
              name: 'english',
              title: 'English',
              type: 'array',
              of: [{ type: 'string' }],
            },
          ],
        },
        {
          name: 'accessibility',
          title: 'Accessibility Features',
          type: 'object',
          fields: [
            {
              name: 'bengali',
              title: 'Bengali',
              type: 'array',
              of: [{ type: 'string' }],
            },
            {
              name: 'english',
              title: 'English',
              type: 'array',
              of: [{ type: 'string' }],
            },
          ],
        },
      ],
    }),
    defineField({
      name: 'safetyFeatures',
      title: 'Safety & Security Features',
      type: 'object',
      fields: [
        {
          name: 'bengali',
          title: 'Bengali',
          type: 'array',
          of: [{ type: 'string' }],
        },
        {
          name: 'english',
          title: 'English',
          type: 'array',
          of: [{ type: 'string' }],
        },
      ],
    }),
    defineField({
      name: 'usageSchedule',
      title: 'Usage Schedule',
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
      description: 'When and how the facility is used',
    }),
    defineField({
      name: 'displayOrder',
      title: 'Display Order',
      type: 'number',
      description: 'Lower numbers appear first',
      initialValue: 0,
    }),
    defineField({
      name: 'featured',
      title: 'Featured',
      type: 'boolean',
      description: 'Show in featured facilities section',
      initialValue: false,
    }),
  ],
  preview: {
    select: {
      title: 'name.english',
      subtitle: 'category',
      media: 'images.0',
      capacity: 'capacity',
    },
    prepare(selection) {
      const { title, subtitle, media, capacity } = selection
      return {
        title,
        subtitle: `${subtitle}${capacity ? ` - Capacity: ${capacity}` : ''}`,
        media,
      }
    },
  },
  orderings: [
    {
      title: 'Display Order',
      name: 'displayOrderAsc',
      by: [{ field: 'displayOrder', direction: 'asc' }],
    },
    {
      title: 'Category',
      name: 'categoryAsc',
      by: [{ field: 'category', direction: 'asc' }],
    },
  ],
})