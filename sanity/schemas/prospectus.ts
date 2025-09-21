import { defineType, defineField } from 'sanity';

export default defineType({
  name: 'prospectus',
  title: 'Prospectus',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'founder',
      title: 'Founder Information',
      type: 'object',
      fields: [
        defineField({
          name: 'name',
          title: 'Name (Bengali)',
          type: 'string',
        }),
        defineField({
          name: 'title',
          title: 'Title (Bengali)',
          type: 'string',
        }),
        defineField({
          name: 'subtitle',
          title: 'Subtitle (Bengali)',
          type: 'string',
        }),
        defineField({
          name: 'nameEnglish',
          title: 'Name (English)',
          type: 'string',
        }),
        defineField({
          name: 'titleEnglish',
          title: 'Title (English)',
          type: 'string',
        }),
        defineField({
          name: 'subtitleEnglish',
          title: 'Subtitle (English)',
          type: 'string',
        }),
      ],
    }),
    defineField({
      name: 'institution',
      title: 'Institution Information',
      type: 'object',
      fields: [
        defineField({
          name: 'name',
          title: 'Name (Bengali)',
          type: 'string',
        }),
        defineField({
          name: 'subtitle',
          title: 'Subtitle (Bengali)',
          type: 'string',
        }),
        defineField({
          name: 'nameEnglish',
          title: 'Name (English)',
          type: 'string',
        }),
        defineField({
          name: 'subtitleEnglish',
          title: 'Subtitle (English)',
          type: 'string',
        }),
      ],
    }),
    defineField({
      name: 'studyPlan',
      title: '10-Year Study Plan',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            defineField({
              name: 'age',
              title: 'Age',
              type: 'string',
            }),
            defineField({
              name: 'classBengali',
              title: 'Class (Bengali)',
              type: 'string',
            }),
            defineField({
              name: 'classEnglish',
              title: 'Class (English)',
              type: 'string',
            }),
            defineField({
              name: 'islamicStudiesBengali',
              title: 'Islamic Studies (Bengali)',
              type: 'string',
            }),
            defineField({
              name: 'islamicStudiesEnglish',
              title: 'Islamic Studies (English)',
              type: 'string',
            }),
            defineField({
              name: 'generalBengali',
              title: 'General Studies (Bengali)',
              type: 'string',
            }),
            defineField({
              name: 'generalEnglish',
              title: 'General Studies (English)',
              type: 'string',
            }),
          ],
        },
      ],
    }),
    defineField({
      name: 'uniqueFeatures',
      title: 'Unique Features',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            defineField({
              name: 'icon',
              title: 'Icon',
              type: 'string',
            }),
            defineField({
              name: 'titleBengali',
              title: 'Title (Bengali)',
              type: 'string',
            }),
            defineField({
              name: 'titleEnglish',
              title: 'Title (English)',
              type: 'string',
            }),
            defineField({
              name: 'descriptionBengali',
              title: 'Description (Bengali)',
              type: 'text',
            }),
            defineField({
              name: 'descriptionEnglish',
              title: 'Description (English)',
              type: 'text',
            }),
          ],
        },
      ],
    }),
    defineField({
      name: 'curriculumSubjects',
      title: 'Curriculum Subjects',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            defineField({
              name: 'icon',
              title: 'Icon',
              type: 'string',
            }),
            defineField({
              name: 'titleBengali',
              title: 'Title (Bengali)',
              type: 'string',
            }),
            defineField({
              name: 'titleEnglish',
              title: 'Title (English)',
              type: 'string',
            }),
            defineField({
              name: 'descriptionBengali',
              title: 'Description (Bengali)',
              type: 'text',
            }),
            defineField({
              name: 'descriptionEnglish',
              title: 'Description (English)',
              type: 'text',
            }),
          ],
        },
      ],
    }),
    defineField({
      name: 'feeStructure',
      title: 'Fee Structure',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            defineField({
              name: 'itemBengali',
              title: 'Item (Bengali)',
              type: 'string',
            }),
            defineField({
              name: 'itemEnglish',
              title: 'Item (English)',
              type: 'string',
            }),
            defineField({
              name: 'preHifz',
              title: 'Pre-Hifz Amount (BDT)',
              type: 'number',
            }),
            defineField({
              name: 'hifz',
              title: 'Hifz Amount (BDT)',
              type: 'number',
            }),
          ],
        },
      ],
    }),
    defineField({
      name: 'higherEducation',
      title: 'Higher Education Information',
      type: 'object',
      fields: [
        defineField({
          name: 'alimPathBengali',
          title: 'Alim Path (Bengali)',
          type: 'text',
        }),
        defineField({
          name: 'alimPathEnglish',
          title: 'Alim Path (English)',
          type: 'text',
        }),
        defineField({
          name: 'collegePathBengali',
          title: 'College Path (Bengali)',
          type: 'text',
        }),
        defineField({
          name: 'collegePathEnglish',
          title: 'College Path (English)',
          type: 'text',
        }),
      ],
    }),
    defineField({
      name: 'specialDiscount',
      title: 'Special Discount Information',
      type: 'object',
      fields: [
        defineField({
          name: 'noteBengali',
          title: 'Note (Bengali)',
          type: 'text',
        }),
        defineField({
          name: 'noteEnglish',
          title: 'Note (English)',
          type: 'text',
        }),
      ],
    }),
    defineField({
      name: 'publishedAt',
      title: 'Published At',
      type: 'datetime',
    }),
  ],
  preview: {
    select: {
      title: 'title',
      publishedAt: 'publishedAt',
    },
    prepare(selection) {
      const { title, publishedAt } = selection;
      return {
        title: title || 'Prospectus',
        subtitle: publishedAt ? new Date(publishedAt).toLocaleDateString() : 'Not published',
      };
    },
  },
});
