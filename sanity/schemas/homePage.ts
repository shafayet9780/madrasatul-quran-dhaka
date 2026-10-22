import { defineArrayMember, defineField, defineType } from 'sanity'
import { mlString, mlText } from './shared'

// The homepage's own content (Studio → Homepage). The routine and the FAQ are optional: while one is empty the site
// shows the wording it was launched with, and an empty photo slot shows the photo it was launched with.

const PARTS = [
  { title: 'Morning', value: 'morning' },
  { title: 'Midday', value: 'midday' },
  { title: 'Afternoon', value: 'afternoon' },
  { title: 'Evening and night', value: 'evening' },
]

const chip = (name: string, title: string, figure = false) =>
  defineField({
    name,
    title,
    type: 'object',
    fields: [
      ...(figure ? [defineField({ name: 'figure', title: 'Figure', type: 'string', description: 'Short, e.g. 50/50 (Bengali pages show Bengali digits).' })] : []),
      mlString('title', 'Line 1 (bold)', { required: true }),
      mlString('note', 'Line 2'),
    ],
  })

const KINDS = [
  { title: 'Quran', value: 'quran' },
  { title: 'Classes', value: 'study' },
  { title: 'Meal', value: 'meal' },
  { title: 'Rest', value: 'rest' },
  { title: 'Salat', value: 'salat' },
  { title: 'Play', value: 'play' },
  { title: 'Home time', value: 'home' },
]

const photo = (name: string, title: string, description?: string) =>
  defineField({
    name,
    title,
    description,
    type: 'image',
    options: { hotspot: true },
    fields: [mlString('alt', 'What the photo shows (for screen readers)', { required: true })],
  })

export const homePage = defineType({
  name: 'homePage',
  title: 'Homepage',
  type: 'document',
  groups: [
    { name: 'top', title: 'Top of the page', default: true },
    { name: 'day', title: 'The day' },
    { name: 'photos', title: 'Photos' },
    { name: 'faq', title: 'FAQ' },
  ],
  fields: [
    defineField({
      name: 'hero',
      title: 'Hero text',
      group: 'top',
      type: 'object',
      options: { collapsible: false },
      description: 'Under the school’s name at the top of the homepage, and the three boxes under the photos (their icons stay).',
      fields: [
        mlString('line', 'The promise (one line)', { required: true }),
        chip('chip1', 'Box 1 (dark, with a figure)', true),
        chip('chip2', 'Box 2'),
        chip('chip3', 'Box 3'),
      ],
    }),
    defineField({
      name: 'heroImages',
      group: 'top',
      title: 'Hero photos',
      description: 'The photos at the top of the homepage, in this order (5 work best).',
      type: 'array',
      validation: (rule) => rule.min(1).max(10),
      of: [
        defineArrayMember({
          type: 'object',
          fields: [
            defineField({ name: 'image', title: 'Photo', type: 'image', options: { hotspot: true }, validation: (rule) => rule.required() }),
            mlString('title', 'What the photo shows (read out by screen readers)'),
            defineField({ name: 'alt', title: 'Fallback description', type: 'string', description: 'Used when the title above is empty.', validation: (rule) => rule.required() }),
          ],
          preview: { select: { title: 'title.bengali', subtitle: 'title.english', media: 'image' } },
        }),
      ],
    }),
    defineField({
      name: 'statistics',
      group: 'top',
      title: 'The school in numbers',
      description: 'The band under the hero. Students and teachers show rounded down with a “+” (130 → ১৩০+), then the student:teacher ratio, then each extra number.',
      type: 'object',
      options: { collapsible: false },
      fields: [
        defineField({ name: 'totalStudents', title: 'Students', type: 'number', validation: (rule) => rule.min(0).integer() }),
        defineField({ name: 'teacherCount', title: 'Teachers', type: 'number', validation: (rule) => rule.min(0).integer() }),
        defineField({
          name: 'achievements',
          title: 'Extra numbers',
          type: 'array',
          of: [
            defineArrayMember({
              type: 'object',
              fields: [mlString('title', 'Label', { required: true }), defineField({ name: 'value', title: 'Value', type: 'string', validation: (rule) => rule.required() })],
              preview: { select: { title: 'title.bengali', subtitle: 'value' } },
            }),
          ],
        }),
      ],
    }),
    defineField({
      name: 'routine',
      group: 'day',
      title: 'A day in hifz day-care',
      description:
        'The routine, by part of the day. Morning steps take clock times; afternoon and evening steps follow the salat (for example "আসরের পর"). Home time is 8:30 pm. Leave empty to keep the launch routine.',
      type: 'array',
      validation: (rule) => rule.max(4),
      of: [
        defineArrayMember({
          type: 'object',
          name: 'routinePart',
          fields: [
            defineField({ name: 'part', title: 'Part of the day', type: 'string', options: { list: PARTS, layout: 'radio', direction: 'horizontal' }, validation: (rule) => rule.required() }),
            mlString('name', 'Heading', { required: true }),
            defineField({
              name: 'steps',
              title: 'Steps',
              type: 'array',
              validation: (rule) => rule.required().min(1),
              of: [
                defineArrayMember({
                  type: 'object',
                  name: 'routineStep',
                  fields: [
                    defineField({ name: 'kind', title: 'Kind (sets the icon and colour)', type: 'string', options: { list: KINDS }, validation: (rule) => rule.required() }),
                    mlString('time', 'Time', { required: true }),
                    mlString('title', 'What happens', { required: true }),
                    mlString('gloss', 'Short explanation (optional, for terms like সবক)'),
                  ],
                  preview: { select: { title: 'title.bengali', subtitle: 'time.bengali' } },
                }),
              ],
            }),
          ],
          preview: { select: { title: 'name.bengali', subtitle: 'part' } },
        }),
      ],
    }),
    defineField({
      name: 'photos',
      title: 'Section photos',
      group: 'photos',
      type: 'object',
      options: { collapsible: false },
      description: 'An empty slot keeps the photo the site was launched with.',
      fields: [
        photo('building', 'The building (campus section)', 'Portrait: it stands beside the play spaces.'),
        photo('entrance', 'The entrance (campus section)'),
        photo('classroom', 'A classroom (campus section)'),
        photo('van', 'The school van (the day)'),
        photo('whyBooks', 'Books (first “why us” card)'),
        photo('whyTeachers', 'Teachers (seventh “why us” card)'),
      ],
    }),
    defineField({
      name: 'playSpaces',
      group: 'photos',
      title: 'Play spaces',
      description: 'Shown beside the building photo in the campus section. Until a photo is added, its name stands in its place.',
      type: 'object',
      fields: [
        photo('roof', 'Girls: the rooftop garden', 'A landscape photo of the rooftop garden.'),
        photo('field', 'Boys: the field next door', 'A landscape photo of the field.'),
      ],
    }),
    defineField({
      name: 'faq',
      group: 'faq',
      title: 'Questions parents ask',
      description: 'Facts only, no fees (point to the admissions page). Leave empty to keep the launch questions.',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'faqItem',
          fields: [mlString('question', 'Question', { required: true }), mlText('answer', 'Answer', { required: true })],
          preview: { select: { title: 'question.bengali' } },
        }),
      ],
    }),
  ],
  preview: { prepare: () => ({ title: 'Homepage' }) },
})
