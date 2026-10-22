# Notice board

Agreed with the owner on 18 October 2026 (interview); the design (the Blend boards) approved and built the same day (see As built below).

- Design canvas: https://claude.ai/artifact/N9bfjbtWWnPZHjmk5MA4PQ
  - Main, MainPhone: the board. Notice, NoticePhone: one notice. NoticeEn: the English page, a notice in Bengali only.
  - Home, HomePhone: the homepage block. Header: the menu with নোটিশ.

## What it is

নোটিশ বোর্ড: the school's official public notices, the ones a school pins on its board and parents forward in
WhatsApp groups. It replaces the old News page; events and achievements with photos belong in the Gallery.

The look blends readability with formality (owner, 18 October 2026: "Notice is a formal thing", then "make a
blend" of the first, warmer design and the formal register): paper, ink and rules, the type as plain words, no
coloured tags, chips or photos, unlike the gallery.

- **Every notice has a number** by year, `২০২৬/১৭`, given automatically in the order notices are published; the office types nothing.
- **The board,** `/[locale]/notices`:
  - the heading and a lead, then the pinned notices as cards with an ink rule on top (জরুরি); they also keep their place in the list, so the numbers have no gaps
  - one row per notice, newest first, grouped by month: the day large with its weekday, then the number and type, the title, one line of text, and PDF / ছবি marks; an outlined নতুন for a notice's first seven days
  - text tabs for the type: ভর্তি (Admission), ছুটি ও বন্ধ (Holidays and closures), পরীক্ষা ও ফলাফল (Exams and results), অনুষ্ঠান ও সাধারণ (Events and general)
  - nothing expires: a year switch, and older months load with one button
- **A notice,** `/[locale]/notices/[slug]`, an article on a sheet:
  - a slim letterhead (the school's name, the notice's number and date), then its type, its title and its text
  - সংযুক্তি: each PDF with দেখুন / ডাউনলোড and its size; pictures (a photo or scan of the paper notice) full width, tap to zoom
  - print (a print layout of the sheet alone), and the previous and next notice
  - share: WhatsApp and copy link. The link's preview shows the title, the date and the school's name; a notice with a picture uses it as the preview image.
  - no issuer line
- **Elsewhere:**
  - নোটিশ in the main menu
  - a homepage block with the latest three notices (pinned first) and a link to the board
  - no site-wide strip: the admissions banner already uses the top of every page; an urgent notice is pinned instead
- **The old News page:** `/news` and its articles redirect to the board. The six sample news items stay in Studio unused until the owner says to delete them.
- **On/off:** a Site Settings switch like the gallery's. It stays off until the first notices are in.

## Where things live

- **Notices:** Studio → Notices (a new `notice` type). Office staff post them, so Studio keeps to a few fields, with help text in Bengali:
  - title: Bengali, English optional
  - date: today unless changed
  - type: one of the four above
  - text: Bengali, English optional; short plain paragraphs
  - attachments: pictures and PDFs, any number
  - pinned until (optional): first on the board and the homepage until that date
  - a notice needs a text or an attachment, or both
  - the link is made automatically; nobody types it
- **English pages:** a notice without English shows in Bengali (marked `lang="bn"`) with a short note that it is in Bengali only.
- **Caching:** like the other pages, built ahead of time and refreshed from Studio every 60 s, so a published notice is on the board within a minute. A notice's own page is built on its first visit.
- **Search:** the board and every notice are in the sitemap and open to search engines.

## Rules for the content (proposed)

- The board is public and searchable: no personal details. No students' names, marks, phone numbers or photos of students in notices. Results are notices that results are out (or admission results by application ID), never lists of names and marks.
- One notice per matter; a change is a new notice that says what it replaces, or an edit to the same one.

## Open with the owner

- The name and address: নোটিশ বোর্ড / Notice board at `/notices`, and its place in the menu (built: before যোগাযোগ).
- The rule on personal details above (built into the Studio help text for the text field).
- Whether the notice sheet's text is set in Tiro Bangla, like a printed letter (built without it: the design system keeps Tiro for quotations).

## As built (18 October 2026)

- **Studio:** `sanity/schemas/notice.ts`, Studio → Notices (newest number first). A new notice takes the next number of its Dhaka year (counting drafts) and today's date when it is created, not when it is published: a notice started first keeps the lower number, and a draft deleted unpublished leaves a gap. The number is read-only and checked for clashes (two notices started before either is saved). A switch, ওয়েবসাইটে দেখান, takes a notice off the site without deleting it. The switch is Site Settings → Navigation → Notice board (`showNotices`).
- **Code:** the logic in `src/lib/notices/notices.ts` (tested), the pieces in `src/components/notices`, the pages in `src/app/[locale]/notices`. The homepage block sits between the guardian reviews and the FAQ. The share buttons are shared with the gallery (`src/components/site/share-links.tsx`).
- **Sharing:** the WhatsApp message starts with the number (নং ২০২৬/১৭, then the title); the link preview's text starts with the date.
- **Zoom:** a picture opens whole in a new tab, where a phone can pinch to zoom (no viewer like the gallery's).
- **Local preview:** `ADMISSIONS_LOCAL=1` switches the board on with sample notices (`src/lib/notices/testing/sample-notices.ts`); `e2e/notices.spec.ts` runs there (`pnpm test:e2e:admissions`).
- **Before switching it on:** post the first notices, then turn on the switch; the menu, homepage block and sitemap follow, and `/news` then leads to the board.
