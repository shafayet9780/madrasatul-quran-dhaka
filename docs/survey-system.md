# Survey System — Specification

Status: **phase 1 built** (T1 + T1 reports, 2026-10-04) on branch `survey-form`; design and prototype locked. Prototype: [`survey-mockups/`](survey-mockups/README.md). Build record: [`survey-implementation-plan.md`](survey-implementation-plan.md). Admin how-to and go-live checklist: [`survey-admin-guide.md`](survey-admin-guide.md). Next: phase 2 (G1/G2 and guardian reports).

Three recurring surveys, run from this app, replace the current Google Forms:

| Code | Name | Respondent | Rates |
|---|---|---|---|
| **T1** | স্টুডেন্ট সম্পর্কে শিক্ষকের রিভিউ | Subject teacher | Each student of the class + subject they teach |
| **G1** | ক্লাস পরিচালনার উপর অভিভাবক রিভিউ | Guardian | Teaching quality of each subject in the child's class |
| **G2** | শিক্ষার্থীর উপর অভিভাবক রিভিউ | Guardian | Their own child |

Source Google Forms (content migrated below):
- G1: https://docs.google.com/forms/d/e/1FAIpQLSdOAgWjGassJ2V0OpSZ8pBjk-7QSibcvqB4OZtKvImYO_VmUw/viewform
- G2: https://docs.google.com/forms/d/e/1FAIpQLSdirLm1_EYUcLIG-WUikVLGGZjQyfyOPqzGGJo3QOL6EJPEjQ/viewform

## 1. Principles

- **Google-Forms-level access.** One shared link per round, with an expiry. No respondent logins.
- **Nothing is anonymous.** Every response records who submitted it and which student / class / subject it concerns.
- **Bengali only.** No English UI for now. Numerals shown in Bengali.
- **Direct marking.** Rating questions show marks only: **১০ / ৮ / ৬ / ৪** (no labels). The scale is configurable per survey template.
- **Polished, mobile-first UX.** Most respondents are on phones. Quality is not traded for speed of delivery.
- **Design system locked (2026-10-04): Bronze & Stone.** Bronze `#875B3D` is the only solid colour (primary button); selection is a bronze outline + tint, never solid; warm paper/stone surfaces; no black. Full tokens and rules: [`survey-mockups/README.md`](survey-mockups/README.md#design-system-locked-2026-10-04-bronze--stone).
- **School scale:** < 300 students, ~13 class-sections.

## 2. Surveys

### 2.1 Common flow

1. Open the round link → intro (title, instructions, scale legend `১০ = সবচেয়ে ভালো, ৪ = সন্তোষজনক নয়`). Guardian intros keep the school's amanat line and add: `আপনার নাম ও উত্তর শুধু প্রিন্সিপাল ও অ্যাডমিন দেখবেন; শিক্ষক দেখবেন না।` G1 time estimate: ৮–১২ মিনিট.
2. Identify (see per-survey).
3. Answer — **one question per screen**, progress bar, previous/next.
4. Review screen → submit.
5. Receipt page (see §5).

Closed or expired link → friendly "এই জরিপটি বন্ধ হয়ে গেছে" page.

### 2.2 T1 — teacher rates students

**Identify:** type own ERP ID (printed on the staff ID card; Bengali digits accepted) → confirm the name it belongs to (`আপনি কি এই শিক্ষক?`) → class → section (step skipped when the class has none) → subject (subjects of that class). Students of that class-section load. The round's teacher list never reaches the browser: the server looks the ID up (rate-limited). The device remembers the confirmed teacher per round, so a return visit only asks for confirmation; the teacher is never in the URL, so a copied link does not carry their identity. Play has a single subject `সব বিষয়` (one teacher teaches everything there).

**Answer:** one question per screen; every student listed (roll + name) with `১০ ৮ ৬ ৪` tap targets. Each tap autosaves (draft) so a teacher can stop and resume on any device. Optional **note per student** (note icon beside the name). Final review grid (students × questions) → submit.

**Duplicate guard:** if a *different* teacher has already submitted the same round + class + section + subject, show a warning naming that teacher and the submission time. The teacher may confirm and continue; both responses are kept and flagged for admin. A teacher reopening their own class + subject edits their own response — no warning.

| # | Question | Hint (shown under question) | Area |
|---|---|---|---|
| ১ | ক্লাসে নিয়মিত উপস্থিত হয় কি না? | | উপস্থিতি |
| ২ | ক্লাসে মনোযোগী কি না? | | মনোযোগ ও পড়ার অভ্যাস |
| ৩ | অন্য বাচ্চাদের সাথে মারামারি বা বাজে কথা বলে কি না? | ১০ = সমস্যা নেই, ৪ = প্রায়ই করে | সহপাঠীদের সাথে আচরণ |
| ৪ | শিক্ষকের নির্দেশ পালন করে কি না? | | আনুগত্য |
| ৫ | অভিভাবক শিক্ষকের সাথে সঠিক কোর্ডিনেশন করে কি না? | | অভিভাবকের সহযোগিতা |
| ৬ | অভিভাবক নির্ধারিত সময়ের বাইরে শিক্ষকের সাথে যোগাযোগ করে কি না? | ১০ = কখনো করেন না, ৪ = প্রায়ই করেন | অভিভাবকের সহযোগিতা |
| ৭ | কুইজ বা অন্যান্য এসেসমেন্ট এ শতকরা আশিভাগ মার্ক পায় কি না? | | পড়াশোনার ফলাফল |

Marks: ১০ / ৮ / ৬ / ৪ for every question. All required.

### 2.3 G1 — guardian rates teaching quality per subject

**Identify:** guardian picks the **class (and section)** first, then enters **student ID or mobile number**. Matches are searched only within that class, so a guess reveals at most that one class's children.
- Student ID → that child.
- Mobile (father or mother contact) → children in that class linked to the number (twins/siblings in the same class) → pick one. Siblings in other classes are reviewed in separate submissions.
- Then capture submitter **name, relation to student, mobile**.
- Mobile matches the ERP guardian mobile → response marked **verified**; otherwise **unverified** (still accepted).

**Answer:** one question per screen; under it, the **subjects of the child's class** (from Studio), each with `১০ ৮ ৬ ৪`. Same rating component as T1. One optional comment at the end. No teacher is stored — only class + subject.

| # | Question | Hint | Area |
|---|---|---|---|
| ১ | ক্লাসের পড়া আপনার সন্তান বুঝতে পারে কি না? | | পাঠদানের কার্যকারিতা |
| ২ | ক্লাসের পড়া ক্লাসে শেষ হয় কি না? | | পাঠদানের কার্যকারিতা |
| ৩ | অতিরিক্ত হোমওয়ার্ক দেওয়া হয় কি না? | ১০ = পরিমাণ ঠিক আছে, ৪ = অনেক বেশি | মূল্যায়ন ও খাতা দেখা |
| ৪ | ক্লাসে উত্তম আচরণ করা হয় কি না? | | আচরণ ও তারবিয়াহ |
| ৫ | আপনার সন্তান শিক্ষককে পছন্দ করে কি না? | | আচরণ ও তারবিয়াহ |
| ৬ | কুইজের সিলেবাস ঠিকঠাক রিভাইজ করা হয় কি না? | | মূল্যায়ন ও খাতা দেখা |
| ৭ | ক্লাস ওয়ার্ক ঠিকঠাক চেক করা হয় কি না? | | মূল্যায়ন ও খাতা দেখা |
| ৮ | হোমওয়ার্ক নিয়মিত চেক করা হয় কি না? | | মূল্যায়ন ও খাতা দেখা |
| ৯ | পড়ানো লেসন আপনার সন্তান শিখেছে কি না? | | পাঠদানের কার্যকারিতা |
| ১০ | অভিভাবকের সাথে শিক্ষক ভালোভাবে কোর্ডিনেট করে কি না? | | অভিভাবকের সাথে যোগাযোগ |
| ১১ | পরীক্ষার খাতা ঠিকঠাক চেক করে বাসায় পাঠানো হয় কি না? | | মূল্যায়ন ও খাতা দেখা |
| ১২ | শিক্ষার্থীর আদব আখলাক শৃংখলার ব্যাপারে শিক্ষক যত্নশীল কি না? | | আচরণ ও তারবিয়াহ |
| ১৩ | আপনার সন্তানের কোনো সমস্যা বা দূর্বলতা থাকলে আপনাকে অবগত করা হয় কিনা? | | অভিভাবকের সাথে যোগাযোগ |
| ১৪ | সার্বিকভাবে আপনি শিক্ষকের কাজে সন্তুষ্ট কি না? | | সার্বিক সন্তুষ্টি |

Comment: `বিশেষ কোন পরামর্শ ও মন্তব্য` (optional).

Subjects (configured per class in Studio): Play `সব বিষয়` only; Nursery–Five আরবি, ইসলাম শিক্ষা, বাংলা, ইংরেজি, গণিত; Six adds বিজ্ঞান and বাংলাদেশ ও বিশ্বপরিচয়.

### 2.4 G2 — guardian rates own child

**Identify:** same as G1.

**Answer:** descriptive options; each option carries a **hidden mark** (configured in Studio) used for scoring. Reports show **both** mark-based scores and **raw option counts**. Options are displayed in the order below.

| # | Question | Options → mark | Area |
|---|---|---|---|
| ১ | নিয়মিত ক্লাস করে কি না? | উপস্থিতি > ৯০% → ১০ · ৮০-৯০% → ৮ · ৭০-৮০% → ৬ · < ৭০% → ৪ | উপস্থিতি |
| ২ | বাসায় নিয়মিত পড়া পড়ে কি না? (নন ডে কেয়ারদের জন্য প্রযোজ্য) | ৪ ঘন্টা + → ১০ · ৩ ঘন্টা + → ৮.৫ · ২ ঘন্টা + → ৭ · ১ ঘন্টা + → ৫.৫ · ১ ঘন্টার কম → ৪ · **প্রযোজ্য নয় (ডে কেয়ার)** → not counted | মনোযোগ ও পড়ার অভ্যাস |
| ৩ | হোমওয়ার্ক দেওয়া হলে নিয়মিত করে কি না? | নিয়মিত করে → ১০ · মাঝে মাঝে বাদ যায় → ৮ · মাঝে মাঝে করে → ৬ · করে না → ৪ | মনোযোগ ও পড়ার অভ্যাস |
| ৪ | নিজে থেকে মোবাইল বা ডিভাইস দেখে কি না? | দেখে না → ১০ · সপ্তাহে ২/১ বার → ৭ · সপ্তাহে ৩/৪ বার বা তার বেশি → ৪ | আগ্রহ ও বাসার অভ্যাস |
| ৫ | বাচ্চা মাদ্রাসা পছন্দ করে কি না? | অনেক পছন্দ করে → ১০ · মোটামুটি পছন্দ করে → ৮ · কম পছন্দ করে → ৬ · পছন্দ করে না → ৪ | আগ্রহ ও বাসার অভ্যাস |
| ৬ | পিতামাতার কথা ঠিকঠাক শোনে কি না? | ঠিকঠাক শোনে → ১০ · মাঝে মাঝে শোনে না → ৮ · মাঝে মাঝে শোনে → ৬ · শোনে না → ৪ | আনুগত্য |
| ৭ | ক্লাসে অন্য বাচ্চাদের সাথে মারামারি বা বাজে কথা বলে এই অভিযোগ মাদ্রাসা থেকে আসে কি না? | প্রায়ই আসে → ৪ · মাঝে মাঝে আসে → ৭ · আসে না → ১০ | সহপাঠীদের সাথে আচরণ |
| ৮ | কুইজে শতকরা কত নাম্বার পায়? | ৮০%+ → ১০ · ৭০%+ → ৮.৫ · ৬০%+ → ৭ · ৫০%+ → ৫.৫ · **৫০% এর কম** → ৪ | পড়াশোনার ফলাফল |
| ৯ | বাচ্চার সার্বিক পড়াশোনায় আপনি সন্তুষ্ট কি না? | সন্তুষ্ট → ১০ · মোটামুটি সন্তুষ্ট → ৭ · সন্তুষ্ট নই → ৪ | আগ্রহ ও বাসার অভ্যাস |

Comment: `কোন পরামর্শ ও মন্তব্য` (optional). Changes vs the Google Form: duplicate "৫" numbering fixed (auto-numbered), ২ gains a "not applicable" option, ৮ gains "৫০% এর কম".

Mark spacing rule: 4 options → ১০/৮/৬/৪, 3 options → ১০/৭/৪, 5 options → ১০/৮.৫/৭/৫.৫/৪.

## 3. Areas

Every question carries an **area** tag, so guardian and teacher views of a student can be compared even when wording differs. Areas are a fixed list maintained in Studio.

**Student areas (G2 ↔ T1)**

| Area | G2 | T1 | Comparable |
|---|---|---|---|
| উপস্থিতি | ১ | ১ | ✓ |
| মনোযোগ ও পড়ার অভ্যাস | ২, ৩ | ২ | ✓ |
| আনুগত্য | ৬ | ৪ | ✓ |
| সহপাঠীদের সাথে আচরণ | ৭ | ৩ | ✓ |
| পড়াশোনার ফলাফল | ৮ | ৭ | ✓ |
| আগ্রহ ও বাসার অভ্যাস | ৪, ৫, ৯ | — | guardian only |
| অভিভাবকের সহযোগিতা | — | ৫, ৬ | teacher only |

**Teaching-quality areas (G1)**: পাঠদানের কার্যকারিতা (১, ২, ৯) · মূল্যায়ন ও খাতা দেখা (৩, ৬, ৭, ৮, ১১) · আচরণ ও তারবিয়াহ (৪, ৫, ১২) · অভিভাবকের সাথে যোগাযোগ (১০, ১৩) · সার্বিক সন্তুষ্টি (১৪).

## 4. Rounds, links, responses

- **Template** (Sanity): survey kind, title, intro, scale, questions (stable `key`, text, hint, type, options + marks, area, required, `allowNA`).
- **Round** (Sanity draft → Postgres): template, label (e.g. "অক্টোবর ২০২৬"), `slug`, planned opens/closes at. Admin starts each round manually — any cadence (monthly, quarterly, ad hoc).
- **Opening a round:** an explicit **"Open round"** action (Studio document action → admin API) creates the `survey_rounds` row, generates the link key, and snapshots the template **plus the class/section/subject lists and teacher list**. From then on **Postgres is the source of truth** for that round (dates, link key, questions, rosters). Extending or closing early is done from the admin side, not by editing the Sanity doc. A **"Refresh lists"** admin action re-snapshots classes/subjects/teachers mid-round if genuinely needed (e.g. a teacher was missing).
- **Keys are immutable:** class, section, subject, teacher, question and area `key`s are read-only in Studio after creation, so stored responses never orphan. Responses also store the display names alongside keys.
- **Changing marks or scale** = new template version; an open round is never affected.
- **Link:** `/survey/{slug}?k={linkKey}` — unguessable key, `noindex`, expiry checked server-side on load and on submit (submit allows a 10-minute grace after close for someone already on the review screen).
- **Round closing with drafts:** drafts are kept, listed in the tracker, and can be submitted if the admin extends the round; they never count in reports.
- **Submissions and history:** a *submission* is one guardian form (G1/G2) or one teacher class-batch (T1), identified by `submission_id`. Submitted rows are immutable. Reopening clones the current submission into a draft; submitting the draft supersedes the previous submission in one transaction (`superseded_by`). The current response is unique per (partial unique index on `status = 'submitted' AND superseded_by IS NULL`):
  - G1, G2: round + student
  - T1: round + teacher + subject + student
- **T1 duplicate guard** is checked when the teacher picks class/subject **and re-checked at submit**; both the new and the earlier batch get `duplicate_flag`.

## 5. Receipt

Receipts never show phone numbers (only the verified / unverified badge) and remind the respondent to save the link, since there is no device-side list of submissions.

After submit the respondent lands on a receipt page (`/survey/receipt/{token}`, unguessable token, one per submission) showing every question and their answer, with **ডাউনলোড** = print stylesheet + browser print-to-PDF (server-side PDF libraries break Bengali conjuncts). On iOS, print lives in the share sheet — show a one-line hint. For T1 the receipt is a class table (students × questions) with a sticky student column. No "my submissions" list on the device (a shared family phone would expose other families' answers).

## 6. Data

| Data | Store | Notes |
|---|---|---|
| Templates, rounds, areas | Sanity | Admin-authored in Studio |
| Classes, sections (optional per class), subjects per class | Sanity | Classes today: Play, Nursery (A/B), KG (A/B), One, Two (male/female), Three (male/female), Four, Five, Six |
| Teacher list (survey) | Sanity | Supplied by the school; separate from public website teacher profiles |
| Students + guardians | Postgres | Imported from ERP export (student ID, name, class, section, roll, guardian name, guardian mobile(s)); upsert by ERP ID; missing students marked inactive, never deleted |
| Round snapshots, responses | Postgres | Responses snapshot student name, class, section, roll at submission time so promotions never rewrite history |
| Mirror / backup | Google Sheet | One tab per round, written server-side; Sheet ID from env only (never from the client) |

**Postgres:** Neon free plan via Vercel Marketplace, Drizzle ORM. Expected volume ≈ 5 MB per full round — years of headroom in 0.5 GB. Free plan restore window is only 6 hours, so the Sheet mirror is the backup.

**Core tables**
- `students(erp_id PK, name, class_key, section_key, roll /* nullable */, father_name, father_mobile, mother_mobile, active, updated_at)` — mobiles nullable, stored canonical `8801XXXXXXXXX`. Verified = submitter mobile matches father **or** mother mobile.
- `survey_rounds(id, sanity_round_id, kind, slug, label, snapshot jsonb /* template + classes/sections/subjects + teachers */, opens_at, closes_at, link_key, opened_at)`
- `submissions(id, round_id, kind, status draft|submitted, superseded_by, duplicate_flag, receipt_token, submitter_name, submitter_relation, submitter_mobile, verified, teacher_key, teacher_name, class_key, section_key, subject_key, subject_name, comment, client_ip, user_agent, created_at, updated_at, submitted_at, mirrored_at)` — one per guardian form or T1 class-batch.
- `responses(id, submission_id, student_erp_id, student_name, class_key, section_key, roll /* snapshot */, answers jsonb, note)` — one per student (T1: one per student in the batch; G1/G2: exactly one).
  - G1 `answers`: `{questionKey: {subjectKey: mark}}`
  - G2 `answers`: `{questionKey: optionKey}`
  - T1 `answers`: `{questionKey: mark}`, `note` = per-student note
- `answer_items(submission_id, response_id, round_id, kind, student_erp_id, class_key, section_key, subject_key, question_key, area_key, option_key, mark, is_na)` — flat rows written on submit for every survey kind (marks and areas resolved from the round snapshot). All reports query this one shape.

**Student ordering** (T1 list, reports): by roll; students without a roll follow, by name, with their ID shown.

**Input normalisation:** Bengali digits ০–৯ → 0–9, spaces/dashes stripped; mobile accepts `01…`, `8801…`, `+8801…`, stored as `8801XXXXXXXXX`; same digit conversion for student ID. Inputs use `inputmode="numeric"`.

**ERP import** (`/admin/import`): CSV (UTF-8) or XLSX of the ERP student list. ERP columns (from the student list screen): `ID, Roll, Photo, Name, Class, Section, Father Name, Father Contact, Mother Contact`. Import uses `ID, Roll, Name, Class, Section, Father Name, Father Contact, Mother Contact`; `Photo` is ignored (no child photos on public survey links). Observed data rules: `Roll` may be empty; `Section` is empty for classes without sections and otherwise like `Section A`; contacts are `+8801…` and may be missing; names are English in mixed case — stored exactly as imported, **displayed in title case** (`ADRUP HOSSAIN MAHAJ` → `Adrup Hossain Mahaj`), exports use the stored value; one contact can belong to several students (siblings). Each Sanity class has `erpClassNames[]` / `erpSectionNames[]` mapping ERP labels (e.g. `Nursery` + `Section A`) to class/section keys. A dry-run preview shows adds/updates/deactivations and every problem row. On confirm, valid rows import; rows with an unmapped class or a missing name are **skipped**; invalid mobiles are imported **blank** (that guardian cannot be verified). Every skipped or altered row is listed and downloadable as Excel. Reports use the response snapshot; the tracker uses the current roster.

**Operations**
- Neon via the serverless HTTP driver and pooled URL; the survey page warms the DB on open (free plan suspends after 5 minutes idle, ~0.5–1 s cold start).
- Sheet mirror is best-effort **after** the DB commit (never fails a submit), append-only with a status column (current / superseded / duplicate); `mirrored_at` + a daily cron retries failures.
- Backup: nightly JSON dump of all survey tables to Vercel Blob (the free plan's 6-hour restore window is not a backup).
- Excel exports as `.xlsx`; all timestamps in `Asia/Dhaka`.

## 7. Reporting — `/admin/reports`

Principal/admin only, behind the existing Studio Basic Auth (single shared login). Full-screen, Bengali, responsive. Global filters on every page: round, compare-with round, class, subject, verified-only.

1. **Overview** — KPI tiles (response rate, G1/G2/T1 averages with Δ vs comparison round, needs-attention count), class × subject heatmap, response progress by class, survey trends, needs-attention list.
2. **Teaching quality (G1)** — class × subject heatmap (mean + n); drill into a cell → per-question distribution of marks, trend, individual responses with submitter.
3. **Class** — student table (guardian avg, teacher avg, gap, trend sparkline, flags) and guardian-vs-teacher scatter (quadrants: both low / perception gap ×2 / both high).
4. **Student profile** — per-area guardian vs teachers vs class average, subject × question grid from teachers, trend across rounds, all raw responses with verification status, two print versions: **guardian version** (A4; per-area marks for guardian, teachers combined and class average, strengths / areas to work on, trend, signature lines — no teacher names, no teacher notes) and **internal version** (everything, including notes).
5. **Teacher rating patterns (T1)** — each teacher's mark distribution and leniency vs colleagues rating the same students; straight-lining detection.
6. **Response tracker** — guardians not yet responded (with mobile, copy-list for WhatsApp), class + subject coverage for T1 (no fixed teacher assignments), unverified and duplicate-flagged submissions.

Statistics rules:
- Always show n. Grey out **aggregates** with n < 3 (never applies to a single student's own guardian response).
- Show mean **and** % at the top mark (১০). G2 also shows raw option counts.
- N/A answers are excluded from numerator and denominator; per-question n is shown so an area resting on fewer questions is visible.
- **Guardian ↔ teacher area comparisons** use a normalised 0–100 score `(mark − 4) / 6 × 100` (G2 and T1 have different mark granularity), and gaps are shown in bands (e.g. ≥ 33 points = ≥ 2 marks).
- **Teacher leniency** = paired mean difference vs other teachers on the same students in the same round. **Straight-lining** = ≥ 90% identical marks across ≥ 10 students in one batch.
- **Δ vs comparison round** is computed on the cohort of students present in both rounds.
- **T1 coverage** (no fixed assignments) = class × subject pairs with at least one submitted batch; guardian response rate = students with a current G1/G2 submission ÷ active students.
- Flags (thresholds editable): drop ≥ X vs previous round, ≥ 2 teachers at ৪ on the same student, guardian–teacher area gap band ≥ Y.

Trends appear from the second round. Every table exports to Excel; every page prints to PDF.

## 8. Security & privacy

"Not too secure" by design, but: unguessable link keys, `noindex`, server-side expiry, rate limiting on identity lookup (per IP **and** per looked-up value; T1 teacher-ID lookup 60 per 10 min per IP, sized for a staff meeting on the school's one IP) and on submit, lookups logged, lookup returns only child name + class (never other guardian data), no phone numbers on any public page, admin routes behind Basic Auth. Drafts record IP / user agent / last-edited time, shown in the tracker. Respondents' mobile numbers are stored for verification and follow-up only.

## 9. Build phases

1. **T1 (urgent)** — Postgres + schema, Sanity templates/rounds/classes/teachers, "Open round" action, ERP student import with dry-run, teacher flow, receipt, Sheet mirror + nightly backup, response tracker (class × subject coverage + duplicates + drafts). Excel export can follow in phase 2 since the Sheet mirror already gives a spreadsheet.
2. **G2 + G1** — guardian identity flow (student ID / mobile, verification), both surveys.
3. **Reporting** — overview, heatmap, class, student profile, teacher patterns, trends, flags.

Mockups (survey screens, then reports) precede each phase's build. Current mockups: [`survey-mockups/`](survey-mockups/README.md).

## 9a. UX states (from design review, 2026-10-04)

Designed in the mockups and required in the build: lookup not found (in this class) with *change class* / *search by ID* actions and office contact; lookup loading and rate-limited; siblings/twins on one number; unverified explanation; relation *অন্যান্য* with free text; autosave chip (saved / saving / offline) and offline banner; review blocks submit while marks are missing and links to each gap; submit pending (double-tap guard), failed, duplicate re-check at submit, round closed during review (10-minute grace, then drafts kept); link not yet open / invalid; teacher name missing from list. Rating screens keep the question and hint pinned while scrolling; mark buttons are a radio group (≥ 48 px tall); review cells are tappable to edit in place. Reports use marks (/১০) as the primary unit and the 0–100 score only in guardian↔teacher comparisons; trend axes start at the scale floor; heatmap cells show n; aggregates with n < 3 are greyed; first-round state hides trends and comparison. Guardian reminders are one message per guardian (never a group list).

## 10. Implementation notes

- Survey routes live outside the `/[locale]` tree (root layout falls back to `bengali` via `src/lib/i18n.ts`). In `src/proxy.ts`, keep `/survey` and `/admin` **matched** and branch inside `proxy()` like the existing `/studio` block: `/admin` → Basic Auth check then `NextResponse.next()`; `/survey` → `NextResponse.next()` with the `bengali` locale header. Neither goes through `intlMiddleware`.
- Admin pages and GET exports use `isValidStudioAuthorization` directly; `isAuthorizedStudioAdminRequest` requires an `Origin` header (only sent on fetch/POST), so use it for mutating admin APIs only.
- Sheet mirror: a **new server-only module** that reuses only the service-account setup from `src/app/api/submit-form/route.ts`, reading `SURVEY_SHEET_ID` from env. Do **not** use `src/lib/google-sheets.ts` (a client wrapper that posts an arbitrary `spreadsheetId`).
- T1 autosave: debounced; changed student rows are POSTed together (`/api/survey/{roundId}/draft`).
- `cacheComponents` stays off (see CLAUDE.md); survey and report routes are dynamic.
- New env: `DATABASE_URL`, `SURVEY_SHEET_ID`.

## 11. Resolved review questions (2026-10-04)

1. **Teacher PIN** — not in this version. Teachers type their ERP ID instead of picking a name (decided 2026-10-05): every teacher has one on their ID card and colleagues rarely know each other's. It is not a secret (IDs are sequential), so it stops mistaken or casual use of a colleague's name, not a determined colleague; per-teacher links would be the next step if that ever matters.
2. **Guardian lookup** — class first, then student ID or mobile (see §2.3).
3. **N/A in T1** — no; all T1 questions use ১০/৮/৬/৪ only.
4. **ERP format** — taken from the ERP student list (see §6 ERP import). The exact export file's headers are confirmed on first import via the dry-run preview.
