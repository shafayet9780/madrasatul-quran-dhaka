import { defineField, defineType } from 'sanity'
import { displayOrderField, mlString, mlText } from './shared'
import { isStableDownloadSlug } from '../../src/lib/downloads/validation'

export const downloadCategory = defineType({
  name: 'downloadCategory',
  title: 'Download Category',
  type: 'document',
  fields: [
    mlString('name', 'Name', { required: true }),
    mlText('description', 'Description'),
    defineField({
      name: 'slug',
      title: 'Stable URL Slug',
      type: 'slug',
      description: 'Locale-independent. Avoid changing this after sharing links.',
      options: { source: 'name.english', maxLength: 96 },
      validation: (Rule) =>
        Rule.required().custom((value) =>
          !value?.current || isStableDownloadSlug(value.current)
            ? true
            : 'Use lowercase letters, numbers, and hyphens only',
        ),
    }),
    displayOrderField(),
    defineField({
      name: 'shareVersion',
      title: 'Share Version',
      type: 'number',
      initialValue: 1,
      hidden: true,
      readOnly: true,
    }),
  ],
  preview: {
    select: { title: 'name.english', subtitle: 'name.bengali' },
  },
})
