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

Bilingual (Bengali/English) marketing + CMS website for Madrasatul Quran, an Islamic school in Dhaka. Next.js 16 App Router (Turbopack default), React 19.2, Sanity v5 CMS, next-intl v4, Tailwind CSS v4, TypeScript.

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

# Google Sheets form integration (run once for setup)
pnpm setup:headers  # write column headers to the sheet
pnpm test:sheets    # verify Sheets credentials/connection
pnpm setup:form     # node scripts/populate-pre-admission-form.js
pnpm setup:all      # setup:form + setup:headers + test:sheets
```

Tests: **Vitest** unit (`src/lib/*.test.ts`, jsdom; setup `vitest.setup.ts`) + **Playwright** route smoke (`e2e/`, `playwright.config.ts`). E2E serves on **port 3100** (3000 often occupied). One-off run: `pnpm exec playwright install chromium` first. Lint scope: eslint flat config ignores build output and `scripts/**` (Node CJS tooling) — Next 16 removed `next lint`.

Sanity Studio served in-app at `/studio`.

Many `scripts/*.js` / `.ts` are one-shot Sanity data seeders (e.g. `populate-sanity-data.js`, `populate-footer-data.js`, `upload-prospectus-data.js`). Run with `node` / `tsx`. Read the script before running — they write to the live Sanity dataset.

## Architecture

### Routing & i18n
- Locales are `'bengali'` and `'english'` (literal segment values, **not** `bn`/`en`). Default `bengali`, `localePrefix: 'always'` — every page lives under `/[locale]/...`.
- `src/proxy.ts` runs `next-intl` middleware for all routes except `api`, `_next`, `studio`, sitemap/robots. It also gates `/studio` with optional basic auth (`STUDIO_AUTH_ENABLED`, `STUDIO_USERNAME`, `STUDIO_PASSWORD`). (Next 16 renamed the `middleware` convention to `proxy`; nodejs runtime only.)
- `src/lib/i18n.ts` is the next-intl request config; messages load from `messages/{locale}.json`.
- Pages: `src/app/[locale]/{about,admissions,campus,contact,curriculum,news,programs,pre-admission}`. Root `src/app/layout.tsx` sets up fonts (Inter/Noto Sans Bengali/Amiri) + analytics; per-locale `src/app/[locale]/layout.tsx` is a Server Component that fetches site/footer settings server-side and passes them as props into the (client) `MainLayout` — don't import the content service into client components.

**Cache Components (`cacheComponents`) is intentionally OFF** — next-intl doesn't support it yet (locale reads via `getMessages`/`getTranslations` can't be statically resolved; awaits Next's `next/root-params`). Don't enable the flag or add `'use cache'` to the fetch layer until next-intl ships support.

### Content (Sanity CMS)
- Schemas in `sanity/schemas/` (registered via `sanity/schemas/index.ts`): `siteSettings`, `page`, `newsEvent`, `academicProgram`, `staffMember`, `facility`, `footer`, `prospectus`, `preAdmissionForm`. Studio config: `sanity.config.ts` + custom `sanity/structure.ts`.
- All content is multilingual — fields carry Bengali + English variants.
- Client layer in `src/lib/`:
  - `sanity.ts` — `client` (CDN in prod, no CDN in dev), `previewClient` (token-auth, never CDN), `urlFor()` (built via `@sanity/image-url` v2 named `createImageUrlBuilder`), `getClient(preview)`.
  - `sanity-fetch.ts` — `sanityFetch()` wrapper; `revalidate: 0` in dev, default 60s in prod (callers pass only `query`/`params`/`tags`), supports cache `tags`. `sanityFetchWithPreview` keeps the preview path uncached.
  - `sanity-queries.ts` — GROQ query strings. `content-service.ts` — `ContentService` class is the main façade for fetching typed content (preview-aware).
- Preview mode via `/api/preview` + `/api/exit-preview`; `/api/refresh` triggers revalidation.

### Forms → Google Sheets
- Pre-admission form posts to `src/app/api/submit-form/route.ts`, which appends rows to a Google Sheet via the `googleapis` service-account credentials (`GOOGLE_PROJECT_ID`, `GOOGLE_PRIVATE_KEY`, `GOOGLE_CLIENT_EMAIL`, etc.). Helper logic in `src/lib/google-sheets.ts`. See `GOOGLE_SHEETS_SETUP.md`.

### Other API routes
`src/app/api/`: `download-prospectus`, `download-curriculum`, `download-code-of-conduct` (PDF/asset delivery), `upload` (Vercel Blob), `image` / `favicon` (image proxy/optimization), `test-sheets`.

### Conventions
- Import alias `@/*` → `src/*`.
- `@typescript-eslint/no-explicit-any` is **off**; unused vars are warnings only. TypeScript `strict` on but `noImplicitAny` off.
- Components grouped by domain under `src/components/` (`homepage`, `about`, `admissions`, `news-events`, `curriculum`, `campus`, `programs`, `forms`, `layout`, `ui`, `translation`, `seo`, `analytics`, `preview`).
- Cross-cutting libs in `src/lib/`: SEO (`seo.ts`, `local-seo.ts`, `sitemap.ts`), performance (`performance-monitoring.ts`, `image-optimization.ts`, `font-optimization.ts`), `design-system.ts`, `multilingual-content.ts`, `content-validation.ts`, `publishing-workflow.ts`.
- Next images: only `cdn.sanity.io` is whitelisted; WebP/AVIF, 1-year cache TTL (`next.config.ts`).

## Surveys (teacher/guardian reviews)
Spec `docs/survey-system.md`, plan `docs/survey-implementation-plan.md`, admin guide `docs/survey-admin-guide.md`, locked design `docs/survey-mockups/`.
- `/survey/{slug}?k=…` (public, Bengali, outside `[locale]`) and `/admin/…` (Studio Basic Auth) are branched in `src/proxy.ts`; analytics never load there.
- Data: Neon Postgres via Drizzle (`src/lib/survey/schema.ts`, migrations `drizzle/`); Sanity holds templates/rounds/classes/teachers; opening a round snapshots them into `survey_rounds` (Postgres is then the source of truth).
- `src/lib/survey/` holds the logic (pure modules are unit-tested; `server-only` modules touch the DB/Sheets). Admin mutations are server actions that must call `assertAdmin()`.
- Commands: `pnpm db:generate`, `pnpm db:migrate`, `pnpm test:db` (`*.db.test.ts` against the Neon dev branch), `pnpm survey:fixtures [--remove]` (sample data in the dev branch). e2e specs that touch the DB run one at a time (`survey-db` Playwright project) with `SURVEY_SHEET_ID` empty.
- Local preview (`ADMISSIONS_LOCAL=1`, see `src/instrumentation.ts`): the survey shares the in-memory Postgres and starts with the same sample data (`src/lib/survey/testing/dev-fixtures.ts`; reload with `POST /api/admissions/dev/survey-fixtures`). `pnpm test:e2e:admissions` runs the survey DB specs there too, except import (it needs the Studio). `pnpm admin:screenshots [dir]` captures every admin page (desktop, phone, A4 prints) from a running preview.

## Env
Required vars live in `.env.local` (see `.env.local.example`): `NEXT_PUBLIC_SANITY_PROJECT_ID`, `NEXT_PUBLIC_SANITY_DATASET`, `SANITY_API_TOKEN` (preview/writes), Google service-account keys, analytics IDs, optional studio auth vars. Surveys add `DATABASE_URL` (pooled) / `DATABASE_URL_UNPOOLED` (migrations), `SURVEY_SHEET_ID`, `PG_BACKUP_BLOB_READ_WRITE_TOKEN`, `CRON_SECRET`.
