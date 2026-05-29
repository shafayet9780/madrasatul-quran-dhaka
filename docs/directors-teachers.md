# Directors & Teachers profiles

Public, bilingual profiles for the school's directors and teachers — a list page plus an SEO-friendly detail page for each, fully editable in Sanity. See [ADR-0001](./decisions/0001-directors-teachers-feature.md) for the design rationale.

## What was built

### Routes
| Route | Rendering | Purpose |
|-------|-----------|---------|
| `/[locale]/directors` | dynamic | Grid of directors |
| `/[locale]/directors/[slug]` | dynamic | Director profile (message, bio, qualifications, education, social links) |
| `/[locale]/teachers` | dynamic | Teachers grouped by department, with search + department filter |
| `/[locale]/teachers/[slug]` | dynamic | Teacher profile (bio, subjects, experience, qualifications, education, specializations) |

Detail pages emit `Person` + `BreadcrumbList` JSON-LD; all four are added to `sitemap.xml` (list pages + per-profile detail URLs, both locales).

### Sanity schemas (`sanity/schemas/`)
- **`department.ts`** — `name`, `slug`, `description`, `accentColor`, `displayOrder`. Referenced by teachers.
- **`director.ts`** — shared profile fields + `message` (rich), `socialLinks`, `signatureName`.
- **`teacher.ts`** — shared profile fields + `department` (reference, required), `subjects`, `yearsOfExperience`, `specializations`.
- **`shared.ts`** — field builders (`mlString`, `mlText`, `mlPortable`, `mlSlug`, `profilePhoto`, `genderField`, `educationField`, …) reused across the three schemas.
- **`siteSettings.ts`** — added `defaultMaleAvatar` and `defaultFemaleAvatar` (the photo-less fallbacks).

Studio: "Directors", "Teachers" (All / Featured), and "Departments" sections in `sanity/structure.ts`.

### Code map
| Concern | Files |
|---------|-------|
| Queries (cached, tagged) | `src/lib/queries/{directors,teachers,site}.ts` |
| Types | `src/types/sanity.ts` (`Department`, `Director`, `Teacher`, `ProfileSocialLink`) |
| Avatar fallback logic | `src/lib/profile-avatar.ts` (+ `.test.ts`) |
| Teacher grouping/filter | `src/lib/teacher-grouping.ts` (+ `.test.ts`) |
| Shared UI | `src/components/people/` (`profile-avatar`, `people-hero`, `profile-sections`) |
| Directors UI | `src/components/directors/` |
| Teachers UI | `src/components/teachers/` |
| Nav mega-menu | `src/components/layout/header.tsx` (+ `main-layout.tsx`, `[locale]/layout.tsx`) |
| SEO | `src/lib/seo.ts` (`generatePersonStructuredData`, `serializeJsonLd`), `src/app/sitemap.ts` |
| Tests | `e2e/faculty.spec.ts` |

### Key behaviors
- **Bilingual** — every text field has Bengali/English variants; rendered via `getLocalizedText` / `getLocalizedArray` and `getFontClass` (locale-aware font).
- **Gender-aware photos** — photo optional; female / photo-less profiles fall back to the Site Settings placeholder for their gender, then to a generic icon.
- **Teacher search/filter** — client-side over the fetched set: search matches name + subjects + specializations; department chips filter; deep-linkable via `/teachers?department=<slug>`.
- **No personal contact** on profiles by policy (directors may expose curated social links only).

## Commands
| Command | Description |
|---------|-------------|
| `pnpm dev` | Develop |
| `pnpm setup:faculty` | Seed demo departments/directors/teachers (writes live dataset) |
| `pnpm test` | Unit tests (incl. avatar + grouping) |
| `pnpm test:e2e` | Playwright route smoke (port 3100) |
| `pnpm build` | Production build |

---

## Demo seeding guide

The seed script populates a realistic starter set so the pages render immediately.

> **⚠️ Writes to the LIVE Sanity dataset** named in `.env.local` (`NEXT_PUBLIC_SANITY_DATASET`). Use a development dataset if you don't want demo docs in production. Re-running is safe — it uses stable `_id`s with `createOrReplace`, so it updates the same documents instead of duplicating.

### Prerequisites
`.env.local` must contain a **write-capable** token:
```
NEXT_PUBLIC_SANITY_PROJECT_ID=...
NEXT_PUBLIC_SANITY_DATASET=...
SANITY_API_TOKEN=...        # Editor/write token
```

### Run
```bash
pnpm setup:faculty
# → ✓ department: department.islamic-studies
#   ✓ director:   director.chairman
#   ✓ teacher:    teacher.1
#   ... Seeded N documents.
```

### What it creates (`scripts/populate-faculty-data.js`)
- **3 departments** — Islamic Studies, NCTB Curriculum, Co-curricular.
- **2 directors** — a male Chairman and a **female Principal with no photo** (demonstrates the gender placeholder).
- **3 teachers** — across departments, mixed gender, with subjects and years of experience.

All documents are bilingual with both-language slugs. No images are attached.

### Finish the setup (recommended)
1. Open `/studio` → **Site Settings** → upload **Default Male Avatar** and **Default Female Avatar**. Without these, photo-less profiles show a generic icon instead of a branded placeholder.
2. (Optional) Open individual directors/teachers and upload photos (male staff), fill the rich **Director's Message** / **Full Biography**.

### Verify
```bash
pnpm dev
```
- Visit `/bengali/directors` and `/english/directors` — cards render; click through to a profile.
- Visit `/teachers` — teachers are grouped by department; try the search box and the department chips; confirm `/teachers?department=islamic-studies` pre-filters.
- The female Principal with no photo should show the female placeholder (or generic icon if avatars aren't set).
- View-source a profile page → confirm `Person` and `BreadcrumbList` JSON-LD blocks.

### Remove demo data
Delete the seeded documents in `/studio` (they have predictable IDs like `director.chairman`, `teacher.1`, `department.islamic-studies`), or via the Sanity CLI.
