# Scripts

Run with `pnpm exec tsx scripts/<name>.ts` or `node scripts/<name>.js` (several have a `pnpm` alias in `package.json`). Read a script before running it.

## Which dataset a script writes to

Scripts that write to Sanity use `NEXT_PUBLIC_SANITY_DATASET` from `.env.local`, which is `development`. Until the 2027 release, `development` is also the live site's dataset. From the release on, the live site reads `production` and `development` serves previews and local work (`docs/studio-cleanup.md`); a script meant for the live site must then be run with `NEXT_PUBLIC_SANITY_DATASET=production`.

## Data scripts

| Script | What it does | Status |
|---|---|---|
| `studio-cleanup.ts` | Moves and removes Studio data for the new arrangement; `--dataset` required, `--dry-run` lists every change | Run at release (`docs/studio-cleanup.md`) |
| `survey-seed.ts` | Survey areas, templates, classes and teachers into Sanity | Done; rerun only for a new dataset |
| `survey-dev-fixtures.ts` | Sample survey data in the database of `.env.local` (`pnpm survey:fixtures [--remove]`) | Any time, dev branch only |
| `setup-fees.ts` | The first Fees document, and the WhatsApp number when missing | Done (2026) |
| `setup-admissions.ts` | Built the 2027 form from the old form's questions | Done; the old form is gone, so it cannot run again |
| `setup-admissions-updates.ts` | The 2027 updates as Studio drafts | Done (October 2026) |
| `arrange-admissions-form.ts` | Arranged the 2027 form's chapters | Done (October 2026) |
| `extract-form-questions.js` | Exported the old form's questions to `docs/pre-admission-form/` (the test fixtures read that file) | Done; the old form is gone |
| `populate-faculty-data.js` | Seeded directors, advisors, teachers and departments | Done (2025) |
| `clean-director-bios.ts` | Tidied the directors' biographies | Done (October 2026) |
| `migrate-public-download-settings.ts` | Moved the public PDFs into Public PDFs | Done |

## Other scripts

| Script | What it does |
|---|---|
| `migrate-if-configured.mjs` | Vercel build step: applies pending database migrations |
| `admin-screenshots.ts` | Screenshots of every admin page from a running local preview (`pnpm admin:screenshots [dir]`) |
| `test-google-sheets.js` | Checks the Google Sheets credentials (`pnpm test:sheets`) |
| `trim-fonts.py` | Makes the trimmed Bengali fonts in `public/fonts` |
