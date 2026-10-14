import { defineField, defineType } from 'sanity'
import { mlString } from './shared'

// A guardian's words for the homepage (Studio → Guardian reviews). Only reviews with recorded consent are shown,
// word for word; a text in the other language is shown with "(translated)".
export const testimonial = defineType({
  name: 'testimonial',
  title: 'Guardian review',
  type: 'document',
  fields: [
    defineField({
      name: 'originalLanguage',
      title: 'Language the guardian wrote in',
      type: 'string',
      options: { list: [{ title: 'Bengali', value: 'bengali' }, { title: 'English', value: 'english' }], layout: 'radio', direction: 'horizontal' },
      initialValue: 'bengali',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'quote',
      title: 'Their words',
      description: 'Exactly as the guardian wrote them: do not edit. The other language is an optional translation.',
      type: 'object',
      fields: [
        { name: 'bengali', title: 'Bengali', type: 'text', rows: 4 },
        { name: 'english', title: 'English', type: 'text', rows: 4 },
      ],
      validation: (rule) =>
        rule.custom((quote: { bengali?: string; english?: string } | undefined, context) => {
          const lang = (context.document?.originalLanguage as 'bengali' | 'english' | undefined) ?? 'bengali'
          return quote?.[lang]?.trim() ? true : 'Enter the guardian’s words in the language they wrote in.'
        }),
    }),
    mlString('who', 'Who', { required: true }),
    mlString('classLine', 'Child’s class and stage', { required: true }),
    defineField({
      name: 'consent',
      title: 'The guardian agreed to publish these words on the website',
      description: 'Required before the review can appear.',
      type: 'boolean',
      initialValue: false,
    }),
    defineField({
      name: 'consentNote',
      title: 'How and when consent was given',
      description: 'For example: "Phone call with the mother, 20 October 2026".',
      type: 'string',
      validation: (rule) =>
        rule.custom((note: string | undefined, context) => (context.document?.consent && !note?.trim() ? 'Record how and when the guardian agreed.' : true)),
    }),
    defineField({ name: 'show', title: 'Show on the homepage', type: 'boolean', initialValue: true }),
    defineField({ name: 'order', title: 'Order', description: 'Lower numbers come first. The homepage shows the first three.', type: 'number' }),
  ],
  orderings: [{ title: 'Order', name: 'order', by: [{ field: 'order', direction: 'asc' }] }],
  preview: {
    select: { who: 'who.bengali', classLine: 'classLine.bengali', consent: 'consent', show: 'show' },
    prepare: ({ who, classLine, consent, show }) => ({
      title: `${who ?? 'Guardian'}, ${classLine ?? ''}`,
      subtitle: !consent ? 'No consent recorded: not shown' : show === false ? 'Hidden' : 'Shown',
    }),
  },
})
