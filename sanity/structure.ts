import type { ListItem, ListItemBuilder, StructureResolver } from 'sanity/structure'
import { orderableDocumentListDeskItem } from '@sanity/orderable-document-list'

/** The one-off documents: fixed sidebar entries whose id is their type; never created from "+" or duplicated (sanity.config.ts). */
export const SINGLETONS = ['homePage', 'campusDay', 'preAdmissionForm', 'feeSettings', 'publicDownloadSettings', 'siteSettings', 'pagesOnOff', 'seoSettings']

/**
 * The Studio sidebar, by how often each part is touched: the weekly updates first, then the pages, people and
 * downloads, then the school's own settings, then the surveys. Plan: docs/studio-cleanup.md.
 */
export const structure: StructureResolver = (S, context) => {
  const single = (type: string, title: string) =>
    S.listItem().title(title).id(type).schemaType(type).child(S.document().schemaType(type).documentId(type).title(title))
  const ordered = (type: string, title: string) => orderableDocumentListDeskItem({ type, title, S, context })
  const group = (id: string, title: string, items: (ListItem | ListItemBuilder)[]) =>
    S.listItem().title(title).id(id).child(S.list().title(title).items(items))

  return S.list()
    .title('Content')
    .items([
      S.listItem()
        .title('Notices')
        .schemaType('notice')
        .child(S.documentTypeList('notice').title('Notices').defaultOrdering([{ field: 'number.year', direction: 'desc' }, { field: 'number.serial', direction: 'desc' }])),
      S.listItem().title('Gallery').schemaType('album').child(S.documentTypeList('album').title('Gallery: albums').defaultOrdering([{ field: 'date', direction: 'desc' }])),
      ordered('testimonial', 'Guardian reviews'),
      S.divider(),

      single('homePage', 'Homepage'),
      single('campusDay', 'Campus: a day'),
      group('admissions', 'Admissions', [
        // A list, not the fixed id, until the clean-up script has moved the form there (docs/studio-cleanup.md); it can't be created from "+".
        S.listItem().title('Pre-admission form').id('preAdmissionForm').schemaType('preAdmissionForm').child(S.documentTypeList('preAdmissionForm').title('Pre-admission form')),
        single('feeSettings', 'Fees, discounts & transport'),
      ]),
      S.divider(),

      group('people', 'People', [ordered('director', 'Directors'), ordered('advisor', 'Advisors'), ordered('teacher', 'Teachers'), ordered('department', 'Departments')]),
      group('downloadsLibrary', 'Downloads', [
        S.listItem().title('Library items').schemaType('downloadable').child(S.documentTypeList('downloadable').title('Library items')),
        S.listItem().title('Categories').schemaType('downloadCategory').child(S.documentTypeList('downloadCategory').title('Categories')),
        single('publicDownloadSettings', 'Public PDFs'),
      ]),
      S.divider(),

      single('siteSettings', 'School details'),
      single('pagesOnOff', 'Pages on/off'),
      single('seoSettings', 'Search & sharing'),
      S.divider(),

      group('surveys', 'Surveys', [
        S.documentTypeListItem('surveyRound').title('Rounds'),
        S.documentTypeListItem('surveyTemplate').title('Templates'),
        S.documentTypeListItem('surveyClass').title('Classes & Subjects'),
        S.documentTypeListItem('surveyTeacher').title('Teachers (survey)'),
        S.documentTypeListItem('surveyArea').title('Areas'),
      ]),
    ])
}
