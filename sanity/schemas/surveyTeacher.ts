import { defineField, defineType } from 'sanity'
import { keyField } from './surveyShared'

/** Teachers who can answer a survey; they start it by typing their ERP ID. Separate from the public website's teacher profiles. */
export const surveyTeacher = defineType({
  name: 'surveyTeacher',
  title: 'Survey Teacher',
  type: 'document',
  fields: [
    {
      ...keyField({ uniqueInType: true }),
      title: 'ERP ID',
      description: 'The ID on the teacher\'s ID card (e.g. 20099). Teachers type it to start a survey. It cannot change after publishing.',
    },
    defineField({ name: 'name', title: 'Name (Bengali)', type: 'string', validation: (Rule) => Rule.required() }),
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
