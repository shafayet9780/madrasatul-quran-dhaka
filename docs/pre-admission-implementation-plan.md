# Pre-admission 2027 — Implementation Plan

Status: **M1 to M4 done** (2026-10-07); M3 waits for the SSLCommerz sandbox credentials for a real sandbox run, M4 for the private Blob store and Resend (both work in the local preview). Next M5 (admin). Database tests run against in-memory Postgres (PGlite, all migrations applied) in the normal `pnpm test`; `pnpm test:db` against the Neon dev branch is still available.
Inputs: [`pre-admission-2027.md`](pre-admission-2027.md) (spec) · [`pre-admission-mockups/`](pre-admission-mockups/README.md) (prototype + design language, locked)

## 1. Decisions (planning interview, 2026-10-07)

| Topic | Decision |
|---|---|
| Admin layout | Both modules move into one shadcn shell now (sidebar with the ভর্তি / জরিপ switcher, header). Survey page bodies keep their current styling and are restyled in a later pass. |
| Sanity content | A setup script writes **drafts only** (roles, groups, class codes, 2027 settings); the owner reviews and publishes in Studio. Same pattern as `pnpm setup:fees`. |
| Email | **Resend**, installed through the Vercel Marketplace (auto-provisioned key, Vercel billing), sending from the school domain. Free tier: 3,000 a month, 100 a day. |
| Dark mode | Light only for now. Dark tokens are defined so it can be switched on site-wide later. |
| Hosting | Vercel **Hobby**. Hobby is for non-commercial use; moving to Pro before real payments is on the go-live checklist. Built to fit Hobby limits either way. |
| Sheet copy | New tab **ভর্তি ২০২৭** in the existing pre-admission spreadsheet (`FORM_GOOGLE_SHEETS_ID`). Old rows untouched. |
| Old form | The single-page form, `/api/submit-form` and the public `/api/upload` route are removed at go-live. |
| Documents | A separate **private** Vercel Blob store (`@vercel/blob` `access: 'private'`); files are served only through an authenticated admin route. |

## 2. Technical choices

- **UI kit:** shadcn/ui (Tailwind v4, Radix primitives) copied into `src/components/shadcn/` (the existing `src/components/ui/` is the public site's and stays untouched). Icons: `lucide-react` (already installed). Tokens from the locked design language, scoped to admissions and admin routes with an `.adm` theme class so the public site does not change.
- **Forms:** the form is rendered from the cycle's **frozen form snapshot** (Sanity config copied into Postgres when the cycle is opened or republished). One validator, built from the snapshot with `zod`, runs on the client (inline errors) and on the server (draft save, submit).
- **DB:** Drizzle + Neon HTTP driver (no interactive transactions). Multi-row writes use `db.batch`; the application-ID serial is assigned in **one SQL statement** (CTE that increments the per-class counter and stamps the application only if it has no ID yet). New tables live in `src/lib/admissions/schema.ts`; `drizzle.config.ts` lists both schema files and migrations stay in `drizzle/`.
- **Drafts and identity:** the start page creates a draft and a random resume token (stored hashed). The token lives in an httpOnly cookie and in the emailed resume link. Lookup by ID or mobile + child's date of birth, rate-limited with the existing Postgres limiter.
- **Uploads:** client-side resize/compress (canvas, no library) to ≤ 500 KB JPEG; server re-checks type and size and writes to the private store under a random key tied to the draft.
- **Payments:** SSLCommerz hosted checkout. Amount and `tran_id` are server-side only. One idempotent `confirmPayment(valId)` (Order Validation API: status VALID/VALIDATED, matching amount, currency BDT, store) is called from the IPN, the browser return and reconciliation. Reconciliation runs in the daily cron and whenever a guardian opens "Find my application" or the confirmation page with a pending payment.
- **PDF:** a print-styled HTML route rendered by `puppeteer-core` + `@sparticuz/chromium-min` (binary fetched at runtime, so the function stays small on Hobby). Rendered on first request after payment and stored in the private Blob store.
- **Email:** `resend` SDK behind a small `sendMail()` module; failures are logged and retried by the daily cron, never blocking the guardian.
- **QR codes:** `qrcode` package, rendered server-side as SVG.
- **Cron:** Hobby allows two jobs and both exist. Admissions work (payment reconciliation, Sheet-copy retry, email retry) is added to the existing daily job, which is renamed to cover both.

## 3. Code layout

```
src/app/[locale]/pre-admission/page.tsx                 # intro (server)
src/app/[locale]/pre-admission/start/page.tsx           # mobile + email → draft
src/app/[locale]/pre-admission/form/page.tsx            # chapter checklist (hub)
src/app/[locale]/pre-admission/form/[chapter]/page.tsx  # one chapter page (client renderer)
src/app/[locale]/pre-admission/review/page.tsx          # review, fee, declaration → pay
src/app/[locale]/pre-admission/status/page.tsx          # confirmation / payment failed / pending
src/app/[locale]/pre-admission/find/page.tsx            # find my application
src/app/[locale]/pre-admission/resume/route.ts          # resume link → cookie → redirect
src/app/api/admissions/draft/route.ts                   # create / autosave / load draft
src/app/api/admissions/upload/route.ts                  # private document upload
src/app/api/admissions/pay/route.ts                     # start SSLCommerz session
src/app/api/admissions/sslcommerz/{ipn,success,fail,cancel}/route.ts
src/app/api/admissions/pdf/[id]/route.ts                # application PDF (guardian cookie or admin)
src/app/admissions-print/[id]/page.tsx                  # print HTML the PDF renderer loads (signed URL)
src/app/admin/(shell)/…                                 # shared shadcn shell; survey pages move under it
src/app/admin/admissions/{page,list,[id]}/…             # overview, list, detail (+ actions.ts)
src/app/admin/admissions/files/[key]/route.ts           # private document proxy (admin only)
src/lib/admissions/                                     # schema, db, snapshot, validate, normalise, ids, payments, pdf, mail, sheets
src/components/shadcn/                                  # shadcn components (owned code)
sanity/schemas/preAdmissionForm.ts                      # + roles, groups, conditions, class codes, cycle settings
scripts/setup-admissions.ts                             # drafts-only Sanity setup (pnpm setup:admissions)
```

## 4. Milestones

### M0 — Environment (owner, guided)
- Create a **private** Blob store and connect it to the project (`ADMISSIONS_BLOB_READ_WRITE_TOKEN`).
- Install **Resend** from the Vercel Marketplace; verify the school domain (3 DNS records).
- SSLCommerz **sandbox** store (free sign-up) → `SSLCOMMERZ_STORE_ID`, `SSLCOMMERZ_STORE_PASSWORD`, `SSLCOMMERZ_SANDBOX=true` for Preview and Development.
- Neon: already connected (survey); admissions tables arrive by migration.

### M1 — Foundation (no visible change to the public site)
1. Install shadcn into `src/components/shadcn/` with the admissions tokens; add the base components (button, input, label, radio-group, checkbox, switch, badge, card, separator, alert, tabs, dropdown-menu, dialog, table, tooltip, progress, sonner). → verify: `pnpm lint`, `pnpm build`.
2. Sanity schema: field **role**, field **group** (per section, with titles), **show-when** condition, class option **code** + age range, **cycle settings** (session label, fees, opens/closes, WhatsApp link, PDF instructions, refund note); Studio validation that each required role is assigned once. → verify: schema unit tests, Studio builds.
3. Pure modules with unit tests: Bengali-digit and BD-mobile normalisation, email typo hint, age at session start + class fit, application ID format, form snapshot builder, snapshot → zod validator, show-when evaluation. → verify: `pnpm test`.
4. Postgres schema + migration: `admission_cycles`, `applications`, `application_serials`, `payments`, `application_events`. → verify: `pnpm db:generate`, migration applies on the Neon dev branch, `pnpm test:db`.
5. Server modules: open/refresh cycle snapshot, create draft (+ resume token), autosave (validated against the snapshot, partial allowed), load by token, duplicate guard, private upload. → verify: db tests.
6. `scripts/setup-admissions.ts` (drafts only) to assign roles, groups and class codes in the existing form document and fill 2027 settings placeholders. → verify: dry run prints the plan; runs only with an explicit flag.
   Done as `pnpm setup:admissions` (dry run) / `pnpm setup:admissions --write`: converts the current questions into the five chapters (the "how did you hear" question opens অতিরিক্ত তথ্য), turns the old Yes/No questions that have options (e.g. ৫ ওয়াক্ত সালাত) into single-choice, and never overwrites existing 2027 chapters.

### M2 — Guardian pages
Intro, start, hub, chapter renderer (all Sanity field types, groups, show-when, uploads with compression and camera), review + declaration, light theme, Bengali/English. → verify: Playwright flow on phone and desktop viewports, axe checks, autosave/resume test.
   Done. `pnpm test:e2e:admissions` runs the flow against the **local preview** (`ADMISSIONS_LOCAL=1`, never on Vercel: in-memory Postgres, the converted live form, in-memory file store; the rest of the site renders without Sanity). `ADMISSIONS_LOCAL=1 pnpm dev` gives the same preview for trying the form. Until M3 the review page submits the application (status `unpaid`) and the status page says online payment opens soon. Find my application (linked from the intro and start pages) arrives in M4.

### M3 — Payments
SSLCommerz client (session, validation, transaction query), pay route, IPN and browser returns, idempotent confirmation with serial assignment, double-payment guard, reconciliation (cron + on lookup), payment-failed and pending states. → verify: db tests with recorded sandbox responses, a full sandbox run.
   Built (sandbox run pending credentials):
   - `src/lib/admissions/sslcommerz.ts`: v4 hosted checkout (session `gwprocess/v4/api.php`, validation `validationserverAPI.php`, query `merchantTransIDvalidationAPI.php`, IPN signature), endpoints and fields taken from the official sslcommerz-lts and SSLCommerz-Laravel libraries (the developer site is not reachable from the build machine).
   - `src/lib/admissions/payments.ts`: a payment counts only after the validation API confirms our tran_id, the exact amount and BDT; risk_level 1 or a mismatch is **held** for the office; the ID is assigned in one statement with a row lock (IPN and browser return can race); fail/cancel returns are re-checked with a transaction query; a second valid payment is logged as `double_payment` (refund from the SSLCommerz panel); attempts left open are settled or closed by the status page and the daily cron (`/api/cron/survey-daily`, 25 s budget).
   - Routes: `POST /api/admissions/sslcommerz/{success,fail,cancel,ipn}`; `ipn_url` is sent with every session, so the merchant panel needs no IPN setting (setting the same URL there does no harm).
   - Status page states: due (pay), failed (retry), pending (check again), held (office review), paid (ID, the two tasks with WhatsApp link and QR, what to bring, receipt). The PDF task shows "being prepared" until M4.
   - Local preview without credentials uses a stand-in checkout page (`/api/admissions/sslcommerz/mock`); with `SSLCOMMERZ_*` set it uses the real sandbox.
   - **Sandbox run checklist** (when credentials arrive): set `SSLCOMMERZ_STORE_ID`, `SSLCOMMERZ_STORE_PASSWORD`, `SSLCOMMERZ_SANDBOX=true` for Preview (and locally in `.env.local`); pay on a Preview deployment with the sandbox's test card and test mobile wallet; check each outcome: success (ID shown), fail and cancel (retry works), closing the tab mid-payment (status page and cron settle it), IPN received (Vercel logs `Admissions: IPN`), and the transaction in the sandbox panel.

### M4 — PDF, email, find, confirmation
Print page (3 pages A4, Bengali shaping checked), Chromium renderer + private storage, confirmation page with the two tasks, email with attachment and resume email, Find my application. → verify: PDF snapshot check, email sent in sandbox, lookup rate limits.
   Built:
   - **PDF** (`pdf-html.ts`, `pdf.ts`): one HTML document printed by headless Chromium (no print route or signed URL: the HTML is set directly, so Vercel deployment protection is no obstacle). Fonts (Noto Sans Bengali, Inter from `@fontsource`), photos (read from the private store) and QR codes (staff: `/admin/admissions/<id>`, WhatsApp group) are embedded. Always Bengali (the office's copy). Page 1: header, print banner, ID, photo, staff QR, student chapter (with age at session start), receipt, evaluation-day box; then the other chapters with a repeated header; the declaration and the office/evaluator section kept together; footer with ID, name and page N / M. The live form prints on exactly 3 pages (checked by `pdf.chromium.test.ts` with poppler; the shaped Bengali was checked visually).
   - Chromium: local executable in development (auto-detected or `CHROMIUM_EXECUTABLE_PATH`), `@sparticuz/chromium-min` on Vercel (pack downloaded once per instance from the Sparticuz GitHub release, `CHROMIUM_PACK_URL` to override). Stored once per application (`admissions/<id>/application-<ID>.pdf`, `pdf_key`); `GET /api/admissions/pdf` for the guardian.
   - **Email** (`mail.ts`, Resend): resume link when an application starts (after the response); confirmation with the ID, WhatsApp link and the PDF attached when payment is confirmed (after the response; retried by the daily job, 15 s budget). Sender `ADMISSIONS_EMAIL_FROM` (default `admissions@madrasatulquranbd.com`, must be on the domain verified in Resend). The hub says where the link was sent.
   - **Find my application**: ID or guardian mobile + child's date of birth; rate-limited per IP (30 / 10 min) and per ID or number (8 / 10 min); results show paid (download PDF, open the confirmation, WhatsApp), fee due (pay, edit) or unfinished (continue). Opening a result gives this device a signed 7-day access cookie (key `ADMISSIONS_SECRET`, else derived from `CRON_SECRET`), so the guardian's resume token, emailed link and other devices keep working.
   - Local preview: emails collected at `/api/admissions/dev/outbox`; the e2e flow downloads the PDF, checks both emails and finds the application from a second device.

### M5 — Admin
Shared shadcn shell (survey nav moves under জরিপ), overview, list (paid / fee pending, filters, search, bulk status, bulk PDF), detail (answers from snapshot, documents, payment, status, evaluation-day switches, notes, activity log), delete unpaid (data + files), Excel export, QR check-in, Sheet copy to the ভর্তি ২০২৭ tab with retry. → verify: e2e for admin flows, `assertAdmin()` on every action.

### M6 — Hardening and go-live
Remove the old form, `/api/submit-form` and `/api/upload`; security review; admin guide (`docs/pre-admission-admin-guide.md`); sandbox end-to-end; go-live checklist (Pro plan, live SSLCommerz store and IPN, Resend domain, deadline, enable form, test ৳500 payment and refund).

## 5. Needed from the owner
- M0 items above (private Blob store, Resend + DNS, SSLCommerz sandbox). `CRON_SECRET` is already set for the survey; Find uses it unless `ADMISSIONS_SECRET` is set.
- Before go-live: live SSLCommerz credentials, class codes and age ranges, WhatsApp group link, deadline, logo file, PDF instructions and refund wording, ERP import template, decision on Vercel Pro.

## 6. Out of scope for this phase
Online evaluation-fee payment, SMS, interview slot booking, merit lists, ERP push (export only), restyling survey page bodies.
