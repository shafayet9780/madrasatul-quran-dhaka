# Class Routine — Specification

Status: **phase 1 built** (2026-10-18) on branch `class-routine`; spec agreed with the owner the same day. Build notes: §11. Next: owner review on the preview, then phase 2 (sheet import).

The school's class routine is kept today in a Google Sheet ([`1. Class schedule for teachers 2027.xlsx`](https://docs.google.com/spreadsheets/d/1vJ4Yil_kTcJ2uXCMjsw0oXpk-Xsg7oLy/edit?gid=2014558857#gid=2014558857)). This module moves it into `/admin` as a third module, **রুটিন**, next to ভর্তি and জরিপ:

1. Enter teachers (profile, subjects they can teach, salary, weekly target).
2. Assign each group's periods: subject + main teacher + optional TA.
3. See the routine, and for any day + period which teachers are free and what they can teach, to arrange a proxy fast.
4. See each teacher's weekly load, flagged under- or over-utilized.

## 1. What the current sheet tells us

| Sheet | Contents | What it means for the model |
|---|---|---|
| Class schedule 26 | Grid: groups × periods; free-teacher lists typed by hand; "No of Classes" + salary per teacher | The core of this module; the free-teacher block is what we compute |
| Sheet1 | Arabic level → book → which students | Level groups are a fixed list, independent of class |
| Room | Rooms used by Quran/Arabic groups at 9:00 and 10:00 | Rooms matter per period, not only per class |
| Profile all | Full Bengali name, age, qualification, experience, designation, department, phone, salary | Teacher profile fields |
| Ramadan 2026 | A separate timetable for Ramadan | Same assignments, other timings (phase 3) |

Findings the design rests on:

- **Days split inside a period.** One cell often holds two subjects: `RA-1 (sun, mon, tue) / Islam (wed, thu)`, `Math (sat–mon)`. An assignment is a period **plus a set of days**. The week is **Saturday–Thursday**.
- **Students regroup by level** in the Quran (9:00, Qaida-A…E, Ammapara-1…4, Hifz & Nazera M/F) and Arabic (10:00, L-1…L-9) periods. A *group* is either a class section or a level group.
- **Co-teaching is common** (`Farhana / Fariza`, `Rakib + Hyder Ali`), sometimes only on some days (`farhana/nasreen (sun–tue)`).
- **Period lengths differ**: Hifz 7:00–8:15 (75 min), afternoon Hifz 3:00–8:00 (300 min), the rest 45 min.
- **Placeholder teachers** (`Science-1…4`, `Arts-1…4`, `Hafiz-1/2`, `Arbi-1/2`, `Hafeza-1`) stand for posts not yet filled.
- **Short names in the grid** (`Mueen`, `Taman afz`) vs full Bengali names in the profile.
- Five (M) and Five (F) both sit in the **hall** at the same time: some rooms are shared.

## 2. Decisions (owner, 2026-10-18)

| Topic | Decision |
|---|---|
| Storage | Neon Postgres via Drizzle (not Sanity): salary stays private, edits are interactive, clashes are checked on the server |
| Load unit | **Periods** (each slot = 1, whatever its length) drive the status; **minutes/week** shown alongside |
| TA load | Main and TA periods shown separately; status uses **main + ½ × TA** |
| Thresholds | **Under < 80 %** of target, **over > 100 %**, OK in between |
| Salary | Visible to anyone with the admin login (as in the sheet today); never in prints or exports |
| Afternoon Hifz | In the routine, as one period of 300 min (counts as 1 period) |
| Gender rule | **Per group**: any / male only / female only (default any). Assignments and proxy suggestions respect it |
| Teacher identity | Own table in Postgres, **separate** from the website's `teacher` and the survey's `surveyTeacher`; optional **ERP ID** links to the survey teacher for later reports |
| Clashes | **Blocked**: a teacher (main or TA), a group, or a room used twice at the same day + period. Exception: a room marked **shared** (hall) |
| Vacancies | A teacher record flagged **vacancy** (e.g. "Science-1"); assignable, never suggested as proxy, listed under "posts to fill"; filled by editing it into the hired person |
| Versions | Each routine has a name (e.g. "২০২৭"); **one active**, others drafts; **copy** starts a new one |
| Proxy | **Daily register with suggestions**; saved history, monthly proxy count per teacher, print + WhatsApp copy |
| Prints | **School grid on A3** landscape; one class's / one teacher's week on **A4** |
| Import | One-time script: sheet → **draft** routine + list of cells it couldn't read (phase 2) |
| "3+1" in the sheet's "No of Classes" | **Main + TA** (owner, 2026-10-18): periods a day as main teacher + as TA. The new load is computed from assignments and shows main and TA apart the same way |

## 3. Data (Postgres, Drizzle — `src/lib/routine/schema.ts`, added to `drizzle.config.ts`)

All tables are prefixed `routine_`.

**`routine_subjects`**: `id`, `name` (as the school writes it, e.g. "Math", "বাংলা", "Qaida"), `order`, `active`.

**`routine_teachers`**

| Field | Notes |
|---|---|
| `full_name` | Bengali, as in the profile sheet; required |
| `short_name` | Shown in the grid (e.g. "Mueen"); required, unique among active teachers |
| `gender` | male / female; required (drives the gender rule), except for a vacancy, which may stay empty until the hire is known (owner, 2026-10-19); no gender warning then |
| `designation`, `department` | Free text (অধ্যক্ষ, সিনিয়র শিক্ষক… / কুরআন, আরবী, জেনারেল, হিফয) |
| `qualification` | Free text |
| `experience_years` | Number, optional |
| `phone` | Optional |
| `salary` | Monthly taka, optional |
| `target_periods` | Expected periods per week; optional (no target → status "টার্গেট নেই") |
| `bio` | Short biography / notes |
| `erp_id` | Optional; matches `surveyTeacher.key` |
| `is_vacancy` | Placeholder for an unfilled post |
| `active` | Inactive teachers can't be assigned and are hidden from free/proxy lists |

**`routine_teacher_subjects`**: teacher ↔ subject (the "can teach" checkboxes).

**`routine_rooms`**: `name` (e.g. "501", "Hall"), `shared` (true → never a clash).

**`routine_groups`**: `name` (Nursery-A, Two (M), Qaida-A, L-1 A), `kind` (class section / level group), `section` (heading the grid sorts under: e.g. জেনারেল, কুরআন, আরবি, হিফয), `band` (optional label shared by a run of groups, e.g. LEVEL-1 for L-1 A, B, C), `order`, `default_room_id`, `gender_rule` (any / male / female), `active`.

**`routine_routines`**: `name`, `status` (draft / active; at most one active), `created_at`, `copied_from_id`.

**`routine_periods`** (per routine): `label` (optional, e.g. "হিফয"), `starts_at`, `ends_at` (minutes = difference), `order`. Periods in one routine may not overlap.

**`routine_assignments`**: `routine_id`, `group_id`, `period_id`, `days` (set of sat…thu, at least one), `subject_id`, `teacher_id` (main, required), `ta_id` (optional, ≠ main), `room_id` (optional; falls back to the group's default room), `note`.

A cell that changes by day is several rows with disjoint `days`. Example, `farhana/nasreen (sun–tue)` in an English period: row 1 sat, wed, thu → Farhana; row 2 sun–tue → Farhana + TA Nasreen.

**`routine_absences`**: `date`, `teacher_id`, `periods` (all day, or chosen period ids), `reason` (optional).
**`routine_proxies`**: `date`, `assignment_id`, `proxy_teacher_id`, plus a **snapshot** of group / period / subject / absent-teacher names so history stays readable after the routine changes. One proxy per assignment per date.

**Clash rule** (server action, inside one transaction that locks the routine row): for the same routine, same period and an overlapping day, refuse if the main teacher or TA is already main or TA elsewhere, if the group already has an assignment, or if the effective room is in use and not shared. The error names what clashes ("মুঈন ৯:০০ রবি–মঙ্গল Qaida-C-তে আছেন"). Subject not in the teacher's list and gender rule broken → **warning**, saved after confirming.

## 4. Load math (pure module, unit-tested)

- `main` = Σ over the teacher's main assignments of the number of days; `ta` likewise for TA rows.
- `weighted = main + ½ × ta`; `percent = weighted ÷ target_periods`.
- Status: **কম** (< 80 %), **ঠিক আছে** (80–100 %), **বেশি** (> 100 %), or **টার্গেট নেই**.
- `minutes/week` = Σ of period length × days (main and TA shown separately).
- `a day` = main ÷ 6 + TA ÷ 6, shown as the sheet writes it ("৩+১"). The target stays one weekly number (owner, 2026-10-18): 3+1 a day is (3 + ½) × 6 = 21.
- `salary per period` ≈ salary ÷ (weighted × 52 ÷ 12), shown on the workload page only.
- Busiest day: the most periods on any one day (a teacher with 6 on Sunday and 1 on Thursday stands out).

The **active** routine feeds the workload page; a draft shows its own workload while it's being edited.

## 5. Admin screens (`/admin/routine/…`, module **রুটিন**)

Follows the shared admin design (`docs/admin-redesign-plan.md`, pieces in `src/app/admin/ui.tsx`). Bengali UI with the words staff actually say, English loanwords included (owner, 2026-10-19): টিচার, টিএ, মেইন, সাবজেক্ট, টার্গেট, খালি পোস্ট, অ্যাবসেন্ট, সিলেক্ট, সেভ, ডিলিট, ড্রাফট, পেজ — not শিক্ষক / সহকারী / বিষয় / লক্ষ্য / শূন্য পদ / মুছুন / খসড়া. Mutations are server actions that call `assertAdmin()`.

| Nav | Page | Contents |
|---|---|---|
| রুটিন | `/admin/routine` | The chosen routine (active by default) in three views (owner, 2026-10-18), all with a day filter (**সব দিন** shows day chips; one day shows only that day) and an **A3 print**: **শিট ভিউ** (default) — like the sheet, the day left to right in blocks (a run of periods whose classes share headings: হিফয · কুরআন · আরবি · জেনারেল · হিফয), each with its name, times and lengths on top and its groups down the side (a block is named by the heading most of its classes are under; a group on its own timetable, like Six (F), is an extra row of each block it has classes in, as at the bottom of the sheet), groups of one band (LEVEL-1) under one label; **সেকশন অনুযায়ী** — one table per heading, only the periods it uses (or all, to add classes in a new period); **টিচার অনুযায়ী** — a row per teacher, periods across, empty = free, weekly load at the end. Main teacher names in brown, TA in blue. In the first two, a cell opens the editor: tap a subject, then a teacher from the **teacher picker** (free teachers green, those who teach the subject first, the lightest week first; busy ones red with where they are, folded away); the TA, a split by days (**দিন ভাগ করুন**), the room and a note only when needed; clashes refused; a cell whose days are all taken shows only its rows. A group's gender rule stays a note on a green chip and asks on save. On a school day the **running period's column is tinted and marked এখন** in all three views (refreshed every minute). The view and day stay in the address (`?view=`, `?day=`); without one, a phone opens on সেকশন অনুযায়ী (review, 2026-10-19). |
| ক্লাসের রুটিন | `/admin/routine/groups/[id]` | One group's week: days × periods. **A4 print**. |
| টিচারের রুটিন | `/admin/routine/teachers/[id]` | One teacher's week (main and TA marked), load summary. **A4 print** (no salary or phone). |
| ফ্রি টিচার | `/admin/routine/free` | One **date** (default today; ‹ › step a school day): a card per period listing free teachers (active, not vacancies, not absent, not on a proxy then) with how many classes they have that day and the subjects they teach. Today, the **running period comes first (এখন চলছে)**, then the ones to come; earlier periods fold away. The subject filter splits each card into who teaches it and the rest. Teachers with no class that day in the period's **sitting** (periods at most 30 minutes apart: the morning school day; the evening Hifz is another) are folded away as likely not at school. That day's absentees are named with a link to the proxy page. |
| প্রক্সি | `/admin/routine/proxy` | Daily register (§6). |
| ওয়ার্কলোড | `/admin/routine/workload` | Every teacher: main, TA, weighted, target, %, status badge, minutes/week, busiest day (all of them when tied), proxies this month, salary, salary per period. The **target is typed in the table** (saved on Enter or leaving the box), so rows sort by name and stay put. Also **খালি পোস্ট** (posts to fill): vacancy teachers with their subjects and weekly load. |
| টিচার | `/admin/routine/teachers` | List + form (fields of §3, subjects as checkboxes). |
| সেটআপ | `/admin/routine/setup` | Routines (create, copy, make active, rename, delete draft), periods of a routine, subjects, rooms, groups. |

Making a routine active asks for confirmation. Saved proxies of past dates keep their snapshot.

## 6. Proxy register

The screen (rebuilt 2026-10-19 for the principal and office staff, phone first):

1. Pick a date (default today, ‹ › a school day back or on; Fridays have no classes).
2. **কে আসেননি?** Select an absent teacher (whole day; an optional reason). Each absent teacher is a chip showing how many of their classes still need a proxy; tap one to open them.
3. Their classes that day come up as cards (time, group · subject, TA marked), each **প্রক্সি লাগবে** or **প্রক্সি: name**. The first uncovered card is open, showing the **teacher picker**:
   - green = can take it (`rankCandidates`, the same list the server checks): active, not a vacancy, not absent, free in that period on that day (no class as main or TA, no proxy already that date + period), and meeting the group's gender rule;
   - first those who teach the subject (**<subject> পড়ান**), then **অন্য সাবজেক্টের টিচার**;
   - within each, those at school then (a class in the same sitting that day, see ফ্রি টিচার) before the rest, marked "এ সময় স্কুলে থাকেন না"; then fewest periods that day (proxies included), then fewest proxies this month — shown under each name;
   - red = everyone else, with why (অ্যাবসেন্ট, <group>-এ ক্লাস, <group>-এ প্রক্সি, the gender rule).
4. Tapping a green name saves at once, shows an **undo** toast and opens the next uncovered card. An assigned card offers **WhatsApp** (a ready message to the proxy teacher's number), **প্রক্সি সরান**, and for an uncovered one **এ পিরিয়ডে আছেন** (the absence then keeps only the other periods; none left removes it).
5. Below: the day's list (prints on A4; copies as WhatsApp text: date, period, class, subject, absent teacher → proxy) and the month's proxy counts.
6. Making another routine active moves upcoming absences for chosen periods to its periods at the same times; with none at that time the absence becomes the whole day (never silently nothing).

Proxy counts per teacher for the month show on the proxy page and the workload page.

## 7. Import from the sheet (phase 2)

A one-time script reads the sheet's Excel download into a **draft** routine (built 2026-10-18):

```bash
pnpm routine:import "<path>/Class schedule.xlsx"          # dry run: drafts names.json, writes report.md
pnpm routine:import "<path>/Class schedule.xlsx" --apply  # writes a draft routine to DATABASE_URL (.env.local)
# options: --name "<routine name>" (default "শিট থেকে (date)"), --dir <folder>
```

- Its files go to `routine-import/` next to the `.xlsx`, never into this public repo:
  - `names.json` maps each short name to its full name and ERP ID (from the ERP teacher list), a gender, a "Profile all" row (qualification, phone, salary) and other spellings (aliases). The first run drafts it from "Free Teachers" plus any names the grid uses; the owner fills in the rest. `--apply` refuses while a teacher's gender is missing (open posts may stay empty) or a Profile name doesn't match.
  - `report.md` lists what would be created, the fix list, the classes with days left empty, and every class it read.
  - `applied.md` (after `--apply`) lists the classes that could not be placed.
- Reading the grid (`src/lib/routine/sheet-import.ts`, pure, unit-tested):
  - Periods and blocks come from the time row and the block-name row above it. Times have no am/pm, so 1–6 are read as afternoon.
  - Bands of rows sit between empty rows. In a band: a Hifz group (merged over its periods), a Quran group (name, then teacher), an Arabic level (`LEVEL-n` merged down its letters → `L-n A`, band `LEVEL-n`; RA/BA book lines → subject Arabic, the book in the note), and a class (name, room, one cell per general period).
  - Cell lines are subjects (`Subject`, `Subject (days)`, `Subject: Teacher (days)`, `(ex tue)`), then teacher lines.
    - A subject without days gets the days the other lines leave.
    - "A / B" or "A + B" makes A main and B TA. Days after them are the TA's days.
    - With as many teachers as subjects, they pair in order.
  - Everything else goes on the fix list, never guessed: two subjects in one line, a missing teacher, overlapping days, unknown names, a class with its own times (Six (F)), rooms given to two classes (marked shared).
- Writing (`sheet-import-apply.ts`): subjects, rooms, groups and teachers with the same name are reused untouched; new ones are created (groups get no gender rule, since "(M)"/"(F)" in the sheet is the students' section and women teach boys' sections; new teachers get the subjects the sheet gives them; no weekly targets). Every class goes through `saveAssignment`, so clashes are refused as in the editor. When only the TA clashes, the class is kept without the TA and noted.

Nothing is written to the active routine. The owner reviews the draft, fixes the list in the editor and makes it active. A failed run leaves a partial draft: delete it in setup and run again.

## 8. Security & privacy

- `/admin/routine` sits behind the existing admin Basic Auth (`src/proxy.ts`); no public pages.
- Salary and phone are shown on admin pages only; never in prints, the WhatsApp text, or exports.
- No routine data in Sanity.
- Nightly backup: the daily cron (`/api/cron/survey-daily`) writes every routine table to `routine-backups/YYYY-MM-DD.json` in the survey's private Blob store (`PG_BACKUP_BLOB_READ_WRITE_TOKEN`) and keeps 30 days (`src/lib/routine/backup.ts`).

## 9. Build phases

| Phase | Scope |
|---|---|
| **1** | Schema + migration; subjects, rooms, groups, periods, routines (draft / active / copy); teachers (incl. vacancy flag, ERP ID); routine editor with clash checks; school / group / teacher views; free teachers; workload + posts to fill; **proxy register**; **prints** (A3 school grid, A4 group / teacher / proxy day). Local preview fixtures (`ADMISSIONS_LOCAL=1`) with sample routine. |
| **2** | Sheet import script (draft + fix list). Built 2026-10-18 (§7). |
| **3** | Ramadan timings (a second set of period times reusing the same assignments); subject coverage per group (periods/week needed vs assigned); use ERP ID to join routine with survey reports. |

Tests: pure modules (clash detection, load math, free-teacher and proxy ranking, day-split helpers) unit-tested; clash enforcement and proxy save as `*.db.test.ts`; Playwright smoke for the routine pages in the local preview.

## 10. Open questions

1. ~~What does "3+1" mean?~~ Main + TA periods a day (owner, 2026-10-18).
2. Target periods per week for each teacher: to be entered by the owner (the sheet has none per week).

## 11. Build notes (phase 1, 2026-10-18)

- **Code:** logic in `src/lib/routine/` (pure: `days`, `clash`, `load`, `free`, `proxy`, `availability` — the picker's green/red choices for the proxy screen, the editor and the free page; server-only: `data`, `db`); pages in `src/app/admin/routine/` (`page.tsx` + `RoutineGrid.tsx` is the school grid and cell editor; `groups/[id]`, `teachers/[id]`, `free`, `proxy`, `workload`, `teachers`, `setup`). Migration `drizzle/0008_routine_init.sql`.
- **Clash guard:** `routine_slots` holds one row per assignment × day for its group, its teacher and TA, and its room unless shared; the primary key `(routine, period, day, kind, ref)` makes a double booking fail the whole `db.batch`. The editor checks the same rules first (`clash.ts`) to give a readable message. Slot rows are inserted 1,000 to a statement (Postgres's parameter limit). Room rows are rebuilt for every routine whenever a room's "shared" flag, a group's default room or a room's existence changes, and the change is refused if it would create a clash.
- **Copy:** copying a routine copies its periods, assignments and slot rows with new ids.
- **Proxies:** the register works on the active routine. A saved proxy is dropped when it no longer holds: nobody is away from that class any more, or the proxy teacher is now away or has a class in that period. Absence changes re-check that date; routine changes (a class saved or deleted, a period deleted) re-check every date from today on. Making another routine active drops today's and later proxies of the old one. Past proxies stay as history: each keeps a name snapshot, and its class and period links go NULL when those are deleted.
- **Local preview:** `ADMISSIONS_LOCAL=1` loads a sample routine with made-up names (`src/lib/routine/testing/dev-fixtures.ts`): class sections, Quran/Arabic/Hifz level groups, a shared hall, day-split cells, a TA, a vacancy, and one teacher away today.
- **Tests:** `src/lib/routine/routine.test.ts` (pure logic), `data.pg.test.ts` (PGlite: clash guard, rooms, copy, proxies, the sample), `e2e/admin-routine.spec.ts` (`pnpm test:e2e:admissions`, project `routine`). `pnpm admin:screenshots [dir] routine` captures the pages and the A3/A4 prints.
