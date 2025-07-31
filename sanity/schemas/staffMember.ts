import { defineField, defineType } from 'sanity'

export const staffMember = defineType({
  name: 'staffMember',
  title: 'Staff Member',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'Name',
      type: 'object',
      fields: [
        {
          name: 'bengali',
          title: 'Bengali',
          type: 'string',
          validation: (Rule) => Rule.required(),
        },
        {
          name: 'english',
          title: 'English',
          type: 'string',
          validation: (Rule) => Rule.required(),
        },
      ],
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'position',
      title: 'Position',
      type: 'object',
      fields: [
        {
          name: 'bengali',
          title: 'Bengali',
          type: 'string',
          validation: (Rule) => Rule.required(),
        },
        {
          name: 'english',
          title: 'English',
          type: 'string',
          validation: (Rule) => Rule.required(),
        },
      ],
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'department',
      title: 'Department',
      type: 'string',
      options: {
        list: [
          { title: 'Administration', value: 'administration' },
          { title: 'Islamic Studies', value: 'islamic_studies' },
          { title: 'NCTB Curriculum', value: 'nctb_curriculum' },
          { title: 'Co-curricular', value: 'co_curricular' },
          { title: 'Support Staff', value: 'support_staff' },
        ],
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'qualifications',
      title: 'Qualifications',
      type: 'object',
      fields: [
        {
          name: 'bengali',
          title: 'Bengali',
          type: 'array',
          of: [{ type: 'string' }],
        },
        {
          name: 'english',
          title: 'English',
          type: 'array',
          of: [{ type: 'string' }],
        },
      ],
    }),
    defineField({
      name: 'biography',
      title: 'Biography',
      type: 'object',
      fields: [
        {
          name: 'bengali',
          title: 'Bengali',
          type: 'text',
          rows: 5,
        },
        {
          name: 'english',
          title: 'English',
          type: 'text',
          rows: 5,
        },
      ],
    }),
    defineField({
      name: 'photo',
      title: 'Photo',
      type: 'image',
      options: {
        hotspot: true,
      },
      fields: [
        {
          name: 'alt',
          type: 'string',
          title: 'Alternative Text',
          validation: (Rule) => Rule.required(),
        },
      ],
      description: 'Please ensure photo follows Islamic modesty guidelines',
    }),
    defineField({
      name: 'specializations',
      title: 'Specializations',
      type: 'array',
      of: [{ type: 'string' }],
      description: 'Areas of expertise or special skills',
    }),
    defineField({
      name: 'contactEmail',
      title: 'Contact Email',
      type: 'email',
      description: 'Optional - for staff directory',
    }),
    defineField({
      name: 'yearsOfExperience',
      title: 'Years of Experience',
      type: 'number',
      validation: (Rule) => Rule.min(0),
    }),
    defineField({
      name: 'education',
      title: 'Educational Background',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            {
              name: 'degree',
              title: 'Degree',
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
              name: 'institution',
              title: 'Institution',
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
              name: 'year',
              title: 'Year',
              type: 'number',
            },
          ],
        },
      ],
    }),
    defineField({
      name: 'displayOrder',
      title: 'Display Order',
      type: 'number',
      description: 'Lower numbers appear first in staff listings',
      initialValue: 0,
    }),
    defineField({
      name: 'isLeadership',
      title: 'Leadership Team',
      type: 'boolean',
      description: 'Show in leadership section',
      initialValue: false,
    }),
  ],
  preview: {
    select: {
      title: 'name.english',
      subtitle: 'position.english',
      media: 'photo',
      department: 'department',
    },
    prepare(selection) {
      const { title, subtitle, media, department } = selection
      return {
        title,
        subtitle: `${subtitle} - ${department}`,
        media,
      }
    },
  },
  orderings: [
    {
      title: 'Display Order',
      name: 'displayOrderAsc',
      by: [{ field: 'displayOrder', direction: 'asc' }],
    },
    {
      title: 'Department',
      name: 'departmentAsc',
      by: [{ field: 'department', direction: 'asc' }],
    },
  ],
})