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
      name: 'layout',
      title: 'Layout',
      description: 'How guardians rate the subjects. Fixed for a round once it opens.',
      type: 'string',
      options: {
        list: [
          { title: 'One subject per screen, all questions', value: 'by-subject' },
          { title: 'One question per screen, all subjects', value: 'by-question' },
        ],
        layout: 'radio',
      },
      hidden: ({ document }) => document?.kind !== 'G1',
    }),
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
            defineField({
              name: 'shortLabel',
              title: 'Short label',
              description: 'A few words for review tables and reports, e.g. "মনোযোগ".',
              type: 'string',
            }),
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
                  if (options.some((o) => (o as { key?: string }).key === 'na')) return 'The key "na" is reserved for "not applicable".'
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
            defineField({
              name: 'allowNA',
              title: 'Allow "not applicable"',
              type: 'boolean',
              initialValue: false,
              validation: (Rule) =>
                Rule.custom((value, context) =>
                  value && (context.document as { kind?: string })?.kind !== 'G2' ? '"Not applicable" is only for G2 (guardian rates own child).' : true
                ),
            }),
            defineField({
              name: 'naLabel',
              title: '"Not applicable" label',
              description: 'e.g. প্রযোজ্য নয় (ডে কেয়ার). Empty = প্রযোজ্য নয়.',
              type: 'string',
              hidden: ({ parent }) => !parent?.allowNA,
            }),
            defineField({
              name: 'unscored',
              title: 'Not marked (answer shown only)',
              description: 'মার্ক গণনা হবে না — শুধু উত্তর দেখানো হবে। The answer is kept and shown in reports (e.g. how many study 2 hours) but left out of every average, gap and flag. Option marks are ignored.',
              type: 'boolean',
              initialValue: false,
              validation: (Rule) =>
                Rule.custom((value, context) =>
                  value && (context.document as { kind?: string })?.kind !== 'G2' ? '"Not marked" is only for G2 (guardian rates own child).' : true
                ),
            }),
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
