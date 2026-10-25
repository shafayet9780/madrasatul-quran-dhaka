# What the Studio controls, and what should move there

Goal (owner, 20 October 2026): the moving parts of the site are edited in the Studio; the obvious things stay in code. This is the inventory of the public pages as of `f94286e` (design-revamp) and the proposal. Decisions are recorded at the end once made.

"Moving" means a fact that changes as the school changes: years, dates, hours, numbers, people, classes, books, photos, steps and documents. "Copy" is wording (headlines, ledes, buttons). "Chrome" is interface text (labels, menus, legal boilerplate).

## 1. Already in the Studio

Contacts, emails, WhatsApp, hours, address, map and social links (School details); fees, discounts, payment policies, vehicles and van routes (Fees, discounts & transport); the intake's session, dates, fees, classes with their ages and requirements, and the bring list (Pre-admission form); hero photos, numbers, the day routine, play-space photos and the FAQ (Homepage); guardian reviews, directors, advisors, teachers, notices, albums, the campus tour; each page's title and description and the share picture (Search & sharing); which pages show (Menu and pages); the prospectus, curriculum and code-of-conduct PDFs (Downloads → Public PDFs).

## 2. Moving facts still in code (proposed to move)

| # | What | Where now | Proposal |
|---|---|---|---|
| A | **Classes and school structure:** the class list and ages (Nursery to Class 11, 5+ to 16+), the three stages with their classes and hours (9:00–1:00, 7:00 am–8:30 pm, 8:00–1:00), each stage's subject split, which classes each strand covers, the Quran portion, general subjects and Arabic/Islamic books per class, the goals' figures (90%+, 300+ hadith) | messages `home.plan`, `home.model`, `curriculum.*` (≈170 keys); code `src/lib/home/plan.ts`, `src/lib/home/day.ts`, `src/lib/curriculum/plan.ts`, `study-plan-table.tsx` | A **Curriculum** document: stages (name, classes, hours, split) and a row per class (name, age, stage, Quran portion, subjects, books). The homepage plan, the curriculum page and the day section read it; the drawings stay in code. The largest item. |
| B | **Founder / chairman block:** quote, aim, name, role, portrait (homepage; the About page reuses the quote; the curriculum page repeats the byline) | messages `home.founder.*`, `/images/home/founder.jpg` | Homepage → Founder: pick the director, write the quote; name, role and photo come from the director. |
| C | **Where to find us:** "600 m east of Uttara Center metro", the street address, the walk sketch's labels, the madrasa's place on the route cards | messages `home.campus.where`, `home.campus.sketch`, `campus.stage.walk`, `preAdmission.transport.madrasaPlace` | From School details (address already there; add a one-line "how to get here"). The Contact page now shows the address twice, from the Studio and from messages. |
| D | **Fixed photos:** the building, entrance, classroom, school van, the two "why us" card photos | `/images/home/*`, `/images/campus/*` in code | Photo fields on the Homepage, falling back to today's files. |
| E | **Admission process text:** the six steps, the "keep handy" list, payment methods (bKash, Nagad, card), the four FAQs on Admissions and Pre-admission, the homepage card's three documents (a copy of the Studio's bring list) | messages `preAdmission.intro.*`, `home.preAdmission.docs` | Into the Pre-admission form's cycle, beside the bring list; the homepage card reads the bring list. |
| F | **Policies:** privacy and cookie pages | messages `analytics.policy.*` | Text in the Studio with a "last updated" date. Independently of the move: both live pages show "This draft should be reviewed by legal counsel before production use", and they have no date. |
| G | **Small links:** the Our Books shop, the parent app's store links and login | code `nav.ts`, `site-footer.tsx` | School details → links. |

## 3. Copy that can stay in code

Headlines, ledes, section text and button labels on every page (hero line, "why us" cards, curriculum prose, close sections). Search titles and descriptions are already in the Studio. Option: move only the homepage hero line and its three chips.

## 4. Fixes regardless of the above

- **Homepage FAQ names a transport office, 01733-202368**, and the homepage shows the messages' FAQ until the Homepage has its own (it has none in the data). Contradicts "no transport desk number".
- **Policy pages:** the legal-review draft banner, no date, spelling মাদ্রাসাতুল (elsewhere মাদরাসাতুল), the email written into the text.
- **Session fallback `'2027'`** in four pre-admission pages: derive from the form or drop.
- Dead message groups `navigation`, `common`, `language`, top-level `footer` (≈48 keys, "© 2025").
- Smaller: the teacher page's "Teacher Not Found" is English only; শ্রেণীতে / শ্রেণিতে spelled two ways; the link-preview title (`TITLE` in the layout) is English only; the homepage's School data uses the old share photo, not the Studio's.

## Decisions (owner, 20 October 2026)

- **Timing:** before the release. The moves ride on the release-day data step (`docs/studio-cleanup.md`).
- **Homepage FAQ:** the transport office number goes; the answer keeps the Uttara and Mirpur routes.
- **A, classes and structure:** into the Studio as facts (a Curriculum document); the drawings stay in code.
- **Copy:** only the homepage hero line and its three chips move (Homepage in the Studio); all other wording stays in code.
- **B, founder:** stays in code.
- **E, admission process text:** stays in code; only the homepage card's documents read the Studio's bring list.
- **F, policies:** into the Studio with a "last updated" date; the draft banner goes.
- **C, D, G:** where to find us, the fixed photos and the outside links move to the Studio.
- Section 4's fixes are done in the same round.

## Build plan

Branch `cms-coverage`, off `design-revamp`.

How a moved piece behaves: the release-day script fills the new Studio fields with today's wording and photos (so nothing changes for visitors), and the copies in code go, except where noted as a fallback. Photos keep today's files as the fallback, since an empty photo field must not leave a hole.

1. **Fixes (section 4).** FAQ number; `'2027'` fallbacks; dead message groups; the teacher page's English-only not-found; শ্রেণী/শ্রেণি; the link-preview title in both languages; the School data photo from Search & sharing; the homepage card's documents from the bring list. → unit tests, build.
2. **Policies (F).** A Policies document (privacy, cookies: rich text in both languages, a last-updated date); the pages read it; banner gone; text seeded from today's messages with the spelling fixed and the email taken from School details. → tests, pages render the seeded text.
3. **Where to find us, outside links (C, G).** School details gains a "how to get here" line (bilingual) and the links (Our Books, parent app on Google Play and the App Store, parent login). Home, Contact, Campus and the route cards read them; the address shows once on Contact.
4. **Photos and hero (D, copy).** Homepage gains the hero line, the three chips, and photos for the building, entrance, classroom, van and the two "why us" cards.
5. **Curriculum (A).** A Curriculum document: stages (name, classes, hours, subject split) and one row per class (name, age, stage, Quran portion, general subjects, Arabic and Islamic studies book and focus), plus the goals' figures. The homepage model, plan and day bars and the curriculum page's model, strands, table and books read it. The largest step; its schema is shown to the owner before the pages are switched.
6. **Release-day script:** the new documents and fields seeded in `production`; rehearsed again on the `production` copy.
7. Review pass, both e2e suites, docs (`sanity/README.md`, `CLAUDE.md`, this file).

## As built (20 October 2026)

- **Fixes:** FAQ number gone; `sessionOrNext` (`src/lib/admissions/intake.ts`) replaces the `'2027'` fallbacks (admin too); groups `navigation`, `common`, `language`, `footer` and `home.preAdmission.docs` gone; শ্রেণী → শ্রেণি in the messages (the admin keeps its own); the link-preview defaults follow the page's language and Search & sharing; the School data's photo is the Studio's share picture; the teacher page's not-found title is the site's name. The homepage card lists the form's bring list (Studio → Pre-admission form → Cycle), and is left out while no intake is offered.
- **Policies:** `policies` singleton (sidebar after Search & sharing), `src/lib/policies.ts`, `src/components/policies/policy-article.tsx`. `{email}` in the text becomes School details' first active email (today info@…, where the old text named the Gmail address). A page without its policy shows not-found.
- **School details:** Location gains How to get here, Nearest metro station and Walk from the metro (`contactDetails` in `src/lib/contact/details.ts`; the drawing shows once both metro fields are filled); the Social tab becomes Social & links with Outside links (Our Books, parent login, Google Play, App Store; an empty link hides its button). The homepage lists the landmarks; Contact shows the address once (in its hero).
- **Homepage:** tabs Top of the page, The day, Photos, FAQ. Hero text (the promise and three boxes; icons stay in code), Section photos (`src/lib/home/photos.ts`: an empty slot keeps the launch photo and its description from messages).
- **Curriculum:** `curriculum` singleton (sidebar after Campus: a day), `src/lib/curriculum/plan.ts` (`curriculumPlan`, tested against the old constants), `load.ts`. While it is not usable (not three stages, a class outside them, the classes out of stage order) the stage card, the map, the day bars, the glance box, the goals and the table are left out. The local preview reads the seed file.
- **Seed:** `scripts/cms-coverage-seed.ts` with `scripts/data/cms-coverage-seed.json` (today's content); `src/lib/cms-coverage.ts`. The clean-up script now keeps the new School details fields. Rehearsed on `production` (after the clean-up): one transaction, a second run finds nothing.
- **What a visitor sees differently** (text diff of the main pages against design-revamp, both on `production`): the homepage's stage names and Bengali class ranges are now the curriculum page's (Hifz rather than Hifz day-care, After Hifz rather than After-Hifz, প্রথম rather than ১ম); the homepage lists the landmarks and the form's five bring-list items; the FAQ has no transport number; Contact shows the address once; the policies have no draft banner, a date, the fixed spelling and the Studio's email.
- **Review (20 October):** fixed a dataset without the new documents (today's `development`, the local preview): the curriculum, the policies and the hero text then come from the seed file, so no page 404s or loses a section before the seed runs; the Studio refuses a class order the site can't draw (`classOrderProblem`); "On this page" lists only the sections shown; the "where" headings fall back to "Where to find us"; an email without its switch counts as shown. The campus tour's walk note is now the "How to get here" line (the page is off at release).
- **Left in code, though facts:** the homepage's day lede ("7:00 am to 8:30 pm …"), the map's subtitle and exits, the strand texts, the after-Dakhil ways, the transport madrasa place on the route cards (সেক্টর ১৭, উত্তরা), the campus tour's launch fallback.
