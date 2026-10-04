# Survey admin guide (phase 1: teacher review T1)

For the principal and admin. Screens are in Bengali; this guide names them as they appear.
Admin pages are at **`/admin`** (same login as the Studio). Content setup is in the **Studio → Surveys** group.

## One-time setup (Studio → Surveys)

1. **Teachers (survey)** — one document per teacher: Key (lowercase, e.g. `ustaza-sumaiya`), Bengali name, ERP ID if any, Active.
   This list is separate from the website's teacher profiles. Inactive teachers are left out of new rounds.
2. **Classes & Subjects** — the nine classes are already there (প্লে … ষষ্ঠ). For each class:
   - **Subjects**: key + Bengali name (e.g. `quran` · কুরআন).
   - **Sections** (Nursery, KG: A/B; Two, Three: বালক/বালিকা) with their **ERP section names** exactly as the ERP export writes them (e.g. `Section A`).
   - **ERP class names**: the class label in the ERP export (e.g. `Nursery`).
3. **Templates** — the T1 template (7 questions, hints, areas) is already there. Change wording only before a round opens; changing marks or the scale means a new template version.
4. **Areas** — the 12 areas are already there; they rarely change.

Keys can be corrected until the document is first published; after that the Studio refuses changes, because stored answers use them.

## Every round

1. **Import the student list** — `/admin` → **ERP ইমপোর্ট**. Download the Student List from the ERP (CSV or Excel), upload it, and read the preview:
   - *সমস্যা* rows: rows without an ID or name, or with a class/section that has no ERP name in the Studio, are skipped; an unreadable roll or phone is imported blank.
   - *নিষ্ক্রিয় হবে*: students missing from the file are marked inactive (never deleted). If many would be deactivated, the page asks you to confirm it is the full list.
   - Fix mappings in the Studio and check again; then **ইমপোর্ট করুন**. The problem list can be downloaded as Excel.
2. **Create the round** — Studio → Surveys → Rounds → new: label (e.g. অক্টোবর ২০২৬), template, link name (e.g. `t1-2026-10`), opening and closing time. **Publish**.
3. **Open it** — either the **Open round** button on the round in the Studio, or `/admin` → **রাউন্ড** → *রাউন্ড খুলুন* (where you can still adjust the dates). Opening copies the questions, classes, subjects and teachers into the round; later Studio edits do not change it. If a teacher or subject was missing, add it in the Studio and press **তালিকা হালনাগাদ** on the round.
4. **Share the link** — **লিংক কপি** on the rounds page; send it to the teachers' group. The link contains a key; anyone with it can open the survey, so share it only with teachers.
5. **Follow progress** — **রেসপন্স ট্র্যাকার** shows each class × subject as জমা / খসড়া / ডুপ্লিকেট / বাকি, teachers' unfinished drafts (with last edit and device), and duplicates.
   - **Duplicate** = two teachers submitted the same class and subject. Choose whose to keep, or keep both if both teach it. The one not kept stops counting in reports; nothing is deleted, and that teacher's receipt says so.
6. **Extend or close** — **মেয়াদ বাড়ান** (also reopens a closed round; drafts are kept) or **এখনই বন্ধ**. After closing, teachers on the review screen still have 10 minutes to submit.

## Reports

- **ক্লাস ও শিক্ষার্থী** — pick a class or search a student by name, ID or roll.
  - Class: teacher average per student (/১০), areas, flags (dropped ≥ 1 mark since the student's last round; ≥ 2 teachers gave ৪), trends from the second round. Aggregates resting on fewer than 3 students are grey.
  - Student: areas against the class average, subject × question marks, teachers' notes, all submissions. **অভ্যন্তরীণ প্রিন্ট** includes notes — do not hand it to guardians. The guardian print arrives with the guardian surveys (phase 2).
- **শিক্ষকদের রেটিং প্যাটার্ন** — each teacher's average, mark spread, how generous compared with colleagues on the same students, and batches where almost every mark is the same.
- Every table has **Excel**; every page prints to PDF.

## Copies and backups

- Every submission is copied to the **Survey Responses** Google Sheet (one tab per round, one row per student). Rows are only ever added: a correction adds new rows marked বর্তমান and the earlier ones marked পুরনো (সংশোধিত) / ডুপ্লিকেট / বাদ (অ্যাডমিন সিদ্ধান্ত). Failed copies are retried every night.
- Every night (03:00 Dhaka) all survey tables are backed up as JSON to a private Vercel Blob store; the last 30 days are kept.

## Go-live checklist (developer)

- Vercel → Settings → Environment Variables:
  - Production and Preview: `FORM_GOOGLE_SHEETS_ID` (pre-admission form), `SURVEY_SHEET_ID`, `CRON_SECRET`, `STUDIO_AUTH_ENABLED=true`, `STUDIO_USERNAME`, `STUDIO_PASSWORD`.
  - Production: `DATABASE_URL`, `DATABASE_URL_UNPOOLED` (from the Neon integration). Preview: the same two names pointing at the Neon `dev` branch.
  - Create a **private** Blob store (Storage → Blob, access: private), connect it with the prefix `SURVEY_BACKUP_BLOB` → `SURVEY_BACKUP_BLOB_READ_WRITE_TOKEN`. Without it the nightly job reports a failure.
  - Leave `SURVEY_SHEET_ID` empty in Preview if preview submissions should not reach the real sheet.
- Database migrations run on every Vercel build (`vercel-build` → `scripts/migrate-if-configured.mjs`, then `next build`). Without `DATABASE_URL_UNPOOLED` the step is skipped with a warning so the public site still deploys; a failing migration stops the deploy. If the project has a custom Build Command, change it to `pnpm run vercel-build`.
- Studio: add the survey teachers, each class's subjects, and the ERP section names for দ্বিতীয়/তৃতীয় বালক/বালিকা; import the real ERP list once (`/admin` → ERP ইমপোর্ট) and check the class mapping.
- Remove the local sample data from the dev branch when it is no longer needed: `pnpm survey:fixtures --remove`.

## Developer commands

- `pnpm test` (unit, offline) · `pnpm test:db` (Neon dev branch, cleans up after itself) · `pnpm test:e2e`
- `test:db`, `survey:fixtures` and the database e2e specs write data, so they refuse to run unless `.env.local` has `SURVEY_DEV_DB=1` — set it only while `DATABASE_URL` points at the dev branch (`vercel env pull` rewrites the file and removes it).
- `pnpm db:generate` / `pnpm db:migrate` (migrations in `drizzle/`)
- `pnpm survey:fixtures` loads sample rounds, students and submissions into the dev branch (open link printed); `--remove` deletes them.
- `pnpm exec tsx scripts/survey-seed.ts` creates missing Studio survey documents (areas, T1 template, classes); `--overwrite` replaces them (only before any round opens).
