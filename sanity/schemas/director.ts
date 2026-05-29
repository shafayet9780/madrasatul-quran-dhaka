import { defineType, defineField } from 'sanity'
import {
  mlString,
  mlText,
  mlSlug,
  mlPortable,
  mlStringArray,
  profilePhoto,
  genderField,
  educationField,
  displayOrderField,
  featuredField,
} from './shared'

export const director = defineType({
  name: 'director',
  title: 'Director',
  type: 'document',
  fields: [
    mlString('name', 'Name', { required: true }),
    mlSlug(),
    mlString('designation', 'Designation', { required: true }),
    genderField(),
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
    defineField({
      name: 'signatureName',
      title: 'Signature Name',
      type: 'string',
      description: 'Optional name shown under the message.',
    }),
    displayOrderField(),
    featuredField('Highlight in the navigation mega-menu'),
  ],
  preview: {
    select: { title: 'name.english', subtitle: 'designation.english', media: 'photo' },
  },
  orderings: [
    { title: 'Display Order', name: 'displayOrderAsc', by: [{ field: 'displayOrder', direction: 'asc' }] },
  ],
})
