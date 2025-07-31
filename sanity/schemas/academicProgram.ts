import { defineField, defineType } from 'sanity'

export const academicProgram = defineType({
  name: 'academicProgram',
  title: 'Academic Program',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Program Title',
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
      name: 'slug',
      title: 'Slug',
      type: 'object',
      fields: [
        {
          name: 'bengali',
          title: 'Bengali Slug',
          type: 'slug',
          options: {
            source: 'title.bengali',
            maxLength: 96,
          },
          validation: (Rule) => Rule.required(),
        },
        {
          name: 'english',
          title: 'English Slug',
          type: 'slug',
          options: {
            source: 'title.english',
            maxLength: 96,
          },
          validation: (Rule) => Rule.required(),
        },
      ],
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'object',
      fields: [
        {
          name: 'bengali',
          title: 'Bengali',
          type: 'text',
          rows: 4,
        },
        {
          name: 'english',
          title: 'English',
          type: 'text',
          rows: 4,
        },
      ],
    }),
    defineField({
      name: 'ageRange',
      title: 'Age Range',
      type: 'string',
      description: 'e.g., "6-10 years" or "Class 1-5"',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'duration',
      title: 'Program Duration',
      type: 'string',
      description: 'e.g., "5 years" or "1 academic year"',
    }),
    defineField({
      name: 'islamicCurriculum',
      title: 'Islamic Studies Curriculum',
      type: 'object',
      fields: [
        {
          name: 'subjects',
          title: 'Subjects',
          type: 'array',
          of: [
            {
              type: 'object',
              fields: [
                {
                  name: 'name',
                  title: 'Subject Name',
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
                  name: 'description',
                  title: 'Description',
                  type: 'object',
                  fields: [
                    {
                      name: 'bengali',
                      title: 'Bengali',
                      type: 'text',
                      rows: 3,
                    },
                    {
                      name: 'english',
                      title: 'English',
                      type: 'text',
                      rows: 3,
                    },
                  ],
                },
                {
                  name: 'hoursPerWeek',
                  title: 'Hours per Week',
                  type: 'number',
                },
              ],
            },
          ],
        },
      ],
    }),
    defineField({
      name: 'nctbCurriculum',
      title: 'NCTB Curriculum',
      type: 'object',
      fields: [
        {
          name: 'subjects',
          title: 'Subjects',
          type: 'array',
          of: [
            {
              type: 'object',
              fields: [
                {
                  name: 'name',
                  title: 'Subject Name',
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
                  name: 'description',
                  title: 'Description',
                  type: 'object',
                  fields: [
                    {
                      name: 'bengali',
                      title: 'Bengali',
                      type: 'text',
                      rows: 3,
                    },
                    {
                      name: 'english',
                      title: 'English',
                      type: 'text',
                      rows: 3,
                    },
                  ],
                },
                {
                  name: 'hoursPerWeek',
                  title: 'Hours per Week',
                  type: 'number',
                },
              ],
            },
          ],
        },
      ],
    }),
    defineField({
      name: 'coCurricularActivities',
      title: 'Co-curricular Activities',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            {
              name: 'name',
              title: 'Activity Name',
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
              name: 'description',
              title: 'Description',
              type: 'object',
              fields: [
                {
                  name: 'bengali',
                  title: 'Bengali',
                  type: 'text',
                  rows: 2,
                },
                {
                  name: 'english',
                  title: 'English',
                  type: 'text',
                  rows: 2,
                },
              ],
            },
            {
              name: 'category',
              title: 'Category',
              type: 'string',
              options: {
                list: [
                  { title: 'Islamic Competition', value: 'islamic_competition' },
                  { title: 'Cultural Program', value: 'cultural_program' },
                  { title: 'Sports', value: 'sports' },
                  { title: 'Academic Competition', value: 'academic_competition' },
                  { title: 'Community Service', value: 'community_service' },
                ],
              },
            },
          ],
        },
      ],
    }),
    defineField({
      name: 'prerequisites',
      title: 'Prerequisites',
      type: 'object',
      fields: [
        {
          name: 'bengali',
          title: 'Bengali',
          type: 'text',
          rows: 3,
        },
        {
          name: 'english',
          title: 'English',
          type: 'text',
          rows: 3,
        },
      ],
    }),
    defineField({
      name: 'outcomes',
      title: 'Learning Outcomes',
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
      name: 'featuredImage',
      title: 'Featured Image',
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
    }),
    defineField({
      name: 'order',
      title: 'Display Order',
      type: 'number',
      description: 'Lower numbers appear first',
      initialValue: 0,
    }),
  ],
  preview: {
    select: {
      title: 'title.english',
      subtitle: 'ageRange',
      media: 'featuredImage',
    },
  },
  orderings: [
    {
      title: 'Display Order',
      name: 'orderAsc',
      by: [{ field: 'order', direction: 'asc' }],
    },
  ],
})