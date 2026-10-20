# Sanity Studio for the Madrasatul Quran website

The Studio is served by the site at `/studio` (`sanity.config.ts`). The sidebar is built in `structure.ts`, and the schemas live in `schemas/` (registered in `schemas/index.ts`). The arrangement was agreed on 20 October 2026; see `docs/studio-cleanup.md`.

## The sidebar

| Entry | Type | What it holds |
|---|---|---|
| Notices | `notice` | The notice board (`docs/notices.md`) |
| Gallery | `album` | Photo and video albums (`docs/gallery.md`) |
| Guardian reviews | `testimonial` | Reviews shown with consent; drag to order, the first three show on the homepage |
| Homepage | `homePage` | Hero photos, the numbers band, the routine, play-space photos, the FAQ |
| Campus: a day | `campusDay` | The campus tour (`docs/campus-day.md`) |
| Admissions → Pre-admission form | `preAdmissionForm` | The form, its cycle and the "Form open" switch (`docs/pre-admission-admin-guide.md`) |
| Admissions → Fees, discounts & transport | `feeSettings` | Fees, discounts, vehicles and van routes (`docs/fees-and-admissions.md`) |
| People | `director`, `advisor`, `teacher`, `department` | Profiles; drag to order |
| Downloads | `downloadable`, `downloadCategory`, `publicDownloadSettings` | The library and the public PDFs (`docs/downloads-library.md`) |
| School details | `siteSettings` | Logo, tagline, mission, phones (each with what it is used for), emails, WhatsApp, hours, address, map, social links |
| Pages on/off | `pagesOnOff` | Which pages exist and which menu links show |
| Search & sharing | `seoSettings` | Default description, share picture, and each main page's title and description |
| Surveys | `survey*` | Rounds, templates, classes, teachers and areas (`docs/survey-admin-guide.md`) |

The one-off documents (`SINGLETONS` in `structure.ts`) have their type as their id, and cannot be created from "+", duplicated or deleted.

## Conventions

- Text the site shows in both languages is an object with `bengali` and `english` (`mlString`, `mlText` in `schemas/shared.ts`).
- An empty optional field keeps the site's own wording; the site never goes blank because a field is empty.
- Ordered lists use `@sanity/orderable-document-list` (the `orderRank` field); queries sort by `orderRank`.
- Data scripts in `scripts/` write to the dataset named in `.env.local` unless told otherwise. Read a script before running it.
