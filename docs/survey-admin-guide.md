# Survey admin guide (teacher review T1, guardian reviews G1 and G2)

For the principal and admin. Screens are in Bengali; this guide names them as they appear.
Admin pages are at **`/admin`** (same login as the Studio). Content setup is in the **Studio → Surveys** group.

## One-time setup (Studio → Surveys)

1. **Teachers (survey)** — one document per teacher: ERP ID (from the ID card, e.g. `20099`), Bengali name, Active.
   Teachers start a survey by typing this ID and confirming their name, so it must match the card. This list is separate from the website's teacher profiles. Inactive teachers are left out of new rounds.
   The 28 teachers from the ERP export are already loaded; eight had no Bengali name in the export and show the English one until it is filled in. A new teacher: add the document here (or run the seed with `--teachers` on a fresh export, which only adds missing ones).
2. **Classes & Subjects** — the nine classes are already there (প্লে … ষষ্ঠ). For each class:
   - **Subjects**: key + Bengali name (e.g. `arabic` · আরবি). Already loaded: Play has one subject, সব বিষয়; Nursery–Five have আরবি, ইসলাম শিক্ষা, বাংলা, ইংরেজি, গণিত; Six adds বিজ্ঞান and বাংলাদেশ ও বিশ্বপরিচয়. Names can be edited; keys cannot after publishing.
   - **Sections** (Nursery, KG: A/B; Two, Three: বালক/বালিকা) with their **ERP section names** exactly as the ERP export writes them (`Section A`, `Section B`, `Male`, `Female`).
   - **ERP class names**: the class label in the ERP export (e.g. `Nursery`).
3. **Templates** — three are already there: T1 (teachers rate each student, 7 questions), G1 (guardians rate the teaching, 10 questions per subject) and G2 (guardians rate their own child, 9 questions with descriptive answers, each carrying a hidden mark). Change wording only before a round opens; changing marks or the scale means a new template version.
   - G1 **Layout**: *one subject, all questions* (default) or *one question, every subject*. It is fixed for a round once it opens.
   - G2 questions can **allow "not applicable"** with their own label (e.g. প্রযোজ্য নয় (ডে কেয়ার)); such answers are left out of every average.
4. **Areas** — the 12 areas are already there; they rarely change.

Keys can be corrected until the document is first published; after that the Studio refuses changes, because stored answers use them.

## Every round

1. **Import the student list** — `/admin` → **ERP ইমপোর্ট**. Download the Student List from the ERP (CSV or Excel), upload it, and read the preview:
   - *সমস্যা* rows: rows without an ID or name, or with a class/section that has no ERP name in the Studio, are skipped; an unreadable roll or phone is imported blank.
   - *নিষ্ক্রিয় হবে*: students missing from the file are marked inactive (never deleted). If many would be deactivated, the page asks you to confirm it is the full list.
   - Fix mappings in the Studio and check again; then **ইমপোর্ট করুন**. The problem list can be downloaded as Excel.
2. **Create the round** — Studio → Surveys → Rounds → new: label (e.g. অক্টোবর ২০২৬), template, link name (e.g. `t1-2026-10`), opening and closing time. **Publish**.
3. **Open it** — either the **Open round** button on the round in the Studio, or `/admin` → **রাউন্ড** → *রাউন্ড খুলুন* (where you can still adjust the dates). Opening copies the questions, classes, subjects and teachers into the round; later Studio edits do not change it. If a teacher or subject was missing, add it in the Studio and press **তালিকা হালনাগাদ** on the round.
4. **Share the link** — **লিংক কপি** on the rounds page; send it to the teachers' group. The link contains a key; anyone with it can open the survey, so share it only with teachers. Each teacher types the ERP ID from their ID card and confirms their name; their phone remembers it for the round. If an ID is not found, check the teacher's document in the Studio, then press **তালিকা হালনাগাদ** on the round.
5. **Follow progress** — **রেসপন্স ট্র্যাকার** shows each class × subject as জমা / খসড়া / ডুপ্লিকেট / বাকি, teachers' unfinished drafts (with last edit and device), and duplicates.
   - **Duplicate** = two teachers submitted the same class and subject. Choose whose to keep, or keep both if both teach it. The one not kept stops counting in reports; nothing is deleted, and that teacher's receipt says so.
6. **Extend or close** — **মেয়াদ বাড়ান** (also reopens a closed round; drafts are kept) or **এখনই বন্ধ**. After closing, teachers on the review screen still have 10 minutes to submit.

## Guardian rounds (G1 and G2)

G1 and G2 are separate rounds with separate links; create, open, extend and close them like a T1 round (choose the G1 or G2 template). Open them around the same dates as the teachers' round: reports pair each teacher round with the guardian rounds whose dates overlap it most (or the nearest one opening within 30 days).

- **Share the link** in the class guardian groups. A guardian picks the class and section, then finds the child by **student ID** or **the father's or mother's mobile** as written in the ERP; siblings in that class and section on one number all appear. Then they give their name and relation (পিতা / মাতা / অন্যান্য) and mobile.
- **Verified** (যাচাইকৃত) = the mobile the guardian typed is one of the child's ERP numbers (foreign numbers too). It shows that the person knows the number, not that it is their phone: in a class WhatsApp group everyone sees each other's numbers. Other forms are accepted but marked **অযাচাইকৃত**; reports can show verified forms only. Keep the ERP numbers current: the import fills them.
- **One form per child counts**: a guardian who submits again for the same child (from any phone) replaces the earlier form; the guardian is warned before starting. The earlier form is kept and marked আগের. The tracker's **একাধিক জমা** list shows each form's number and marks a counted form that came from a different number than the earlier one — call the guardian if it looks wrong.
- **Limits**: one number or student ID can be looked up 10 times in 10 minutes, one connection 1,000 times a day, and one child can receive 10 forms in 10 minutes (to stop guessing and flooding); a guardian who hits a limit sees a message to try later. Lookups keep only the last 4 digits and are deleted after 90 days.
- Unsent answers stay on the phone (for that round and child) until submitted; on a shared office phone, submit before handing it to another family.
- **Tracker** (রেসপন্স ট্র্যাকার → the guardian round): response per class, then per class the children still missing with their ERP numbers and a **বার্তা কপি** button per guardian (one message per guardian, never a group list; hidden once the round is closed), unverified forms and children with more than one form. Excel downloads the lists.

## Reports

Everything is in marks out of ১০ (the scale runs ৪–১০). A mark of ৭ or less counts as a **low answer**, and every average says what share of its answers were low ("১২% উত্তর ৭ বা কম"): an average of ৮.৫ can still hide a few unhappy families. Anything resting on fewer than 3 children or guardians is hidden or faint, and every average says how many it rests on; guardian averages also show how many of all children that is, because when few guardians answer, the average is theirs, not the whole class's. "Change since" compares only the children counted in both rounds.

- **প্রশ্নভিত্তিক ফলাফল** — every question across the school or for one class: average, share of answers ৭ or less and how many answered, weakest first; how many guardians gave each answer about their child (unmarked questions such as study hours too); all guardian comments. Excel has the same.
- **ওভারভিউ** — pick the teacher round; the G1 and G2 rounds that ran with it are chosen by date (*স্বয়ংক্রিয়*) and can be changed. Tiles for teaching quality (G1), guardians' view (G2), teachers' view (T1) and guardian response; the teaching heatmap; response by class; the trend; and **মনোযোগ প্রয়োজন**: children with a flag (below).
- **শিক্ষার মান** — class × subject averages from the guardians' class-management review (darker = higher; each cell says how many guardians and what share of answers were ৭ or less; ⚠ = at least 25%). Click a cell for marks per question and that class's guardian comments. Filters: round, compare with, area, verified only.
- **ক্লাস ও শিক্ষার্থী** — pick a class or search a student by name, ID or roll.
  - Class: children with flags come first. Per child: guardian and teacher averages, the gap (guardian − teachers, in marks, on the areas both rated), the guardian form's status and flags; areas side by side; a scatter of guardian against teachers behind **বিস্তারিত**. **শুধু যাচাইকৃত** uses verified guardian forms only.
  - Student: guardian and teacher view per area against the class average, the trend, subject × question marks, teachers' notes, the guardian's answers and comment, and every form. **অভ্যন্তরীণ প্রিন্ট** includes teachers' names and notes — do not hand it to guardians.
  - **অভিভাবকের জন্য প্রিন্ট** — one A4 page for the guardian meeting: averages per area (guardian, teachers, and the teachers' class average), strengths (every side gave ৮+) and areas to work on together (any side below ৭), the last rounds, space for notes and signatures. It never shows teachers' names, notes, the guardian's comment or phone numbers.
- **Flags**: the teachers' average dropped ≥ 1 mark since the child's previous round (on the subjects rated in both rounds); ≥ 2 teachers gave ৪ on the same question (named in the flag); guardian and teachers ≥ 2 marks apart on the areas both rated.
- The two teacher questions about the guardian (coordination, contact outside hours) show as **অভিভাবকের সহযোগিতা** on their own; they never count in the child's average or flags.
- G2 **"বাসায় নিয়মিত পড়া পড়ে কি না?"** is not marked (study hours depend on age): its answers are shown as counts only. Any G2 question can be set this way in the Studio (**Not marked (answer shown only)**) before a round opens.
- A guardian's answers count in the class and section the child was in when the form came in; a child who moves section later shows them in the old section's averages.
- **শিক্ষকদের রেটিং প্যাটার্ন** — one sentence per teacher (like colleagues, or on average how much more or less they give on the same students — within half a mark counts as alike; the share of ৪s; classes where almost every mark is the same, which can be a genuinely good class: a thing to check, not an accusation), then the average, spread and details.
- **The sidebar** (left on a laptop) holds the menu, the **round** card and **শিক্ষার্থী খুঁজুন** (⌘K / Ctrl+K). The round chosen there is used by every report page; the tracker can still switch to a guardian round. The ⟷ button folds the sidebar to icons. `/admin` opens the overview.
- **On a phone** the top bar shows the page, the round and search; the tabs at the bottom go to ওভারভিউ, ক্লাস and ট্র্যাকার, and **আরও** opens the full menu. Excel and print are on the laptop view; tables become cards.
- **শিক্ষার মান** and the teacher-review tracker show who teaches each class and subject, taken from who submitted the teachers' review (there are no fixed assignments, so a subject nobody has submitted shows no teacher).
- Every table has **Excel**; every page prints to PDF.

## Copies and backups

- Every submission is copied to the **Survey Responses** Google Sheet (one tab per round). Teacher rounds: one row per student; G2: one row per form; G1: one row per form and subject. Rows are only ever added: a correction adds new rows marked বর্তমান and the earlier ones marked পুরনো (সংশোধিত) / ডুপ্লিকেট / বাদ (অ্যাডমিন সিদ্ধান্ত), or আগের for a replaced guardian form. Failed copies are retried every night.
- Every night (03:00 Dhaka) all survey tables are backed up as JSON to a private Vercel Blob store; the last 30 days are kept.

## Go-live checklist (developer)

- Vercel → Settings → Environment Variables:
  - Production and Preview: `FORM_GOOGLE_SHEETS_ID` (pre-admission form), `SURVEY_SHEET_ID`, `CRON_SECRET`, `STUDIO_AUTH_ENABLED=true`, `STUDIO_USERNAME`, `STUDIO_PASSWORD`.
  - Production: `DATABASE_URL`, `DATABASE_URL_UNPOOLED` (from the Neon integration). Preview: the same two names pointing at the Neon `dev` branch.
  - Create a **private** Blob store (Storage → Blob, access: private), connect it with the prefix `PG_BACKUP_BLOB` → `PG_BACKUP_BLOB_READ_WRITE_TOKEN`. Without it the nightly job reports a failure.
  - Leave `SURVEY_SHEET_ID` empty in Preview if preview submissions should not reach the real sheet.
- Database migrations run on every Vercel build (`vercel-build` → `scripts/migrate-if-configured.mjs`, then `next build`). Without `DATABASE_URL_UNPOOLED` the step is skipped with a warning so the public site still deploys; a failing migration stops the deploy. If the project has a custom Build Command, change it to `pnpm run vercel-build`.
- Studio: survey teachers, subjects and ERP section names are loaded (2026-10-05); fill in the eight missing Bengali teacher names. Import the real ERP list in production once (`/admin` → ERP ইমপোর্ট); the dry run on the 2026-10-05 export mapped all 148 students with no problems.
- Remove the local sample data from the dev branch when it is no longer needed: `pnpm survey:fixtures --remove`.

## Developer commands

- `pnpm test` (unit, offline) · `pnpm test:db` (Neon dev branch, cleans up after itself) · `pnpm test:e2e`
- `test:db`, `survey:fixtures` and the database e2e specs write data, so they refuse to run unless `.env.local` has `SURVEY_DEV_DB=1` — set it only while `DATABASE_URL` points at the dev branch (`vercel env pull` rewrites the file and removes it).
- `pnpm db:generate` / `pnpm db:migrate` (migrations in `drizzle/`)
- Per-connection limits use the first `x-forwarded-for` address, which Vercel sets itself; on another host, make sure the proxy overwrites that header or the limits can be dodged.
- `pnpm survey:fixtures` loads sample rounds (T1, G1 by subject and by question, G2), students and submissions into the dev branch (links printed); `--remove` deletes them; `--rate-limits` only clears the request counters.
- `pnpm exec tsx scripts/survey-seed.ts` creates missing Studio survey documents (areas, T1 template, classes with subjects) and fills empty subject lists / ERP section names on existing classes; `--teachers <ERP teacher export .xlsx>` also adds missing survey teachers (the list is read from the file, never committed: the repository is public); `--overwrite` replaces the seeded documents (only before any round opens).
