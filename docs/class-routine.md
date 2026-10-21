# Class Routine — Specification

Status: **phase 1 built** (2026-10-18); **simplified and rebuilt** (2026-10-21, §2a) on branch `class-routine`: typed times instead of periods, class types, rows = rooms. Build notes: §11. The parents' routine waits for the owner's samples.

The school's class routine is kept today in a Google Sheet ([`1. Class schedule for teachers 2027.xlsx`](https://docs.google.com/spreadsheets/d/1vJ4Yil_kTcJ2uXCMjsw0oXpk-Xsg7oLy/edit?gid=2014558857#gid=2014558857)). This module moves it into `/admin` as a third module, **রুটিন**, next to ভর্তি and জরিপ:

1. Enter teachers (profile, subjects they can teach, salary, weekly target).
2. Give each class and group its lessons: a typed time, days, subject + main teacher + optional TA.
3. See the routine, and for any day and time which teachers are free and what they can teach, to arrange a proxy fast.
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

### 2a. Simplification (owner, 2026-10-21; mockup locked on the canvas, page "সরল রুটিন (নতুন)")

| Topic | Decision |
|---|---|
| Classes and groups | A **class** is a conventional class (Nursery…Six). Every student is also in one Quran group (Qaida, Ammapara, Najera, Hifz) and one Arabic group (L-1…), mixed across classes. Groups are **not linked** to classes and no students are tracked. |
| Class types | An editable list (seeded জেনারেল, হিফয, নাজেরা, কুরআন, আরবি), each with a **placement**: *class* (own room, a row in the table), *own room* (Hifz/Najera: their own rooms and rows), *seated* (Quran/Arabic: sit in a class's room, chosen per lesson as **কোথায় বসে**). A subject belongs to exactly one type. |
| Times | **Typed freely** per lesson (no periods). Quran/Arabic groups may move to any time (9:00–9:45, 11:00–11:45). Overlapping times are allowed; the table's columns are the routine's distinct times. |
| Rooms | No shared rooms. |
| Views | **টেবিল** (rows = rooms: Hifz/Najera sections on top, foldable, then the classes with the groups seated in their rooms), **গ্রুপ** (every class and group under its type, foldable), **টিচার**. Flat colour fill per type; no left accent bars or tinted chips. |
| Add / edit | A side panel (§5). |
| Prints | One table across an **A4 landscape** page. |
| Teachers | Edit and delete on each row; delete removes the teacher's lessons, and a teacher with absence/proxy history is hidden instead (**সরান**). |
| Sheet import | **Retired.** Classes and periods were wiped by migration `0012` (teachers, subjects, rooms, groups, absences and proxies kept). |
| Parents' routine | Deferred until the owner sends samples. |

## 3. Data (Postgres, Drizzle — `src/lib/routine/schema.ts`, added to `drizzle.config.ts`)

All tables are prefixed `routine_`.

**`routine_class_types`**: `name` (unique), `placement` (class / own_room / seated), `sort` (the table's section order).

**`routine_subjects`**: `id`, `type_id`, `name` (as the school writes it, e.g. "Math", "Qaida"; unique per type, so Islam can be both জেনারেল and আরবি), `sort`, `active`.

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

**`routine_rooms`**: `name` (e.g. "501", "Hall").

**`routine_groups`** (classes and groups): `name` (Nursery-A, Hifz-1 (M), Qaida-A, L-1 A), `type_id`, `sort`, `default_room_id` (none for a seated group), `gender_rule` (any / male / female), `active`.

**`routine_routines`**: `name`, `status` (draft / active; at most one active), `created_at`, `copied_from_id`.

**`routine_assignments`** (lessons): `routine_id`, `group_id`, `host_group_id` (a seated group: the class whose room it uses), `starts_at`, `ends_at` (minutes after midnight, end after start), `days` (set of sat…thu, at least one), `subject_id` (of the group's type), `teacher_id` (main, required), `ta_id` (optional, ≠ main).

A cell that changes by day is several rows with disjoint `days`. Example, `farhana/nasreen (sun–tue)`: row 1 sat, wed, thu → Farhana; row 2 sun–tue → Farhana + TA Nasreen.

**`routine_absences`**: `date`, `teacher_id`, `times` (null = all day, or the lesson times away), `reason` (optional).
**`routine_proxies`**: `date`, `assignment_id`, `role`, `starts_at`, `ends_at`, `proxy_teacher_id`, plus a **snapshot** of group / time / subject / absent-teacher names so history stays readable after the routine changes. One proxy per assignment and role per date; a proxy teacher can't take two overlapping ones (exclusion constraint).

**Clash rule:** in one routine, on a shared day, two lessons whose times overlap (touching ends don't) may not share the group, a teacher (main or TA) or the room row (a seated group takes its host class's row; a class or own-room group its own). The database refuses it (`routine_slots_no_overlap`, an exclusion constraint over `int4range(starts_at, ends_at)`, btree_gist); the editor checks the same rules first (`clash.ts`) and names what clashes ("Six (F)-এর প্রতিদিন ৯:০০–১০:০০-এ আগে থেকেই English আছে।"). Subject not in the teacher's list and gender rule broken → **warning**, saved after confirming.

## 4. Load math (pure module, unit-tested)

- `main` = Σ over the teacher's main lessons of the number of days (each lesson a day = 1 class, whatever its length); `ta` likewise for TA rows.
- `weighted = main + ½ × ta`; `percent = weighted ÷ target_periods`.
- Status: **কম** (< 80 %), **ঠিক আছে** (80–100 %), **বেশি** (> 100 %), or **টার্গেট নেই**.
- `minutes/week` = Σ of lesson length × days (main and TA shown separately).
- `a day` = main ÷ 6 + TA ÷ 6, shown as the sheet writes it ("৩+১"). The target stays one weekly number (owner, 2026-10-18): 3+1 a day is (3 + ½) × 6 = 21.
- `salary per class` ≈ salary ÷ (weighted × 52 ÷ 12), shown on the workload page behind **বেতন দেখান**.
- Busiest day: the most classes on any one day (a teacher with 6 on Sunday and 1 on Thursday stands out).

The **active** routine feeds the workload page; a draft shows its own workload while it's being edited.

## 5. Admin screens (`/admin/routine/…`, module **রুটিন**)

Follows the shared admin design (`docs/admin-redesign-plan.md`, pieces in `src/app/admin/ui.tsx`). Bengali UI with the words staff actually say, English loanwords included (owner, 2026-10-19): টিচার, টিএ, মেইন, সাবজেক্ট, টার্গেট, খালি পোস্ট, অ্যাবসেন্ট, সিলেক্ট, সেভ, ডিলিট, ড্রাফট, পেজ — not শিক্ষক / সহকারী / বিষয় / লক্ষ্য / শূন্য পদ / মুছুন / খসড়া. Mutations are server actions that call `assertAdmin()`.

| Nav | Page | Contents |
|---|---|---|
| রুটিন | `/admin/routine` | The chosen routine (active by default; `?r=` a draft) as one plain table, the routine's distinct times across (sticky head and name column), in three views (`?view=`, locked 2026-10-21): **টেবিল** (default) — a row per room: the own-room types first (Hifz and Najera, one section per gender, "হিফয · নাজেরা (M)"), then **ক্লাস**, each class's row also showing the seated groups in its room (group name in its type's colour). **গ্রুপ** — every class and group under its type (own room, seated, then classes), a seated group's cell saying "Nursery-A-এর রুমে · ৪০২". **টিচার** — a row per teacher, empty = free, the week's load at the end. A section heading folds its rows into one line counting the groups in class at each time (remembered in the browser; prints unfolded). Cells take a flat fill per type. A day filter (`?day=`), **টিচার খুঁজুন** (fades every other lesson and counts the chosen teacher's), **ছোট করে দেখুন** (compact), **?** (what the names and colours mean) and **⋯** (print, versions). With today on screen in the active routine, today's absences show struck through with the proxy (→ name) or **প্রক্সি লাগবে**; the running time is marked **এখন**. **ক্লাস যোগ করুন**, a lesson, or "+" in an empty cell (that row and time) opens the side panel: ক্লাস, না কোন গ্রুপ (type chips) → name → subject (that type's) → time (typed, Bengali or English digits; "✓ … কলামে বসবে" or "নতুন কলাম তৈরি হবে", the routine's times one tap away) → days → **কোথায় বসে** (seated groups; the last one preselected) → clash alert → teacher picker (free green, subject teachers first; busy folded with where they are) → TA. **সেভ**, **সেভ করে আরেকটা**, **ডিলিট** (edit), and an undo toast. **Print:** one table across A4 landscape, the time row repeated on each page. |
| ক্লাসের রুটিন | `/admin/routine/groups/[id]` | One class's or group's week: days × its times (a class also shows the groups seated in its room). **A4 print**. |
| টিচারের রুটিন | `/admin/routine/teachers/[id]` | One teacher's week (main and TA marked), load summary. **A4 print** (no salary or phone). |
| ফ্রি টিচার | `/admin/routine/free` | One **date** (default today; ‹ › step a school day), every teacher's state at every lesson time (`dayBoard`). Two views (locked 2026-10-19), `?view=`: **নাম** (default) — a column per time ("N জন ফ্রি", এখন), each teacher a chip with only their subject names: **solid green** free and teaches a subject taught then (or the chosen subject), **dashed pale green** free with other subjects, **orange** on a proxy (group shown), **red** in class (group · subject), **grey** absent; free chips first, fewest classes that day first. Teachers with no class that day in the time's **sitting** (lessons at most 30 minutes apart: the morning school day; the evening Hifz is another) fold into "+N জন স্কুলে নেই". **টেবিল** — a row per teacher, times across, the same colours, the day's class count at the end; with a subject chosen, its teachers come first under their own heading. Today, past times fade and the board scrolls to the running one. That day's absentees are named with a link to the proxy page. |
| প্রক্সি | `/admin/routine/proxy` | Daily register (§6). |
| প্রক্সি তালিকা | `/admin/routine/proxy/list` | Who was away and who covered which class, for a day or a school week (**দিন / সপ্তাহ**, ‹ ›), totals, WhatsApp copy, print, and the month's proxy counts as bars. Today and later list every class of an absent teacher (covered or **প্রক্সি লাগবে**); past days list only the proxies given (their snapshot), since the routine may have changed since. |
| ওয়ার্কলোড | `/admin/routine/workload` | Every teacher: main, TA, weighted, target, %, status badge, minutes/week, busiest day (all of them when tied), proxies this month; salary and salary per class only with **বেতন দেখান** on (`?salary=1`). The **target is typed in the table** (saved on Enter or leaving the box), so rows sort by name and stay put. Also **খালি পোস্ট** (posts to fill): vacancy teachers with their subjects and weekly load. |
| টিচার | `/admin/routine/teachers` | Search by name or subject, filter সবাই / বেশি / কম / খালি পোস্ট; each row **এডিট** (side panel: short name, gender, full name, designation, phone, subjects by type, target, salary, the rest folded) and **ডিলিট** (a confirm listing the lessons it deletes; with history it is **সরান**: hidden, lessons deleted, history kept). `?edit=<id>` / `?new=1` open the panel. |
| সেটআপ | `/admin/routine/setup` | Tabs (`?tab=`): **ক্লাসের ধরন** (name, placement, ▲▼ order), **ক্লাস ও গ্রুপ** and **সাবজেক্ট** under their type, **রুম**, **রুটিন ভার্সন** (new, copy, make active, rename, delete a draft). A row's **এডিট** opens a side panel; **⋯** holds the rest. Deleting a type, subject or room asks first (a room's classes then have no room); deleting a class or group shows an undo. A type, subject, class or group still in the routine can't be deleted (turn it off instead); a type's placement, or a class's or group's type, can't change while it has lessons. Making a version active asks first (today's and later proxies of the old one are dropped); a new or copied version opens in the routine page. |

Making a routine active asks for confirmation. Saved proxies of past dates keep their snapshot.

## 6. Proxy register

The screen (rebuilt 2026-10-19 for the principal and office staff, phone first):

1. Pick a date (default today, ‹ › a school day back or on; Fridays have no classes).
2. **কে আসেননি?** Select an absent teacher (whole day; an optional reason). Each absent teacher is a chip showing how many of their classes still need a proxy; tap one to open them.
3. Their classes that day come up as cards (time, group · subject, TA marked), each **প্রক্সি লাগবে** or **প্রক্সি: name**. The first uncovered card is open, showing the **teacher picker**:
   - green = can take it (`rankCandidates`, the same list the server checks): active, not a vacancy, not absent, free at that time on that day (no overlapping class as main or TA, no overlapping proxy that date), and meeting the group's gender rule;
   - first those who teach the subject (**<subject> পড়ান**), then **অন্য সাবজেক্টের টিচার**;
   - within each, those at school then (a class in the same sitting that day, see ফ্রি টিচার) before the rest, marked "এ সময় স্কুলে থাকেন না"; then fewest classes that day (proxies included), then fewest proxies this month — shown under each name;
   - red = everyone else, with why (অ্যাবসেন্ট, <group>-এ ক্লাস, <group>-এ প্রক্সি, the gender rule).
4. Tapping a green name saves at once, shows an **undo** toast and opens the next uncovered card. An assigned card offers **WhatsApp** (a ready message to the proxy teacher's number), **প্রক্সি সরান**, and for an uncovered one **এ ক্লাসে আছেন** (the absence then keeps only the other times; none left removes it).
5. Below: the day's list (prints on A4; copies as WhatsApp text: date, time, class, subject, absent teacher → proxy) and the month's proxy counts.
6. Absences are kept by time, so making another routine active carries them over as they are.

Proxy counts per teacher for the month show on the proxy page and the workload page.

## 7. Import from the sheet (retired 2026-10-21)

A one-time script once read the sheet into a draft routine (`pnpm routine:import`). With typed times and class types it no longer fits, and the owner chose to enter the routine fresh in the new editor, so the script and its tests were removed (git history before 2026-10-21 has them).

## 8. Security & privacy

- `/admin/routine` sits behind the existing admin Basic Auth (`src/proxy.ts`); no public pages.
- Salary and phone are shown on admin pages only; never in prints, the WhatsApp text, or exports.
- No routine data in Sanity.
- Nightly backup: the daily cron (`/api/cron/survey-daily`) writes every routine table to `routine-backups/YYYY-MM-DD.json` in the survey's private Blob store (`PG_BACKUP_BLOB_READ_WRITE_TOKEN`) and keeps 30 days (`src/lib/routine/backup.ts`).

## 9. Build phases

| Phase | Scope |
|---|---|
| **1** | Schema + migration; subjects, rooms, groups, periods, routines (draft / active / copy); teachers (incl. vacancy flag, ERP ID); routine editor with clash checks; school / group / teacher views; free teachers; workload + posts to fill; **proxy register**; **prints** (A3 school grid, A4 group / teacher / proxy day). Local preview fixtures (`ADMISSIONS_LOCAL=1`) with sample routine. |
| **2** | Sheet import script (draft + fix list). Built 2026-10-18, retired 2026-10-21 (§7). |
| **2a** | Simplification (§2a): class types, typed times, rows = rooms, side-panel editor, setup tabs, teacher delete, proxy list. Built 2026-10-21. |
| **3** | Parents' routine (when the owner sends samples); Ramadan timings (a copied version with other times); subject coverage per group (periods/week needed vs assigned); use ERP ID to join routine with survey reports. |

Tests: pure modules (clash detection, load math, free-teacher and proxy ranking, time parsing) unit-tested; clash enforcement and proxy save on PGlite (`*.pg.test.ts`); Playwright smoke for the routine pages in the local preview.

## 10. Open questions

1. ~~What does "3+1" mean?~~ Main + TA periods a day (owner, 2026-10-18).
2. Target periods per week for each teacher: to be entered by the owner (the sheet has none per week).

## 11. Build notes (2026-10-18, rebuilt 2026-10-21)

- **Code:** logic in `src/lib/routine/` (pure: `days` (times, `parseTime`/`parseSpan`: Bengali or English digits, 1–6 o'clock read as afternoon, an end before an afternoon start read in the evening), `clash`, `load`, `free` (sittings), `proxy`, `availability` (the picker's choices), `layout` (`tableSections`, `groupSections`, `cellLessons`); server-only: `data`, `db`, `backup`). Pages in `src/app/admin/routine/`: `page.tsx` + `RoutineGrid.tsx` (the three views), `LessonPanel.tsx` (the side panel), `cells.tsx` (time heads, a lesson, type fills), `controls.tsx` (side panel, chips, segmented control, toasts); `groups/[id]`, `teachers` (`TeacherList`, `TeacherForm` = the panel), `teachers/[id]`, `free`, `proxy` (+ `proxy/list`), `workload`, `setup` (`SetupBoard`). Migrations `drizzle/0008_routine_init.sql` … `0012_routine_typed_times_finish.sql`.
- **Migration 0011/0012:** seeds the five types, types each group from its old section, splits subjects by type (Islam, Arabic, Quran), moves absence and proxy periods to times, **deletes every lesson** and drops `routine_periods`. It runs on deploy (`vercel-build`), so the production routine is emptied then; teachers and the register's history stay.
- **Clash guard:** `routine_slots` holds one row per lesson × day for its group, its room row, its teacher and TA (`kind` text, `ref_id`, `starts_at`, `ends_at`); the exclusion constraint makes an overlapping double booking fail the whole `db.batch`. PGlite loads btree_gist for the tests and the preview (`src/lib/admissions/testing/pg.ts`).
- **Copy:** copying a routine copies its lessons and slot rows with new ids.
- **Proxies:** the register works on the active routine. A saved proxy is dropped when it no longer holds (nobody away from that class, or the proxy teacher now away or in an overlapping class). Absence changes re-check that date; routine changes re-check every date from today on. Making another routine active drops today's and later proxies of the old one. Past proxies keep their name snapshot.
- **Local preview:** `ADMISSIONS_LOCAL=1` loads a sample routine with made-up names (`src/lib/routine/testing/dev-fixtures.ts`): Hifz/Najera M/F groups in their own rooms (morning and evening), classes, Quran/Arabic groups seated in class rooms, a class on its own times (Six (F)), day-split cells, a TA, a vacancy, and one teacher away today.
- **Tests:** `src/lib/routine/routine.test.ts`, `availability.test.ts` (pure logic), `data.pg.test.ts`, `backup.pg.test.ts` (PGlite: clash guard, copy, teacher delete, proxies, the sample), `e2e/admin-routine.spec.ts` (`pnpm test:e2e:admissions`, project `routine`). `pnpm admin:screenshots [dir] routine` captures the pages and prints.
