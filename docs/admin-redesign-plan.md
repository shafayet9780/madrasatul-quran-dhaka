# One admin, one design: plan

Goal: the whole admin (`/admin`, both ভর্তি and জরিপ) uses the shadcn design language built for admissions,
the survey pages are restyled and simplified, and both survey prints work on A4. Ships with the
`pre-admission-2027` branch.

## Decisions (2026-10-08)

| Topic | Decision |
|---|---|
| Live survey changes on `main` | Merge `main` in; keep its tabs component as is (no radix swap). |
| Admissions ideas from the survey work | Only the class filter: each class on the admissions overview opens the filtered list. |
| Design | One neutral shadcn palette and one set of components for both modules; no colour switch between modules. |
| Fonts | Anek Bangla for headings, Noto Sans Bengali for text, Inter for Latin IDs and digits. |
| Survey pages | Restyle **and simplify**. For each batch I show the proposed changes first and build after your OK. |
| Chart and mark colours | Kept (they carry meaning); checked for contrast and colour-blind safety on white. |
| Guardian copy | Adds the class-management review as the guardian's average per subject (subject names only, no teacher names). Stays one A4 page. |
| Internal print | Its own A4 print page with all three reviews, notes and history. |
| Timing | Print fixes ship with this branch, not separately to `main`. |
| Checking | A local survey preview with sample data, so every page and print is screenshotted before each push. |
| Not included | The public survey forms and receipts (`/survey/...`); survey logic. |

## Phase A: bring in `main`, class filter

1. Merge `origin/main` (merge commit, no rebase). Check: tsc, unit tests, e2e. Push.
2. Admissions overview: each class bar links to `/admin/admissions/applications?class=<code>`
   (the list already filters by `?class=`). e2e checks the link and the filtered list. Push.

## Phase B: local survey preview

1. With `ADMISSIONS_LOCAL=1` the survey reads the same in-memory Postgres as admissions
   (`getDb()` honours the local override, as `getAdmissionsDb()` does).
2. Load the existing sample survey data (now `src/lib/survey/testing/dev-fixtures.ts`: two teacher rounds, a
   guardian class-management and a guardian-about-the-child round, students, batches, a draft) into it at
   start-up, without Sanity or Neon. The fixture loader takes a database instead of using
   `.env.local`.
3. A screenshot script (Playwright) for every admin page: desktop, phone, and print (A4 PDF).

Check: every survey admin page renders with the sample data; `pnpm survey:fixtures` against
Neon still works.

Done: `pnpm test:e2e:admissions` also runs the survey specs that need only the database (reports,
tracker, teacher and guardian forms) against the sample data; `pnpm admin:screenshots`.

## Phase C: one shell, one theme

1. Fonts as decided; Hind Siliguri stays only on the public survey forms.
2. One palette for the whole shell (sidebar, page top bar, phone tabs and menu sheet, round picker as
   a shadcn select). The module switcher stays.
3. Shared admin UI pieces move from `admissions/ui.tsx` to `src/app/admin/ui.tsx` (page body, title,
   card, empty state, tabs, badges). Survey-only pieces (mark chip, flag, KPI tile) build on them.

Check: screenshots of both modules; e2e for both.

Done: one palette (`.sv-root.sv-admin` in admin.css) and font set for both modules; the app frame
never prints; shared pieces in `src/app/admin/ui.tsx` (`PageBody`, `PageTitle`, `Card`,
`EmptyState`, `LAT`, `TONE_TEXT`). The round picker stays a native select (styled), which suits phones
and screen readers better than a custom one.

## Phase D: survey pages, in batches

For each batch: screenshots of today's page → short list of proposed simplifications → your OK →
build → screenshots → push.

1. Overview, classes and student search, class page.
   Done (agreed 2026-10-09): filters apply on change (rarely changed guardian-round choices under
   "আরও বিকল্প"); four tiles that open their pages; response by class and needs-attention as compact
   tables (all classes stay in the teaching table); classes page = full-width search + a classes
   table with guardian answers; class page without the per-student scatter, the area comparison as
   the student page's table (⚠ at 1 mark), the student table with the difference once (⚠ at 2) and
   short rows on phones.
2. Student page and both prints (below).
   Done (agreed 2026-10-09): one mark legend (the four marks; an average takes the colour of the
   step below); on phones the teacher and class-management answers are one block per subject; the
   header card and every subject column stay on screen. Guardian copy: class management as the
   guardian's average per subject, trend chart dropped. Internal print as planned below.
3. Teaching quality, question results, rater patterns (charts keep their data colours).
   Done (agreed 2026-10-09): teaching quality with the area averages as tiles and the cell details
   under a full-width table; question results with the guardian rounds under "আরও বিকল্প", one
   colour key and four tabs (print shows all); rater patterns with the explanations folded and
   short rows on phones.
4. Response tracker (teacher and guardian), rounds, ERP import, error and not-found pages.
   Done (agreed 2026-10-09): tracker round picker as a filter menu with Excel/print in the top bar,
   no "এই পাতায়" links, duplicates waiting for a decision first, one note for children without a
   number; rounds with one button and a ⋯ menu, closed rounds folded, short rows on phones; import,
   error and not-found restyled only. The rounds e2e now also runs on the local preview.

### Prints (batch 2)

- **Guardian copy**: adds "ক্লাস পরিচালনা" as subject → the guardian's average mark. Check: the
  A4 PDF is one page with the sample data's largest class.
- **Internal print**: a new page `/admin/reports/student/[erpId]/print`, opened by the student page's
  print button:
  - header with school, student, round, print date and "অভ্যন্তরীণ";
  - attention, comparison, the three answer sets in full, teachers' notes, history (unfolded);
  - A4 portrait. A teacher table too wide for the page is split into parts that repeat the question
    column, so nothing is cut off;
  - sections may break across pages; table rows don't; table headers repeat on each page.

  Checks: in the print view no content is wider than the page; all three answer sets and the
  history are present.

## Phase E: clean-up

Remove the survey CSS no longer used; update `docs/survey-admin-guide.md` and the CLAUDE.md note
that `docs/survey-mockups/` is the locked design (now: content only; the admin follows the
admissions design). Full tests and e2e; push.

Done (2026-10-09): 19 unused class families removed from admin.css (cards, buttons, inputs, notes,
KPI tiles, splits, tags, chips, the compact stackable table and the old phone h1 rule); the admin
guide describes the new layouts; CLAUDE.md says the mockups now describe the admin's content only.

## While this runs

A survey fix on `main` before this branch ships: merge it in and carry it over to the new design.
