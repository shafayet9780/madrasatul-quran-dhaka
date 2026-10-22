import { defineField, defineType } from 'sanity';
import { admissionFormFields } from './admissionForm';

export const preAdmissionForm = defineType({
  name: 'preAdmissionForm',
  title: 'Pre-Admission Form',
  type: 'document',
  groups: [
    { name: 'form', title: 'Form 2027', default: true },
    { name: 'cycle', title: 'Cycle 2027' },
  ],
  fields: [
    ...admissionFormFields,
    defineField({
      name: 'formSettings',
      group: ['form', 'cycle'],
      title: 'Form Settings',
      type: 'object',
      fields: [
        {
          name: 'isEnabled',
          title: 'Form open',
          type: 'boolean',
          description: 'Turn on to take applications; the dates in Cycle settings still apply.',
          initialValue: true,
        },
      ],
    }),
    defineField({
      name: 'declarationText',
      group: 'form',
      title: 'Final Declaration Text',
      type: 'object',
      fields: [
        {
          name: 'bengali',
          title: 'Bengali Declaration',
          type: 'text',
          rows: 5,
          validation: Rule => Rule.required(),
        },
        {
          name: 'english',
          title: 'English Declaration',
          type: 'text',
          rows: 5,
          validation: Rule => Rule.required(),
        },
      ],
    }),
  ],
  preview: {
    select: { open: 'formSettings.isEnabled' },
    prepare: ({ open }) => ({ title: 'Pre-Admission Form', subtitle: open ? 'Open' : 'Closed' }),
  },
});
