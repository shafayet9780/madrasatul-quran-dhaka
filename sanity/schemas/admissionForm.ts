import { defineArrayMember, defineField, defineType } from 'sanity'
import { FIELD_TYPES, ROLE_SPECS, ROLES, checkFormConfig, type RawSection } from '../../src/lib/admissions/form-config'

// The 2027 pre-admission form: one uniform field definition in every section, plus the cycle
// settings. Lives inside the `preAdmissionForm` document (groups “Form 2027” and “Cycle 2027”).
// Rules shared with the server are in src/lib/admissions/form-config.ts.

const KEY_HELP = 'Lower-case letters, digits or _; starts with a letter. Never rename after the form opens: answers are stored under this key.'

const lang = (name: 'bengali' | 'english', title: string, rows: number | undefined, required: boolean) =>
  rows
    ? defineField({ name, title, type: 'text', rows, validation: required ? (Rule) => Rule.required() : undefined })
    : defineField({ name, title, type: 'string', validation: required ? (Rule) => Rule.required() : undefined })

const bi = (name: string, title: string, opts: { required?: boolean; rows?: number; description?: string } = {}) =>
  defineField({
    name,
    title,
    type: 'object',
    description: opts.description,
    options: { columns: opts.rows ? 1 : 2 },
    fields: [lang('bengali', 'Bengali', opts.rows, !!opts.required), lang('english', 'English', opts.rows, false)],
  })

const TYPE_TITLES: Record<(typeof FIELD_TYPES)[number], string> = {
  text: 'Short answer',
  textarea: 'Long answer',
  number: 'Number',
  email: 'Email',
  tel: 'Mobile number',
  date: 'Date',
  select: 'Dropdown (one choice)',
  radio: 'Multiple choice (one choice)',
  checkbox: 'Checkboxes (several choices)',
  yesno: 'Yes / No',
  file: 'Photo or document upload',
}

export const admissionOption = defineType({
  name: 'admissionOption',
  title: 'Option',
  type: 'object',
  fieldsets: [{ name: 'class', title: 'Class field only', options: { collapsible: true, collapsed: true } }],
  fields: [
    bi('label', 'Label', { required: true }),
    defineField({ name: 'value', title: 'Stored value', type: 'string', description: 'Short and stable, e.g. kg or daily.', validation: (Rule) => Rule.required() }),
    defineField({ name: 'code', title: 'Class code', type: 'string', fieldset: 'class', description: 'Used in the application ID, e.g. KG → KG-017.' }),
    defineField({ name: 'ageMin', title: 'Minimum age (years at session start)', type: 'number', fieldset: 'class' }),
    defineField({ name: 'ageMax', title: 'Maximum age (years at session start)', type: 'number', fieldset: 'class' }),
    defineField({ name: 'special', title: 'By special consideration', type: 'boolean', fieldset: 'class' }),
  ],
  preview: { select: { title: 'label.bengali', subtitle: 'value', code: 'code' }, prepare: ({ title, subtitle, code }) => ({ title, subtitle: code ? `${subtitle} · ${code}` : subtitle }) },
})

export const admissionField = defineType({
  name: 'admissionField',
  title: 'Field',
  type: 'object',
  fieldsets: [{ name: 'advanced', title: 'Role, group and conditions', options: { collapsible: true, collapsed: false } }],
  fields: [
    bi('label', 'Question / label', { required: true }),
    defineField({ name: 'key', title: 'Field key', type: 'string', description: KEY_HELP, validation: (Rule) => Rule.required() }),
    defineField({
      name: 'type',
      title: 'Field type',
      type: 'string',
      options: { list: FIELD_TYPES.map((value) => ({ value, title: TYPE_TITLES[value] })) },
      validation: (Rule) => Rule.required(),
    }),
    defineField({ name: 'required', title: 'Required', type: 'boolean', initialValue: false }),
    defineField({
      name: 'options',
      title: 'Options',
      type: 'array',
      of: [defineArrayMember({ type: 'admissionOption' })],
      hidden: ({ parent }) => !['select', 'radio', 'checkbox'].includes(parent?.type),
    }),
    defineField({
      name: 'fileKind',
      title: 'Upload kind',
      type: 'string',
      options: { list: [{ value: 'photo', title: 'Photo (image only)' }, { value: 'document', title: 'Document (image or PDF)' }], layout: 'radio' },
      hidden: ({ parent }) => parent?.type !== 'file',
    }),
    bi('placeholder', 'Placeholder'),
    bi('help', 'Help text'),
    defineField({
      name: 'role',
      title: 'Role',
      type: 'string',
      fieldset: 'advanced',
      description: 'Tells the website what this field means (used for the ID, PDF, search and payment). Each role once.',
      options: { list: ROLES.map((value) => ({ value, title: ROLE_SPECS[value].title })) },
    }),
    defineField({ name: 'group', title: 'Group key', type: 'string', fieldset: 'advanced', description: 'Key of a group in this section; fields in a group appear under its heading.' }),
    defineField({
      name: 'width',
      title: 'Width on desktop',
      type: 'string',
      fieldset: 'advanced',
      options: { list: [{ value: 'full', title: 'Full' }, { value: 'half', title: 'Half (two side by side)' }], layout: 'radio', direction: 'horizontal' },
      initialValue: 'full',
    }),
    defineField({
      name: 'showWhen',
      title: 'Show only when',
      type: 'object',
      fieldset: 'advanced',
      description: 'Leave empty to always show. Otherwise: the key of an earlier choice or yes/no field, and the values that show this field (yes/no fields use yes and no).',
      fields: [
        defineField({ name: 'field', title: 'Field key', type: 'string' }),
        defineField({ name: 'values', title: 'Values', type: 'array', of: [defineArrayMember({ type: 'string' })] }),
      ],
    }),
  ],
  preview: {
    select: { title: 'label.bengali', type: 'type', role: 'role', required: 'required' },
    prepare: ({ title, type, role, required }) => ({
      title: `${title ?? 'Untitled'}${required ? ' *' : ''}`,
      subtitle: [TYPE_TITLES[type as keyof typeof TYPE_TITLES] ?? type, role && ROLE_SPECS[role as keyof typeof ROLE_SPECS]?.title].filter(Boolean).join(' · '),
    }),
  },
})

export const admissionGroup = defineType({
  name: 'admissionGroup',
  title: 'Group',
  type: 'object',
  fields: [
    defineField({ name: 'key', title: 'Group key', type: 'string', description: KEY_HELP, validation: (Rule) => Rule.required() }),
    bi('title', 'Heading', { required: true }),
    bi('description', 'Description', { rows: 2 }),
  ],
  preview: { select: { title: 'title.bengali', subtitle: 'key' } },
})

export const admissionSection = defineType({
  name: 'admissionSection',
  title: 'Chapter',
  type: 'object',
  fields: [
    bi('title', 'Chapter title', { required: true }),
    defineField({ name: 'key', title: 'Chapter key', type: 'string', description: KEY_HELP, validation: (Rule) => Rule.required() }),
    bi('description', 'Description', { rows: 2 }),
    defineField({ name: 'groups', title: 'Groups', type: 'array', of: [defineArrayMember({ type: 'admissionGroup' })] }),
    defineField({ name: 'fields', title: 'Fields', type: 'array', of: [defineArrayMember({ type: 'admissionField' })] }),
  ],
  preview: { select: { title: 'title.bengali', fields: 'fields' }, prepare: ({ title, fields }) => ({ title, subtitle: `${fields?.length ?? 0} fields` }) },
})

export const admissionCycle = defineType({
  name: 'admissionCycle',
  title: 'Admission cycle',
  type: 'object',
  fields: [
    defineField({ name: 'session', title: 'Session', type: 'string', description: 'e.g. 2027', validation: (Rule) => Rule.required() }),
    defineField({ name: 'applicationFee', title: 'Application fee (৳)', type: 'number', validation: (Rule) => Rule.required().integer().positive() }),
    defineField({ name: 'evaluationFee', title: 'Evaluation fee (৳, paid in cash on the day)', type: 'number', validation: (Rule) => Rule.required().integer().min(0) }),
    defineField({ name: 'opensAt', title: 'Opens at', type: 'datetime' }),
    defineField({
      name: 'closesAt',
      title: 'Closes at (deadline)',
      type: 'datetime',
      validation: (Rule) =>
        Rule.custom((closesAt, ctx) => {
          const opensAt = (ctx.parent as { opensAt?: string } | undefined)?.opensAt
          return !closesAt || !opensAt || closesAt > opensAt || 'The deadline must be after the opening time.'
        }),
    }),
    defineField({ name: 'whatsappUrl', title: 'WhatsApp group link', type: 'url', validation: (Rule) => Rule.uri({ scheme: ['https'] }) }),
    bi('pdfInstructions', 'Instructions printed on the application PDF', { rows: 3 }),
    bi('refundNote', 'Refund note (shown before payment)', { rows: 2 }),
  ],
})

/** Fields added to the `preAdmissionForm` document. */
export const admissionFormFields = [
  defineField({ name: 'cycle', title: 'Cycle settings', type: 'admissionCycle', group: 'cycle' }),
  defineField({
    name: 'sections',
    title: 'Chapters',
    description: 'The 2027 form. Each chapter is one page for the guardian.',
    type: 'array',
    group: 'form',
    of: [defineArrayMember({ type: 'admissionSection' })],
    validation: (Rule) =>
      Rule.custom((sections) => {
        if (!sections) return true
        const problems = checkFormConfig(sections as RawSection[])
        return problems.length ? problems.join('\n') : true
      }),
  }),
]

export const admissionFormTypes = [admissionOption, admissionField, admissionGroup, admissionSection, admissionCycle]
