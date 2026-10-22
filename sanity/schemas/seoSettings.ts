import { defineField, defineType } from 'sanity'
import { mlString, mlText } from './shared'

/** The main pages with their own title and description in Studio → Search & sharing (src/lib/page-seo.ts). */
export const SEO_PAGES = [
  ['home', 'Homepage'],
  ['about', 'About us'],
  ['admissions', 'Admissions'],
  ['preAdmission', 'Pre-admission ({session} becomes the year, e.g. 2027; the school’s name is added after the title)'],
  ['curriculum', 'Curriculum'],
  ['campus', 'Campus'],
  ['contact', 'Contact'],
  ['notices', 'Notice board'],
  ['gallery', 'Gallery'],
] as const

const TITLE_HINT = 'Shown in Google and as the browser tab. Up to about 60 characters; the school’s name is not added.'
const DESCRIPTION_HINT = 'The line under the title in Google and in shared links. About 120 to 160 characters.'

/**
 * Studio → Search & sharing (singleton `seoSettings`): how the site looks in Google and in shared links. Each empty
 * field keeps the site's own wording.
 */
export const seoSettings = defineType({
  name: 'seoSettings',
  title: 'Search & sharing',
  type: 'document',
  groups: [
    { name: 'site', title: 'Whole site', default: true },
    { name: 'pages', title: 'Pages' },
  ],
  fields: [
    { ...mlText('description', 'Default description', { rows: 3 }), group: 'site', description: `For pages without their own. ${DESCRIPTION_HINT}` },
    defineField({
      name: 'shareImage',
      title: 'Share picture',
      group: 'site',
      type: 'image',
      options: { hotspot: true },
      description: 'Shown when a page is shared on Facebook or WhatsApp (an album shows its own cover). Landscape, at least 1200 × 630.',
      fields: [mlString('alt', 'What the picture shows', { required: true })],
    }),
    defineField({
      name: 'pages',
      title: 'Pages',
      group: 'pages',
      type: 'object',
      options: { collapsible: false },
      fields: SEO_PAGES.map(([name, title]) =>
        defineField({
          name,
          title,
          type: 'object',
          options: { collapsible: true, collapsed: true },
          fields: [
            { ...mlString('title', 'Title'), description: TITLE_HINT },
            { ...mlText('description', 'Description', { rows: 3 }), description: DESCRIPTION_HINT },
          ],
        }),
      ),
    }),
  ],
  preview: { prepare: () => ({ title: 'Search & sharing' }) },
})
