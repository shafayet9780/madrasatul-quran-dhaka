import { defineType } from 'sanity'
import { orderRankField, orderRankOrdering } from '@sanity/orderable-document-list'
import { mlString, mlSlug } from './shared'

export const department = defineType({
  name: 'department',
  title: 'Department',
  type: 'document',
  description: 'Used to group and filter teachers.',
  fields: [
    mlString('name', 'Name', { required: true }),
    mlSlug(),
    {
      name: 'accentColor',
      title: 'Accent Color',
      type: 'string',
      description: 'Optional hex color (e.g. #8B5A3C) used to tint the department section.',
    },
    orderRankField({ type: 'department', newItemPosition: 'after' }),
  ],
  preview: {
    select: { title: 'name.english', subtitle: 'name.bengali' },
  },
  orderings: [orderRankOrdering],
})
