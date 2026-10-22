import { defineType } from 'sanity'
import { orderRankField, orderRankOrdering } from '@sanity/orderable-document-list'
import { mlString, mlText, profilePhoto } from './shared'

export const advisor = defineType({
  name: 'advisor',
  title: 'Advisor',
  type: 'document',
  fields: [
    mlString('name', 'Name', { required: true }),
    profilePhoto(),
    mlText('summary', 'Short Description', { rows: 3, required: true }),
    orderRankField({ type: 'advisor', newItemPosition: 'after' }),
  ],
  preview: {
    select: { title: 'name.english', subtitle: 'summary.english', media: 'photo' },
  },
  orderings: [orderRankOrdering],
})
