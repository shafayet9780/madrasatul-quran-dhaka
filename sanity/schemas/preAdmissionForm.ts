import { defineField, defineType } from 'sanity';
import { admissionFormFields } from './admissionForm';

export const preAdmissionForm = defineType({
  name: 'preAdmissionForm',
  title: 'Pre-Admission Form Configuration',
  type: 'document',
  groups: [
    { name: 'form', title: 'Form 2027', default: true },
    { name: 'cycle', title: 'Cycle 2027' },
    { name: 'legacy', title: 'Legacy form (until go-live)' },
  ],
  fields: [
    ...admissionFormFields,
    defineField({
      name: 'formSettings',
      group: ['form', 'cycle', 'legacy'],
      title: 'Form Settings',
      type: 'object',
      fields: [
        {
          name: 'isEnabled',
          title: 'Enable Form',
          type: 'boolean',
          description: 'Toggle to enable/disable the pre-admission form',
          initialValue: true,
        },
        {
          name: 'formTitle',
          title: 'Form Title',
          type: 'object',
          fields: [
            {
              name: 'bengali',
              title: 'Bengali Title',
              type: 'string',
              validation: Rule => Rule.required(),
            },
            {
              name: 'english',
              title: 'English Title',
              type: 'string',
              validation: Rule => Rule.required(),
            },
          ],
        },
        {
          name: 'formDescription',
          title: 'Form Description',
          type: 'object',
          fields: [
            {
              name: 'bengali',
              title: 'Bengali Description',
              type: 'text',
              rows: 3,
            },
            {
              name: 'english',
              title: 'English Description',
              type: 'text',
              rows: 3,
            },
          ],
        },
        {
          name: 'submissionDate',
          title: 'Submission Date',
          type: 'date',
          description: 'Last date for form submission',
          validation: Rule => Rule.required(),
        },
        {
          name: 'googleSheetsId',
          title: 'Google Sheets ID',
          type: 'string',
          description:
            'For reference only. Submissions and the setup scripts use the server setting FORM_GOOGLE_SHEETS_ID; changing this field does not move them.',
        },
      ],
    }),
    defineField({
      name: 'generalQuestions',
      group: 'legacy',
      title: 'General Questions',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            {
              name: 'question',
              title: 'Question',
              type: 'object',
              fields: [
                {
                  name: 'bengali',
                  title: 'Bengali Question',
                  type: 'string',
                  validation: Rule => Rule.required(),
                },
                {
                  name: 'english',
                  title: 'English Question',
                  type: 'string',
                  validation: Rule => Rule.required(),
                },
              ],
            },
            {
              name: 'fieldType',
              title: 'Field Type',
              type: 'string',
              options: {
                list: [
                  { title: 'Short Answer', value: 'text' },
                  { title: 'Long Answer', value: 'textarea' },
                  { title: 'Dropdown', value: 'select' },
                  { title: 'Multiple Choice', value: 'radio' },
                  { title: 'Checkboxes', value: 'checkbox' },
                  { title: 'Date Picker', value: 'date' },
                  { title: 'Time Picker', value: 'time' },
                  { title: 'Email', value: 'email' },
                  { title: 'Phone', value: 'tel' },
                  { title: 'Number', value: 'number' },
                  { title: 'File Upload', value: 'file' },
                ],
              },
              validation: Rule => Rule.required(),
            },
            {
              name: 'options',
              title: 'Options (for dropdown/radio/checkbox)',
              type: 'array',
              of: [
                {
                  type: 'object',
                  fields: [
                    {
                      name: 'label',
                      title: 'Option Label',
                      type: 'object',
                      fields: [
                        {
                          name: 'bengali',
                          title: 'Bengali',
                          type: 'string',
                        },
                        {
                          name: 'english',
                          title: 'English',
                          type: 'string',
                        },
                      ],
                    },
                    {
                      name: 'value',
                      title: 'Option Value',
                      type: 'string',
                    },
                  ],
                },
              ],
              hidden: ({ parent }) =>
                !['select', 'radio', 'checkbox'].includes(parent?.fieldType),
            },
            {
              name: 'isRequired',
              title: 'Required Field',
              type: 'boolean',
              initialValue: false,
            },
            {
              name: 'placeholder',
              title: 'Placeholder Text',
              type: 'object',
              fields: [
                {
                  name: 'bengali',
                  title: 'Bengali Placeholder',
                  type: 'string',
                },
                {
                  name: 'english',
                  title: 'English Placeholder',
                  type: 'string',
                },
              ],
            },
            {
              name: 'helpText',
              title: 'Help Text',
              type: 'object',
              fields: [
                {
                  name: 'bengali',
                  title: 'Bengali Help Text',
                  type: 'string',
                },
                {
                  name: 'english',
                  title: 'English Help Text',
                  type: 'string',
                },
              ],
            },
          ],
          preview: {
            select: {
              title: 'question.bengali',
              subtitle: 'fieldType',
            },
          },
        },
      ],
    }),
    defineField({
      name: 'studentInfoFields',
      group: 'legacy',
      title: 'Student Information Fields',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            {
              name: 'fieldName',
              title: 'Field Name',
              type: 'string',
              validation: Rule => Rule.required(),
            },
            {
              name: 'label',
              title: 'Field Label',
              type: 'object',
              fields: [
                {
                  name: 'bengali',
                  title: 'Bengali Label',
                  type: 'string',
                  validation: Rule => Rule.required(),
                },
                {
                  name: 'english',
                  title: 'English Label',
                  type: 'string',
                  validation: Rule => Rule.required(),
                },
              ],
            },
            {
              name: 'fieldType',
              title: 'Field Type',
              type: 'string',
              options: {
                list: [
                  { title: 'Short Answer', value: 'text' },
                  { title: 'Long Answer', value: 'textarea' },
                  { title: 'Dropdown', value: 'select' },
                  { title: 'Date Picker', value: 'date' },
                  { title: 'Email', value: 'email' },
                  { title: 'Phone', value: 'tel' },
                  { title: 'File Upload', value: 'file' },
                ],
              },
              validation: Rule => Rule.required(),
            },
            {
              name: 'fileType',
              title: 'File Type (for file uploads)',
              type: 'string',
              options: {
                list: [
                  { title: 'General File', value: 'general' },
                  { title: 'Student Image', value: 'student-image' },
                  {
                    title: 'Birth Certificate',
                    value: 'student-birth-certificate',
                  },
                ],
              },
              hidden: ({ parent }) => parent?.fieldType !== 'file',
            },
            {
              name: 'options',
              title: 'Options (for dropdown)',
              type: 'array',
              of: [
                {
                  type: 'object',
                  fields: [
                    {
                      name: 'label',
                      title: 'Option Label',
                      type: 'object',
                      fields: [
                        {
                          name: 'bengali',
                          title: 'Bengali',
                          type: 'string',
                        },
                        {
                          name: 'english',
                          title: 'English',
                          type: 'string',
                        },
                      ],
                    },
                    {
                      name: 'value',
                      title: 'Option Value',
                      type: 'string',
                    },
                  ],
                },
              ],
              hidden: ({ parent }) => parent?.fieldType !== 'select',
            },
            {
              name: 'isRequired',
              title: 'Required Field',
              type: 'boolean',
              initialValue: false,
            },
            {
              name: 'placeholder',
              title: 'Placeholder Text',
              type: 'object',
              fields: [
                {
                  name: 'bengali',
                  title: 'Bengali Placeholder',
                  type: 'string',
                },
                {
                  name: 'english',
                  title: 'English Placeholder',
                  type: 'string',
                },
              ],
            },
            {
              name: 'helpText',
              title: 'Help Text',
              type: 'object',
              fields: [
                {
                  name: 'bengali',
                  title: 'Bengali Help Text',
                  type: 'string',
                },
                {
                  name: 'english',
                  title: 'English Help Text',
                  type: 'string',
                },
              ],
            },
          ],
          preview: {
            select: {
              title: 'label.bengali',
              subtitle: 'fieldType',
            },
          },
        },
      ],
    }),
    defineField({
      name: 'studentAssessmentFields',
      group: 'legacy',
      title: 'Student Assessment Fields',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            {
              name: 'fieldName',
              title: 'Field Name',
              type: 'string',
              validation: Rule => Rule.required(),
            },
            {
              name: 'label',
              title: 'Field Label',
              type: 'object',
              fields: [
                {
                  name: 'bengali',
                  title: 'Bengali Label',
                  type: 'string',
                  validation: Rule => Rule.required(),
                },
                {
                  name: 'english',
                  title: 'English Label',
                  type: 'string',
                  validation: Rule => Rule.required(),
                },
              ],
            },
            {
              name: 'fieldType',
              title: 'Field Type',
              type: 'string',
              options: {
                list: [
                  { title: 'Short Answer', value: 'text' },
                  { title: 'Long Answer', value: 'textarea' },
                  { title: 'Dropdown', value: 'select' },
                  { title: 'Multiple Choice', value: 'radio' },
                  { title: 'Checkboxes', value: 'checkbox' },
                  { title: 'Yes/No', value: 'boolean' },
                  { title: 'Time Picker', value: 'time' },
                  { title: 'Number', value: 'number' },
                  { title: 'File Upload', value: 'file' },
                ],
              },
              validation: Rule => Rule.required(),
            },
            {
              name: 'fileType',
              title: 'File Type (for file uploads)',
              type: 'string',
              options: {
                list: [
                  { title: 'General File', value: 'general' },
                  { title: 'Student Image', value: 'student-image' },
                  {
                    title: 'Birth Certificate',
                    value: 'student-birth-certificate',
                  },
                ],
              },
              hidden: ({ parent }) => parent?.fieldType !== 'file',
            },
            {
              name: 'options',
              title: 'Options',
              type: 'array',
              of: [
                {
                  type: 'object',
                  fields: [
                    {
                      name: 'label',
                      title: 'Option Label',
                      type: 'object',
                      fields: [
                        {
                          name: 'bengali',
                          title: 'Bengali',
                          type: 'string',
                        },
                        {
                          name: 'english',
                          title: 'English',
                          type: 'string',
                        },
                      ],
                    },
                    {
                      name: 'value',
                      title: 'Option Value',
                      type: 'string',
                    },
                  ],
                },
              ],
              hidden: ({ parent }) =>
                !['select', 'radio', 'checkbox'].includes(
                  parent?.fieldType
                ),
            },
            {
              name: 'isRequired',
              title: 'Required Field',
              type: 'boolean',
              initialValue: false,
            },
            {
              name: 'placeholder',
              title: 'Placeholder Text',
              type: 'object',
              fields: [
                {
                  name: 'bengali',
                  title: 'Bengali Placeholder',
                  type: 'string',
                },
                {
                  name: 'english',
                  title: 'English Placeholder',
                  type: 'string',
                },
              ],
            },
            {
              name: 'helpText',
              title: 'Help Text',
              type: 'object',
              fields: [
                {
                  name: 'bengali',
                  title: 'Bengali Help Text',
                  type: 'string',
                },
                {
                  name: 'english',
                  title: 'English Help Text',
                  type: 'string',
                },
              ],
            },
          ],
          preview: {
            select: {
              title: 'label.bengali',
              subtitle: 'fieldType',
            },
          },
        },
      ],
    }),
    defineField({
      name: 'parentInfoFields',
      group: 'legacy',
      title: 'Parent Information Fields',
      type: 'object',
      fields: [
        {
          name: 'fatherFields',
          title: 'Father Information Fields',
          type: 'array',
          of: [
            {
              type: 'object',
              fields: [
                {
                  name: 'fieldName',
                  title: 'Field Name',
                  type: 'string',
                  validation: Rule => Rule.required(),
                },
                {
                  name: 'label',
                  title: 'Field Label',
                  type: 'object',
                  fields: [
                    {
                      name: 'bengali',
                      title: 'Bengali Label',
                      type: 'string',
                      validation: Rule => Rule.required(),
                    },
                    {
                      name: 'english',
                      title: 'English Label',
                      type: 'string',
                      validation: Rule => Rule.required(),
                    },
                  ],
                },
                {
                  name: 'fieldType',
                  title: 'Field Type',
                  type: 'string',
                  options: {
                    list: [
                      { title: 'Short Answer', value: 'text' },
                      { title: 'Long Answer', value: 'textarea' },
                      { title: 'Dropdown', value: 'select' },
                      { title: 'Multiple Choice', value: 'radio' },
                      { title: 'Checkboxes', value: 'checkbox' },
                      { title: 'Yes/No', value: 'boolean' },
                      { title: 'Time Picker', value: 'time' },
                      { title: 'Number', value: 'number' },
                      { title: 'File Upload', value: 'file' },
                    ],
                  },
                  validation: Rule => Rule.required(),
                },
                {
                  name: 'fileType',
                  title: 'File Type (for file uploads)',
                  type: 'string',
                  options: {
                    list: [
                      { title: 'General File', value: 'general' },
                      { title: "Father's Image", value: 'father-image' },
                    ],
                  },
                  hidden: ({ parent }) => parent?.fieldType !== 'file',
                },
                {
                  name: 'options',
                  title: 'Options',
                  type: 'array',
                  of: [
                    {
                      type: 'object',
                      fields: [
                        {
                          name: 'label',
                          title: 'Option Label',
                          type: 'object',
                          fields: [
                            {
                              name: 'bengali',
                              title: 'Bengali',
                              type: 'string',
                            },
                            {
                              name: 'english',
                              title: 'English',
                              type: 'string',
                            },
                          ],
                        },
                        {
                          name: 'value',
                          title: 'Option Value',
                          type: 'string',
                        },
                      ],
                    },
                  ],
                  hidden: ({ parent }) =>
                    !['select', 'radio', 'checkbox'].includes(
                      parent?.fieldType
                    ),
                },
                {
                  name: 'isRequired',
                  title: 'Required Field',
                  type: 'boolean',
                  initialValue: false,
                },
                {
                  name: 'placeholder',
                  title: 'Placeholder Text',
                  type: 'object',
                  fields: [
                    {
                      name: 'bengali',
                      title: 'Bengali Placeholder',
                      type: 'string',
                    },
                    {
                      name: 'english',
                      title: 'English Placeholder',
                      type: 'string',
                    },
                  ],
                },
                {
                  name: 'helpText',
                  title: 'Help Text',
                  type: 'object',
                  fields: [
                    {
                      name: 'bengali',
                      title: 'Bengali Help Text',
                      type: 'string',
                    },
                    {
                      name: 'english',
                      title: 'English Help Text',
                      type: 'string',
                    },
                  ],
                },
              ],
              preview: {
                select: {
                  title: 'label.bengali',
                  subtitle: 'fieldType',
                },
              },
            },
          ],
        },
        {
          name: 'motherFields',
          title: 'Mother Information Fields',
          type: 'array',
          of: [
            {
              type: 'object',
              fields: [
                {
                  name: 'fieldName',
                  title: 'Field Name',
                  type: 'string',
                  validation: Rule => Rule.required(),
                },
                {
                  name: 'label',
                  title: 'Field Label',
                  type: 'object',
                  fields: [
                    {
                      name: 'bengali',
                      title: 'Bengali Label',
                      type: 'string',
                      validation: Rule => Rule.required(),
                    },
                    {
                      name: 'english',
                      title: 'English Label',
                      type: 'string',
                      validation: Rule => Rule.required(),
                    },
                  ],
                },
                {
                  name: 'fieldType',
                  title: 'Field Type',
                  type: 'string',
                  options: {
                    list: [
                      { title: 'Short Answer', value: 'text' },
                      { title: 'Long Answer', value: 'textarea' },
                      { title: 'Dropdown', value: 'select' },
                      { title: 'Multiple Choice', value: 'radio' },
                      { title: 'Checkboxes', value: 'checkbox' },
                      { title: 'Yes/No', value: 'boolean' },
                      { title: 'Time Picker', value: 'time' },
                      { title: 'Number', value: 'number' },
                      { title: 'File Upload', value: 'file' },
                    ],
                  },
                  validation: Rule => Rule.required(),
                },
                {
                  name: 'options',
                  title: 'Options',
                  type: 'array',
                  of: [
                    {
                      type: 'object',
                      fields: [
                        {
                          name: 'label',
                          title: 'Option Label',
                          type: 'object',
                          fields: [
                            {
                              name: 'bengali',
                              title: 'Bengali',
                              type: 'string',
                            },
                            {
                              name: 'english',
                              title: 'English',
                              type: 'string',
                            },
                          ],
                        },
                        {
                          name: 'value',
                          title: 'Option Value',
                          type: 'string',
                        },
                      ],
                    },
                  ],
                  hidden: ({ parent }) =>
                    !['select', 'radio', 'checkbox'].includes(
                      parent?.fieldType
                    ),
                },
                {
                  name: 'isRequired',
                  title: 'Required Field',
                  type: 'boolean',
                  initialValue: false,
                },
                {
                  name: 'placeholder',
                  title: 'Placeholder Text',
                  type: 'object',
                  fields: [
                    {
                      name: 'bengali',
                      title: 'Bengali Placeholder',
                      type: 'string',
                    },
                    {
                      name: 'english',
                      title: 'English Placeholder',
                      type: 'string',
                    },
                  ],
                },
                {
                  name: 'helpText',
                  title: 'Help Text',
                  type: 'object',
                  fields: [
                    {
                      name: 'bengali',
                      title: 'Bengali Help Text',
                      type: 'string',
                    },
                    {
                      name: 'english',
                      title: 'English Help Text',
                      type: 'string',
                    },
                  ],
                },
              ],
              preview: {
                select: {
                  title: 'label.bengali',
                  subtitle: 'fieldType',
                },
              },
            },
          ],
        },
      ],
    }),
    defineField({
      name: 'additionalQuestions',
      group: 'legacy',
      title: 'Additional Information',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            {
              name: 'fieldName',
              title: 'Field Name',
              type: 'string',
              validation: Rule => Rule.required(),
            },
            {
              name: 'question',
              title: 'Question',
              type: 'object',
              fields: [
                {
                  name: 'bengali',
                  title: 'Bengali Question',
                  type: 'string',
                  validation: Rule => Rule.required(),
                },
                {
                  name: 'english',
                  title: 'English Question',
                  type: 'string',
                  validation: Rule => Rule.required(),
                },
              ],
            },
            {
              name: 'fieldType',
              title: 'Field Type',
              type: 'string',
              options: {
                list: [
                  { title: 'Short Answer', value: 'text' },
                  { title: 'Long Answer', value: 'textarea' },
                  { title: 'Dropdown', value: 'select' },
                  { title: 'Multiple Choice', value: 'radio' },
                  { title: 'Checkboxes', value: 'checkbox' },
                  { title: 'Yes/No', value: 'boolean' },
                  { title: 'Date Picker', value: 'date' },
                  { title: 'Time Picker', value: 'time' },
                  { title: 'Email', value: 'email' },
                  { title: 'Phone', value: 'tel' },
                  { title: 'Number', value: 'number' },
                  { title: 'File Upload', value: 'file' },
                ],
              },
              validation: Rule => Rule.required(),
            },
            {
              name: 'fileType',
              title: 'File Type (for file uploads)',
              type: 'string',
              options: {
                list: [
                  { title: 'General File', value: 'general' },
                  { title: 'Student Image', value: 'student-image' },
                  { title: "Father's Image", value: 'father-image' },
                  {
                    title: 'Birth Certificate',
                    value: 'student-birth-certificate',
                  },
                ],
              },
              hidden: ({ parent }) => parent?.fieldType !== 'file',
            },
            {
              name: 'options',
              title: 'Options (for dropdown/radio/checkbox)',
              type: 'array',
              of: [
                {
                  type: 'object',
                  fields: [
                    {
                      name: 'label',
                      title: 'Option Label',
                      type: 'object',
                      fields: [
                        {
                          name: 'bengali',
                          title: 'Bengali',
                          type: 'string',
                        },
                        {
                          name: 'english',
                          title: 'English',
                          type: 'string',
                        },
                      ],
                    },
                    {
                      name: 'value',
                      title: 'Option Value',
                      type: 'string',
                    },
                  ],
                },
              ],
              hidden: ({ parent }) =>
                !['select', 'radio', 'checkbox'].includes(parent?.fieldType),
            },
            {
              name: 'isRequired',
              title: 'Required Field',
              type: 'boolean',
              initialValue: false,
            },
            {
              name: 'placeholder',
              title: 'Placeholder Text',
              type: 'object',
              fields: [
                {
                  name: 'bengali',
                  title: 'Bengali Placeholder',
                  type: 'string',
                },
                {
                  name: 'english',
                  title: 'English Placeholder',
                  type: 'string',
                },
              ],
            },
            {
              name: 'helpText',
              title: 'Help Text',
              type: 'object',
              fields: [
                {
                  name: 'bengali',
                  title: 'Bengali Help Text',
                  type: 'string',
                },
                {
                  name: 'english',
                  title: 'English Help Text',
                  type: 'string',
                },
              ],
            },
          ],
          preview: {
            select: {
              title: 'question.bengali',
              subtitle: 'fieldType',
            },
          },
        },
      ],
    }),
    defineField({
      name: 'contactInfoFields',
      group: 'legacy',
      title: 'Contact Information Fields',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            {
              name: 'fieldName',
              title: 'Field Name',
              type: 'string',
              validation: Rule => Rule.required(),
            },
            {
              name: 'label',
              title: 'Field Label',
              type: 'object',
              fields: [
                {
                  name: 'bengali',
                  title: 'Bengali Label',
                  type: 'string',
                  validation: Rule => Rule.required(),
                },
                {
                  name: 'english',
                  title: 'English Label',
                  type: 'string',
                  validation: Rule => Rule.required(),
                },
              ],
            },
            {
              name: 'fieldType',
              title: 'Field Type',
              type: 'string',
              options: {
                list: [
                  { title: 'Short Answer', value: 'text' },
                  { title: 'Long Answer', value: 'textarea' },
                  { title: 'Email', value: 'email' },
                  { title: 'Phone', value: 'tel' },
                ],
              },
              validation: Rule => Rule.required(),
            },
            {
              name: 'isRequired',
              title: 'Required Field',
              type: 'boolean',
              initialValue: false,
            },
            {
              name: 'placeholder',
              title: 'Placeholder Text',
              type: 'object',
              fields: [
                {
                  name: 'bengali',
                  title: 'Bengali Placeholder',
                  type: 'string',
                },
                {
                  name: 'english',
                  title: 'English Placeholder',
                  type: 'string',
                },
              ],
            },
            {
              name: 'helpText',
              title: 'Help Text',
              type: 'object',
              fields: [
                {
                  name: 'bengali',
                  title: 'Bengali Help Text',
                  type: 'string',
                },
                {
                  name: 'english',
                  title: 'English Help Text',
                  type: 'string',
                },
              ],
            },
          ],
          preview: {
            select: {
              title: 'label.bengali',
              subtitle: 'fieldType',
            },
          },
        },
      ],
    }),
    defineField({
      name: 'declarationText',
      group: ['form', 'legacy'],
      title: 'Final Declaration Text',
      type: 'object',
      fields: [
        {
          name: 'bengali',
          title: 'Bengali Declaration',
          type: 'text',
          rows: 5,
          validation: Rule => Rule.required(),
        },
        {
          name: 'english',
          title: 'English Declaration',
          type: 'text',
          rows: 5,
          validation: Rule => Rule.required(),
        },
      ],
    }),
    defineField({
      name: 'successMessage',
      group: 'legacy',
      title: 'Success Message',
      type: 'object',
      fields: [
        {
          name: 'bengali',
          title: 'Bengali Success Message',
          type: 'text',
          rows: 3,
          validation: Rule => Rule.required(),
        },
        {
          name: 'english',
          title: 'English Success Message',
          type: 'text',
          rows: 3,
          validation: Rule => Rule.required(),
        },
      ],
    }),
  ],
  preview: {
    select: {
      title: 'formSettings.formTitle.bengali',
      subtitle: 'formSettings.isEnabled',
    },
    prepare(selection) {
      const { title, subtitle } = selection;
      return {
        title: title || 'Pre-Admission Form',
        subtitle: subtitle ? 'Enabled' : 'Disabled',
      };
    },
  },
});
