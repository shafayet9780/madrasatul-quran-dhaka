import { defineField, defineType } from 'sanity'

export const surveyRound = defineType({
  name: 'surveyRound',
  title: 'Survey Round',
  type: 'document',
  description:
    'A planned round. "Open round" copies the template, classes and teachers; after that, dates are changed from the admin rounds page.',
  fields: [
    defineField({ name: 'label', title: 'Label (Bengali)', description: 'e.g. অক্টোবর ২০২৬', type: 'string', validation: (Rule) => Rule.required() }),
    defineField({
      name: 'template',
      title: 'Template',
      type: 'reference',
      to: [{ type: 'surveyTemplate' }],
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Link name',
      description: 'Part of the survey link, e.g. t1-2026-10.',
      type: 'slug',
      validation: (Rule) =>
        Rule.required().custom((slug) =>
          !slug?.current || /^[a-z0-9][a-z0-9-]*$/.test(slug.current) ? true : 'Use lowercase letters, numbers and dashes.'
        ),
    }),
    defineField({ name: 'plannedOpensAt', title: 'Opens at', type: 'datetime', validation: (Rule) => Rule.required() }),
    defineField({
      name: 'plannedClosesAt',
      title: 'Closes at',
      type: 'datetime',
      validation: (Rule) =>
        Rule.required().custom((closes, context) => {
          const opens = (context.document as { plannedOpensAt?: string })?.plannedOpensAt
          return !closes || !opens || closes > opens ? true : 'Must be after the opening time.'
        }),
    }),
  ],
  orderings: [{ title: 'Opens at', name: 'opens', by: [{ field: 'plannedOpensAt', direction: 'desc' }] }],
  preview: {
    select: { title: 'label', kind: 'template.kind', slug: 'slug.current' },
    prepare: ({ title, kind, slug }) => ({ title, subtitle: [kind, slug].filter(Boolean).join(' · ') }),
  },
})
