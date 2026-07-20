import { defineField, defineType } from 'sanity'

function publicPdf(name: string, title: string, purpose: string) {
  return defineField({
    name,
    title,
    type: 'vercelBlobFile',
    options: { uploadPurpose: purpose },
  } as never)
}

export const publicDownloadSettings = defineType({
  name: 'publicDownloadSettings',
  title: 'Public Download Files',
  type: 'document',
  fields: [
    publicPdf('prospectus', 'Prospectus (PDF)', 'public-prospectus'),
    publicPdf('curriculum', 'Curriculum (PDF)', 'public-curriculum'),
    publicPdf(
      'codeOfConduct',
      'Parents’ Code of Conduct (PDF)',
      'public-code-of-conduct',
    ),
  ],
  preview: {
    prepare: () => ({ title: 'Public Download Files' }),
  },
})
