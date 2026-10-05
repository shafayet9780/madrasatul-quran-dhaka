import { defineArrayMember, defineField, defineType } from 'sanity'
import { keyField, uniqueItemKeys } from './surveyShared'

export const surveyClass = defineType({
  name: 'surveyClass',
  title: 'Survey Class',
  type: 'document',
  fields: [
    keyField({ uniqueInType: true }),
    defineField({ name: 'name', title: 'Name (Bengali)', type: 'string', validation: (Rule) => Rule.required() }),
    defineField({ name: 'order', title: 'Order', type: 'number', validation: (Rule) => Rule.required() }),
    defineField({
      name: 'erpClassNames',
      title: 'ERP class names',
      description: 'Class labels in the ERP export that map to this class, e.g. "Nursery".',
      type: 'array',
      of: [{ type: 'string' }],
      validation: (Rule) => Rule.required().min(1).unique(),
    }),
    defineField({
      name: 'sections',
      title: 'Sections',
      description: 'Leave empty when the class has no sections.',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'surveySection',
          fields: [
            keyField(),
            defineField({ name: 'name', title: 'Name', type: 'string', validation: (Rule) => Rule.required() }),
            defineField({
              name: 'erpSectionNames',
              title: 'ERP section names',
              description: 'Section labels in the ERP export, e.g. "Section A".',
              type: 'array',
              of: [{ type: 'string' }],
              validation: (Rule) => Rule.unique(),
            }),
          ],
          preview: { select: { title: 'name', subtitle: 'key' } },
        }),
      ],
      validation: (Rule) => Rule.custom(uniqueItemKeys),
    }),
    defineField({
      name: 'subjects',
      title: 'Subjects',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'surveySubject',
          fields: [
            keyField(),
            defineField({ name: 'name', title: 'Name (Bengali)', type: 'string', validation: (Rule) => Rule.required() }),
          ],
          preview: { select: { title: 'name', subtitle: 'key' } },
        }),
      ],
      validation: (Rule) => Rule.custom(uniqueItemKeys),
    }),
  ],
  orderings: [{ title: 'Order', name: 'order', by: [{ field: 'order', direction: 'asc' }] }],
  preview: {
    select: { title: 'name', sections: 'sections', subjects: 'subjects' },
    prepare: ({ title, sections, subjects }) => ({
      title,
      subtitle: `${sections?.length ?? 0} sections · ${subjects?.length ?? 0} subjects`,
    }),
  },
})
