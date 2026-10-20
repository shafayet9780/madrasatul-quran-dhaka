# Studio clean-up and the production dataset

Plan agreed 2026-10-20, before the 2027 release. Branch `studio-cleanup` (off `design-revamp`, merged back before release).

Why: the Studio held about twice what the site reads. The admissions phone was stored three times, homepage content sat in Site Settings, five whole types fed no page, and the sidebar followed build order. The live site also read the dataset named `development`, so seed scripts and previews wrote to live content.

## Decisions

| Topic | Decision |
|---|---|
| Datasets | `production` becomes live, `development` serves previews and local work. The switch happens with the release (one short content freeze). |
| Deleted types | News & Events, Academic Programs (and `/programs`), Facilities, Pages, Prospectus, the old `staffMember` document. Footer is folded into School details. |
| Pages on/off | Its own sidebar entry (today's Navigation Visibility). The News and Programs switches go. |
| Ordering | Drag and drop (`@sanity/orderable-document-list`) for Directors, Advisors, Teachers, Departments and Guardian reviews. |
| Pre-admission photo | The photo slot is removed (it was fed by Facilities, none of which had a photo). |
| Copyright | Automatic: `© {year} মাদরাসাতুল কুরআন`. No field. |
| SEO | Connected: site defaults (description, share image) plus a title and description per main page, all in the Studio. The code's current copy is the starting value and the fallback. Keywords are dropped. |
| Phones | One list. Each number has a "used for" choice (Admissions / Transport / Accounts / Office) and a show switch. WhatsApp stays its own field. |
| Teachers | Stay under People, with Departments nested under them. |

## The new sidebar

```
Notices
Gallery
Guardian reviews                 (drag to order)
──────────
Homepage                         (+ hero photos and numbers, from Site Settings)
Campus: a day
Admissions ▸  Pre-admission form · Fees, discounts & transport
──────────
People ▸      Directors · Advisors · Teachers · Departments   (drag to order)
Downloads ▸   Library items · Categories · Public PDFs
──────────
School details                   (logo, address, phones, emails, WhatsApp, hours, map, social, tagline, mission)
Pages on/off
Search & sharing                 (SEO defaults + one entry per main page)
──────────
Surveys ▸     Rounds · Templates · Classes & subjects · Teachers · Areas
```

Every one-off document (School details, Pages on/off, Search & sharing, Homepage, Campus: a day, Pre-admission form, Fees, Public PDFs) is a fixed sidebar entry. None can be created from the "+" menu or duplicated.

## Where each piece of data ends up

| Today | After |
|---|---|
| `siteSettings.heroImages` (image, alt, title) | `homePage.heroImages` |
| `siteSettings.statistics` (totalStudents, teacherCount, achievements) | `homePage.statistics` (yearsOfService, graduationRate dropped) |
| `footer.subtitle`, `footer.description` | `siteSettings.tagline`, `siteSettings.mission` |
| `footer.copyright` | dropped (automatic year) |
| `siteSettings.navigationVisibility` | new singleton `pagesOnOff`. The site settings query projects it under the same name, so the code shape stays |
| `contactInfo.admissionsPhone`, `phone[]` (type, isPrimary, label regex for transport) | `contactInfo.phone[]` {number, label, usedFor, isActive ("Show on the site")} |
| `contactInfo.email[]` (label, type, isPrimary unused) | `contactInfo.email[]` {address, isActive} |
| `siteSettings.seo`, layout.tsx TITLE/DESCRIPTION/SOCIAL_IMAGE, each page's metadata text | new singleton `seoSettings` {description, shareImage, pages.{home, about, admissions, preAdmission, curriculum, campus, contact, notices, gallery}.{title, description}}; read by `src/lib/page-seo.ts` |
| `preAdmissionForm` (random id, list in sidebar) | fixed id `preAdmissionForm`. The code queries by type, so the id change is safe. The sidebar keeps a list (creating is blocked) so it works before and after the move |
| `preAdmissionForm.formSettings.isEnabled`, `declarationText` | kept, moved to the Form 2027 tab ("Form open", "Final declaration") |
| `displayOrder` / `order` on director, advisor, teacher, department, testimonial | `orderRank` (seeded from today's order; directors from the About page's current order) |

Removed outright (never read by the site):
- **siteSettings:** `title`, `description`, `admissionBanner`, `admissionInfo`, `officeContacts`, `locationInfo.transportation`, `locationInfo.directions`, landmark `description`/`icon`, heroImages `description`/`order`.
- **footer:** the whole type, after the copy above.
- **feeSettings:** `faqQuestion`, `faqAnswer`, `transport[].note`.
- **director:** `gender`, `signatureName`, `featured`. **advisor:** `gender`, `featured`. **teacher:** `featured`.
- **department:** `description`. **downloadCategory:** `description`.
- **preAdmissionForm legacy tab:** `generalQuestions`, `studentInfoFields`, `studentAssessmentFields`, `parentInfoFields`, `additionalQuestions`, `contactInfoFields`, `successMessage`, and `formSettings.{formTitle, formDescription, submissionDate, googleSheetsId}`.
- **Types:** `newsEvent`, `academicProgram`, `facility`, `page`, `prospectus`, `footer`, and the orphan `staffMember` document.

## Steps

Each step ends with `pnpm lint`, `pnpm test` and `pnpm exec tsc --noEmit`. Playwright runs once at the end.

1. **Delete what nothing reads.**
   - Schemas: newsEvent, academicProgram, facility, page, prospectus.
   - Routes: `/news`, `/news/[slug]`, `/programs`. Redirects: `/news/*` goes to `/notices` when the board is on, otherwise to `/`; `/programs` goes to `/curriculum`.
   - Code: news-events and programs components, `hooks/use-content.ts`, `components/translation/*`, `publishing-workflow.ts`, `content-validation.ts`, dead content-service methods and queries, the dead parts of `seo.ts`, preview links for the removed types, their `messages` namespaces.
   - Pre-admission: remove the photo slot and `getFeaturedFacilities`.
   - Legacy form: the old form component, its types and the legacy tab. Check `lib/admissions/legacy-form.ts` and the setup scripts first.
   - Verify: grep for every removed type name returns only the data script and docs.
2. **School details, Pages on/off, Homepage.**
   - Reshape siteSettings as in the table above, and fold Footer in.
   - New `pagesOnOff` singleton.
   - Move the hero and numbers into homePage.
   - Phones: `usedFor`. `getAdmissionsContact` and `transportPhone` pick by it, and the label regex goes.
   - Copyright: automatic year.
   - Also fix: the footer's "Our Books" link follows `showBooks`. (The planned hidden-vehicle fix was dropped: a vehicle's "Show on website" only lists it in discount names, and route cards are frozen into the form.)
3. **Search & sharing.**
   - New `seoSettings` singleton.
   - `generatePageMetadata` callers read their page's entry and fall back to today's code copy.
   - The layout reads the default description and share image.
   - Pages covered: home, about, admissions, pre-admission, curriculum, campus, contact, notices, gallery. Detail pages (a notice, an album, a director) keep deriving from their own content.
4. **Ordering.** Add `@sanity/orderable-document-list` with pnpm. Change the five types to `orderRank` and their queries to `order(orderRank)`.
5. **Sidebar.** Rewrite `sanity/structure.ts` as above. In `sanity.config.ts`, block templates and the duplicate action for every singleton.
6. **Two datasets.**
   - The download clean-up cron must keep a file if *either* dataset references it, because both datasets share one Vercel Blob store.
   - Local `.env.local` stays on `development`. Update `CLAUDE.md` and `scripts/README.md`: seeders write to `development` unless `--dataset production` is given.
   - Survey pairing: Sanity `production` goes with the live Neon branch, `development` with the dev branch.
7. **Data script** `scripts/studio-cleanup.ts`.
   - Requires an explicit `--dataset`, and has `--dry-run` that prints every change.
   - It is idempotent: copy first, then unset and delete.
   - It also seeds `seoSettings` from today's copy and `orderRank` from today's order.
   - Unit-test the pure transform functions.
8. **Review pass**, then the full Playwright run against a local build reading `production` after the rehearsal below.

## Done during the work (20 October 2026)

Beyond the steps above:
- The old form's whole path went with it: `/api/submit-form`, the public `/api/upload`, `src/lib/google-sheets.ts`, `scripts/setup-google-sheets-headers.js` and the `setup:form`/`setup:headers`/`setup:all` commands. The 2027 flow keeps applications in Postgres and copies paid ones to its own sheet tab (`sheet-copy.ts`).
- The one-shot seeders for the removed types (`populate-sanity-data.js`, `upload-prospectus-data.js`, `populate-footer-data.js`, `populate-centralized-data.js`, `populate-banner-data.ts`, `test-content-integration.js`) are gone; `scripts/README.md` lists what remains and its status.
- The pre-admission page's empty photo slot is gone (its grid is unchanged, so the page looks as before).
- The teacher list cards now get their qualifications (the list query left them out).
- `sanity/README.md` describes the new sidebar.
- The data script reads only on a dry run, so `--dry-run` works on any dataset; writing to `development` needs `--yes-development`.

## Release-day runbook

1. **Freeze Studio edits** (tell the office). Before this, nobody edits in the Preview Studio of this branch: it reads the live `development` data with the new schema (School details would not validate; a new pre-admission form could be made by mistake).
2. **Export** `development`: `pnpm exec sanity dataset export development <backup>.tar.gz`. Keep the file outside the repo; it is the backup and the rollback.
3. **Import** it into `production`: `pnpm exec sanity dataset import <backup>.tar.gz production --replace`.
4. **Run the data script on `production`:** `pnpm exec tsx scripts/studio-cleanup.ts --dataset production --dry-run`, read the list, then the same without `--dry-run`. The dry run of 20 October against `development` listed: School details reshaped (phones: Senior Admin → admissions, Admin → office, Accounts → accounts), 6 hero photos and the numbers to the Homepage, Pages on/off created (Teachers, Gallery, Notices off), Search & sharing created, the form moved to `preAdmissionForm`, the fees FAQ unset, 9 directors, 4 advisors, 1 teacher and 1 department ordered, and 16 old documents deleted.
5. **Check locally** with `NEXT_PUBLIC_SANITY_DATASET=production`: `pnpm build`, `pnpm test:e2e`, and the Studio (sidebar, every singleton opens, drag ordering).
6. **Vercel:** set `NEXT_PUBLIC_SANITY_DATASET` to `production` for Production and `development` for Preview. Point the Sanity webhooks (downloads, refresh) at the production dataset, adding them for it where they are per-dataset.
7. **Merge and deploy.** Smoke-test home, admissions, pre-admission, contact, notices, about, downloads, `/studio` and a survey link.
8. **Afterwards:** refresh `development` from `production` (export and import) so previews match the new shape.
9. **Then remove the stand-ins:** the queries fall back to the old fields until the script has run (`coalesce` in `siteSettingsQuery`, `homePageQuery` and `src/lib/queries/site.ts`; the old `admissionsPhone`/`type` read in `siteSettingsQuery` and `withPhoneUses` in `content-service.ts`; all marked "stand-in"), so previews on the old data look like the live site. Once both datasets are cleaned up, drop the fallbacks.

Rollback: set Production's dataset back to `development` and redeploy the previous build. `development` is untouched until step 8.

## Open items for the owner (not blocking)

- **Which number is the transport desk?** No phone label mentions transport today. Until one is marked "Transport", the transport line stays hidden, as today.
- **Board order:** seeded from the About page's current order. Adjust by dragging in People → Directors.
