# Spec: Directors & Teachers Profiles

## Context

Madrasatul Quran's site has marketing + CMS pages but no public faculty presence. The school wants to showcase its **Directors** and **Teachers** — each as a browsable list plus an individual, SEO-friendly detail page, fully editable in Sanity. This builds trust with prospective parents and gives each staff member a shareable, indexable profile.

A `staffMember` schema already exists (powers the About-page leadership modal grid). Per decision, it stays untouched — Directors/Teachers are **new, independent** document types. Department becomes its own referenced schema so teachers can be grouped and filtered.

This is a **high-level spec only**, not an execution plan. Phases (Plan → Tasks → Implement) follow after approval.

## Objective

Ship four routes, three new Sanity schemas, a content/query layer, and a premium "Our People" mega-menu.

- **Directors**: `/[locale]/directors` (list) + `/[locale]/directors/[slug]` (detail)
- **Teachers**: `/[locale]/teachers` (list, grouped by department + search/filter) + `/[locale]/teachers/[slug]` (detail)
- All content from Sanity, bilingual (Bengali/English), preview-aware.
- Top-notch UI reusing the existing design system; strong SEO (Person + Breadcrumb JSON-LD, metadata, sitemap, hreflang).

**Success = a parent can browse directors/teachers, filter teachers by department, open any profile at its own URL, in either language, with correct metadata + structured data, and an editor can manage it all in `/studio` with zero code changes.**

## Decisions (locked via interview)

| Topic | Decision |
|---|---|
| Schema strategy | New `director`, `teacher`, **`department`** doc types. `staffMember` left as-is. |
| Detail format | Dedicated route per profile (best SEO), mirroring the `news` list+detail pattern. |
| Teacher list | Grouped by department + client-side search/filter. |
| Navigation | **"Our People" mega-menu** + full header re-arrangement (re-enable hidden pages). |
| Director fields | Shared set + **Director's message** (rich) + **social/contact links**. |
| Teacher fields | Shared set + **subjects taught** + **years of experience** + **specializations**. |
| Public contact | **None** on profiles (privacy). General Contact-page CTA only. |
| Bio format | **Short plain summary** (cards + meta) + **rich portable-text full bio** (detail). |
| Photos / modesty | `gender` field on both types. **Photo optional**; female (and any photo-less) profiles render a **shared gender-aware placeholder** image configurable in Site Settings. |

## Tech Stack

Next.js 16 App Router · React 19.2 · Sanity v5 / next-sanity 13 · next-intl v4 · Tailwind v4 · TypeScript. Animations: GSAP (existing). Package manager: **pnpm**.

## Commands

```bash
pnpm dev          # develop
pnpm lint         # eslint
pnpm test         # vitest unit
pnpm test:e2e     # playwright route smoke (port 3100)
pnpm build        # verify build + generateStaticParams
```

## Schemas (high level)

Mirror existing multilingual conventions: every user-facing text is an object `{ bengali, english }`; bilingual `slug` (dual `slug.bengali.current` / `slug.english.current`); images carry required `alt`; `displayOrder` for sorting; preview + orderings configs.

**`department`** (new, referenced):
`name` (ML), `slug` (ML), `description?` (ML), `displayOrder`. Optional `icon`/`accentColor` for mega-menu + section styling.

**Shared profile fields** (both `director` & `teacher`):
`name` (ML), `slug` (ML), `designation/position` (ML), `gender` (`male`|`female`), `photo?` (optional image, modesty note), `summary` (ML plain — cards + SEO description), `fullBio` (ML portable text), `qualifications` (ML string arrays), `education[]` (degree/institution/year, like staffMember), `displayOrder`, `featured?`.

**`director`** adds: `message` (ML portable text — "Director's message"), `signatureName?`, `socialLinks[]` (label + url; e.g. email/LinkedIn/Facebook).

**`teacher`** adds: `department` (reference → `department`, required), `subjects` (ML string array), `yearsOfExperience` (number), `specializations` (string array).

**Site Settings** extension: `defaultMaleAvatar`, `defaultFemaleAvatar` (images) for the photo-less fallback.

Register in `sanity/schemas/index.ts`; add filtered desk sections in `sanity/structure.ts` (Directors list; Teachers → All / by department / Featured; Departments).

## Architecture / Reuse

- **Routes** mirror `src/app/[locale]/news/{page.tsx,[slug]/page.tsx}`: server pages fetch + `notFound()`, pass typed data into `'use client'` components. `generateStaticParams` over locale×slug; `generateMetadata` per profile.
- **Queries**: new `src/lib/queries/directors.ts` + `teachers.ts` (+ department helper), following `src/lib/queries/news-events.ts` (dual-slug `*[_type==... && slug.$lang.current==$slug][0]`). Add matching `getAll*/get*BySlug` methods to `ContentService` (`src/lib/content-service.ts`) for the façade/preview path; teachers query joins department via `->`.
- **Types**: extend `src/types/sanity.ts` — `Department`, `Director`, `Teacher` reusing `MultilingualText`, `MultilingualSlug`, `SanityImage`, `Education`.
- **Rendering**: resolve text via `getLocalizedText` / `getLocalizedArray` / `getLocalizedSlug` (`src/lib/sanity-utils.ts` / `multilingual-content.ts`); font via `getFontClass`.
- **UI primitives**: `Card`, `Grid`, `Container`, `Section`, `Typography` (`src/components/ui/`); `AvatarImage` / `CardImage` (`optimized-image.tsx`) with gender-aware placeholder fallback; rich bio via `rich-text.tsx`. New components under `src/components/directors/` and `src/components/teachers/` (list, card, detail, + teacher department-filter/search bar). Hero/page-header pattern from existing pages.
- **Nav**: rebuild `src/components/layout/header.tsx` — current flat `navigationItems` array has **no dropdown rendering yet**, so the "Our People" mega-menu (desktop) + accordion (mobile) is net-new. Re-enable About/Academics/News. Add `navigation.*` keys to `messages/{bengali,english}.json`.
- **SEO**: add `generatePersonStructuredData` to `src/lib/seo.ts` (reuse breadcrumb + hreflang helpers); add directors/teachers to `generateDynamicSitemap` in `src/lib/sitemap.ts`. Only `cdn.sanity.io` images (already whitelisted).
- **Seeding**: a one-shot `scripts/populate-faculty-data.*` (read-before-run convention) for departments + sample profiles.

## Testing Strategy

- **Vitest** unit: query string shape, multilingual + gender-placeholder resolution helpers, teacher department-grouping/filter logic.
- **Playwright** smoke (`e2e/`, port 3100): both list routes + a sample detail route render 200 in each locale; `notFound` on bad slug.
- **Manual/MCP**: `/studio` CRUD round-trip; locale switch keeps slug mapping; build emits static params; JSON-LD validates.

## Boundaries

- **Always**: match existing multilingual/slug/preview conventions; reuse design-system + UI primitives; keep `cacheComponents` OFF and no `'use cache'` (next-intl); run lint + tests before commit; `pnpm` only.
- **Ask first**: any change to existing `staffMember` / About leadership; new dependencies; header re-arrangement beyond the approved structure; editing `next.config.ts`.
- **Never**: expose personal contact on profiles; upload/display female photos against modesty rule; commit secrets/tokens; touch unrelated pages.

## Open Questions (non-blocking; default if no answer)

1. Do directors need an explicit rank/title separate from `designation` for ordering, or is `displayOrder` enough? *(Default: `displayOrder`.)*
2. Should the homepage/About surface a "Meet our team" teaser linking here? *(Default: out of scope this round.)*
3. Teacher search: name only, or name + subject + specialization? *(Default: name + subject + specialization.)*

## Verification (end-to-end)

1. `pnpm dev` → seed via script → confirm Directors/Teachers/Departments appear in `/studio`.
2. Visit all four routes in `/bengali` and `/english`; verify mega-menu links, teacher department grouping + search, gender placeholder for photo-less profiles.
3. View-source a detail page: correct `<title>`/description, Person + Breadcrumb JSON-LD, hreflang alternates.
4. `pnpm build` succeeds (static params generated); `pnpm test` + `pnpm test:e2e` green.
