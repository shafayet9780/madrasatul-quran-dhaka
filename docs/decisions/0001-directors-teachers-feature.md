# ADR-0001: Directors & Teachers profiles — schema model and dynamic rendering

## Status
Accepted

## Date
2026-05-29

## Context
The site needed public, browsable profiles for the school's **Directors** and **Teachers**: a list page plus an individual, SEO-friendly detail page for each, fully editable in Sanity and bilingual (Bengali/English).

Constraints from the existing codebase:
- A `staffMember` schema already powers the About-page leadership grid (modal-based, no slug, no detail route).
- Locales are `bengali`/`english`, `localePrefix: 'always'`; every page lives under `/[locale]/...`.
- **Cache Components is intentionally OFF** and next-intl reads locale via `getMessages`/`getTranslations` (which use `headers()`), so the `[locale]` layout is inherently dynamic.
- Teachers can grow large and need grouping; directors are few and need a richer profile (welcome message).
- Photos must respect Islamic modesty guidelines — female staff typically have no photo.

## Decisions

### 1. New `director` + `teacher` + `department` document types (not a reuse/extension of `staffMember`)
`staffMember` is left untouched so the About page keeps working. Directors and Teachers are independent types with their own slugs and fields. `department` is its own referenced document so teachers can be grouped/filtered and departments managed centrally.

### 2. Dedicated route per profile (not a modal)
`/[locale]/{directors,teachers}/[slug]` — individually shareable, indexable URLs with `Person` + `BreadcrumbList` JSON-LD, mirroring the existing `news` list+detail pattern.

### 3. Dynamic rendering — **no `generateStaticParams`** on detail pages
Detail pages are server-rendered on demand (`ƒ`), exactly like `news/[slug]`.

The spec originally called for SSG via `generateStaticParams`. That fails in this project: marking a leaf page as statically generated forces a static render of the whole tree, but the `[locale]` layout performs dynamic IO (next-intl `getMessages()` → `headers()`). The result was `DYNAMIC_SERVER_USAGE` → HTTP 500 on any non-prerendered slug. Removing `generateStaticParams` makes the pages dynamic and lets `notFound()` return a clean 404. This is consistent with `news/[slug]` and with the Cache-Components-OFF note in `CLAUDE.md`.

### 4. Reads go through the cached `sanityFetch` wrapper
Query modules (`src/lib/queries/{directors,teachers,site}.ts`) use `sanityFetch` (revalidate 60s in prod, 0 in dev) with cache **tags** (`director`, `teacher`, `department`, `siteSettings`) so `/api/refresh` can invalidate them via `revalidateTag`.

### 5. Gender-aware avatar fallback
Photo is optional. `resolveProfileImage(photo, gender, placeholders)` returns the photo if present, else a shared per-gender placeholder configured in **Site Settings** (`defaultMaleAvatar` / `defaultFemaleAvatar`), else a generic icon. This honors the modesty requirement without per-row image work.

### 6. Premium "Our People" mega-menu + header re-arrangement
The header gained dropdown/mega-menu rendering (it previously had only flat links). "Our People" shows featured directors (with photos) and department links; About/Academics are simple dropdowns. Mega-menu data is fetched once in the `[locale]` layout (`getPeopleNav`, cached) and threaded through `MainLayout → Header`.

## Alternatives considered
- **Extend `staffMember` with a `role` field** — rejected: coarse Studio UX, mixes the working About-page model with new concerns, harder to give directors vs teachers different fields.
- **Modal detail (like leadership-team)** — rejected: no shareable URL, not individually indexable; weaker SEO.
- **SSG detail pages** — rejected: incompatible with next-intl's dynamic layout under Cache-Components-OFF (see Decision 3).
- **Raw `client.fetch` (like `queries/news-events.ts`)** — superseded by `sanityFetch` here to get tag-based revalidation; functionally equivalent for rendering.

## Consequences
- Profiles are dynamic (`ƒ`), revalidated every 60s and on tag invalidation — fresh content without rebuilds.
- Bilingual slugs are both `Rule.required()`, so Studio blocks publishing a profile without both-language slugs; queries look up `slug.<locale>.current` with no cross-locale fallback (matches `news`).
- List queries are unbounded (`*[_type == ...]`); fine for a faculty of tens. If a roster reaches hundreds, add pagination.
- `getPeopleNav` runs on every page load site-wide (cached) to populate the header.
- JSON-LD is injected via `serializeJsonLd()` which escapes `<` to prevent `</script>` breakout from CMS-authored fields.
