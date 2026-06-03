import { defineType } from 'sanity'
import { mlString, mlText, profilePhoto, genderField, displayOrderField, featuredField } from './shared'

export const advisor = defineType({
  name: 'advisor',
  title: 'Advisor',
  type: 'document',
  fields: [
    mlString('name', 'Name', { required: true }),
    genderField(),
    profilePhoto(),
    mlText('summary', 'Short Description', { rows: 3, required: true }),
    displayOrderField(),
    featuredField('Show this advisor in the navigation mega-menu'),
  ],
  preview: {
    select: { title: 'name.english', subtitle: 'summary.english', media: 'photo' },
  },
  orderings: [
    { title: 'Display Order', name: 'displayOrderAsc', by: [{ field: 'displayOrder', direction: 'asc' }] },
  ],
})
