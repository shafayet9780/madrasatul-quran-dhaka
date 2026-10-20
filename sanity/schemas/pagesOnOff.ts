import { defineField, defineType } from 'sanity'

const toggle = (name: string, title: string, fieldset: string, initialValue = true) =>
  defineField({ name, title, type: 'boolean', initialValue, fieldset })

/**
 * Studio → Pages on/off (singleton `pagesOnOff`). Turning a page off takes it out of the menu, the footer and the
 * sitemap; the pages in the first group also stop existing (their address shows the not-found page). Read through the
 * site settings query as `navigationVisibility` (src/lib/nav-visibility.ts).
 */
export const pagesOnOff = defineType({
  name: 'pagesOnOff',
  title: 'Pages on/off',
  type: 'document',
  fieldsets: [
    { name: 'pages', title: 'Pages (off: the page is gone, its address shows “not found”)' },
    { name: 'links', title: 'Menu links (off: the page stays, only its menu link goes)' },
  ],
  fields: [
    toggle('showPeople', 'About us (the board and the advisors)', 'pages'),
    toggle('showDirectors', 'Directors (on About us, and their profile pages)', 'pages'),
    toggle('showAdvisors', 'Advisors (on About us)', 'pages'),
    toggle('showTeachers', 'Teachers', 'pages'),
    toggle('showCampus', 'Campus', 'pages'),
    toggle('showGallery', 'Gallery (turn on once the first albums are in)', 'pages', false),
    toggle('showNotices', 'Notice board (turn on once the first notices are in; old News links then lead to it)', 'pages', false),
    toggle('showCurriculum', 'Curriculum', 'links'),
    toggle('showAdmissions', 'Admissions', 'links'),
    toggle('showContact', 'Contact', 'links'),
    toggle('showBooks', 'Our Books (the outside bookshop, in the menu and the footer)', 'links'),
  ],
  preview: { prepare: () => ({ title: 'Pages on/off' }) },
})
