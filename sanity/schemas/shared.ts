import { defineField } from 'sanity'

/**
 * Shared field builders for multilingual (Bengali/English) content.
 * Mirrors the object-with-bengali/english pattern used across the schemas
 * (see newsEvent, staffMember) so Directors/Teachers stay consistent.
 */

type Req = { required?: boolean }

export function mlString(name: string, title: string, opts: Req = {}) {
  return defineField({
    name,
    title,
    type: 'object',
    fields: [
      { name: 'bengali', title: 'Bengali', type: 'string', validation: (Rule) => (opts.required ? Rule.required() : Rule) },
      { name: 'english', title: 'English', type: 'string', validation: (Rule) => (opts.required ? Rule.required() : Rule) },
    ],
    validation: (Rule) => (opts.required ? Rule.required() : Rule),
  })
}

export function mlText(name: string, title: string, opts: Req & { rows?: number } = {}) {
  const rows = opts.rows ?? 3
  return defineField({
    name,
    title,
    type: 'object',
    fields: [
      { name: 'bengali', title: 'Bengali', type: 'text', rows, validation: (Rule) => (opts.required ? Rule.required() : Rule) },
      { name: 'english', title: 'English', type: 'text', rows, validation: (Rule) => (opts.required ? Rule.required() : Rule) },
    ],
    validation: (Rule) => (opts.required ? Rule.required() : Rule),
  })
}

export function mlStringArray(name: string, title: string, description?: string) {
  return defineField({
    name,
    title,
    type: 'object',
    description,
    fields: [
      { name: 'bengali', title: 'Bengali', type: 'array', of: [{ type: 'string' }] },
      { name: 'english', title: 'English', type: 'array', of: [{ type: 'string' }] },
    ],
  })
}

const portableBlock = {
  type: 'block',
  styles: [
    { title: 'Normal', value: 'normal' },
    { title: 'H2', value: 'h2' },
    { title: 'H3', value: 'h3' },
    { title: 'Quote', value: 'blockquote' },
  ],
  marks: {
    decorators: [
      { title: 'Strong', value: 'strong' },
      { title: 'Emphasis', value: 'em' },
    ],
    annotations: [
      { title: 'URL', name: 'link', type: 'object', fields: [{ title: 'URL', name: 'href', type: 'url' }] },
    ],
  },
}

export function mlPortable(name: string, title: string, description?: string) {
  return defineField({
    name,
    title,
    type: 'object',
    description,
    fields: [
      { name: 'bengali', title: 'Bengali', type: 'array', of: [portableBlock] },
      { name: 'english', title: 'English', type: 'array', of: [portableBlock] },
    ],
  })
}

export function mlSlug(name = 'slug') {
  return defineField({
    name,
    title: 'Slug',
    type: 'object',
    description: 'URL identifier. Generate from the name in each language.',
    fields: [
      {
        name: 'bengali',
        title: 'Bengali Slug',
        type: 'slug',
        options: { source: 'name.bengali', maxLength: 96 },
        validation: (Rule) => Rule.required(),
      },
      {
        name: 'english',
        title: 'English Slug',
        type: 'slug',
        options: { source: 'name.english', maxLength: 96 },
        validation: (Rule) => Rule.required(),
      },
    ],
    validation: (Rule) => Rule.required(),
  })
}

export function profilePhoto(name = 'photo') {
  return defineField({
    name,
    title: 'Photo',
    type: 'image',
    options: { hotspot: true },
    description:
      'Optional. Please follow Islamic modesty guidelines. Leave empty for female staff — a shared placeholder is shown automatically.',
    fields: [{ name: 'alt', type: 'string', title: 'Alternative Text', validation: (Rule) => Rule.required() }],
  })
}

export function genderField() {
  return defineField({
    name: 'gender',
    title: 'Gender',
    type: 'string',
    options: {
      list: [
        { title: 'Male', value: 'male' },
        { title: 'Female', value: 'female' },
      ],
      layout: 'radio',
    },
    description: 'Used to pick the correct placeholder image when no photo is provided.',
    validation: (Rule) => Rule.required(),
  })
}

export function educationField() {
  return defineField({
    name: 'education',
    title: 'Educational Background',
    type: 'array',
    of: [
      {
        type: 'object',
        fields: [
          mlString('degree', 'Degree'),
          mlString('institution', 'Institution'),
          { name: 'year', title: 'Year', type: 'number' },
        ],
        preview: {
          select: { title: 'degree.english', subtitle: 'institution.english' },
        },
      },
    ],
  })
}

export function displayOrderField() {
  return defineField({
    name: 'displayOrder',
    title: 'Display Order',
    type: 'number',
    description: 'Lower numbers appear first.',
    initialValue: 0,
  })
}

export function featuredField(description = 'Highlight this profile') {
  return defineField({
    name: 'featured',
    title: 'Featured',
    type: 'boolean',
    description,
    initialValue: false,
  })
}
