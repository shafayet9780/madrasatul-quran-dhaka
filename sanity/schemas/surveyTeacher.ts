import { defineField, defineType } from 'sanity'
import { keyField } from './surveyShared'

/** Teachers who can pick their name in a survey. Separate from the public website's teacher profiles. */
export const surveyTeacher = defineType({
  name: 'surveyTeacher',
  title: 'Survey Teacher',
  type: 'document',
  fields: [
    keyField({ uniqueInType: true }),
    defineField({ name: 'name', title: 'Name (Bengali)', type: 'string', validation: (Rule) => Rule.required() }),
    defineField({ name: 'erpId', title: 'ERP ID', type: 'string' }),
    defineField({
      name: 'active',
      title: 'Active',
      description: 'Inactive teachers are left out of new rounds.',
      type: 'boolean',
      initialValue: true,
    }),
  ],
  orderings: [{ title: 'Name', name: 'name', by: [{ field: 'name', direction: 'asc' }] }],
  preview: {
    select: { title: 'name', key: 'key', active: 'active' },
    prepare: ({ title, key, active }) => ({ title, subtitle: active === false ? `${key} · inactive` : key }),
  },
})
