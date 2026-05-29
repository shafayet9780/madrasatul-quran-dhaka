# Implementation Plan: Directors & Teachers Profiles

Companion to `specs/directors-teachers-profiles.md`. Tasks are vertically sliced, dependency-ordered, each S/M sized (≤5 files), each with acceptance + verification.

## Architecture Decisions

- **Foundation first**: `department` schema + gender-aware avatar fallback are shared dependencies — build before the two feature slices.
- **Vertical slices**: Directors and Teachers each ship end-to-end (schema → type → query → service → pages → components) before moving on. Directors first (simpler — no department join), Teachers second (adds dept reference + grouping/filter).
- **Mirror `news`**: routes/queries/components follow `src/app/[locale]/news/*` + `src/lib/queries/news-events.ts`. No new patterns.
- **Cross-cutting last**: shared Person/Breadcrumb JSON-LD, sitemap, and the "Our People" mega-menu land after both slices exist so they wire real routes.

## Dependency Graph

```
T1 department schema ─┐
T4 avatar fallback ───┼─→ T2 director schema ─→ T5 director queries ─→ T6 list ─→ T7 detail ─┐
                      └─→ T3 teacher schema  ─→ T8 teacher queries  ─→ T9 list ─→ T10 detail ─┤
                                                                                              ├─→ T11 JSON-LD
                                                                                              ├─→ T12 sitemap
                                                                                              ├─→ T13 mega-menu
                                                                                              └─→ T14 seed (manual)
                                                                          T15/T16 tests ──────┘
```

---

## Phase 1 — Foundation (Sanity model + shared UI)

### Task 1: `department` schema + registration + desk + type
**Description:** New referenced document type used to group/filter teachers and label sections.
**Acceptance:**
- [ ] `department` doc type with `name` (ML), `slug` (ML), `description?` (ML), `displayOrder`, optional `accentColor`/`icon`; preview + displayOrder ordering.
- [ ] Registered in `sanity/schemas/index.ts`; "Departments" section in `sanity/structure.ts`.
- [ ] `Department` interface in `src/types/sanity.ts`.
**Verification:**
- [ ] `/studio` shows Departments; can create one with both locales + slug.
- [ ] `pnpm build` clean.
**Dependencies:** None
**Files:** `sanity/schemas/department.ts`, `sanity/schemas/index.ts`, `sanity/structure.ts`, `src/types/sanity.ts`
**Scope:** S

### Task 2: `director` schema + registration + desk + type
**Description:** Director document type — shared profile fields plus director-specific message + social links.
**Acceptance:**
- [ ] Fields: `name` (ML), `slug` (ML), `designation` (ML), `gender` (male|female), `photo?`, `summary` (ML plain), `fullBio` (ML portable text), `qualifications` (ML arrays), `education[]`, `message` (ML portable text), `signatureName?`, `socialLinks[]` (label+url), `displayOrder`, `featured?`.
- [ ] Registered + "Directors" desk section; `Director` type added.
**Verification:**
- [ ] `/studio` create director, both locales, slug auto-generates.
- [ ] `pnpm build` clean.
**Dependencies:** T1 (shares conventions; no hard dep)
**Files:** `sanity/schemas/director.ts`, `sanity/schemas/index.ts`, `sanity/structure.ts`, `src/types/sanity.ts`
**Scope:** S

### Task 3: `teacher` schema (with department reference) + registration + desk + type
**Description:** Teacher document type — shared fields plus subjects, experience, specializations, and a required department reference.
**Acceptance:**
- [ ] Fields: shared set (as T2 minus message/signature/social) + `department` (reference→`department`, required), `subjects` (ML array), `yearsOfExperience` (number), `specializations` (string array).
- [ ] Registered + "Teachers" desk section (All / by-department / Featured filters); `Teacher` type added (department typed as ref or expanded).
**Verification:**
- [ ] `/studio` create teacher, assign department, both locales.
- [ ] `pnpm build` clean.
**Dependencies:** T1
**Files:** `sanity/schemas/teacher.ts`, `sanity/schemas/index.ts`, `sanity/structure.ts`, `src/types/sanity.ts`
**Scope:** S

### Task 4: Gender-aware avatar fallback (Site Settings + helper)
**Description:** Photo optional; female/photo-less profiles render a shared placeholder configured in Site Settings.
**Acceptance:**
- [ ] `siteSettings` gains `defaultMaleAvatar`, `defaultFemaleAvatar` image fields.
- [ ] Helper `getProfileImage(profile, siteSettings)` returns photo or gender placeholder; used by a thin wrapper around existing `AvatarImage`.
- [ ] Unit test covers: has-photo → photo; female no-photo → female placeholder; male no-photo → male placeholder.
**Verification:**
- [ ] `pnpm test` green for the helper.
**Dependencies:** None
**Files:** `sanity/schemas/siteSettings.ts`, `src/types/sanity.ts`, `src/lib/sanity-utils.ts` (or new `profile-image.ts`), `src/lib/<helper>.test.ts`
**Scope:** S

### Checkpoint: Foundation
- [ ] All four doc types editable in `/studio`; teacher↔department reference works.
- [ ] `pnpm build` + `pnpm test` green.
- [ ] Review with human before feature slices.

---

## Phase 2 — Directors vertical slice

### Task 5: Director queries + ContentService methods
**Description:** GROQ list + dual-slug detail queries, plus façade methods (preview-aware).
**Acceptance:**
- [ ] `src/lib/queries/directors.ts`: `getAllDirectors()` (order displayOrder) and `getDirectorBySlug(slug, lang)` (dual-slug `slug.$lang.current==$slug`).
- [ ] `getAllDirectors`/`getDirectorBySlug` on `ContentService` with cache `tags: ['director']`.
**Verification:**
- [ ] Unit test asserts query shape (dual-slug, fields present).
- [ ] Manual: methods return seeded data in dev.
**Dependencies:** T2
**Files:** `src/lib/queries/directors.ts`, `src/lib/content-service.ts`, `src/lib/sanity-queries.ts` (if shared fragments), `src/lib/queries/directors.test.ts`
**Scope:** S

### Task 6: Directors list page + cards
**Description:** `/[locale]/directors` — responsive grid of director cards, hero/page-header, GSAP fade-in.
**Acceptance:**
- [ ] `DirectorsList` + `DirectorCard` under `src/components/directors/`; card shows photo/placeholder, name, designation, links to detail; uses `Card`/`Grid`/`Typography`, locale font.
- [ ] Server page fetches via ContentService, passes typed data to client component; `generateMetadata`.
**Verification:**
- [ ] Both locales render 200; cards link correctly.
- [ ] `pnpm build` clean.
**Dependencies:** T5, T4
**Files:** `src/app/[locale]/directors/page.tsx`, `src/components/directors/directors-list.tsx`, `src/components/directors/director-card.tsx`, `src/components/directors/index.ts`
**Scope:** M

### Task 7: Director detail page
**Description:** `/[locale]/directors/[slug]` — full profile: message, rich bio, qualifications, education, social links, breadcrumb.
**Acceptance:**
- [ ] `DirectorDetail` renders message + portable-text bio (`rich-text.tsx`), qualifications, education, social links; **no personal contact beyond provided social**; gender placeholder when no photo.
- [ ] `generateStaticParams` (locale×slug), `generateMetadata` (summary→description), `notFound()` on miss.
**Verification:**
- [ ] Seeded director opens in both locales; bad slug → 404.
- [ ] `pnpm build` emits static params.
**Dependencies:** T5, T6
**Files:** `src/app/[locale]/directors/[slug]/page.tsx`, `src/components/directors/director-detail.tsx`
**Scope:** M

### Checkpoint: Directors
- [ ] List + detail work in both locales; placeholder + i18n correct.
- [ ] Build + tests green.

---

## Phase 3 — Teachers vertical slice

### Task 8: Teacher queries (department join) + ContentService methods
**Description:** List query expands `department->`; dual-slug detail; façade methods.
**Acceptance:**
- [ ] `src/lib/queries/teachers.ts`: `getAllTeachers()` (joins `department->{name,slug,displayOrder}`), `getTeacherBySlug(slug, lang)`.
- [ ] ContentService methods with `tags: ['teacher']`.
**Verification:**
- [ ] Unit test asserts dept join + dual-slug in query.
- [ ] Manual: returns teachers with resolved department.
**Dependencies:** T3
**Files:** `src/lib/queries/teachers.ts`, `src/lib/content-service.ts`, `src/lib/queries/teachers.test.ts`
**Scope:** S

### Task 9: Teachers list page — grouped by department + search/filter
**Description:** `/[locale]/teachers` — department-grouped sections with client-side search (name + subject + specialization) and department filter.
**Acceptance:**
- [ ] `TeachersList` groups by department (ordered by dept displayOrder), `TeacherCard`, and a `TeacherFilterBar` (search input + department chips); empty-state when filter yields none.
- [ ] Server page fetches once; filtering is client-side; `generateMetadata`.
**Verification:**
- [ ] Grouping renders; search + filter narrow results; both locales 200.
- [ ] Unit test for grouping/filter logic.
**Dependencies:** T8, T4
**Files:** `src/app/[locale]/teachers/page.tsx`, `src/components/teachers/teachers-list.tsx`, `src/components/teachers/teacher-card.tsx`, `src/components/teachers/teacher-filter-bar.tsx`, `src/components/teachers/index.ts`
**Scope:** M

### Task 10: Teacher detail page
**Description:** `/[locale]/teachers/[slug]` — profile: subjects, experience, specializations, qualifications, education, rich bio, department label, breadcrumb.
**Acceptance:**
- [ ] `TeacherDetail` renders all teacher fields; gender placeholder fallback; no personal contact.
- [ ] `generateStaticParams`, `generateMetadata`, `notFound()`.
**Verification:**
- [ ] Seeded teacher opens both locales; bad slug → 404; build emits params.
**Dependencies:** T8, T9
**Files:** `src/app/[locale]/teachers/[slug]/page.tsx`, `src/components/teachers/teacher-detail.tsx`
**Scope:** M

### Checkpoint: Teachers
- [ ] List grouping/filter + detail work both locales.
- [ ] Build + tests green.

---

## Phase 4 — Cross-cutting (SEO + Nav + seed)

### Task 11: Person + Breadcrumb JSON-LD on detail pages
**Description:** Shared structured-data helper wired into both detail pages.
**Acceptance:**
- [ ] `generatePersonStructuredData(profile, locale)` in `src/lib/seo.ts` (reuse `generateBreadcrumbStructuredData`); Person includes name, jobTitle, image, affiliation EducationalOrganization.
- [ ] Both detail pages emit Person + Breadcrumb JSON-LD `<script>`.
**Verification:**
- [ ] View-source shows valid JSON-LD; passes a schema validator.
**Dependencies:** T7, T10
**Files:** `src/lib/seo.ts`, `src/app/[locale]/directors/[slug]/page.tsx`, `src/app/[locale]/teachers/[slug]/page.tsx`
**Scope:** S

### Task 12: Dynamic sitemap entries
**Description:** Add directors/teachers URLs (both locales + hreflang alternates) to the sitemap.
**Acceptance:**
- [ ] `generateDynamicSitemap` in `src/lib/sitemap.ts` queries published directors + teachers, emits bengali/english URLs with `alternates.languages`.
**Verification:**
- [ ] `/sitemap.xml` lists seeded profiles in both locales.
**Dependencies:** T7, T10
**Files:** `src/lib/sitemap.ts`
**Scope:** S

### Task 13: "Our People" mega-menu + header re-arrangement
**Description:** Net-new dropdown/mega-menu rendering in the header (no dropdown exists today); add Directors/Teachers, re-enable About/Academics/News.
**Acceptance:**
- [ ] Desktop "Our People" mega-menu (Directors col + Teachers-by-department col, "All" links); mobile accordion equivalent; keyboard + `aria` accessible; closes on route change/Esc/outside-click.
- [ ] `navigation.*` keys added to `messages/bengali.json` + `messages/english.json`; hidden nav items re-enabled per approved structure.
**Verification:**
- [ ] Menu works desktop + mobile, both locales; links resolve; no console/a11y errors.
- [ ] `pnpm build` + `pnpm lint` clean.
**Dependencies:** T6, T9
**Files:** `src/components/layout/header.tsx`, `messages/bengali.json`, `messages/english.json`, (optional) `src/components/layout/mega-menu.tsx`
**Scope:** M

### Task 14: Seed script (manual run — writes live dataset)
**Description:** One-shot seeder for departments + sample directors/teachers. **Ask first / run manually** per repo convention.
**Acceptance:**
- [ ] `scripts/populate-faculty-data.*` creates a few departments, directors, teachers (bilingual, slugs, gender mix incl. photo-less female).
- [ ] Header comment documents what it writes; idempotent-ish (uses stable `_id`s or checks).
**Verification:**
- [ ] Read script, then run against dev dataset; docs visible in `/studio` and on pages.
**Dependencies:** T1–T3
**Files:** `scripts/populate-faculty-data.ts`
**Scope:** S

---

## Phase 5 — Test consolidation

### Task 15: Unit tests round-out
**Description:** Ensure Vitest coverage for query shapes, gender placeholder, grouping/filter (fold in any gaps from T4/T5/T8/T9).
**Acceptance:** [ ] Helpers + query builders covered; `pnpm test` green.
**Verification:** [ ] `pnpm test`.
**Dependencies:** T5, T8, T9
**Files:** `src/lib/*.test.ts`
**Scope:** S

### Task 16: Playwright route smoke
**Description:** E2E smoke for all four routes + a detail route, both locales, plus 404.
**Acceptance:** [ ] `/bengali` + `/english` list + sample detail render 200; bad slug → 404.
**Verification:** [ ] `pnpm test:e2e` (port 3100) green.
**Dependencies:** T7, T10
**Files:** `e2e/faculty.spec.ts`
**Scope:** S

### Checkpoint: Complete
- [ ] All four routes work, both locales; teacher grouping/filter; gender placeholder; mega-menu; JSON-LD; sitemap.
- [ ] `pnpm lint`, `pnpm test`, `pnpm test:e2e`, `pnpm build` all green.
- [ ] Ready for review.

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Mega-menu is net-new (no existing dropdown) — a11y/mobile complexity | Med | Isolate in own component; reuse portal pattern already in `header.tsx`; test keyboard + mobile early. |
| `cacheComponents` constraint — no `'use cache'` | Med | Keep flag OFF; rely on `sanityFetch` revalidate+tags only. |
| Slug collisions across locales / empty slugs | Low | Dual-slug query + required slug validation; `notFound()` guard. |
| Seed script writes live dataset | Med | Manual run only, read-before-run, documented; prefer dev dataset. |
| Teacher list scale (client filter on large set) | Low | Server fetch once; lightweight client filter; revisit pagination only if needed. |

## Open Questions (from spec, non-blocking)

1. Director rank field vs `displayOrder` only — default `displayOrder`.
2. Homepage/About "Meet our team" teaser — default out of scope.
3. Teacher search fields — default name + subject + specialization.

## Parallelization

- After Phase 1 checkpoint: **Directors (T5–T7)** and **Teachers (T8–T10)** slices are independent → parallelizable.
- T11/T12 need both slices done. T13 needs T6+T9. T14 needs T1–T3.
- Sequential within each slice (query → list → detail).
