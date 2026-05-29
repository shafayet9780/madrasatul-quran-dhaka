import { defineType } from 'sanity'
import { mlString, mlText, mlSlug, displayOrderField } from './shared'

export const department = defineType({
  name: 'department',
  title: 'Department',
  type: 'document',
  description: 'Used to group and filter teachers.',
  fields: [
    mlString('name', 'Name', { required: true }),
    mlSlug(),
    mlText('description', 'Description', { rows: 3 }),
    {
      name: 'accentColor',
      title: 'Accent Color',
      type: 'string',
      description: 'Optional hex color (e.g. #8B5A3C) used to tint the department section.',
    },
    displayOrderField(),
  ],
  preview: {
    select: { title: 'name.english', subtitle: 'name.bengali' },
  },
  orderings: [
    {
      title: 'Display Order',
      name: 'displayOrderAsc',
      by: [{ field: 'displayOrder', direction: 'asc' }],
    },
  ],
})
