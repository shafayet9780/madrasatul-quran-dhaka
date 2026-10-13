import { defineArrayMember, defineField, defineType } from 'sanity'
import { FIELD_TYPES, ROLE_SPECS, ROLES, checkBringList, checkFormConfig, type RawBringItem, type RawSection } from '../../src/lib/admissions/form-config'

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
  transportStop: 'Transport stop (routes from Fees & Discounts)',
}

export const admissionOption = defineType({
  name: 'admissionOption',
  title: 'Option',
  type: 'object',
  fieldsets: [
    { name: 'class', title: 'Class field only', options: { collapsible: true, collapsed: true } },
    { name: 'checkbox', title: 'Checkbox questions only', options: { collapsible: true, collapsed: true } },
  ],
  fields: [
    bi('label', 'Label', { required: true }),
    defineField({ name: 'value', title: 'Stored value', type: 'string', description: 'Short and stable, e.g. kg or daily.', validation: (Rule) => Rule.required() }),
    defineField({ name: 'code', title: 'Class code', type: 'string', fieldset: 'class', description: 'Used in the application ID, e.g. KG → KG-017.' }),
    defineField({ name: 'ageMin', title: 'From age (years at session start)', type: 'number', fieldset: 'class', description: 'A child of this age fits.' }),
    defineField({
      name: 'ageMax',
      title: 'Up to age (years at session start, not included)',
      type: 'number',
      fieldset: 'class',
      description: 'A child of this age is already too old. Nursery for 4-year-olds: from 4, up to 5.',
    }),
    defineField({ name: 'special', title: 'By special consideration', type: 'boolean', fieldset: 'class' }),
    defineField({
      name: 'closed',
      title: 'Closed for this session',
      type: 'boolean',
      fieldset: 'class',
      description: 'Parents cannot choose this class. Untick to open it again. Applications already made are not affected.',
    }),
    defineField({
      name: 'requires',
      title: 'Requirements (all must be met)',
      type: 'array',
      fieldset: 'class',
      description: 'A child can apply for this class only when every requirement is met (e.g. girls only). The message shows under the class and on the question that does not meet it.',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'classRequirement',
          fields: [
            defineField({ name: 'field', title: 'Question key', type: 'string', description: 'A choice or yes/no question, e.g. student_gender.', validation: (Rule) => Rule.required() }),
            defineField({ name: 'values', title: 'Answers that meet it', type: 'array', of: [defineArrayMember({ type: 'string' })], description: 'Option values, e.g. female.', validation: (Rule) => Rule.required().min(1) }),
            bi('message', 'Message', { required: true, description: 'Short, e.g. শুধু মেয়েদের জন্য.' }),
          ],
          preview: { select: { title: 'message.bengali', field: 'field', values: 'values' }, prepare: ({ title, field, values }) => ({ title, subtitle: `${field} = ${(values ?? []).join(' / ')}` }) },
        }),
      ],
    }),
    defineField({
      name: 'exclusive',
      title: 'Only this choice',
      type: 'boolean',
      fieldset: 'checkbox',
      description: 'For “none of the above”: ticking it clears the other choices, and ticking another choice clears it.',
    }),
  ],
  preview: {
    select: { title: 'label.bengali', subtitle: 'value', code: 'code', closed: 'closed' },
    prepare: ({ title, subtitle, code, closed }) => ({ title, subtitle: [subtitle, code, closed && 'Closed for this session'].filter(Boolean).join(' · ') }),
  },
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
    defineField({
      name: 'allowMissing',
      title: 'Allow “don’t have it now”',
      type: 'boolean',
      description: 'Shows a tick box under the upload. Ticking it counts as answered; the document is then brought on assessment day.',
      hidden: ({ parent }) => parent?.type !== 'file',
    }),
    { ...bi('missingLabel', 'Text of the “don’t have it now” tick box'), hidden: ({ parent }: any) => parent?.type !== 'file' || !parent?.allowMissing },
    { ...bi('missingNote', 'Note shown once it is ticked', { rows: 2 }), hidden: ({ parent }: any) => parent?.type !== 'file' || !parent?.allowMissing },
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
    defineField({ name: 'evaluationFee', title: 'Assessment fee (৳, paid in cash on the day)', type: 'number', validation: (Rule) => Rule.required().integer().min(0) }),
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
    bi('conductIntro', 'Code of conduct: introduction (pledge page)', { rows: 2 }),
    defineField({
      name: 'conductGroups',
      title: 'Code of conduct: rule groups',
      description: 'Shown on the pledge page, the application PDF and the offline form. Rules are numbered 1, 2, 3… across all groups.',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'conductGroup',
          fields: [
            bi('title', 'Group heading', { required: true }),
            defineField({
              name: 'rules',
              title: 'Rules',
              type: 'array',
              of: [defineArrayMember({ type: 'object', name: 'conductRule', fields: [lang('bengali', 'Bengali', 3, true), lang('english', 'English', 3, false)], preview: { select: { title: 'bengali' } } })],
              validation: (Rule) => Rule.min(1),
            }),
          ],
          preview: { select: { title: 'title.bengali', rules: 'rules' }, prepare: ({ title, rules }) => ({ title, subtitle: `${rules?.length ?? 0} rules` }) },
        }),
      ],
    }),
    bi('conductPledge', 'Code of conduct pledge (first tick box)', { rows: 2 }),
    bi('familyDeclaration', 'Declaration (second tick box, shown boxed)', { rows: 4 }),
    defineField({
      name: 'bringList',
      title: 'What to bring on assessment day',
      description: 'Shown on the success page, the application PDF, the email and the intro page. Write {fee} for the assessment fee.',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'bringItem',
          fields: [
            bi('text', 'Item', { required: true }),
            defineField({
              name: 'showWhen',
              title: 'Show only when',
              type: 'object',
              description: 'Leave empty to always show. Otherwise: the key of a choice or yes/no question and the values that show this item.',
              fields: [
                defineField({ name: 'field', title: 'Field key', type: 'string' }),
                defineField({ name: 'values', title: 'Values', type: 'array', of: [defineArrayMember({ type: 'string' })] }),
              ],
            }),
            defineField({ name: 'document', title: 'Upload question key', type: 'string', description: 'Optional: when this document was not uploaded online, the item is highlighted as “must bring”.' }),
          ],
          preview: { select: { title: 'text.bengali', subtitle: 'document' } },
        }),
      ],
      validation: (Rule) =>
        Rule.custom((items, ctx) => {
          const problems = checkBringList(items as RawBringItem[] | undefined, (ctx.document as { sections?: RawSection[] } | undefined)?.sections)
          return problems.length ? problems.join('\n') : true
        }),
    }),
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
