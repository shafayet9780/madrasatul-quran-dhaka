# Survey System — Implementation Plan (Phase 1: T1 + T1 reports)

Status: **locked** (2026-10-04)
Inputs: [`survey-system.md`](survey-system.md) (spec, locked) · [`survey-mockups/`](survey-mockups/README.md) (prototype + design system, locked)

## 1. Decisions (from the planning interview)

| Topic | Decision |
|---|---|
| Timeline | Flexible; build fast but complete — no half-finished screens or skipped states |
| Scope | Spec phase 1 **plus T1 reports** (class view, student profile from teacher marks, rater patterns) |
| Database | Neon Postgres (free) via Vercel Marketplace; owner creates it with step-by-step guidance |
| Hosting | Vercel **Hobby** → cron jobs at most once a day |
| Sheet copy | New dedicated "Survey Responses" spreadsheet, shared with the existing service account, one tab per round |
| Seed data | Owner sends the teacher list and subjects per class; loaded by a setup script |
| Delivery | Commits on `survey-form`; no PRs until the owner asks |
| Pre-admission Sheets issue | Fixed in a separate commit using the new server-only Sheets module |

## 2. Technical choices

- **DB access:** Drizzle ORM + `drizzle-kit` migrations; `@neondatabase/serverless` HTTP driver with the pooled URL. A Neon **dev branch** for local work and tests; `main` branch for production.
- **Validation:** `zod` schemas shared by API routes and client forms.
- **Spreadsheets:** `exceljs` for XLSX import (ERP) and export; CSV with UTF-8 BOM as fallback.
- **Charts:** hand-built SVG/HTML exactly as in the prototype — no chart library.
- **Rate limiting:** small Postgres table (`rate_limits`) keyed by IP + action; no extra service.
- **Styling:** Tailwind v4 with the locked tokens added as CSS variables (`--sv-bronze`, `--sv-tint`, `--sv-stone`, …) scoped to survey/admin routes, so the public site is untouched.
- **Fonts:** Anek Bangla (500/600) + Hind Siliguri (400–600) via `next/font`, loaded only on survey/admin routes.
- Rendering: survey and admin routes are dynamic (no caching); `cacheComponents` stays off.

## 3. Code layout

```
src/app/survey/[slug]/page.tsx            # round entry (server: load round snapshot) → client flow
src/app/survey/[slug]/SurveyFlowT1.tsx    # client: teacher → class → rate → review
src/app/survey/receipt/[token]/page.tsx   # receipt (print stylesheet)
src/app/api/survey/[roundId]/draft/route.ts      # PATCH per student (autosave)
src/app/api/survey/[roundId]/submit/route.ts     # transactional submit + supersede + duplicate re-check
src/app/api/survey/[roundId]/status/route.ts     # teacher's own batch status, duplicate pre-check
src/app/admin/(reports)/…                 # tracker, class, student, raters
src/app/admin/rounds/page.tsx             # open / copy link / extend / close
src/app/admin/import/page.tsx             # ERP import with dry run
src/app/api/admin/…                       # admin APIs (Basic Auth + same-origin for mutations)
src/app/api/cron/survey-daily/route.ts    # Sheet-copy retry + JSON backup to Blob
src/lib/survey/                           # db client, schema, snapshot, scoring, normalise, sheets, stats
sanity/schemas/survey*.ts                 # template, round, class, teacher, area
sanity/actions/OpenRoundAction.tsx        # Studio document action → admin API
scripts/survey-seed.ts                    # T1 template, areas, classes/subjects, teachers
drizzle/                                  # migrations
```

`src/proxy.ts`: `/survey` → bengali locale header, no intl redirect; `/admin` → Basic Auth (same check as `/studio`), no intl redirect.

## 4. Milestones

Each milestone ends with its checks passing and a commit.

### M0 — Environment (guided, owner + me)
1. Create Neon via Vercel → Storage → Neon (free) → connect to project; create a `dev` branch; put both URLs in `.env.local`.
2. Create the "Survey Responses" spreadsheet, share with the service account e-mail, set `SURVEY_SHEET_ID`.
3. Add `CRON_SECRET` (exists) usage for the new cron; confirm `BLOB_READ_WRITE_TOKEN`.
**Check:** `pnpm db:check` connects to both branches; Sheets test write succeeds.

### M1 — Foundation
- Drizzle schema + first migration: `students`, `survey_rounds`, `submissions`, `responses`, `answer_items`, `rate_limits`, `import_runs`.
- `src/lib/survey`: Bengali-digit + mobile normalisation, title-case display, round snapshot types, marks/score maths (`(mark−4)/6×100`), stats helpers (n, mean, distribution, leniency, straight-lining).
- Sanity schemas (immutable keys after create) + seed script: T1 template (7 questions, hints, areas), areas, classes/sections/subjects, teachers.
- Server-only Sheets module; **separate commit**: pre-admission route reads the sheet ID from server config.
- Proxy changes for `/survey` and `/admin`.
**Check:** unit tests (normalisation, scoring, stats, snapshot); migration applies on `dev`; seed visible in Studio; proxy tests; pre-admission e2e still passes.

### M2 — Round lifecycle
- Studio **Open round** action → admin API: validates, snapshots template + classes + teachers into `survey_rounds`, generates link key.
- `/admin/rounds`: list, copy link, extend (date picker), close with confirmation, refresh lists.
**Check:** route tests (open/extend/close, auth required); opening twice is idempotent.

### M3 — Teacher survey (phone + desktop)
- Screens per prototype: intro, name pick (+ "not on list"), class/section/subject with own status, duplicate warning, question-first rating (pinned header, one-ring track, remaining jump, per-tap autosave), review (tap-to-edit, notes, incomplete state), submit, receipt (print), all states (saving/offline/failed/closed/grace/invalid/not open).
- Submit: one transaction — validate complete, re-check duplicate, supersede previous batch, write `answer_items`, issue receipt token.
**Check:** unit tests for submit/supersede/duplicate logic; Playwright e2e on `dev` (full T1 flow phone + desktop viewport, resume after reload, duplicate warning, edit after submit); axe accessibility scan on each step.

### M4 — ERP import
- `/admin/import`: upload CSV/XLSX → dry run (adds/updates/deactivations/problems) → confirm; class mapping from Sanity `erpClassNames`; skipped-row Excel download.
**Check:** fixture tests with real-format sample (mixed case, empty roll, missing contacts, unmapped class, short mobile).

### M5 — Sheet copy + backup
- After each submit: best-effort append (status column current/superseded/duplicate); failures marked for retry.
- Daily cron (`survey-daily`): retry failed copies + JSON backup of survey tables to Vercel Blob.
**Check:** route tests with mocked Sheets/Blob; manual end-to-end on `dev`.

### M6 — Tracker (T1)
- Class × subject coverage (done / draft / missing / duplicate), drafts with last edit + device, duplicate resolution (keep one / keep both).
**Check:** e2e on seeded data; counts match DB.

### M7 — T1 reports
- Class page: student list from teacher marks (marks /১০, n, trend once 2+ rounds), area bars.
- Student profile: subject × question grid, teacher notes, history; guardian sections shown as "G2 শুরু হলে দেখা যাবে" until phase 2. Internal print.
- Rater patterns: distribution, leniency vs peers, straight-lining flags; print.
- Excel export for each table.
**Check:** stats unit tests on fixture data; e2e renders with n<3 greying and first-round state.

### M8 — Hardening & handover
- Rate limits, `noindex`, error/404 pages, Neon cold-start warm-up, performance budget on a mid-range phone, final `/code-review`, docs update (spec + this plan marked done), admin how-to in `docs/`.
**Check:** `pnpm lint`, `pnpm test`, `pnpm test:e2e`, `pnpm build` all green; Lighthouse accessibility ≥ 95 on survey pages.

## 5. Needed from the owner

| Item | Needed by |
|---|---|
| Neon + Vercel setup (guided) | M0 |
| New Google Sheet shared with the service account | M0 |
| Teacher list (names; ERP id if any) | M1 |
| Subjects per class (and which classes have sections) | M1 |
| A real ERP export file | M4 |

## 6. Out of scope for this phase

Guardian surveys G1/G2 and their identity flow, guardian-side reports (overview, teaching-quality heatmap, guardian↔teacher comparison, guardian print). The data model and design system already support them; they are phase 2.
