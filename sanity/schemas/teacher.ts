import { defineType, defineField } from 'sanity'
import { orderRankField, orderRankOrdering } from '@sanity/orderable-document-list'
import {
  mlString,
  mlText,
  mlSlug,
  mlPortable,
  mlStringArray,
  profilePhoto,
  genderField,
  educationField,
  seniorityField,
} from './shared'

export const teacher = defineType({
  name: 'teacher',
  title: 'Teacher',
  type: 'document',
  fields: [
    mlString('name', 'Name', { required: true }),
    mlSlug(),
    mlString('designation', 'Designation'),
    seniorityField([
      { title: 'Head of Department', value: 'head_of_department' },
      { title: 'Senior Teacher', value: 'senior_teacher' },
      { title: 'Teacher', value: 'teacher' },
      { title: 'Assistant Teacher', value: 'assistant_teacher' },
    ]),
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
    orderRankField({ type: 'teacher', newItemPosition: 'after' }),
    defineField({
      name: 'showDetailPage',
      title: 'Enable Detail Page',
      type: 'boolean',
      description: 'If off, this profile shows as a list card only — no clickable detail page.',
      initialValue: true,
    }),
  ],
  preview: {
    select: { title: 'name.english', subtitle: 'department.name.english', media: 'photo' },
  },
  orderings: [
    orderRankOrdering,
  ],
})
