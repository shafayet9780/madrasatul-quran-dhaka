import { defineField, defineType } from 'sanity'
import { keyField } from './surveyShared'

export const surveyArea = defineType({
  name: 'surveyArea',
  title: 'Survey Area',
  type: 'document',
  fields: [
    keyField({ uniqueInType: true }),
    defineField({ name: 'name', title: 'Name (Bengali)', type: 'string', validation: (Rule) => Rule.required() }),
    defineField({
      name: 'group',
      title: 'Group',
      type: 'string',
      options: {
        list: [
          { title: 'Student (G2 ↔ T1)', value: 'student' },
          { title: 'Teaching quality (G1)', value: 'teaching' },
        ],
        layout: 'radio',
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({ name: 'order', title: 'Order', type: 'number' }),
  ],
  orderings: [{ title: 'Order', name: 'order', by: [{ field: 'group', direction: 'asc' }, { field: 'order', direction: 'asc' }] }],
  preview: { select: { title: 'name', subtitle: 'group' } },
})
