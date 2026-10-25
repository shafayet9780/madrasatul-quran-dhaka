import { defineArrayMember, defineField, defineType } from 'sanity'
import { MENU_ITEMS } from '../../src/lib/nav-visibility'

const toggle = (name: string, title: string, fieldset: string, initialValue = true) =>
  defineField({ name, title, type: 'boolean', initialValue, fieldset })

/**
 * Studio → Menu and pages (singleton `pagesOnOff`). Menu order sets the order of the menu and the footer. Turning a
 * page off takes it out of the menu, the footer and the sitemap; the pages in the first group also stop existing (their
 * address shows the not-found page). Read through the site settings query as `navigationVisibility`
 * (src/lib/nav-visibility.ts).
 */
export const pagesOnOff = defineType({
  name: 'pagesOnOff',
  title: 'Menu and pages',
  type: 'document',
  fieldsets: [
    { name: 'pages', title: 'Pages (off: the page is gone, its address shows “not found”)' },
    { name: 'links', title: 'Menu links (off: the page stays, only its menu link goes)' },
  ],
  fields: [
    defineField({
      name: 'menuOrder',
      title: 'Menu order',
      description: 'Drag the items into the order you want in the menu and the footer. An item switched off below is left out wherever it sits; an item missing here comes after the listed ones.',
      type: 'array',
      of: [
        defineArrayMember({
          name: 'menuItem',
          title: 'Menu item',
          type: 'object',
          fields: [defineField({ name: 'page', title: 'Item', type: 'string', options: { list: MENU_ITEMS }, validation: (rule) => rule.required() })],
          preview: {
            select: { page: 'page' },
            prepare: ({ page }) => ({ title: MENU_ITEMS.find((i) => i.value === page)?.title ?? 'Choose an item' }),
          },
        }),
      ],
      validation: (rule) =>
        rule.custom((items: { page?: string }[] | undefined) => {
          const pages = (items ?? []).map((i) => i.page).filter(Boolean)
          const twice = pages.find((p, i) => pages.indexOf(p) !== i)
          return twice ? `${MENU_ITEMS.find((i) => i.value === twice)?.title ?? twice} is in the list twice.` : true
        }),
    }),
    toggle('showPeople', 'About us (the board and the advisors)', 'pages'),
    toggle('showDirectors', 'Directors (on About us, and their profile pages)', 'pages'),
    toggle('showAdvisors', 'Advisors (on About us)', 'pages'),
    toggle('showTeachers', 'Teachers', 'pages'),
    toggle('showCampus', 'Campus (turn on once the tour’s photos are in)', 'pages', false),
    toggle('showGallery', 'Gallery (turn on once the first albums are in)', 'pages', false),
    toggle('showNotices', 'Notice board (turn on once the first notices are in; old News links then lead to it)', 'pages', false),
    toggle('showCurriculum', 'Curriculum', 'links'),
    toggle('showAdmissions', 'Admissions', 'links'),
    toggle('showContact', 'Contact', 'links'),
    toggle('showBooks', 'Our Books (the outside bookshop, in the menu and the footer)', 'links'),
  ],
  preview: { prepare: () => ({ title: 'Menu and pages' }) },
})
