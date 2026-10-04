import { defineArrayMember, defineField, defineType } from 'sanity'
import { keyField, uniqueItemKeys } from './surveyShared'

const KINDS = [
  { title: 'T1 · Teacher rates students', value: 'T1' },
  { title: 'G1 · Guardian rates teaching', value: 'G1' },
  { title: 'G2 · Guardian rates own child', value: 'G2' },
]

export const surveyTemplate = defineType({
  name: 'surveyTemplate',
  title: 'Survey Template',
  type: 'document',
  description: 'Changing marks or the scale means a new template version. Open rounds keep their own copy.',
  fields: [
    defineField({
      name: 'kind',
      title: 'Survey',
      type: 'string',
      options: { list: KINDS, layout: 'radio' },
      validation: (Rule) => Rule.required(),
    }),
    defineField({ name: 'version', title: 'Version', type: 'number', initialValue: 1, validation: (Rule) => Rule.required().integer().min(1) }),
    defineField({ name: 'title', title: 'Title (Bengali)', type: 'string', validation: (Rule) => Rule.required() }),
    defineField({ name: 'intro', title: 'Intro (Bengali)', type: 'text', rows: 3 }),
    defineField({ name: 'commentLabel', title: 'Comment label', description: 'Leave empty for no overall comment box.', type: 'string' }),
    defineField({
      name: 'scale',
      title: 'Marks',
      description: 'Marks shown for rating questions, best first.',
      type: 'array',
      of: [{ type: 'number' }],
      initialValue: [10, 8, 6, 4],
      validation: (Rule) => Rule.required().min(2).unique(),
    }),
    defineField({
      name: 'questions',
      title: 'Questions',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'surveyQuestion',
          fields: [
            keyField(),
            defineField({ name: 'text', title: 'Question (Bengali)', type: 'string', validation: (Rule) => Rule.required() }),
            defineField({ name: 'hint', title: 'Hint', description: 'Shown under the question, e.g. for reversed wording.', type: 'string' }),
            defineField({
              name: 'type',
              title: 'Answer type',
              type: 'string',
              options: {
                list: [
                  { title: 'Marks (from the scale)', value: 'marks' },
                  { title: 'Descriptive options (hidden marks)', value: 'options' },
                ],
                layout: 'radio',
              },
              initialValue: 'marks',
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: 'options',
              title: 'Options',
              description: 'Hidden marks: 3 options → 10/7/4, 4 → 10/8/6/4, 5 → 10/8.5/7/5.5/4.',
              type: 'array',
              hidden: ({ parent }) => parent?.type !== 'options',
              of: [
                defineArrayMember({
                  type: 'object',
                  name: 'surveyOption',
                  fields: [
                    keyField(),
                    defineField({ name: 'label', title: 'Label (Bengali)', type: 'string', validation: (Rule) => Rule.required() }),
                    defineField({ name: 'mark', title: 'Mark', type: 'number', validation: (Rule) => Rule.required().min(0).max(10) }),
                  ],
                  preview: { select: { title: 'label', subtitle: 'mark' } },
                }),
              ],
              validation: (Rule) =>
                Rule.custom((options, context) => {
                  if ((context.parent as { type?: string })?.type !== 'options') return true
                  if (!options || options.length < 2) return 'Add at least two options.'
                  return uniqueItemKeys(options)
                }),
            }),
            defineField({
              name: 'area',
              title: 'Area',
              type: 'reference',
              to: [{ type: 'surveyArea' }],
              validation: (Rule) => Rule.required(),
            }),
            defineField({ name: 'required', title: 'Required', type: 'boolean', initialValue: true }),
            defineField({ name: 'allowNA', title: 'Allow "not applicable"', type: 'boolean', initialValue: false }),
          ],
          preview: { select: { title: 'text', subtitle: 'key' } },
        }),
      ],
      validation: (Rule) => Rule.required().min(1).custom(uniqueItemKeys),
    }),
  ],
  preview: {
    select: { title: 'title', kind: 'kind', version: 'version' },
    prepare: ({ title, kind, version }) => ({ title, subtitle: `${kind} · v${version}` }),
  },
})
