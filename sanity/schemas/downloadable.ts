import { defineField, defineType } from 'sanity'
import { displayOrderField, mlPortable, mlString, mlText } from './shared'
import { isStableDownloadSlug } from '../../src/lib/downloads/validation'

export const downloadable = defineType({
  name: 'downloadable',
  title: 'Downloadable',
  type: 'document',
  fields: [
    mlString('title', 'Title', { required: true }),
    mlText('summary', 'Summary', { rows: 3 }),
    mlPortable('body', 'Body'),
    defineField({
      name: 'slug',
      title: 'Stable URL Slug',
      type: 'slug',
      description: 'Locale-independent. Avoid changing this after sharing links.',
      options: { source: 'title.english', maxLength: 96 },
      validation: (Rule) =>
        Rule.required().custom((value) =>
          !value?.current || isStableDownloadSlug(value.current)
            ? true
            : 'Use lowercase letters, numbers, and hyphens only',
        ),
    }),
    defineField({
      name: 'category',
      title: 'Category',
      type: 'reference',
      to: [{ type: 'downloadCategory' }],
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'file',
      title: 'File',
      type: 'vercelBlobFile',
      options: { uploadPurpose: 'restricted-download' },
      validation: (Rule) => Rule.required(),
    } as never),
    defineField({
      name: 'coverImage',
      title: 'Optional Cover Image',
      type: 'image',
      options: { hotspot: true },
      fields: [
        defineField({
          name: 'alt',
          title: 'Alternative Text',
          type: 'string',
          validation: (Rule) => Rule.required(),
        }),
      ],
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
    select: {
      title: 'title.english',
      subtitle: 'category.name.english',
      media: 'coverImage',
    },
  },
})
