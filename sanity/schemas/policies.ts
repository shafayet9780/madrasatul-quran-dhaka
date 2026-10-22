import { defineArrayMember, defineField, defineType } from 'sanity'
import { mlString, mlText } from './shared'

const policy = (name: string, title: string) =>
  defineField({
    name,
    title,
    type: 'object',
    options: { collapsible: true },
    fields: [
      mlString('title', 'Title', { required: true }),
      mlText('intro', 'Opening paragraph', { rows: 3 }),
      defineField({
        name: 'sections',
        title: 'Sections',
        type: 'array',
        of: [
          defineArrayMember({
            type: 'object',
            fields: [mlString('heading', 'Heading', { required: true }), mlText('body', 'Text', { rows: 5, required: true })],
            preview: { select: { title: 'heading.english', subtitle: 'heading.bengali' } },
          }),
        ],
      }),
    ],
  })

/**
 * Studio → Policies (singleton `policies`): the privacy and cookie pages. In any text, {email} becomes the school's
 * first email in School details.
 */
export const policies = defineType({
  name: 'policies',
  title: 'Privacy & cookie policies',
  type: 'document',
  fields: [
    defineField({
      name: 'updatedAt',
      title: 'Last updated',
      type: 'date',
      description: 'Shown on both pages. Change it whenever the text changes.',
      validation: (r) => r.required(),
    }),
    { ...policy('privacy', 'Privacy policy'), description: 'Write {email} where the school’s email should go (from School details).' },
    policy('cookies', 'Cookie policy'),
  ],
  preview: { prepare: () => ({ title: 'Privacy & cookie policies' }) },
})
