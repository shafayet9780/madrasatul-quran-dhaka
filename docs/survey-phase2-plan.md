# Survey System — Implementation Plan (Phase 2: guardian surveys G1/G2 + guardian reports)

Status: **reviewed twice, owner decisions folded in; ready to build** (2026-10-05). Phase 1 (T1 + T1 reports) is live; see [`survey-implementation-plan.md`](survey-implementation-plan.md) for its plan, build notes and leftovers.

Inputs: [`survey-system.md`](survey-system.md) (spec: §2.1 common flow, §2.3 G1, §2.4 G2, §3 areas, §5 receipt, §7 reports, §8 security, §9a UX states) · [`survey-mockups/`](survey-mockups/README.md) (locked "Bronze & Stone" design; guardian frames `G-*`, `G1-*`, `G2-*`, reports `R*`/`RM*`).

## 1. Decisions

| Topic | Decision |
|---|---|
| Links | G1 and G2 are **separate rounds with separate links**, shared separately (owner, 2026-10-05). The round model already supports this (one template per round). |
| G1 layout | Template setting `layout`: **one subject, all questions** (default, as in the school's form) or one question, all subjects (owner asked for both). Stored in the round snapshot JSON (no migration), so it cannot change mid-round. |
| Questions | Spec §2.3 (G1, 10 questions from the school's current form) and §2.4 (G2). |
| Intro | As the locked `G-Intro` frame and spec §2.1: the school's amanat line (spelling fixed: `আমানতদারিতার`), the "only principal and admin see" line, legend `১০ = সবচেয়ে ভালো · ৪ = সন্তোষজনক নয়` (marks only, spec §1). |
| N/A in G1 | Off (the school's form has none). Per-question `allowNA` is accepted on G2 only; T1 and G1 templates are rejected with it (P4 review). |
| Receipts | As the locked `G1-Receipt` / `G2-Receipt` frames: receipt token page, "অন্য সন্তানের জন্য রিভিউ দিন" leads back to the round link (it carries the round key; acceptable, the link is sent to every guardian anyway). A correction is a new submission through the same link (`G2-Review`: "… পর্যন্ত সংশোধন করা যাবে"). |
| Second submission for the same child | **Newest counts**; the earlier one is kept but superseded; no duplicate flag (owner, 2026-10-05). **Before starting**, when the child already has a current submission in this round, the guardian sees a warning: `এই শিক্ষার্থীর জন্য ১২ অক্টোবর একটি রিভিউ জমা হয়েছে। নতুন রিভিউ জমা দিলে আগেরটির বদলে এটি গণ্য হবে।` with continue / go back. It shows only the date (never who submitted). The tracker lists children with more than one submission. |
| Tracker / reminders | **Per round** (owner): each round has its own tracker view; each reminder carries that round's link. |
| Pairing rounds in reports | **By dates, automatically** (owner, 2026-10-06): a report is for a teacher (T1) round; the G1 and G2 rounds whose open period overlaps it most are used with it (ties: nearest opening). A picker shows them and lets the admin choose others. |
| Guardian ↔ teacher in reports | Marks (/১০) stay the unit for averages and tables; the scatter, the area comparison bars and the student's "পার্থক্য" tile use the 0–100 score. The gap flag is the child's guardian (G2) and teacher (T1) averages ≥ 2 marks apart (`FLAGS.guardianTeacherGap`); an area chip shows ≥ 15 points (R3 frame). A drop flag compares with the child's latest earlier teacher round. "Class average" beside a child is the guardian and teacher class averages together. |
| Guardian print | One A4 page, marks only, no teacher names or notes. Strengths = up to 3 areas the child averages ৮+ in (guardian and teachers together); work = up to 3 below ৭. Trend: last 4 teacher rounds with their G2 rounds, axis from ৪. |
| Drafts | **On the phone only** (owner): answers stay on the device, keyed by round + student ERP ID and cleared on submit, so a second child on the same phone starts empty (a reload keeps them); no server drafts, no guardian draft list in the tracker; the save chip reads `এই ফোনে সংরক্ষিত`. Spec §4/§8/§9a amended. |

## 2. What already exists (phase 1)

- Schema: `survey_kind` G1/G2; `submissions.submitter_name/relation/mobile`, `verified`, `comment`; `responses.answers` JSON (G1 `{q: {subject: mark|'na'}}`, G2 `{q: optionKey}`); `answer_items.is_na`; `responses_guardian_current_uq` = one current guardian response per round + student (G1 keeps all subjects in that one response).
- Sanity template schema: kinds T1/G1/G2, question types `marks` / `options` with hidden marks (`spacedMarks`), `allowNA`, `commentLabel`, areas.
- Round lifecycle, receipt tokens, Sheet mirror (T1 only today: `isPending` filters `kind = 'T1'`), nightly backup, **per-IP** rate limits, ERP import (students + father/mother mobiles, foreign numbers), `fetchOfficePhone`, design components (mark track, chip radios, sheets, save chip, footer, desktop card).
- Reports, round picker and tracker filter `kind = 'T1'` today (`reports.ts`, `tracker.ts`, `listRounds`).

## 3. Milestones

Each milestone ends with its checks green, an independent review, fixes, a re-review and a commit on `survey-phase2`. No merge to `main` until the owner says so.

### P0 — Mockups for the changed screens
- **G1-Rate-BySubject** (phone + desktop): one subject per screen ("বিষয় ২/৫"), the 10 questions each with a mark track, hint readable on a phone, progress by subject; review grid subjects × questions.
- Frame changes that follow the §1 decisions: "already submitted" warning before starting (`G-Match`), tracker per guardian round without a draft list (`R6`), save chip `এই ফোনে সংরক্ষিত`.
**Check:** owner approves the frames before P4 (by-subject) and P5 (tracker). P1–P3 do not wait. **Done:** approved 2026-10-05 (canvas version 19).

### P1 — Templates, answers and configuration
- Template schema + snapshot: `layout` (G1; `by-subject` default / `by-question`).
- Answer values: `'na'` is the stored value for an `allowNA` question in G1 **and** G2. Replace the ambiguous `markFor` (undefined for both N/A and invalid; phase-1 leftover) with a `classifyAnswer` helper → `{ mark } | { na } | { invalid }`, unit-tested. `build-round` rejects `allowNA` on T1 and options without marks.
- Seed (`scripts/survey-seed.ts`, create-if-missing): G1 v1 (10 questions, hint on ৫, areas per spec §3) and G2 v1 (9 questions, option marks by the spacing rule, `allowNA` on ২ labelled প্রযোজ্য নয় (ডে কেয়ার)), intros, comment labels.
- Migration 0004: `answer_items.verified` (denormalised from the submission, like `teacher_key`, so the reports' verified-only filter needs no join) and the `survey_lookups` table (P2).
**Check:** unit tests (snapshot, validation, `classifyAnswer`, option scoring, N/A excluded); templates visible in Studio; a G1 and a G2 round open on the dev database.

### P2 — Guardian identity (shared by G1 and G2)
- Screens (`G-Intro`, `G-Class`, `G-Identify`, `G-Identify-Error`, `G-Match`, `G-Match-Unverified`): intro → class (+ section) → student ID **or** mobile → match (siblings in that class on one number → pick one) → submitter name, relation (বাবা / মা / অন্যান্য + free text, stored in `submitter_relation`, max 40 chars, printed on the receipt), mobile.
- `POST /api/survey/[roundId]/lookup`, behind `authorizeRound` (link key header): searches only active students of the chosen class/section; returns child name + class + erp ID only (never guardian names or mobiles). "ID in another class" and "no such ID" return the same not-found body.
- Rate limits, new action `guardianLookup` (separate from the T1 teacher lookup): per IP 300 / 10 min (guardians arrive from mobile carriers behind shared IPs) and per looked-up value (normalised ID or mobile) 10 / 10 min. Spec §2.3 already accepts that a guess reveals at most one class's children, so there is no per-class limit.
- `survey_lookups` (for investigating abuse in the database only; nothing in the UI shows it): round, class, kind (id/mobile), matched erp IDs, the last 4 digits of the normalised input (never the full mobile), IP, time. Pruned after 90 days by the daily cron; left out of the Blob backup.
- Verification (`G-Match-Unverified`): the submit route — not the client, not the lookup — re-checks that the student is active and in the chosen class/section and computes `verified` = submitter mobile equals the student's father or mother mobile (normalised, foreign numbers included). Any client-sent `verified` is ignored.
- The match step returns, **per matched child**, the date of a current submission in this round (date only) for the warning in §1 — with twins it shows which one is still pending. Someone who knows a child's class and ID can learn that the child's guardian has answered and when; nothing about who.
- States from spec §9a: not found in this class (change class / search by ID / office contact), loading, rate-limited, siblings, unverified, round closed / not open / invalid link.
**Check:** route tests (link key required, class scoping, identical not-found, per-value limit, nothing but name/class/date returned, log keeps last 4 digits only); unit tests for verification; e2e: ID path, mobile path with twins, not-found, unverified; axe on each screen.

### P3 — G2 flow
- One question per screen with descriptive options (`G2-Question`, desktop `G2-Question-Desktop`), day-care N/A on ২ (`G2-DayCare`), comment, review (`G2-Review`), submit, receipt (`G2-Receipt`).
- Submit (one `db.batch`, as T1): validate complete (N/A only where allowed), apply the §1 rule for a second submission, supersede the earlier current response (clear `is_current`, set `superseded_by`, delete its `answer_items`) before inserting the new one, write `answer_items` with option marks + `verified`, requeue the Sheet copy, issue the receipt token.
- Concurrent submits for the same child (double tap, two tabs, two parents): catch the unique-index violation (23505) on `responses_guardian_current_uq`, re-read the current submission and retry the supersede once; a double tap from the same device returns the existing receipt.
- Receipt of a superseded submission: says it was replaced; links to the newer receipt **only** when the newer submission has the same submitter mobile (as T1 links only to the same teacher), so one guardian never sees another person's answers.
**Check:** unit tests (submit, supersede, race, N/A excluded from scores); e2e full flow phone + desktop, reload keeps answers, resubmit replaces; axe.

### P4 — G1 flow
- By-subject (default, P0 frames) and by-question (`G1-Rate`, `G1-Rate-Desktop`) on one data model; review grid (`G1-Review`) with tap-to-edit; comment; submit (as P3); receipt (`G1-Receipt`).
- Play has one subject (সব বিষয়): both layouts become one screen of questions.
**Check:** unit tests (G1 answer items per subject); e2e both layouts, Play, review edits; axe.

### P5 — Tracker, Sheet copy, backup (before any real guardian round opens)
- Tracker for guardian rounds, per round (§1): response rate by class; students without a current response with guardian mobile and a **per-guardian** reminder to copy (never a group list); unverified submissions; students with more than one submission this round (submitter name, relation, verified, time).
- Sheet copy: flip `isPending` to include G1/G2; one tab per round; G2 one row per student, G1 one row per student × subject; columns include submitter name, relation, mobile (admin-only sheet, spec §8), verified, status as T1.
- Widen `listRounds` / RoundPicker / tracker queries beyond `kind = 'T1'`.
- Consolidate the phase-1 leftover "current / superseded / set aside" logic (derived in three places) now that guardians add more; draft-progress consolidation stays T1-only.
**Check:** db tests for tracker queries; Sheet rows in a test spreadsheet; e2e tracker.

### P6 — Guardian reports (in two reviewed parts: P6a data + overview + teaching quality; P6b class, student, guardian print)
- Overview (`R1`/`RM1`): KPI tiles, response progress, class × subject heatmap, needs-attention list.
- Teaching quality (`R2`/`RM2`): G1 class × subject heatmap (mean, % at ১০, n), drill-down to per-question distribution (with per-question n) and responses.
- Class (`R3`): guardian average beside teacher average, gap, guardian-vs-teacher scatter.
- Student (`R4`): guardian column per area, G2 option counts, guardian responses with verification; **guardian print** (A4, `R4-Print-Guardian`: no teacher names, no notes).
- Filters: round, compare-with round, class, subject, verified-only (via `answer_items.verified`). Widen `reports.ts` beyond `kind = 'T1'`. Statistics rules from spec §7 (n < 3 grey, 0–100 only for guardian↔teacher, Δ on the shared cohort). Excel on every table; print on every page.
**Check:** unit tests for report maths; db tests for report queries; e2e per page + exports; Lighthouse a11y ≥ 95.

### P7 — Hardening and handover
- Abuse review of the public guardian endpoints, error/404 states, performance on a mid-range phone, docs (spec, admin guide: guardian rounds, reminders, reports), final whole-branch review.
**Check:** `pnpm lint`, `pnpm test`, `pnpm test:db`, `pnpm test:e2e`, `pnpm build` green; preview tested by the owner (and a guardian or two) before merge.

## 4. Needed from the owner

| Item | Needed by |
|---|---|
| Approve the P0 frames (done 2026-10-05) | P4, P5 |
| A guardian or two to try the preview | P7 |

## 5. Out of scope

Guardian SMS/WhatsApp sending (reminders are copied by the admin), guardian logins, anonymous responses (spec: nothing is anonymous), English UI.
