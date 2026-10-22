import { defineType, defineField } from 'sanity'
import { orderRankField, orderRankOrdering } from '@sanity/orderable-document-list'
import {
  mlString,
  mlText,
  mlSlug,
  mlPortable,
  mlStringArray,
  profilePhoto,
  educationField,
} from './shared'

export const director = defineType({
  name: 'director',
  title: 'Director',
  type: 'document',
  fields: [
    mlString('name', 'Name', { required: true }),
    mlSlug(),
    mlString('designation', 'Designation', { required: true }),
    profilePhoto(),
    mlText('summary', 'Short Summary', { rows: 2 }),
    mlPortable('message', "Director's Message", 'A welcome / vision message shown prominently on the profile.'),
    mlPortable('fullBio', 'Full Biography'),
    mlStringArray('qualifications', 'Qualifications'),
    educationField(),
    defineField({
      name: 'socialLinks',
      title: 'Social / Contact Links',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            {
              name: 'platform',
              title: 'Platform',
              type: 'string',
              options: {
                list: [
                  { title: 'Email', value: 'email' },
                  { title: 'Facebook', value: 'facebook' },
                  { title: 'LinkedIn', value: 'linkedin' },
                  { title: 'Twitter / X', value: 'twitter' },
                  { title: 'Website', value: 'website' },
                ],
              },
              validation: (Rule) => Rule.required(),
            },
            { name: 'url', title: 'URL', type: 'url', validation: (Rule) => Rule.required() },
          ],
          preview: { select: { title: 'platform', subtitle: 'url' } },
        },
      ],
    }),
    orderRankField({ type: 'director', newItemPosition: 'after' }),
    defineField({
      name: 'showDetailPage',
      title: 'Enable Detail Page',
      type: 'boolean',
      description: 'If off, this profile shows as a list card only — no clickable detail page.',
      initialValue: true,
    }),
  ],
  preview: {
    select: { title: 'name.english', subtitle: 'designation.english', media: 'photo' },
  },
  orderings: [orderRankOrdering],
})
