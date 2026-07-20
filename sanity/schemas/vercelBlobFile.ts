import { defineField, defineType } from 'sanity'
import { VercelBlobInput } from '../components/VercelBlobInput'

export const vercelBlobFile = defineType({
  name: 'vercelBlobFile',
  title: 'Vercel Blob File',
  type: 'object',
  components: { input: VercelBlobInput },
  fields: [
    defineField({ name: 'pathname', title: 'Blob Pathname', type: 'string', readOnly: true }),
    defineField({ name: 'url', title: 'Blob URL', type: 'url', readOnly: true }),
    defineField({ name: 'downloadUrl', title: 'Blob Download URL', type: 'url', readOnly: true }),
    defineField({ name: 'originalFilename', title: 'Original Filename', type: 'string', readOnly: true }),
    defineField({ name: 'contentType', title: 'MIME Type', type: 'string', readOnly: true }),
    defineField({ name: 'size', title: 'Size (bytes)', type: 'number', readOnly: true }),
    defineField({ name: 'etag', title: 'ETag', type: 'string', readOnly: true }),
    defineField({ name: 'uploadedAt', title: 'Uploaded At', type: 'datetime', readOnly: true }),
  ],
  validation: (Rule) =>
    Rule.custom((value) => {
      if (!value) return 'A file is required'
      const required = ['pathname', 'url', 'originalFilename', 'contentType', 'size', 'etag', 'uploadedAt']
      return required.every((field) => Boolean((value as Record<string, unknown>)[field]))
        ? true
        : 'Please finish uploading the file'
    }),
})
