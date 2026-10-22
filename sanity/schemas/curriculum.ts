import { defineArrayMember, defineField, defineType } from 'sanity'
import { mlString, mlText } from './shared'
import { classOrderProblem } from '../../src/lib/curriculum/plan'

// Studio → Curriculum (singleton `curriculum`): the facts behind the homepage's education model, ten-year map and day
// bars, and the curriculum page's stages, table, books by class, goals and at-a-glance box (src/lib/curriculum/plan.ts).
// The wording around them and the drawings stay in the site's code.

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/
const time = (name: string, title: string) =>
  defineField({
    name,
    title,
    type: 'string',
    description: '24-hour, e.g. 07:00 or 20:30.',
    validation: (r) => r.required().custom((v) => !v || TIME.test(v) || 'Write the time as HH:MM, e.g. 08:30.'),
  })
const percent = (name: string, title: string) => defineField({ name, title, type: 'number', validation: (r) => r.required().min(0).max(100).integer() })

const SUBJECTS = [
  { title: 'Bangla', value: 'bangla' },
  { title: 'English', value: 'english' },
  { title: 'Maths', value: 'maths' },
  { title: 'Science', value: 'science' },
  { title: 'BGS', value: 'bgs' },
]

export const curriculum = defineType({
  name: 'curriculum',
  title: 'Curriculum',
  type: 'document',
  groups: [
    { name: 'stages', title: 'Stages', default: true },
    { name: 'classes', title: 'Classes' },
    { name: 'goals', title: 'Goals' },
    { name: 'glance', title: 'At a glance' },
  ],
  fields: [
    defineField({
      name: 'stages',
      title: 'Stages',
      group: 'stages',
      description: 'Always three, in order: the drawings are made for three.',
      type: 'array',
      validation: (r) => r.required().length(3),
      of: [
        defineArrayMember({
          type: 'object',
          name: 'stage',
          fields: [
            mlString('name', 'Name', { required: true }),
            { ...mlString('care', 'Care note'), description: 'e.g. Day-care, Dakhil included.' },
            { ...mlString('classes', 'Classes', { required: true }), description: 'e.g. Classes 2 to 5 / দ্বিতীয় থেকে পঞ্চম.' },
            time('start', 'School day starts'),
            time('end', 'School day ends'),
            percent('quran', 'Quran %'),
            percent('arabic', 'Arabic %'),
            percent('general', 'General %'),
            defineField({ name: 'arabicIncludesIslam', title: 'The Arabic share counts Islamic studies too', type: 'boolean', initialValue: false }),
            { ...mlText('note', 'Note', { rows: 2 }), description: 'Optional, under the stage on the curriculum page.' },
          ],
          validation: (r) =>
            r.custom((s: { quran?: number; arabic?: number; general?: number } | undefined) =>
              !s || (s.quran ?? 0) + (s.arabic ?? 0) + (s.general ?? 0) === 100 || 'The three shares must add up to 100.',
            ),
          preview: { select: { title: 'name.english', subtitle: 'classes.english' } },
        }),
      ],
    }),
    defineField({
      name: 'classes',
      title: 'Classes',
      group: 'classes',
      description: 'One row per class, from the youngest, in order. The ten-year map, the class table, the books by class and each strand’s class range are drawn from these.',
      type: 'array',
      validation: (r) => r.custom((rows: { stage?: number; board?: string }[] | undefined) => classOrderProblem(rows) ?? true),
      of: [
        defineArrayMember({
          type: 'object',
          name: 'classRow',
          fields: [
            { ...mlString('name', 'Name', { required: true }), description: 'Short, as on the map: Nursery, KG, Class 1 / নার্সারি, কেজি, ১ম.' },
            defineField({ name: 'age', title: 'Age from', type: 'number', description: 'e.g. 5 shows “5+ yrs”. Empty: no age shown.', validation: (r) => r.min(0).max(30).integer() }),
            defineField({ name: 'stage', title: 'Stage', type: 'number', options: { list: [1, 2, 3], layout: 'radio', direction: 'horizontal' }, validation: (r) => r.required() }),
            defineField({
              name: 'board',
              title: 'Board year',
              type: 'string',
              description: 'Dakhil and Mutawassita years follow the board’s syllabus: the map and the table show them as one block each, and the fields below are not used.',
              options: { list: [{ title: 'Dakhil', value: 'dakhil' }, { title: 'Mutawassita', value: 'mutawassita' }], layout: 'radio', direction: 'horizontal' },
            }),
            { ...mlString('quran', 'Quran portion'), description: 'e.g. Qaida, Hifz 1. Empty once the Quran strand ends.', hidden: ({ parent }: { parent?: { board?: string } }) => !!parent?.board },
            defineField({ name: 'bookLevel', title: 'Book level', type: 'string', description: 'As the Arabic and Islamic studies books are numbered: N, KG, 1 … 8.', hidden: ({ parent }) => !!parent?.board }),
            { ...mlString('arabicBook', 'Arabic: book'), hidden: ({ parent }: { parent?: { board?: string } }) => !!parent?.board },
            { ...mlString('arabicFocus', 'Arabic: what it covers'), hidden: ({ parent }: { parent?: { board?: string } }) => !!parent?.board },
            { ...mlString('islamBook', 'Islamic studies: book'), hidden: ({ parent }: { parent?: { board?: string } }) => !!parent?.board },
            { ...mlString('islamFocus', 'Islamic studies: what it covers'), hidden: ({ parent }: { parent?: { board?: string } }) => !!parent?.board },
            defineField({ name: 'islamInArabic', title: 'Islamic studies taught in Arabic', type: 'boolean', initialValue: false, hidden: ({ parent }) => !!parent?.board }),
            defineField({
              name: 'general',
              title: 'General subjects',
              type: 'array',
              of: [{ type: 'string' }],
              options: { list: SUBJECTS, layout: 'grid' },
              hidden: ({ parent }) => !!parent?.board,
            }),
            defineField({
              name: 'generalBooks',
              title: 'General books by',
              type: 'string',
              options: { list: [{ title: 'NCTB', value: 'nctb' }, { title: 'AQVI', value: 'aqvi' }], layout: 'radio', direction: 'horizontal' },
              initialValue: 'nctb',
              hidden: ({ parent }) => !!parent?.board,
            }),
            defineField({ name: 'limited', title: 'General subjects limited (during hifz, on a special syllabus)', type: 'boolean', initialValue: false, hidden: ({ parent }) => !!parent?.board }),
          ],
          preview: {
            select: { title: 'name.english', bn: 'name.bengali', stage: 'stage', board: 'board' },
            prepare: ({ title, bn, stage, board }) => ({ title: `${title ?? ''} · ${bn ?? ''}`, subtitle: `Stage ${stage ?? '?'}${board ? ` · ${board}` : ''}` }),
          },
        }),
      ],
    }),
    defineField({
      name: 'goals',
      title: 'Ten-year goals',
      group: 'goals',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'goal',
          fields: [
            mlString('title', 'Title', { required: true }),
            defineField({ name: 'figure', title: 'Figure', type: 'string', description: 'Optional, e.g. 90%+. A goal with a figure is tagged “Goal” (a target, not a result). Bengali pages show Bengali digits.' }),
            mlText('text', 'Text', { required: true, rows: 3 }),
          ],
          preview: { select: { title: 'title.english', subtitle: 'figure' } },
        }),
      ],
    }),
    defineField({
      name: 'glance',
      title: 'At a glance',
      group: 'glance',
      description: 'The box at the top of the curriculum page.',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'glanceItem',
          fields: [mlString('label', 'Label', { required: true }), mlString('value', 'Value', { required: true })],
          preview: { select: { title: 'label.english', subtitle: 'value.english' } },
        }),
      ],
    }),
  ],
  preview: { prepare: () => ({ title: 'Curriculum' }) },
})
