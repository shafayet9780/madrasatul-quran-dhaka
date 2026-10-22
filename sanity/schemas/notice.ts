import { defineArrayMember, defineField, defineType } from 'sanity'
import { NOTICE_TYPES, type NoticeType } from '../../src/lib/notices/notices'

// The notice board (Studio → Notices, docs/notices.md): the school's official notices. The office posts them, so the
// fields are few and their help is in Bengali. Each notice gets the next number of its year when it is created
// (২০২৬/১৭); its link is that number, so nobody types one.

const TYPE_TITLES: Record<NoticeType, string> = {
  admission: 'ভর্তি (Admission)',
  holiday: 'ছুটি ও বন্ধ (Holidays and closures)',
  exam: 'পরীক্ষা ও ফলাফল (Exams and results)',
  general: 'অনুষ্ঠান ও সাধারণ (Events and general)',
}

const API = { apiVersion: '2024-01-01' }
const dhakaToday = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Dhaka' })
const baseId = (id: string) => id.replace(/^drafts\./, '')

type Doc = { _id?: string; number?: { year?: number; serial?: number }; body?: { bengali?: string }; attachments?: unknown[] }

export const notice = defineType({
  name: 'notice',
  title: 'Notice',
  type: 'document',
  // The next number of the year, counting drafts too, so a notice still being written keeps its number. Two notices
  // started before either is saved would get the same one; the number's check below catches that.
  initialValue: async (_params, context) => {
    const year = Number(dhakaToday().slice(0, 4))
    const last = await context.getClient(API).fetch<number | null>(
      `*[_type == "notice" && number.year == $year] | order(number.serial desc)[0].number.serial`,
      { year },
    )
    return { number: { year, serial: (last ?? 0) + 1 }, date: dhakaToday(), show: true }
  },
  validation: (rule) =>
    rule.custom((doc: Doc | undefined) =>
      doc?.body?.bengali?.trim() || doc?.attachments?.length ? true : 'নোটিশের লেখা দিন, অথবা অন্তত একটি ছবি বা PDF যোগ করুন।',
    ),
  fields: [
    defineField({
      name: 'number',
      title: 'নোটিশ নং (Number)',
      description: 'নিজে থেকে দেওয়া হয়, বদলানোর দরকার নেই। নোটিশের লিংকও এই নম্বর দিয়ে হয়।',
      type: 'object',
      readOnly: true,
      options: { columns: 2 },
      fields: [
        { name: 'year', title: 'Year', type: 'number' },
        { name: 'serial', title: 'Serial', type: 'number' },
      ],
      validation: (rule) =>
        rule.custom(async (value: Doc['number'], context) => {
          if (!value?.year || !value?.serial) return 'নম্বর নেই। এই নোটিশটি মুছে নতুন করে লিখুন।'
          const id = baseId(context.document?._id ?? '')
          const taken = await context.getClient(API).fetch<number>(
            `count(*[_type == "notice" && number.year == $year && number.serial == $serial && !(_id in [$id, $draft])])`,
            { year: value.year, serial: value.serial, id, draft: `drafts.${id}` },
          )
          return taken ? 'এই নম্বর আরেকটি নোটিশের। এই নোটিশটি মুছে নতুন করে লিখুন।' : true
        }),
    }),
    defineField({
      name: 'title',
      title: 'বিষয় / শিরোনাম (Title)',
      description: 'ছোট করে, কী নিয়ে নোটিশ। ইংরেজি না দিলে ইংরেজি পেজে বাংলাটাই দেখাবে।',
      type: 'object',
      fields: [
        { name: 'bengali', title: 'Bengali', type: 'string', validation: (rule) => rule.required() },
        { name: 'english', title: 'English (optional)', type: 'string' },
      ],
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'date',
      title: 'তারিখ (Date)',
      description: 'নোটিশের তারিখ। আজকের তারিখ নিজে থেকে বসানো থাকে।',
      type: 'date',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'type',
      title: 'ধরন (Type)',
      type: 'string',
      options: { list: NOTICE_TYPES.map((value) => ({ title: TYPE_TITLES[value], value })), layout: 'radio' },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'body',
      title: 'নোটিশের লেখা (Text)',
      description: 'অনুচ্ছেদের মাঝে একটি ফাঁকা লাইন রাখুন। ওয়েবসাইট সবাই দেখে: কোনো শিক্ষার্থীর নাম, নম্বর, ফোন নম্বর বা ছবি দেবেন না। ফলাফল দিন শুধু "ফলাফল প্রকাশিত হয়েছে" বা আবেদন নম্বর দিয়ে।',
      type: 'object',
      fields: [
        { name: 'bengali', title: 'Bengali', type: 'text', rows: 8 },
        { name: 'english', title: 'English (optional)', type: 'text', rows: 8 },
      ],
    }),
    defineField({
      name: 'attachments',
      title: 'সংযুক্তি (Attachments)',
      description: 'সই করা নোটিশের ছবি বা স্ক্যান, আর PDF (যেমন রুটিন)। ছবি নোটিশের লেখার নিচে দেখায়, PDF দেখা ও ডাউনলোডের বাটনে।',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'image',
          title: 'ছবি (Picture)',
          fields: [
            defineField({
              name: 'alt',
              title: 'ছবিতে কী আছে (for screen readers)',
              type: 'object',
              fields: [
                { name: 'bengali', title: 'Bengali', type: 'string' },
                { name: 'english', title: 'English (optional)', type: 'string' },
              ],
            }),
          ],
        }),
        defineArrayMember({
          type: 'file',
          title: 'PDF',
          options: { accept: 'application/pdf' },
          fields: [
            defineField({
              name: 'name',
              title: 'নাম (যেমন অর্ধবার্ষিক পরীক্ষার রুটিন)',
              description: 'না দিলে নোটিশের শিরোনামটাই দেখাবে।',
              type: 'object',
              fields: [
                { name: 'bengali', title: 'Bengali', type: 'string' },
                { name: 'english', title: 'English (optional)', type: 'string' },
              ],
            }),
          ],
        }),
      ],
    }),
    defineField({
      name: 'pinnedUntil',
      title: 'জরুরি: ওপরে রাখুন এই তারিখ পর্যন্ত (Pinned until)',
      description: 'ঐচ্ছিক। দিলে নোটিশটি এই তারিখ পর্যন্ত নোটিশ বোর্ড ও হোম পেজের সবার ওপরে থাকবে।',
      type: 'date',
    }),
    defineField({ name: 'show', title: 'ওয়েবসাইটে দেখান (Show on the site)', type: 'boolean', initialValue: true }),
  ],
  orderings: [{ title: 'Number, newest first', name: 'numberDesc', by: [{ field: 'number.year', direction: 'desc' }, { field: 'number.serial', direction: 'desc' }] }],
  preview: {
    select: { title: 'title.bengali', year: 'number.year', serial: 'number.serial', date: 'date', show: 'show', pinned: 'pinnedUntil' },
    prepare: ({ title, year, serial, date, show, pinned }) => ({
      title: `${show === false ? '(hidden) ' : ''}${title ?? ''}`,
      subtitle: [year && serial ? `${year}/${serial}` : '', date, pinned ? `pinned until ${pinned}` : ''].filter(Boolean).join(' · '),
    }),
  },
})
