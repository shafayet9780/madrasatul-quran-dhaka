# Pre-admission 2027 — design spec

Status: **DRAFT — decisions agreed with the owner 2026-10-07; mockups in review:** https://claude.ai/artifact/YNFRWPUJiTvhJRrTzW1Myb (private until shared). Build starts only after the mockups are approved (same process as `docs/survey-mockups/`).

## Goals

1. Rebuilt pre-admission form page — a calm, phone-first, bilingual step-by-step flow.
2. After submission the guardian downloads a printable PDF slip to bring to the interview.
3. Confirmation shows a WhatsApp group QR + link where later updates (interview slots, results) are posted.
4. Application fee **৳500**, paid online through SSLCommerz (existing merchant).
5. Evaluation fee **৳500** is announced (intro, review step, confirmation, PDF), paid **in cash on evaluation day**; staff mark it received in admin.
6. Applications are stored in Neon Postgres and managed from `/admin` (view, mark status, export for ERP). The Google Sheet keeps receiving a best-effort copy.

## Decisions (owner, 2026-10-07)

| Topic | Decision |
|---|---|
| Payment timing | Fill first, then pay. The form is saved as **unpaid**; payment confirms it. Failed/abandoned payment loses nothing — a retry link resumes payment. |
| Gateway charge | School absorbs it. Guardian pays exactly ৳500. |
| Interview schedule | Not on the form or PDF. Announced in the WhatsApp group by **application ID** ranges. |
| Form fields | **All fields stay in Sanity** (editable without a developer). ERP mapping happens at export. |
| Application ID | **Class code + per-class serial**, e.g. `KG-017`, `N-042`. Class codes set in Sanity. Assigned when payment is confirmed, so unpaid applications never consume a number. |
| WhatsApp | **One group** for everyone; link set in Sanity, QR generated from it. |
| Evaluation fee | Cash on evaluation day; staff mark "received" in admin (scanning the PDF's QR opens the record). |
| Confirmation message | **Email** (transactional provider, e.g. Resend) with ID, link and the PDF attached. No SMS. |
| Visual design | Public site brand (colours, header, footer) + the survey's proven interaction patterns (progress line, big targets, tinted selection). Mockups first. |
| Google Sheet | Keep a best-effort copy of paid applications (and later status changes), reusing the survey mirror pattern with daily retry. |
| Closing | Deadline date/time in Sanity closes the form automatically (countdown in the final days). The existing enable toggle stays. |
| Form layout | A form, not a survey: start page (mobile + email), then one page per chapter (~7) with labelled field groups and compact controls, checklist hub, review. |
| Unpaid applications | Kept; listed separately in admin with phone numbers for follow-up; **deleted manually** by staff (data + documents). |

Defaults taken (change if needed): the application fee is non-refundable and says so before payment; a double charge is refunded manually via the SSLCommerz panel. Admin stays on the shared Studio Basic Auth, so the activity log records *what/when*, not *who*.

## Guardian flow

1. **Intro** (`/[locale]/pre-admission`) — session (2027), classes, what to have ready (photos, birth certificate), ~15 minutes, ৳500 application fee (non-refundable) + ৳500 evaluation fee (cash, evaluation day), timeline (apply → pay → slip → WhatsApp for slot → evaluation → result), deadline countdown, FAQ, "Continue my application".
2. **Start** — one short page asking the guardian's mobile and email (the fields with roles `primaryMobile` / `email`, wherever they sit in Sanity; not asked again later). Creates the draft, so autosave, the resume link and office follow-up work from the first minute.
3. **Chapters** — a **form, not a survey**: one page per Sanity section (~7 pages: Student, Father, Mother, Family, Contact, Documents, as configured), then **Review** with the declaration.
   - **Checklist hub** as home: each chapter shows Not started / In progress / Done; first time through it guides in order, afterwards any chapter can be reopened. Review unlocks when all required fields are done.
   - Inside a page, fields sit in **labelled groups** (e.g. Father: Basic information · Occupation · Religious practice · Family and media). Choices use compact radio buttons, checkboxes and dropdowns, not large cards. Two columns on desktop where paired (Bengali/English name); one column on phones.
   - Thin progress line + chapter title at the top; sticky bottom bar with "Saved ✓" and Next. Back never loses data.
   - Conditional fields appear only when relevant (Sanity "show when").
   - Server autosave (draft in Postgres) + local copy; the resume link (token) is shown and emailed from the start page.
   - Validation when a field is left, not while typing; on Next, the page scrolls to the first problem with a short summary. Bengali digits normalised (`০১৭…` → `017…`); Bangladeshi mobile check (`+880` fixed, number keypad); email typo hint (`gmial.com`); date of birth asked before class, with classes that fit the child's age highlighted (warning, not a block, unless the office sets a hard range).
   - Photos open the camera with a passport-style frame; compressed/resized on the device before upload (phone photos are 3–5 MB; the limit stays small). Birth certificate as image or PDF.
   - Duplicate guard: same child name + DOB + guardian mobile in this cycle → "you already applied (KG-017)" with a link to find it.
4. **Pay** — summary (৳500, non-refundable; evaluation fee later in cash) → SSLCommerz hosted checkout (bKash, Nagad, cards, net banking).
5. **Confirmation** — application ID large, "Download slip (PDF)", WhatsApp QR + "Join group" button, email notice, what happens next, evaluation-fee reminder.
6. **Find my application** — application ID *or* guardian mobile (unpaid applications have no ID yet), verified with the child's date of birth → every matching application (one mobile may cover siblings): download the slip again, or continue / pay an unpaid one. Rate-limited (Postgres limiter from the survey).

Bilingual throughout (`bengali` / `english` locales); Bengali numerals in Bengali UI. Accessibility checked with axe in e2e.

## Sanity changes (`preAdmissionForm`)

- **Field role** (optional, per field): `studentNameBn`, `studentNameEn`, `dateOfBirth`, `classApplied`, `studentPhoto`, `birthCertificate`, `fatherName`, `motherName`, `primaryMobile`, `secondaryMobile`, `email`, `address`. Validation blocks publishing unless each required role (student name, DOB, class, primary mobile, email, student photo) is assigned exactly once. Roles drive the PDF, admin list/search, ID, duplicate guard, SSLCommerz customer fields and the email. Everything else is stored as-is.
- **Class options**: add short `code` (e.g. `KG`) and optional age range.
- **Cycle settings**: session label (2027), application fee (৳500), evaluation fee text/amount, opens-at / closes-at (deadline), WhatsApp group link, slip instructions ("bring this slip, original birth certificate…"), fee/refund note, confirmation text.
- **Field groups**: within a section, fields can be grouped under a heading (rendered as a labelled group on the page); optional "pair" hint puts two fields side by side on desktop.
- **Conditional show/hide** (optional per field: "show when field X = value") — e.g. transport area only if transport matters.

The fee amount is read on the server only; the browser never sends a price.

## Data (Postgres, Drizzle — new migration)

- `admission_cycles` — `id`, `label`, `snapshot` (frozen form config incl. labels/options/roles, taken when the cycle opens or the form is republished; each application stores the snapshot version it was answered against), `fee_amount`, `opens_at`, `closes_at`, `whatsapp_url`.
- `applications` — `id` (uuid), `cycle_id`, `public_ref` (application ID, unique per cycle, null until paid), `class_code`, `serial`, `status`, role columns (names, DOB, class, mobiles, email), `answers` jsonb (all fields by `fieldName`), `documents` jsonb (private storage keys), `resume_token_hash`, `locale`, attribution, `submitted_at`, `paid_at`, `eval_fee_received_at`, `created_at`, `updated_at`. Indexes on mobiles, names, status, class.
- `application_serials` — per cycle + class counter, incremented in the same transaction that confirms payment.
- `payments` — one row per attempt: `tran_id` (unique, server-generated), `application_id`, amount, currency, `status` (initiated / valid / failed / cancelled / risk), `val_id`, `bank_tran_id`, `card_type`, raw validation response, timestamps.
- `application_events` — status changes, notes, eval-fee marks, deletions (append-only log).
- Reuses `rate_limits`.

**Status pipeline:** `draft` → `unpaid` (submitted, awaiting payment) → `paid` → `interview` → `evaluated` → `admitted` / `waitlisted` / `not_selected` → `sent_to_erp`. Evaluation fee received and attendance are flags, not statuses.

## Payments (SSLCommerz)

- `POST /api/admissions/pay` — server creates a `payments` row with a fresh `tran_id`, calls the session API (`gwprocess/v4/api.php`) with the server-side amount and success/fail/cancel/IPN URLs, redirects to `GatewayPageURL`.
- **Confirmation only by validation**: IPN (`/api/admissions/ipn`) and the browser's success return both call one idempotent `confirmPayment(val_id)` that calls the Order Validation API and requires `status ∈ {VALID, VALIDATED}`, matching `tran_id`, `amount`, `currency = BDT`, and our store. Only then: payment → valid, application → `paid`, serial assigned, email queued, Sheet mirror queued. Risk-flagged payments are held for staff review.
- **Reconciliation**: the daily cron (`survey-daily` pattern) queries SSLCommerz by `tran_id` for payments still `initiated` after 30 min — catches bKash/Nagad payments whose browser never came back.
- Double payment guarded: a paid application cannot start a new payment; a second valid payment is flagged for refund.
- Sandbox store on previews/local; live store only on the production domain (SSLCommerz is domain-bound). Env: `SSLCOMMERZ_STORE_ID`, `SSLCOMMERZ_STORE_PASSWORD`, `SSLCOMMERZ_SANDBOX`.

## Documents (privacy fix)

Today `/api/upload` writes children's photos and birth certificates to **public** Blob URLs named after the child. New uploads go to private storage with random keys, tied to a draft application, size/type-checked on the server; admin views them only through an authenticated `/admin` route; the slip embeds the photo server-side. Manual deletion removes the files too.

## PDF slip

- A4, one page: school header, session, **application ID** (large) + QR (opens the admin record for staff), student photo, student and guardian details, class, payment receipt (amount, transaction ID, method, date), evaluation-fee notice (৳500, cash on evaluation day), documents to bring, "slot will be announced in the WhatsApp group" + group QR.
- Rendered from an HTML print page with headless Chromium (`@sparticuz/chromium`) — common React PDF libraries break Bengali conjuncts, which is unacceptable for a child's name. Generated after payment, stored, and served from the confirmation page, Find-my-application, the email and admin. The HTML print page doubles as a fallback.

## Email

Transactional provider (Resend or similar; needs a verified sending domain). One email after payment: ID, slip PDF attached, WhatsApp link, Find-my-application link. Resume-link email for drafts. Best-effort with retry from the daily cron; failure never blocks confirmation.

## Admin (`/admin/admissions`, new sidebar section)

- **Overview** — paid per class, unpaid count, daily trend, "how did you hear", eval fees collected.
- **Applications** — table (ID, child, class, guardian mobile, status, paid date, eval fee), filters (class, status, date), search (ID, name, mobile), bulk status change.
- **Unpaid** — separate list with phone numbers for follow-up; manual delete (with confirmation; removes data and documents).
- **Detail** — all answers rendered from the snapshot, photo + birth-certificate viewer, payment record, status control, eval-fee received, attended, internal notes, activity log, print slip.
- **QR scan** on evaluation day — the slip QR opens the detail page to mark attendance and fee.
- **Export** — Excel (exceljs) with one column per Sanity field (labels from the snapshot) + role columns + status/payment; ERP mapping is applied on import.
- All mutations are server actions calling `assertAdmin()`.

## Also included (suggested)

Deadline countdown; resume links; duplicate guard; age-vs-class hint; on-device photo compression; funnel analytics (step reached → pay started → paid); unpaid follow-up list; QR check-in on evaluation day; privacy fix for documents.

## Inputs needed before go-live

SSLCommerz sandbox + live credentials (set in Vercel env, not in chat) and IPN URL whitelisting for the production domain; email sending domain; class codes + age ranges; WhatsApp group link; deadline; slip instructions and refund wording; ERP import template (for the export layout).

## Delivery plan

1. **Mockups** (canvas, phone + desktop): intro, start page, checklist hub, a chapter page (Father, phone + desktop), documents page, review, pay summary, confirmation, find-my-application, PDF slip, admin overview/list/detail → owner approval, then lock.
2. Sanity schema (roles, class codes, cycle settings, conditions) + Postgres migration + private uploads + draft autosave API → unit + db tests.
3. Guardian step-by-step UI → e2e + axe.
4. SSLCommerz integration (sandbox) + confirmation + reconciliation cron → db tests with simulated validation responses; full sandbox run.
5. PDF slip + email + Find my application.
6. Admin section + Sheet mirror + export.
7. Go-live checklist: live store, domain, IPN, test ৳500 payment and refund, deadline set, enable.
