import { defineArrayMember, defineField, defineType } from 'sanity'
import { mlString, mlText } from './shared'

// The Campus page (Studio → Campus: a day): one school day, stop by stop, from the metro in the morning to home time
// at night. Each stop is a time and a place. The animation follows the kind; editors never pick effects. While the list
// is empty the site shows the day it was launched with (src/lib/campus/launch-day.ts).

const STOP_KINDS = [
  { title: 'From the metro (the walk is drawn)', value: 'approach' },
  { title: 'The van arrives (drawn; its photo pops in)', value: 'arrive' },
  { title: 'The entrance (the door opens into the photo)', value: 'entrance' },
  { title: 'A floor or a class', value: 'floor' },
  { title: 'Several rooms (the photos change as the reader scrolls)', value: 'rooms' },
  { title: 'The van leaves (drawn)', value: 'leave' },
  { title: 'Moments in turn (salat, meal, sleep…)', value: 'moments' },
  { title: 'The roof (the photo opens from the sky down)', value: 'roof' },
  { title: 'The field (the photo comes in from the side)', value: 'field' },
  { title: 'Home time (the evening photo pulls back)', value: 'exit' },
  { title: 'Other (a photo)', value: 'other' },
]

/** Kinds drawn on the stage; every other kind shows its photo, and is hidden until it has one. */
const DRAWN = ['approach', 'arrive', 'leave', 'moments']

const SKIES = [
  { title: 'Dawn', value: 'dawn' },
  { title: 'Morning', value: 'morning' },
  { title: 'Day', value: 'day' },
  { title: 'Afternoon', value: 'afternoon' },
  { title: 'Late afternoon', value: 'late' },
  { title: 'Dusk', value: 'dusk' },
  { title: 'Night', value: 'night' },
]

const GROUPS = [
  { title: 'Pre-Hifz', value: 'preHifz' },
  { title: 'Hifz', value: 'hifz' },
  { title: 'After-Hifz', value: 'afterHifz' },
]

const ICONS = [
  { title: 'Salat', value: 'salat' },
  { title: 'Shower', value: 'bath' },
  { title: 'Meal', value: 'meal' },
  { title: 'Sleep', value: 'sleep' },
  { title: 'Reading', value: 'read' },
  { title: 'Revision', value: 'revise' },
  { title: 'Play', value: 'play' },
  { title: 'Home', value: 'home' },
]

type Parent = { kind?: string }

export const campusDay = defineType({
  name: 'campusDay',
  title: 'Campus: a day',
  type: 'document',
  fields: [
    defineField({
      name: 'stops',
      title: 'Stops',
      description:
        'The day in order, from the metro to home time. Keep the routine’s real order. A stop that shows a photo is hidden until it has one; the lift lists only the floors used here. While this list is empty the site shows the day it launched with; once it has stops, only these show.',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'campusStop',
          fields: [
            defineField({ name: 'kind', title: 'Kind (sets the animation)', type: 'string', options: { list: STOP_KINDS }, validation: (rule) => rule.required() }),
            defineField({ name: 'show', title: 'Show on the site', type: 'boolean', initialValue: true }),
            mlString('label', 'Time line above the heading (for example সকাল ৭:০০)', { required: true }),
            mlString('place', 'Place (for example ৩য় তলা)'),
            defineField({
              name: 'floor',
              title: 'Floor number',
              description: '0 is the ground floor. Puts the stop on the lift; leave empty outside the building. The roof kind is on the lift by itself.',
              type: 'number',
              validation: (rule) => rule.integer().min(0).max(20),
            }),
            mlString('title', 'Heading', { required: true }),
            mlText('text', 'Text (one or two lines)', { required: true }),
            defineField({
              name: 'clock',
              title: 'On the stage’s clock',
              description:
                'One row per moment of the stop: the big time (or a part of the day such as আসরের পর), the small line above it, the sky and who is in school. Several rows play in turn as the reader scrolls.',
              type: 'array',
              validation: (rule) => rule.required().min(1).max(4),
              of: [
                defineArrayMember({
                  type: 'object',
                  name: 'campusBeat',
                  fields: [
                    mlString('time', 'Time (big)', { required: true }),
                    mlString('part', 'Part of the day (small, above)', { required: true }),
                    defineField({ name: 'sky', title: 'Sky', type: 'string', options: { list: SKIES }, validation: (rule) => rule.required() }),
                    defineField({ name: 'groups', title: 'Who is in school', type: 'array', of: [{ type: 'string' }], options: { list: GROUPS, layout: 'grid' } }),
                  ],
                  preview: { select: { title: 'time.bengali', subtitle: 'sky' } },
                }),
              ],
            }),
            defineField({
              name: 'moments',
              title: 'Moments (light up in turn)',
              type: 'array',
              hidden: ({ parent }: { parent?: Parent }) => parent?.kind !== 'moments',
              validation: (rule) =>
                rule.max(4).custom((moments: unknown[] | undefined, context) =>
                  (context.parent as Parent | undefined)?.kind === 'moments' && !moments?.length ? 'Add at least one moment.' : true,
                ),
              of: [
                defineArrayMember({
                  type: 'object',
                  name: 'campusMoment',
                  fields: [
                    defineField({ name: 'icon', title: 'Icon', type: 'string', options: { list: ICONS }, validation: (rule) => rule.required() }),
                    mlString('label', 'Label', { required: true }),
                  ],
                  preview: { select: { title: 'label.bengali', subtitle: 'icon' } },
                }),
              ],
            }),
            defineField({
              name: 'photos',
              title: 'Photos (landscape)',
              description: 'One to three. Several play in turn on the Several rooms kind, each with its name.',
              type: 'array',
              validation: (rule) => [
                rule.max(3),
                rule
                  .custom((photos: unknown[] | undefined, context) => {
                    const kind = (context.parent as Parent | undefined)?.kind
                    return kind && !DRAWN.includes(kind) && !photos?.length ? 'Hidden on the site until it has a photo.' : true
                  })
                  .warning(),
              ],
              of: [
                defineArrayMember({
                  type: 'image',
                  options: { hotspot: true },
                  fields: [mlString('alt', 'What the photo shows (for screen readers)', { required: true }), mlString('name', 'Name on the photo (for example সভাকক্ষ)')],
                }),
              ],
            }),
          ],
          preview: {
            select: { title: 'title.bengali', label: 'label.bengali', kind: 'kind', show: 'show', media: 'photos.0' },
            prepare: ({ title, label, kind, show, media }) => ({
              title: `${show === false ? '(hidden) ' : ''}${title ?? ''}`,
              subtitle: [label, kind].filter(Boolean).join(' · '),
              media,
            }),
          },
        }),
      ],
    }),
  ],
  preview: { prepare: () => ({ title: 'Campus: a day' }) },
})
