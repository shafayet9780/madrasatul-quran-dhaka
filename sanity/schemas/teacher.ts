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

export const teacher = defineType({
  name: 'teacher',
  title: 'Teacher',
  type: 'document',
  fields: [
    mlString('name', 'Name', { required: true }),
    mlSlug(),
    mlString('designation', 'Designation'),
    genderField(),
    defineField({
      name: 'department',
      title: 'Department',
      type: 'reference',
      to: [{ type: 'department' }],
      validation: (Rule) => Rule.required(),
    }),
    profilePhoto(),
    mlText('summary', 'Short Summary', { rows: 2 }),
    mlPortable('fullBio', 'Full Biography'),
    mlStringArray('subjects', 'Subjects Taught'),
    mlStringArray('qualifications', 'Qualifications'),
    defineField({
      name: 'specializations',
      title: 'Specializations / Achievements',
      type: 'array',
      of: [{ type: 'string' }],
    }),
    defineField({
      name: 'yearsOfExperience',
      title: 'Years of Experience',
      type: 'number',
      validation: (Rule) => Rule.min(0),
    }),
    educationField(),
    displayOrderField(),
    featuredField(),
  ],
  preview: {
    select: { title: 'name.english', subtitle: 'department.name.english', media: 'photo' },
  },
  orderings: [
    { title: 'Display Order', name: 'displayOrderAsc', by: [{ field: 'displayOrder', direction: 'asc' }] },
  ],
})
