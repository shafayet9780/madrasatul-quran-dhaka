import { defineArrayMember, defineField, defineType } from 'sanity'
import { mlString, mlText } from './shared'
import { TOPICS, youtubeId, type Topic } from '../../src/lib/gallery/albums'

// The gallery (Studio → Gallery): one album per day or event, its photos and its videos. The gallery page lists the
// dated albums month by month and the all-time ones (the campus, Quran classes, the play spaces) at the end. With text
// below, an album page opens as a short story. Videos stay on the school's YouTube channel; only the link comes here.

const TOPIC_TITLES: Record<Topic, string> = { quran: 'Quran and Hifz', classes: 'Classes', events: 'Events', sports: 'Sports and trips', campus: 'Campus' }

type Doc = { evergreen?: boolean }
type Bi = { bengali?: string; english?: string }

/** A warning when one language is filled in and the other is not: the site shows captions in both. */
const bothLanguages = (value: Bi | undefined) =>
  !value?.bengali?.trim() === !value?.english?.trim() ? true : 'Write it in both languages.'

export const album = defineType({
  name: 'album',
  title: 'Album',
  type: 'document',
  fields: [
    mlString('title', 'Name', { required: true }),
    defineField({
      name: 'slug',
      title: 'Link',
      description: 'The end of the album’s address. Generate it from the English name.',
      type: 'slug',
      options: { source: 'title.english', maxLength: 80 },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'evergreen',
      title: 'All-time album (not one day)',
      description: 'For the campus, the Quran classes or the play spaces: shown under সব সময়ের অ্যালবাম, with no date. Add new photos to it over time.',
      type: 'boolean',
      initialValue: false,
    }),
    defineField({
      name: 'date',
      title: 'Date',
      description: 'The day of the event or the photos. Albums are listed month by month.',
      type: 'date',
      hidden: ({ document }) => Boolean((document as Doc | undefined)?.evergreen),
      validation: (rule) => rule.custom((date, context) => ((context.document as Doc | undefined)?.evergreen || date ? true : 'Add the date, or mark it an all-time album.')),
    }),
    defineField({ name: 'topic', title: 'Topic', type: 'string', options: { list: TOPICS.map((value) => ({ title: TOPIC_TITLES[value], value })), layout: 'radio' }, validation: (rule) => rule.required() }),
    mlText('summary', 'Two lines under the name (optional)', { rows: 2 }),
    defineField({
      name: 'photos',
      title: 'Photos',
      description:
        'No photos of girls above Class 1. Children’s faces are fine. The first photo is the album’s cover (and the large photo when the album has text). Drag to reorder.',
      type: 'array',
      options: { layout: 'grid' },
      of: [
        defineArrayMember({
          type: 'image',
          options: { hotspot: true },
          fields: [
            mlString('alt', 'What the photo shows (for screen readers)', { required: true }),
            defineField({ ...mlString('caption', 'Caption (optional, in both languages)'), validation: (rule) => rule.custom(bothLanguages).warning() }),
          ],
        }),
      ],
    }),
    defineField({
      name: 'videos',
      title: 'Videos',
      description: 'Links to videos on the school’s YouTube channel. No music in videos.',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'albumVideo',
          fields: [
            defineField({
              name: 'url',
              title: 'YouTube link',
              type: 'url',
              validation: (rule) => rule.required().custom((url: string | undefined) => (!url || youtubeId(url) ? true : 'Paste a YouTube video link.')),
            }),
            mlString('title', 'Name', { required: true }),
            defineField({
              name: 'upright',
              title: 'Upright (a short video, 9:16)',
              description: 'Shown in the row of short videos. Links with /shorts/ are upright by themselves.',
              type: 'boolean',
              initialValue: false,
            }),
            defineField({ name: 'length', title: 'Length (for example 8:20)', type: 'string', validation: (rule) => rule.regex(/^\d{1,2}(:\d{2}){1,2}$/, { name: 'minutes:seconds' }) }),
          ],
          preview: { select: { title: 'title.bengali', subtitle: 'url' } },
        }),
      ],
    }),
    defineField({
      name: 'story',
      title: 'Text (optional)',
      description: 'Two or three lines on how the day went, by the office or the class teacher. With text, the album page opens as a short story. Leave a blank line between paragraphs.',
      type: 'object',
      fields: [
        { name: 'bengali', title: 'Bengali', type: 'text', rows: 5 },
        { name: 'english', title: 'English', type: 'text', rows: 5 },
      ],
      validation: (rule) => rule.custom(bothLanguages).warning(),
    }),
    defineField({
      name: 'quote',
      title: 'A teacher’s words (optional)',
      description: 'Word for word, one or two lines. Shown below the text.',
      type: 'object',
      fields: [
        defineField({ ...mlText('text', 'Their words', { rows: 2 }), validation: (rule) => rule.custom(bothLanguages).warning() }),
        mlString('by', 'Name and role (for example উস্তাদ আব্দুল্লাহ, শ্রেণিশিক্ষক)'),
      ],
    }),
    defineField({ name: 'show', title: 'Show on the site', type: 'boolean', initialValue: true }),
  ],
  orderings: [{ title: 'Date, newest first', name: 'dateDesc', by: [{ field: 'date', direction: 'desc' }] }],
  preview: {
    select: { title: 'title.bengali', date: 'date', evergreen: 'evergreen', show: 'show', media: 'photos.0', photos: 'photos', videos: 'videos' },
    prepare: ({ title, date, evergreen, show, media, photos, videos }) => ({
      title: `${show === false ? '(hidden) ' : ''}${title ?? ''}`,
      subtitle: [evergreen ? 'All-time' : date, `${photos?.length ?? 0} photos`, videos?.length ? `${videos.length} videos` : ''].filter(Boolean).join(' · '),
      media,
    }),
  },
})
