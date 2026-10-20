# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# General Guidelines

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:

- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:

- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:

- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

## 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:

- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:

```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

## Project

Bilingual (Bengali/English) marketing + CMS website for Madrasatul Quran, an Islamic school in Dhaka. Next.js 16 App Router (Turbopack default), React 19.3, Sanity v5 CMS, next-intl v4, Tailwind CSS v4, TypeScript.

**Package manager is pnpm** (`pnpm-lock.yaml`, `node_modules/.pnpm`). Use `pnpm`, not `npm` — installs with npm desync the lockfile.

## Commands

```bash
pnpm dev            # next dev (Turbopack)
pnpm build          # next build (Turbopack)
pnpm start          # serve production build
pnpm lint           # eslint
pnpm test           # vitest run (unit)
pnpm test:watch     # vitest watch
pnpm test:e2e       # playwright (builds + serves on port 3100)

# Google Sheets (paid applications are copied to the pre-admission sheet)
pnpm test:sheets    # verify Sheets credentials/connection
```

Tests: **Vitest** unit (`src/lib/*.test.ts`, jsdom; setup `vitest.setup.ts`) + **Playwright** route smoke (`e2e/`, `playwright.config.ts`). E2E serves on **port 3100** (3000 often occupied). One-off run: `pnpm exec playwright install chromium` first. Lint scope: eslint flat config (`eslint-config-next` 16, imported natively) ignores build output, `scripts/**` (Node CJS tooling) and `docs/**` (prototypes) — Next 16 removed `next lint`. The React Compiler rules (`react-hooks/set-state-in-effect`, `refs`, `purity`, `immutability`, `preserve-manual-memoization`) are warnings until older components are reworked; new code should pass them.

Sanity Studio served in-app at `/studio`.

Many `scripts/*.js` / `.ts` are one-shot Sanity data seeders (list and status in `scripts/README.md`). Run with `node` / `tsx`. Read the script before running — they write to the dataset in `.env.local` (`development`). **Datasets:** until the 2027 release the live site reads `development`; from the release on it reads `production`, and `development` serves previews and local work (`docs/studio-cleanup.md`).

## Architecture

### Routing & i18n
- Locales are `'bengali'` and `'english'` (literal segment values, **not** `bn`/`en`). Default `bengali`, `localePrefix: 'always'` — every page lives under `/[locale]/...`.
- `src/proxy.ts` runs `next-intl` middleware for all routes except `api`, `_next`, `studio`, sitemap/robots. It also gates `/studio` with optional basic auth (`STUDIO_AUTH_ENABLED`, `STUDIO_USERNAME`, `STUDIO_PASSWORD`). (Next 16 renamed the `middleware` convention to `proxy`; nodejs runtime only.)
- `src/lib/i18n.ts` is the next-intl request config; messages load from `messages/{locale}.json`.
- Pages: `src/app/[locale]/{about,admissions,campus,contact,curriculum,gallery,notices,pre-admission}` (`news` and `programs` only redirect: to the notice board, or home while it is off; to the curriculum). There is no `src/app/layout.tsx`: `src/app/[locale]/layout.tsx` is the public site's root layout (`<html lang>`, fonts, analytics, site/footer settings fetched server-side and passed as props into the (client) `MainLayout` — don't import the content service into client components); `/admin`, `/survey` and `/studio` have their own root layouts. `[locale]/not-found.tsx` is the 404 page (`[...rest]` sends unknown paths there).
- **Pages are cached** (built ahead of time, refreshed from the CMS every 60 s): every `[locale]` page and layout calls `setRequestLocale(locale)`, and nothing on them may read the request (`headers()`, `cookies()`, `searchParams`) unless the page is meant to render per visit (pre-admission, downloads). The visitor's country for the consent defaults comes from a cookie the proxy sets (`src/lib/analytics/country.ts`). Pages with an id (`[slug]`) are built on their first visit. In the local preview (`ADMISSIONS_LOCAL=1`) nothing is built ahead of time.
- **The browser gets only the messages it needs:** the root layout sends `SHARED_CLIENT_MESSAGES` (`src/lib/i18n-messages.ts`); a section whose client components call `useTranslations` adds its namespaces in its own layout (`ClientMessages`: pre-admission, teachers). A new client `useTranslations` needs its namespace added there.
- **Fonts:** Anek Latin from next/font (`src/lib/fonts.ts`); Anek Bangla and Tiro Bangla (quotations) self-hosted and trimmed in `public/fonts` (`src/styles/fonts.css`, made by `scripts/trim-fonts.py`; Anek Bangla preloaded on Bengali pages only).

**Cache Components (`cacheComponents`) is intentionally OFF** — next-intl doesn't support it yet (locale reads via `getMessages`/`getTranslations` can't be statically resolved; awaits Next's `next/root-params`). Don't enable the flag or add `'use cache'` to the fetch layer until next-intl ships support.

### Content (Sanity CMS)
- Schemas in `sanity/schemas/` (registered via `sanity/schemas/index.ts`): `siteSettings`, `footer`, `preAdmissionForm`, `homePage` (singleton: the homepage routine, play-space photos and FAQ; empty lists fall back to `messages` `home.*`), `testimonial` (guardian reviews, shown only with consent), `album` (the gallery: photos in Sanity, videos as YouTube links; spec `docs/gallery.md`; the page shows only once Site Settings switches `showGallery` on), `notice` (the notice board at `/notices`: numbered ২০২৬/১৭ when created, the link is the number; spec `docs/notices.md`; shows once `showNotices` is on, and then the old `/news` links lead to it). Studio config: `sanity.config.ts` + custom `sanity/structure.ts`.
- All content is multilingual — fields carry Bengali + English variants.
- Client layer in `src/lib/`:
  - `sanity.ts` — `client` (CDN in prod, no CDN in dev), `previewClient` (token-auth, never CDN), `urlFor()` (built via `@sanity/image-url` v2 named `createImageUrlBuilder`), `getClient(preview)`.
  - `sanity-fetch.ts` — `sanityFetch()` wrapper; `revalidate: 0` in dev, default 60s in prod (callers pass only `query`/`params`/`tags`), supports cache `tags`. `sanityFetchWithPreview` keeps the preview path uncached.
  - `sanity-queries.ts` — GROQ query strings. `content-service.ts` — `ContentService` class is the main façade for fetching typed content (preview-aware).
- Preview mode via `/api/preview` + `/api/exit-preview`; `/api/refresh` triggers revalidation.

### Forms → Google Sheets
- Pre-admission applications live in Postgres; paid ones are copied to the tab "ভর্তি ২০২৭" of the pre-admission sheet (`FORM_GOOGLE_SHEETS_ID`) by `src/lib/admissions/sheet-copy.ts`, via the `googleapis` service-account credentials in `src/lib/google-sheets-server.ts` (`GOOGLE_PROJECT_ID`, `GOOGLE_PRIVATE_KEY`, `GOOGLE_CLIENT_EMAIL`, etc.). The survey copies to `SURVEY_SHEET_ID` the same way.

### Other API routes
`src/app/api/`: `download-prospectus`, `download-curriculum`, `download-code-of-conduct` (PDF/asset delivery), `image` / `favicon` (image proxy/optimization), `test-sheets`.

### Conventions
- Import alias `@/*` → `src/*`.
- `@typescript-eslint/no-explicit-any` is **off**; unused vars are warnings only. TypeScript `strict` on but `noImplicitAny` off.
- Components grouped by domain under `src/components/` (`homepage`, `about`, `admissions`, `curriculum`, `campus`, `layout`, `ui`, `analytics`, `preview`).
- Cross-cutting libs in `src/lib/`: SEO (`seo.ts`: JSON-LD builders, the homepage's School data comes from Site Settings, plus the photo of the school's front and its map pin; `page-metadata.ts`: canonical + hreflang; `sitemap.ts`), performance (`performance-monitoring.ts`, `image-optimization.ts`), `fonts.ts`.
- Public-site design tokens (2027 revamp) live in `src/styles/tokens.css` (Tailwind v4 `@theme`, imported by `globals.css`); `DESIGN.md` and the Claude design system are written from it. The old `primary`/`secondary`/`accent` scales in `globals.css` stay until every page is redesigned, then go. The admin keeps Inter + Noto Sans Bengali (`src/components/survey/fonts.ts`).
- Next images: only `cdn.sanity.io` is whitelisted; WebP/AVIF, 1-year cache TTL (`next.config.ts`).
- Bengali copy uses the words Bangladeshi parents actually say, not literal translations of English: ফেসবুক পেজ, ওয়েবসাইট, লিংক, যোগাযোগ পেজে (not ফেসবুক পাতা, যোগাযোগ পাতায়). When a term has a common English loanword in everyday Bengali, use the loanword; write a Bengali coinage only when it is the one people use.

## Surveys (teacher/guardian reviews)
Spec `docs/survey-system.md`, plan `docs/survey-implementation-plan.md`, admin guide `docs/survey-admin-guide.md`, design `docs/survey-mockups/` (the public survey forms; for the admin pages they describe the content only: the admin follows the shared shadcn design, `docs/admin-redesign-plan.md`, pieces in `src/app/admin/ui.tsx`).
- `/survey/{slug}?k=…` (public, Bengali, outside `[locale]`) and `/admin/…` (Studio Basic Auth) are branched in `src/proxy.ts`; analytics never load there.
- Data: Neon Postgres via Drizzle (`src/lib/survey/schema.ts`, migrations `drizzle/`); Sanity holds templates/rounds/classes/teachers; opening a round snapshots them into `survey_rounds` (Postgres is then the source of truth).
- `src/lib/survey/` holds the logic (pure modules are unit-tested; `server-only` modules touch the DB/Sheets). Admin mutations are server actions that must call `assertAdmin()`.
- Commands: `pnpm db:generate`, `pnpm db:migrate`, `pnpm test:db` (`*.db.test.ts` against the Neon dev branch), `pnpm survey:fixtures [--remove]` (sample data in the dev branch). e2e specs that touch the DB run one at a time (`survey-db` Playwright project) with `SURVEY_SHEET_ID` empty.
- Local preview (`ADMISSIONS_LOCAL=1`, see `src/instrumentation-node.ts`): the survey shares the in-memory Postgres and starts with the same sample data (`src/lib/survey/testing/dev-fixtures.ts`; reload with `POST /api/admissions/dev/survey-fixtures`). `pnpm test:e2e:admissions` runs the survey DB specs there too, except import (it needs the Studio). `pnpm admin:screenshots [dir]` captures every admin page (desktop, phone, A4 prints) from a running preview.

## Class routine
Spec + build notes `docs/class-routine.md`. `/admin/routine/…` (module রুটিন in the admin shell): teachers, routine grid, free teachers, proxy register, workload, setup.
- Data: Neon Postgres via Drizzle (`src/lib/routine/schema.ts`, same migrations folder), nothing in Sanity (salary is private). `routine_slots` is the clash guard: one row per assignment × day for group, teacher/TA and unshared room, primary key refuses double bookings; writes go through `src/lib/routine/data.ts` in one `db.batch`.
- Pure logic in `src/lib/routine/{days,clash,load,free,proxy}.ts` (unit-tested); local preview loads a sample routine (`src/lib/routine/testing/dev-fixtures.ts`).
- Sheet import: `pnpm routine:import <xlsx> [--apply]` writes a draft routine from the school's sheet (docs/class-routine.md §7). Its names.json / reports live next to the xlsx, never in this public repo; `--apply` writes to `DATABASE_URL`.

## Env
Required vars live in `.env.local` (see `.env.local.example`): `NEXT_PUBLIC_SANITY_PROJECT_ID`, `NEXT_PUBLIC_SANITY_DATASET`, `SANITY_API_TOKEN` (preview/writes), Google service-account keys, analytics IDs, optional studio auth vars. Surveys add `DATABASE_URL` (pooled) / `DATABASE_URL_UNPOOLED` (migrations), `SURVEY_SHEET_ID`, `PG_BACKUP_BLOB_READ_WRITE_TOKEN`, `CRON_SECRET`.
