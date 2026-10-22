---
name: "Madrasatul Quran, Dhaka"
description: "A warm cream and deep-brown school site that proves the 50-50 model with its own graphics."
colors:
  cream: "#F4ECDD"
  paper: "#FBF7EF"
  surface: "#FFFDF8"
  sand: "#EBD5B3"
  sand-deep: "#E3C9A6"
  sand-pale: "#EFE3CF"
  dark: "#2C1F15"
  panel: "#3A2A1E"
  ink: "#2B1608"
  ink-body: "#4A2810"
  ink-muted: "#6B4526"
  ink-faint: "#8C7158"
  on-dark: "#F4ECDD"
  on-dark-body: "#E3D3B8"
  on-dark-muted: "#CDB99A"
  on-dark-faint: "#A8916F"
  rust: "#8A3F0A"
  rust-deep: "#5C2A08"
  on-rust-soft: "#FBE6D2"
  clay: "#9E5420"
  bronze: "#C58A4B"
  bronze-light: "#E2A867"
  open: "#5FC383"
  whatsapp-brand: "#25D366"
  whatsapp-brand-deep: "#1DA851"
  line: "#E4D5BC"
  line-strong: "#D9C3A0"
  line-sand: "#D9BE95"
  line-bronze: "#B98A5E"
  line-dark: "#4B372A"
  line-dark-strong: "#68503E"
typography:
  display:
    fontFamily: "'Anek Latin', 'Anek Bangla', system-ui, sans-serif"
    fontSize: "clamp(6.5rem, 13vw, 11rem)"
    fontWeight: 800
    lineHeight: 0.92
    letterSpacing: "-0.02em"
  hero:
    fontFamily: "'Anek Latin', 'Anek Bangla', system-ui, sans-serif"
    fontSize: "clamp(2.375rem, 4.2vw, 3.75rem)"
    fontWeight: 750
    lineHeight: 1.16
    letterSpacing: "-0.01em"
  hero-english:
    fontFamily: "'Anek Latin', 'Anek Bangla', system-ui, sans-serif"
    fontSize: "clamp(2.25rem, 3.7vw, 3.25rem)"
    fontWeight: 750
    lineHeight: 1.16
    letterSpacing: "-0.01em"
  h2:
    fontFamily: "'Anek Latin', 'Anek Bangla', system-ui, sans-serif"
    fontSize: "clamp(1.875rem, 3.4vw, 2.875rem)"
    fontWeight: 750
    lineHeight: 1.14
  h3:
    fontFamily: "'Anek Latin', 'Anek Bangla', system-ui, sans-serif"
    fontSize: "clamp(1.5rem, 2.4vw, 2rem)"
    fontWeight: 750
    lineHeight: 1.2
  h4:
    fontFamily: "'Anek Latin', 'Anek Bangla', system-ui, sans-serif"
    fontSize: "clamp(1.3125rem, 2vw, 1.625rem)"
    fontWeight: 700
    lineHeight: 1.25
  lead:
    fontFamily: "'Anek Latin', 'Anek Bangla', system-ui, sans-serif"
    fontSize: "clamp(1.125rem, 1.6vw, 1.3125rem)"
    fontWeight: 400
    lineHeight: 1.6
  body:
    fontFamily: "'Anek Latin', 'Anek Bangla', system-ui, sans-serif"
    fontSize: "17px"
    fontWeight: 400
    lineHeight: 1.6
  body-sm:
    fontFamily: "'Anek Latin', 'Anek Bangla', system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.6
  caption:
    fontFamily: "'Anek Latin', 'Anek Bangla', system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "'Anek Latin', 'Anek Bangla', system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 650
    lineHeight: 1.35
  figure-xl:
    fontFamily: "'Anek Latin', 'Anek Bangla', system-ui, sans-serif"
    fontSize: "clamp(2.75rem, 5vw, 4.5rem)"
    fontWeight: 800
    lineHeight: 1
  figure-lg:
    fontFamily: "'Anek Latin', 'Anek Bangla', system-ui, sans-serif"
    fontSize: "clamp(2.5rem, 4.4vw, 3.75rem)"
    fontWeight: 800
    lineHeight: 1
  figure-md:
    fontFamily: "'Anek Latin', 'Anek Bangla', system-ui, sans-serif"
    fontSize: "clamp(2.5rem, 4vw, 3.5rem)"
    fontWeight: 800
    lineHeight: 1
  figure-sm:
    fontFamily: "'Anek Latin', 'Anek Bangla', system-ui, sans-serif"
    fontSize: "1.75rem"
    fontWeight: 800
    lineHeight: 1
  quote-xl:
    fontFamily: "'Tiro Bangla', 'Anek Bangla', serif"
    fontSize: "clamp(1.5rem, 2.6vw, 2.125rem)"
    fontWeight: 400
    lineHeight: 1.5
  quote-lg:
    fontFamily: "'Tiro Bangla', 'Anek Bangla', serif"
    fontSize: "clamp(1.1875rem, 1.9vw, 1.5rem)"
    fontWeight: 400
    lineHeight: 1.6
  quote:
    fontFamily: "'Tiro Bangla', 'Anek Bangla', serif"
    fontSize: "clamp(1.125rem, 1.6vw, 1.25rem)"
    fontWeight: 400
    lineHeight: 1.65
  letter:
    fontFamily: "'Tiro Bangla', 'Anek Bangla', serif"
    fontSize: "clamp(1.125rem, 1.6vw, 1.3125rem)"
    fontWeight: 400
    lineHeight: 1.75
rounded:
  chip: "6px"
  cell: "10px"
  photo: "14px"
  card: "18px"
  panel: "20px"
  pill: "9999px"
spacing:
  gutter: "clamp(1rem, 4vw, 2.5rem)"
  section: "clamp(4rem, 8vw, 7rem)"
  page: "77.5rem"
  narrow: "51.25rem"
---

# Design System: Madrasatul Quran, Dhaka

Source of truth: `src/styles/tokens.css` (Tailwind v4 `@theme`) and the components in `src/components/homepage`, `src/components/admissions`, `src/components/curriculum`, `src/components/contact`, `src/components/about`, `src/components/layout` and `src/components/site`, built from the owner-approved homepage canvas (October 2026) and carried to the Admissions and Curriculum pages. This file and the Claude design system ("Madrasatul Quran") are written from the repo; when they disagree, the repo wins. The frontmatter is generated from `tokens.css`.

## Overview

**Creative North Star: "The School That Shows Its Working"**

A warm, cream-and-brown page that argues with its own diagrams instead of slogans. The school's claim (Islamic and general education given equal weight) is drawn, not asserted: a giant solid/outlined ৫০/৫০, a stage split whose tiles are sized by the real percentages, the ten-year map, the school day with each stage's hours on one axis, the van routes and a sketch of the walk from the metro. Real photographs of the school sit between the diagrams, captioned underneath.

The public website of Madrasatul Quran, an Islamic day school in Uttara, Dhaka (Nursery to Class 11). Its promise is the 50/50 model: Islamic and general education carry equal weight in one ten-year plan, with hifz done in a day-care format without dropping general study. The readers are practising, educated guardians in Dhaka who compare schools over weeks, mostly on Android phones, and share links in family WhatsApp groups. Every page has one job: help a guardian understand the model, trust the people and the service, and take the next step (apply, download the prospectus, visit, call).

The site is bilingual. Bengali is the default and is designed first; English mirrors it.

Rejected (owner, 2026-10-10): the austere white signage look; traditional or ornamental Islamic decoration; a photo carousel over a slogan; a people grid.

## Content fundamentals

- **Facts come from a source.** Every claim traces to the prospectus, the CMS (Sanity) or the school. Never invent a number, a schedule, a result or a quote. A missing fact stays a visible placeholder in brackets: `[শেষ তারিখ]`, `[deadline]`.
- **Goals are labelled as goals.** Targets such as ৩০০+ হাদিস and ৯০%+ কুরআনের অর্থ appear under the word লক্ষ্য (goal), never as results.
- **Numbers on the homepage come from the CMS** (`siteSettings.statistics`) and are rounded down with a plus: steps of 10 from 100, steps of 5 below (130 → ১৩০+, 28 → ২৫+). A ratio (১:৫) is worked out from the exact values.
- **Bengali numerals in Bengali copy** (৭:০০, ১৩০+, ৫০/৫০); Latin numerals in English.
- **Words the school uses:** শিক্ষার্থী / "student" (never "pupil"); সালাত (not নামাজ); অভিভাবক / "guardian". Terms of the hifz routine (সবক, সাত সবক, আমুখতা, মাশক) keep their names and get a short gloss the first time.
- **Board path:** Dakhil is the only board path; never SSC. The school runs in three stages (প্রি-হিফজ, হিফজ, আফটার হিফজ from Class 6 to Mutawassita, Dakhil inside it). After Dakhil a student goes on to Mutawassita here or to college; the Curriculum page also names Kafiya at a Qawmi madrasa, as the prospectus does. Do not mention Alim or Sanawiya.
- **The prospectus is the source of truth** for the curriculum; the detailed curriculum PDF only adds each class's books.
- **Punctuation:** no em dashes or en dashes in either language; use a comma, a full stop or the danda (।).
- **No decorative Arabic** (no calligraphy as ornament, no Bismillah banners). Quranic text appears only as content, with reverence.
- **No fees on the homepage.** Fees live on the admissions page and the prospectus.
- **Quotations are word for word.** Guardian reviews render only with the guardian's consent recorded in the CMS, exactly as written; a translation is marked (অনুবাদ) / (translated).
- **Tone:** plain, warm, factual. Short sentences. Lead with what the school does, not with adjectives. No exclamation marks, no superlatives ("best", "leading"), no emoji.
- **New copy needs the owner's sign-off** before it ships.

Example, the hero: **মাদরাসাতুল কুরআন** / ইসলামি ও সাধারণ শিক্ষার আদর্শ সমন্বয়, with two actions only: আবেদন করুন (apply) and the prospectus download.

## Visual foundations

**Colour.** One warm brown family; light and dark sections alternate down the page.
- Light sections sit on `cream` or `paper`; cards on them use `surface` with a `line` border. Text: `ink` for headings, `ink-body` for running text, `ink-muted` for captions. `ink-faint` is for icons only.
- Dark sections sit on `dark`; cards inside use `panel`. Text: `on-dark`, `on-dark-body`, `on-dark-muted`, `on-dark-faint`. Dividers `line-dark`; frames `line-dark-strong`.
- `rust` fills exactly one thing: the primary apply button (text `surface`, shadow `shadow-button`). It is never a chip or a section colour, so the apply action is always the one rust thing on screen. The rust pre-admission card near the page end is the single rust block, with `on-rust-soft` for its secondary text. The only other rust is a line, never a fill: the 4px slash in the ৫০/৫০ mark and text links such as "the full plan".
- Subjects have fixed colours from one family. In the stage split's tiles: Quran `bronze`, Arabic (or Arabic and Islamic) `clay`, general `cream`. In the curriculum map's lanes: Quran `rust-deep`, Arabic `clay`, Islam `sand-deep` with a `line-sand` edge, general `paper` with a `line-bronze` edge.
- `bronze` is decoration: rules and subject fills. It is never text on a light section.
- Green appears in two places only: the `open` dot that says the office is open now, and WhatsApp's own green (`whatsapp-brand`) on WhatsApp's logo and buttons, so a guardian knows it at a glance. No other green buttons, and never a green band, card or text (owner, 2026-10-15: a whole green section looked wrong).

**Type.** Anek for everything: Latin from Anek Latin, Bengali from Anek Bangla, through one stack (`sans`). Tiro Bangla (`quote`) is only for Bengali quotations; English quotations stay in sans. In a Tiro quotation, set the danda (।) in Anek. Weights: 400 text, 650 links, buttons and labels, 700 card titles, 750 headings, 800 figures. The fonts load without the width axis, so never use `font-stretch`. Headings, the lead and figures are fluid between phone and desktop; text steps (`text-11` to `text-19`) are fixed. Bengali running text keeps a line height of at least 1.5. Nothing is set below 11px.

**Layout.** Every section is full-bleed colour with its content in `page-wrap`: up to `page` (1240px) of content with the `gutter` (16px phone to 40px desktop) outside it on each side; vertical padding `section` (64px to 112px). Section openings (the H2 and its lead) sit in `narrow` (820px); running text stays under about 40em. Design for a 390px phone first: the curriculum map runs top to bottom below 1200px and as 13 class columns by four subject rows from 1200px.

**Shape.** `radius-card` (18) for cards, `radius-panel` (20) for large panels, `radius-photo` (14) for every photo, `radius-cell` (10) for map cells and split tiles, `radius-chip` (6) for chips, fully round pills for buttons and tabs.

**Depth.** Flat colour does most of the work. Shadows are warm and soft and used by role: `shadow-photo` under hero photos, `shadow-raise` for a raised card on dark, `shadow-button` under the apply button, `shadow-bar` above the phone's sticky apply bar, `shadow-frame-dark` for photos on dark. No shadow on ordinary cards.

**Texture.** One texture, on the footer only: a faint dot grid (`texture-dots`, cream dots at 10% every 24px on `dark`). It marks the end of the page, so no other section uses it.

**Imagery.** Photographs of the school itself, in `radius-photo` frames. The hero photos and the play spaces come from the CMS; the campus, van, reason and founder photos are files in `public/images/home`, and the Campus page's launch-day rooms in `public/images/campus`; the Campus page's stops and photos come from Studio once it has them, and the gallery's albums from Studio → Gallery (videos stay on YouTube). The photo shoot comes after launch; until then an empty photo slot shows a placeholder (`sand-pale` on light, `panel` on dark) that names the photo to come in brackets.

**Motion.** Motion only where it explains something: numbers count up once in view; the split tiles glide between stages (`ease-out-expo`, 700ms); the curriculum map and the van routes draw with scroll; buttons and FAQ answers move a little (`ease-standard`). In the hero, one photo tile at a time cross-fades about every five seconds, and it can be paused. The Campus page plays one school day beside its text (CampusTour): the sky, the clock, the chips and the lift follow the stop in view, and each stop's own motion follows the scroll. Animate only transform, opacity and clip-path. The H1, the buttons and the first photo never fade in, reading text never animates, and nothing loops except the hero photos. `prefers-reduced-motion` turns all of it off, and every element must look complete without its animation.

**Accessibility.** Every text pair named in a token's note passes WCAG AA (4.5:1). Pages are server-rendered, so all content is in the HTML for search engines and answer engines. Form inputs are at least 16px on phones.

## Iconography

Phosphor icons, regular weight, copied as SVG from `@phosphor-icons/core` 2.1.1 (the set in Assets › Icons is every icon the homepage uses). Draw them inline at 18 to 24px, filled with the text colour around them (`ink-muted` on light, `on-dark-muted` on dark). An icon sits next to a word and never replaces it, except the social links in the footer, which carry an accessible name. No emoji, no icon fonts.

## Using this system in the code

The source of truth is the repo: `src/styles/tokens.css` (Tailwind v4 `@theme`) and `src/lib/fonts.ts`. Token names here match the repo's Tailwind classes:
- Colours: `bg-cream`, `text-ink-muted`, `border-line`, `bg-rust` (CSS `var(--color-rust)`).
- Type: `text-hero`, `text-h2`, `text-figure-lg`, `text-17`, `font-sans`, `font-quote`, `font-heading` (750), `font-strong` (650).
- Layout: `page-wrap` (a section's content box), `py-section`, `max-w-narrow`.
- Shape and depth: `rounded-card`, `rounded-photo`, `shadow-photo`, `texture-dots` (footer only).
- Motion: `ease-out-expo`, `ease-standard`, and `motion-safe:animate-settle` (hero photos), `animate-rise` (hero chips), `animate-tile-in` (a hero tile's next photo), `draw-x` / `draw-y` (the curriculum map's scroll-driven draw), `route-stop` / `route-line` (the van routes drawing down to the school), `animate-answer` (an FAQ answer easing in as it opens); the Campus page's stage has its own stylesheet (`src/components/campus/campus-day.css`); the scroll-driven ones are already off under reduced motion.
- Icons: `<Icon name="…" />` (`src/components/site/icon.tsx`); buttons: `<ButtonLink>` (`src/components/site/button.tsx`).

The admin and the survey pages are outside this system: they keep their own shared design.

## Components

The homepage, top to bottom, then the site chrome. Each has a preview in the Claude design system.

### SiteHeader

The header on every public page (`src/components/layout/site-header.tsx`, a server component, with the menu in `site-nav.tsx`): the logo and name, the main menu, the language switch. It scrolls away with the page.

- Logo: `siteSettings.logo` at 42px. Name `text-18` 700, place `text-13` `ink-muted`. The logo is the link home.
- Menu: আমাদের সম্পর্কে (the board and advisors; it replaced the আমাদের সদস্যবৃন্দ dropdown in October 2026), কারিকুলাম, ক্যাম্পাস, গ্যালারি, ভর্তি, যোগাযোগ, আমাদের বইসমূহ ↗ (opens alquranervasha.com in a new tab). Labels: `messages` `site.nav`.
- Site Settings → Navigation decides what shows (`siteNav` in `src/lib/site/nav.ts`): আমাদের সম্পর্কে follows Our people and shows while the directors or the advisors do; ক্যাম্পাস follows Campus (`showCampus`); গ্যালারি shows only once Gallery (`showGallery`) is switched on, so the menu never links to an empty gallery; নোটিশ (before যোগাযোগ) likewise once the notice board (`showNotices`) is. The footer's Pages list follows the same switches.
- From 1180px: one row of links. The menu can still hold a dropdown group (none today): it opens on hover or click, Escape or a click elsewhere closes it; its panel is `surface`, `line` border, `radius-card`, `shadow-photo`.
- Below 1180px: a মেনু / Menu pill (Phosphor list, ✕ while open) opens the same links under the header. Below 480px the language switch moves to the top of that menu, so the row fits a 360px phone.
- The page you are on (`aria-current="page"`, also its subpages): `rust` with a 2px underline 10px below in the row; `rust` 650 in the phone menu; `cream` behind it in a dropdown.
- The language switch (`quiet` pill) opens the same page in the other language.

### AdmissionBanner

The site-wide pre-admission strip above the header (`src/components/layout/admission-banner.tsx`): shown while the form is open or announced, hidden otherwise.

- Data: the intake from the pre-admission form in the CMS (`getAdmissionCta`): the session and the real status line ("আবেদন চলছে, শেষ সময় …"); never a placeholder date.
- An `open` dot when open, `on-dark-faint` when announced; a `light` `sm` button (apply, or details when not open yet). No close button.

### Button

Pill links (`ButtonLink`, `src/components/site/button.tsx`): `primary` (rust) is the apply action and nothing else; `outline` is the second action on light sections; `light` and `outline-dark` sit on dark sections and bars; `quiet` is the language switch; `whatsapp` (WhatsApp's green, `ink` text) is for WhatsApp links only.

- Props: `href` (pages go through next/link; `/api/…` files, downloads and other sites are plain links), `variant`, `size` (`lg` 56px / 18px, `md` 44px / 15px, `sm` 34px / 14px), children (text, an optional icon after for "go", before for "download").
- One `primary` per view. Never a rust chip or a rust section beside it.
- Focus: a 2px outline offset 2px, `ink` on light, `bronze-light` on dark.

### Hero

The homepage opener (`Hero`, `src/components/homepage/hero.tsx`): the H1 (name in `rust`, the promise in `ink`, `text-hero`), two buttons only (apply, prospectus download), the photo mosaic and the three HeroChips.

- Photos: `siteSettings.heroImages` from the CMS; alt text is the image title in the page language, else its CMS alt. Three tiles (1.3fr / 1fr, the first spans two rows, `rounded-card`), `clamp(300px, 38vw, 540px)` tall.
- Tiles take turns (`HeroGallery`): every 5 seconds one tile cross-fades to the next photo (`animate-tile-in`, after it has loaded). Paused off-screen, on hover or focus, by its pause button; still under reduced motion. Only with more photos than tiles.
- The H1, the buttons and the first photo never animate; tiles 2 and 3 settle in (`animate-settle`).
- Marked `data-hero`: the phone ApplyBar waits until it has scrolled away.

### HeroChip

The three chips under the hero photos, overlapping them by 40px: the dark ৫০/৫০ chip, then sand (ডে-কেয়ার হিফজ) and paper (আরবি মিডিয়াম) with a rust Phosphor icon.

- Each chip: a short first line (`text-15`, 650) and a quieter second line (`text-13`). Copy lives in `messages/*.json` under `home.hero`.
- Never a rust chip: rust is the apply button.
- On load they rise one after another (`animate-rise`, 240 / 320 / 400ms delays) behind `motion-safe:`.

### NumbersBand

The school in numbers (`NumbersBand`, `src/components/homepage/numbers-band.tsx`), a dark band right after the hero.

- Data: `siteSettings.statistics`. Students and teachers print as a floor with "+" (steps of 10 from 100, of 5 below: 130 → ১৩০+, 28 → ২৫+); the ratio (১:৫) uses the exact values; each `achievements` entry prints as the CMS has it. `graduationRate` and `yearsOfService` never show (`homeStats`, `src/lib/home/stats.ts`).
- Figures `text-figure-lg` in `on-dark`, labels `text-15` `on-dark-muted`, a `line-dark-strong` rule on the left of each.
- The floors count up once when they scroll into view (`CountUp`); the final value is in the HTML from the start, and nothing counts under reduced motion or when already on screen.

### EducationModel

The education model (`EducationModel`, `src/components/homepage/education-model.tsx`; the card is `StageSplit`, `stage-split.tsx`). A `cream` section after the numbers band.

- **The mark:** the H2 (`text-h2`) over ৫০ / ৫০ in `text-display`: the first ৫০ in `ink`, a 4px `rust` slash turned 14°, the second ৫০ in `sand-pale` with a 2px `ink` outline. The mark is `aria-hidden`; a visually hidden line reads "৫০-৫০: ইসলামি ও সাধারণ শিক্ষা, সমান গুরুত্বে".
- **The strands:** Islamic and general, under a 2px `ink` rule; then the lead (`text-lead`).
- **The balance card** (`dark`, `radius-panel`, `shadow-photo`): tabs for the first three stages, the stage's classes and school day, three tiles with the sourced split, a legend, and the note that 50/50 is the overall philosophy, not every timetable.
  - Splits (`STAGE_SPLITS`, `src/lib/home/plan.ts`): Pre-Hifz 25/25/50, Hifz day-care 70/15/15, After-Hifz 50/50 (Arabic and Islamic against general; its Quran slot is empty). No other splits exist.
  - Tile colours: Quran `bronze`, Arabic `clay`, general `cream`, the same family as the curriculum map.
  - **The signature motion:** on a tab change the tiles glide to the new split and the percentages roll (700ms, `ease-out-expo`). Only `clip-path` and `transform` move: each tile is a full-width layer clipped to its share, and a figure is set at `text-figure-xl` and scaled, so a size change glides too. The selected pill is a dark-on-cream copy of the tabs clipped to the selected one, so each label turns dark exactly where the pill covers it.
  - Tabs follow the ARIA tab pattern (arrow keys, Home, End). The tiles are `aria-hidden`; the legend is the text version. Under reduced motion the tiles jump.

### StudyPlan

Nursery to Class 11 in three stages (`StudyPlan`, `src/components/homepage/study-plan.tsx`): a `dark` section with the H2 and lead, then the ten-year map on a `cream` panel, the exits after Dakhil, the AQVI note and a link to the full plan (`/curriculum`).

- **Data** (`src/lib/home/plan.ts`, labels in `home.plan`): 13 classes in three stages (Pre-Hifz Nursery to Class 1, Hifz Classes 2 to 5, After-Hifz Class 6 to Mutawassita, as the prospectus has them); four strands. Quran: Qaida, Ammapara, Nazera, Hifz 1 to 3, Shunani (to Class 5). Arabic language to Class 8. Islamic studies, in Arabic from Class 6. General: Bangla, English, Maths, with science added in Class 5 and BGS from Class 6. Inside After-Hifz, Dakhil (Classes 9 and 10, "বোর্ডের সিলেবাস") and Mutawassita (Class 11, "দাখিলের পর এক বছর") are one block each (`BOARD_BLOCKS`; `dark`, then `panel`), labels in `home.plan.blocks`.
- **Strand colours** (the same family as the stage split): Quran `rust-deep`, Arabic `clay`, Islam `sand-deep` with a `line-sand` edge, general `paper` with a `line-bronze` edge. Stage bands are `dark`. Cells use `radius-cell`.
- **Wide screens (1200px and up):** 13 class columns (the Class 11 column is 1.5 parts so মুতাওয়াসসিতা fits without stretching at 1440; narrower, it may break inside the word) by four 46px lanes. Segment text is `text-12` up to 1440px, then `text-13`.
- **Phones and tablets:** the same map turned top to bottom (see StudyPlanPhone): each stage heads its own rows and a segment is cut where stages meet (`splitAtStages`).
- **Motion:** each strand draws from Nursery onward as the map scrolls in, one after another (`draw-x` / `draw-y` in `tokens.css`, a `clip-path` wipe on a scroll-driven timeline named `--plan`). Labels and class names are there from the start. Pure CSS: browsers without scroll-driven animations, and reduced motion, show the map whole.

### SchoolDay

A day in hifz day-care (`SchoolDay`, `src/components/homepage/school-day.tsx`): a `paper` section after the ten-year map. The H2 and lead, the routine, the stage hours, then the school's transport.

- **The routine** (Studio → Homepage → A day in hifz day-care, through `routineFor` in `src/lib/home/day.ts`; while that is empty, the launch routine: `ROUTINE` with its text in `home.day.parts`): four cards (সকাল, দুপুর, বিকাল, সন্ধ্যা ও রাত) on `surface` with a `line` border and `radius-card`, in an auto-fit grid (250px minimum). Each step: a 36px circle by kind, the time in `rust` (`text-13` 700), the title (`text-16` 650), an optional gloss (`text-13` `ink-muted`) for সবক, সাত সবক, আমুখতা, মাশক. A 2px `sand-pale` rail joins the circles.
  - Kinds: Quran `rust-deep`, classes `clay`, meal and rest `sand`, salat `dark`, play `bronze`, home time `rust`. Phosphor regular icons.
  - Morning times are clock times and never change; afternoon and evening steps are tied to salat (আসরের পর, মাগরিবের পর). Home time is always 8:30 pm. Never invent a step.
  - The routine never animates: it is reading text.
- **Hours by stage:** the first three stages on one 7:00 am to 8:30 pm axis (`STAGE_HOURS`), hifz day-care in `rust`, the others `line-sand`, on a 14px `cream` track. The hours are in the text beside each bar; the bars and ticks are `aria-hidden`.
- **Transport:** the van photo (`radius-photo`, 4:3, at most 420px wide, left on wide screens) beside the H3, the lead and the routes. Routes come from the CMS (Fees & Discounts → Transport → Routes, visible ones in CMS order; no charges on the homepage); the school is added as the last stop. Two route columns on phones, 180px auto-fill from 640px. The transport desk button (`outline`, `rust` edge) shows only when Site Settings has an active phone labelled "Transport".
- **Motion:** each route draws down to the school as it scrolls in: a stop's dot pops, then the link to the next stop draws (`route-stop` / `route-line` in `tokens.css`, scroll timeline `--route`). A dot sits on the first line of its name and each link joins one dot to the next, so wrapped names stay on the line. Names never move; without scroll-driven animations, or with reduced motion, the routes are whole.

### Campus

The campus (`Campus`, `src/components/homepage/campus.tsx`): a `dark` section after the day. The H2 and lead, where the students play, two photos of the school, and the walk from the metro. Copy in `home.campus`.

- **Room to play:** the building photo in the middle, the girls' rooftop garden and the boys' field beside it, each joined to its place on the building by a dashed `bronze-light` line (over a 5px dark halo, so it reads on the photo) ending in a `bronze-light` dot. Lines and dots are `aria-hidden`.
  - Two fixed layouts in % of the collage box: wide from 760px (1160:470, the spaces left and right), tall below (358:700, the spaces above and below, at most 440px wide). Never squeeze one into the other.
  - Each space: a `panel` frame (`radius-photo`, `shadow-frame-dark`) and its title (girls or boys first, then the place) with a quieter line on where it is. The photos come from Studio → Homepage → Play spaces, framed on their hotspot; until one is added the frame is left out and the title and line stand in its place.
- **Photos:** the entrance at dusk and a winter morning in class, 16:10, `radius-photo`, side by side from about 640px; captions `text-14` `on-dark-muted`. They are files in `public/images/home`, like the building and van photos. Below them, once the gallery is on, a `bronze-light` text link with an arrow to it (`home.campus.gallery`).
- **Getting here:** a `panel` card (`radius-panel`). Left, a sketch (not to scale, `role="img"` with the route in its label): the metro line in `rust`, the station in `cream`, the 600 m walk dashed in `bronze`, the school in `rust`. Its labels are set larger below 480px so they stay readable when the sketch is small; it is never wider than 560px. Right, the H3 (the distance from the metro), the address, a landmark, a `light` button to the CMS Google Maps link (hidden without one) and an `outline-dark` button to the Campus page (CampusTour), shown while Site Settings shows Campus.
- No motion: nothing here explains anything by moving.

### Why

Why Madrasatul Quran (`Why`, `src/components/homepage/why.tsx`): a `cream` section after the campus. The H2, the founders' reason in their own words, then eight reasons as cards. Copy in `home.why`. The cards are `ReasonCards` (`src/components/site/reason-cards.tsx`), which the Admissions page reuses for four of them (AdmissionsWhy); the section carries `id="why"` so it can link here.

- **The quote:** from the prospectus, verbatim, with its source under it (`text-14` `ink-muted`). `text-quote-lg` in `ink-body`, at most 40em. Bengali quotations are set in Tiro Bangla (`font-quote`), English in Anek Latin. Each danda is set in Anek Bangla (`QuoteText`, `src/components/site/quote-text.tsx`), as in every quotation on the site.
- **The reasons:** an auto-fill grid, four columns on wide screens and two on phones (`max(150px, 25% - 18px)` minimum). Three looks: `paper` (accent `rust`), `sand` (accent `rust-deep`), `dark` (accent `bronze`), mixed so no two of a kind sit side by side. A card leads with a 16:10 photo, a 48px Phosphor icon in its accent, or a goal figure (`text-figure-md`); the title (`text-18` 700, an `h3`) and one sentence sit at the foot of the card.
  - Goal figures are targets from the prospectus (৩০০+ hadith by Class 9, ৯০%+ of the Quran translated by Dakhil) and always carry the `sand-deep` লক্ষ্য tag: never present a goal as a result.
  - The order and look of each card are in `REASONS`; the photos are files in `public/images/home` until the CMS has them.
- No motion.

### Founder

The founder's letter (`Founder`, `src/components/homepage/founder.tsx`): a `dark` section after Why. No visible heading (the H2 প্রতিষ্ঠাতার কথা is screen-reader only): the quotation is the heading. Copy in `home.founder`, word for word from the founder.

- **Words:** his line on knowledge as the quotation (`text-quote-xl`), then the school's aim (`text-letter`, `on-dark-body`, at most 36em). Bengali in Tiro Bangla (`font-quote`) with each danda in Anek (`QuoteText`); English in Anek Latin.
- **Who:** a duotone portrait, 4:5, `clamp(150px, 16vw, 210px)` wide, `radius-photo`: the photo in grey multiplied onto `sand`, with a `panel` layer on `mix-blend-mode: lighten` lifting its shadows, so any portrait sits in the palette. Beside it, over a `line-dark-strong` rule, the name (23px, Tiro 400 in Bengali) and his roles (`text-14` `on-dark-muted`). The figure ২০০+ matches the numbers band.
- On wide screens the words take three fifths and the portrait two; below about 900px the portrait drops under the words.
- No motion.

### Reviews

What guardians say (`Reviews`, `src/components/site/reviews.tsx`, shared with the Admissions page): a `paper` section after the founder's letter. The H2 with a note on the right (`text-15` `ink-muted`): each review is shared with the guardian's permission, in their own words. Copy in `home.reviews`. On the Admissions page the same section sits on `dark` (`tone="dark"`: `on-dark` heading, `on-dark-muted` note), the cards staying `surface`.

- **Cards:** `surface` with a `line` border, `radius-card`, in an auto-fit grid (300px minimum: three across on wide screens, one on phones). A 30px `bronze` quotes icon, the words (`text-quote`; Tiro Bangla for Bengali with `QuoteText`, Anek Latin for English), then over a `sand-pale` rule who said it (`text-15` 650) and their child's class and stage (`text-13` `ink-muted`).
- **Rules:** quotes stay word for word, never edited or translated into the other language's card; only reviews whose consent is recorded may show; never invent one.
- **Source:** Studio → Guardian reviews (`reviewsFor`, `src/lib/home/reviews.ts`): only reviews with consent ticked and how it was given recorded, not hidden, the first three by order. A translation shows with (অনুবাদ) / (translated) after the class; without one, the guardian's own words show, set in their language. With no such review the section is left out, so the page never shows an empty or invented review.
- No motion.

### HomeNotices

The latest notices (`src/components/notices/home-notices.tsx`), once the notice board is on: a `paper` section after the reviews, with a `line` rule above. Two columns from 768px (5:7): the H2 নোটিশ বোর্ড, a line (`text-17` `ink-muted`) and সব নোটিশ দেখুন with an arrow; then the three latest notices, pinned ones first, as the board's rows without their first line. Left out when there are no notices. Copy in `notices.home`.

### Faq

Questions parents ask (`Faq`, `src/components/homepage/faq.tsx`): a `cream` section after the reviews, with no bottom padding: the pre-admission card follows on the same ground. Copy in `home.faq`. The layout is the shared `FaqSection` (`src/components/site/faq-section.tsx`), which the Admissions page uses too.

- **Left:** the H2 and a line inviting a call, ending in the office number as a `rust` underlined `tel:` link (the CMS admissions phone, printed the local way). Without a phone in the CMS the line is left out.
- **Right:** native `details`/`summary`, so every answer is in the HTML and works without JavaScript; the first is open. Rows sit between `line-strong` rules, at least 88px tall; the question `clamp(17px, 1.5vw, 19px)` 700, a 22px `rust` plus (closed) or minus (open); the answer `text-16` at 1.7 in `ink-body`, at most 40em.
- **Questions:** Studio → Homepage → Questions parents ask (`faqFor`, `src/lib/home/faq.ts`); while that is empty, the launch questions in `home.faq.items`.
- **Search:** the same list is printed as FAQPage JSON-LD in the section, so the visible answers and the structured data never drift apart.
- **Motion:** an answer eases in as it opens (`animate-answer`: 6px and opacity, 280ms `ease-standard`), behind `motion-safe:`.
- Answers stay facts from the prospectus and the school; no fees here (the fees answer points to the admissions page).

### PreAdmissionCard

The homepage's close (`PreAdmissionCard`, `src/components/homepage/pre-admission-card.tsx`): on `cream` straight after the FAQ, the page's one rust block (`rust`, `radius-panel`, text `surface`, secondary text `on-rust-soft`).

- **The intake comes from the CMS** (Studio → Pre-admission form, through `getAdmissionCta`, the same source as the banner and the phone ApplyBar): the title প্রি-অ্যাডমিশন {session} (`clamp(32px, 3.6vw, 48px)` 800) and the live status line with its deadline. While the form is open the line adds that it takes about 15 minutes and the button says আবেদন করুন; while it is only announced the button says বিস্তারিত দেখুন. With no intake open or announced the card says ভর্তি তথ্য and points to the admissions page. Never a placeholder date.
- **Actions:** a `paper` pill (54px, `rust-deep` text, arrow) to the pre-admission page, and an underlined `surface` text link to the campus page. The pill is light on rust, so the apply action stays the one rust thing on screen.
- **What admission needs:** a `dark` at 28% panel (`radius-card`) with a numbered list (28px `paper` circles with `rust-deep` numerals in the page's digits).
- No motion.

### SiteFooter

The footer on every public page (`src/components/layout/site-footer.tsx`, a server component), on `dark` with the footer texture (`texture-dots`: cream dots at 10%, every 24px; used nowhere else, so it marks the end of the page).

- From the CMS: phone desks, emails, address, office hours (`siteSettings.contactInfo`), social links, map link, tagline, mission and copyright (`footer`). Phones print the local way in the page's digits (`sitePhone`).
- Columns: the school (logo, tagline, mission, social pills, the EximusEdu guardian app), পেজ, যোগাযোগ, ঠিকানা; a bottom row with copyright and links (guardian login, books, privacy, cookies).
- Text `on-dark-body`, headings `on-dark` 650, fine print `on-dark-faint`; icons `bronze`.

### ApplyBar

Phones only (below 640px): the pre-admission bar fixed to the foot of the screen (`src/components/layout/apply-bar.tsx`), with a spacer of the same height after the footer so it never covers it.

- On a page with a hero (`data-hero`) it slides up (`translate-y`, `ease-out-expo`) once the hero has scrolled away; on other pages it is there from the start. Hidden and inert while it is down.
- Shows only while the intake is open or announced: the session title (`text-16` 700), the status line (`text-13` `on-dark-muted`), a `light` button.

## Admissions page

ভর্তি ও ফি (`src/app/[locale]/admissions/page.tsx`, components in `src/components/admissions`), top to bottom: AdmissionsHero (`paper`), AdmissionClasses (`dark`), AdmissionSteps (`paper`), AdmissionsWhy (`dark`: the value before the price), AdmissionFees (`paper`: fees, then transport), the homepage's Reviews on `dark` (only once there are consented reviews), the shared FaqSection (`cream`, see Faq) and AdmissionsClose (on the same `cream`). While no intake is open or announced, the classes, the steps and the questions are left out and the opening points to the contact page.

### AdmissionsHero

The Admissions page's opening (`src/components/admissions/admissions-hero.tsx`), on `paper`.

- **Left:** the H1 ভর্তি ও ফি (`text-hero`), a lead (`text-lead`) and the actions. Only while no intake is open or announced (so the site banner is hidden) does the status line sit above the H1, in a `surface` pill with an `ink-faint` dot.
- **Actions:** while the form is open, the rust আবেদন করুন (the page's apply action); while it is only announced, an `outline` বিস্তারিত দেখুন; with no intake, an `outline` ভর্তি বিষয়ে যোগাযোগ to the contact page. Beside it, the `outline` prospectus download.
- **Right, while an intake is open or announced:** a `surface` card (`radius-card`, `line` border) titled প্রি-অ্যাডমিশন {session} (`text-h4`), the status line under the title (green `open` dot while open), then the application and assessment fees, each with its note, the amount at 26px 750. The status sits in the card, not above the H1, because the site banner already shows it at the top of the page.
- **Under it:** "এই পৃষ্ঠায়", links to the page's sections (16px 650, `line-sand` underline turning `rust` on hover), only for the sections shown.
- **Data:** the published Pre-admission form (`getPublishedIntake`, no database, so the page stays cacheable). Never a placeholder date or fee.
- No motion.

### AdmissionClasses

The session's classes (`src/components/admissions/admission-classes.tsx`), on `dark`, while an intake is open or announced.

- **Head:** the H2 যে শ্রেণিতে ভর্তি নেওয়া হচ্ছে and the age note বয়স ধরা হয় ১ জানুয়ারি {year} তারিখে। (`text-19`, `on-dark-body`).
- **Tiles:** youngest first (`classTiles`, `src/lib/admissions/admissions-page.ts`), two to a row on phones, then as many 210px tiles as fit. Each is a `panel` tile (`radius-card`, inset `line-dark` ring): the class name (`text-h4`, as the form writes it) and the age in `bronze-light` (18px 650): "{n} বছর", or "{from} থেকে {to} বছর".
- **By special consideration:** a `line-dark-strong` chip বিশেষ বিবেচনায়, then the form's requirements as a list with `bronze` markers (শুধু মেয়েদের জন্য …).
- **Closed this session:** the tile keeps its place with a dashed `line-dark-strong` border and muted text, and the chip এ বছর ভর্তি বন্ধ.
- **Data:** the published form's class question (ages counted on 1 January of the session, as the form counts them). A class added, closed or reordered in the Studio shows here.
- No motion.

### AdmissionSteps

How admission works (`src/components/admissions/admission-steps.tsx`), on `paper`, while an intake is open or announced: the pre-admission page's six approved steps (`preAdmission.intro.step1` to `step6`).

- An `ol` in columns of at least 300px (three on desktop, one on phones). Each step sits under a `line-strong` rule: a 40px `sand` circle with the number in `rust-deep` (750, the page's digits, hidden from screen readers since the list is ordered), the title (19px 700) and its note (`text-16`, `ink-body`).
- **Step 5 (assessment)** lists what to bring from the CMS (Pre-admission form → Cycle settings → bring list, the assessment fee filled in), with `rust` markers; an item that applies only sometimes ends in (প্রযোজ্য হলে).
- The fees in the notes come from the form (application fee, assessment fee).
- No motion.

### AdmissionFees

What it costs (`src/components/admissions/admission-fees.tsx`): one `paper` band with two sections, between the reasons and the reviews (both `dark`), fees then transport, all from Studio → Fees & Discounts. Fees belong here and in the prospectus, never on the homepage.

- **Fees (`#fees`):** the CMS heading and introduction, then the fee table on a `surface` card (`radius-card`, `line` border): one real `table`, the same on phones (it fits at 320px). Columns: ফি, then the CMS's two column labels (নন ডে-কেয়ার, ডে-কেয়ার) right-aligned under a 2px `ink` rule. Rows grouped (মাসিক ফি; এককালীন ও বাৎসরিক ফি; অন্যান্য ফি) under 13px 650 `rust` group labels; each row the fee name (17px 650), its frequency when the group does not already say it, and its note; amounts in 750 with tabular figures (`৳১০,০০০`), and words (প্রযোজ্য নয়, অফিসে যোগাযোগ করুন) in 14px `ink-muted`. Under the table: সকল পরিমাণ বাংলাদেশি টাকায় and ডে-কেয়ার: ২য় থেকে ৫ম শ্রেণি.
- **Beside it:** `cream` blocks for the visible discounts (`#discounts`: title in `rust`, description, conditions, প্রযোজ্য ফি) and the payment rules (`#payment`: instructions and the policies as a list with `rust` markers).
- **Transport (`#transport`):** the CMS heading and introduction, then a `surface` card (`line` border) per visible route (`buildTransport`): the shared `RouteLine` (`src/components/site/route-line.tsx`, also on the homepage) (stops drawn down to মাদরাসাতুল কুরআন) with the vehicle and monthly charge under the route name. Under the cards, the approved seat note with an info icon, and the transport desk phone (`outline` with a `rust` border) when Site Settings has one.
- **Without usable fee settings:** ফি সম্পর্কিত তথ্য, the CMS's unavailable message and an `outline` button to the contact page.
- **Motion:** only the route lines (`route-stop`/`route-line`, scroll-driven, as on the homepage), off with reduced motion.

### AdmissionsWhy

Why Madrasatul Quran, short (`src/components/admissions/admissions-why.tsx`), on `dark` straight before the fees, so the value comes before the price: four of the homepage's reasons. After the fees come the guardian reviews, also on `dark` (the homepage's Reviews, consented reviews only; with none, left out).

- The homepage H2 কেন মাদরাসাতুল কুরআন? with a `bronze-light` link সব দেখুন (arrow) to the homepage's Why section (`/{locale}#why`), on the right on wide screens and under the H2 on phones.
- The cards are the shared `ReasonCards` (`src/components/site/reason-cards.tsx`, all eight on the homepage) (`only` picks reasons 1, 2, 3 and 5: the blend, the four language skills, the hadith goal with its লক্ষ্য tag, the path after Class 8). On `dark` the dark card turns `panel` (inset `line-dark` ring) so it still shows. Same approved copy (`home.why.reasons`), no new claims.
- No motion.

### AdmissionsClose

The Admissions page's close (`src/components/admissions/admissions-close.tsx`): a `dark` card (`radius-panel`) on `cream` straight after the questions (the shared `FaqSection`, here with the pre-admission page's four questions), like the homepage's pre-admission card but not rust: the rust block belongs to the homepage.

- The H2 ভর্তি নিয়ে কথা বলুন (`text-h3`), the approved line ভর্তির সময়সূচি, ফি বা আপনার সন্তানের বিষয়ে জানতে অফিসে যোগাযোগ করুন। and the office hours from Site Settings with a `bronze-light` clock icon.
- **Actions, in one row:** the rust আবেদন করুন while the form is open; a `light` ভর্তি অফিসে কল করুন (phone icon, the admissions phone); an `outline-dark` হোয়াটসঅ্যাপ. The call and WhatsApp clicks are counted (`admissions_contact`).
- No motion.

## Curriculum page

কারিকুলাম (`src/app/[locale]/curriculum/page.tsx`, components in `src/components/curriculum`), from the prospectus of 14 October 2026 (the source of truth; the detailed curriculum PDF only adds each class's books). Top to bottom: CurriculumHero (`paper`), TeachingModel (`dark`: the 50-50 model and the three stages with their hours), Strands (`paper`), Goals (`dark`), StudyPlanTable with ClassBooks (`cream`), HigherEducation (`dark`) and CurriculumClose (`paper`). No fees on this page: the close links to Admissions. The three stages are the same everywhere (`STAGE_CLASSES` in `src/lib/home/plan.ts`): প্রি-হিফজ নার্সারি to Class 1, হিফজ Classes 2 to 5, আফটার হিফজ Class 6 to Mutawassita with Dakhil inside it.

### OnThisPage

Links to each section of a page, under its opening (`OnThisPage`, `src/components/site/on-this-page.tsx`): used by the Admissions and Curriculum heroes.

- A `nav` named by its label ("এই পৃষ্ঠায়" / "On this page", `text-14` 650 `ink-muted`), above a `line` rule.
- Each link 16px 650 `ink`, a `line-sand` underline 6px below, turning `rust` on hover; 44px tall for touch. A page passes only the sections it shows.

### CurriculumHero

The Curriculum page's opening (`src/components/curriculum/curriculum-hero.tsx`), on `paper`, laid out like AdmissionsHero.

- **Left:** the H1 কারিকুলাম (`text-hero`), the prospectus's one-line summary as the lead, and two `outline` downloads: the detailed curriculum (`/api/download-curriculum`) and the prospectus. No apply button here: the close card carries it.
- **Right:** "এক নজরে", a `surface` card (`radius-card`, `line` border) with five facts (classes, hifz, AQVI books, Islamic studies in Arabic, the board exam) as label and value rows; on a narrow phone a value drops under its label, right-aligned, and hyphenated words stay whole.
- **Under it:** OnThisPage (the five sections).
- Copy: `curriculum.hero`. No motion.

### TeachingModel

The 50-50 model (`src/components/curriculum/teaching-model.tsx`), on `dark`: the prospectus's শিক্ষা পদ্ধতি and its three stages.

- **Top:** the H2 শিক্ষা পদ্ধতি with ৫০-৫০ মডেল on a second line in `bronze-light`; beside it the prospectus's three points (18px, `on-dark-body`), each after a `bronze` dot, divided by `line-dark` rules. The third is the 80-20 contrast.
- **Stages:** an H3, then three `panel` cards (one column on phones, two on tablets with the third across the row, three from 1000px) (স্তর-১ প্রি-হিফজ, নন ডে-কেয়ার; স্তর-২ হিফজ, ডে-কেয়ার; স্তর-৩ আফটার হিফজ, দাখিলসহ, ষষ্ঠ থেকে মুতাওয়াসসিতা). Each card: a 64px row of split tiles (Quran `bronze`, Arabic or Arabic and Islam `clay`, general `cream`; widths are the percentages, `STAGE_SPLITS` in `src/lib/home/plan.ts`), a legend that carries the split as text (the tiles are hidden from screen readers), then classes (`bronze-light`) and hours with a clock icon; on a narrow card a value drops under its label, and the hours never break. Stage 3 adds: after Dakhil, Mutawassita here or college.
- The prospectus's timetable (শ্রেণি বিন্যাস ও সময়সূচি) lives in these cards, so there is no separate table. No motion: the homepage's StageSplit animates; this page shows all three at once.

### Strands

The four strands (`src/components/curriculum/strands.tsx`), on `paper`: the prospectus's কারিকুলাম cards.

- **Top:** the H2 and the prospectus line (NCTB with the school's own Islamic curriculum); beside it the chairman's words on why, from the detailed curriculum, as a quotation: Tiro Bangla (`text-quote-lg`, the danda in Anek via QuoteText) after a 4px `rust` rule, the source in `text-14` `ink-muted`. In English the quotation stays in sans and its source says (translated).
- **Cards:** `surface` with a `line` border, `radius-card`. A 48px icon tile in the strand's colour (Quran `rust-deep`, Arabic `clay`, Islamic studies `sand-deep` with a `line-sand` edge, general `paper` with a `line-bronze` edge), the title (19px 700), the prospectus text, and the class range at the foot above a `line` rule.

### Goals

The prospectus's ten-year goals in Islamic studies (`src/components/curriculum/goals.tsx`), on `dark`: six `panel` cards, three across (two columns from 260px each down to one on phones).

- Each: the title (19px 700) and the prospectus text (`on-dark-body`). The two goals with a figure (Quran ৯০%+, hadith ৩০০+) show it in `bronze` `text-figure-md` beside the title and carry the লক্ষ্য tag (`sand-deep` chip): targets, never results.

### StudyPlanTable

The prospectus's ten-year table, designed (`src/components/curriculum/study-plan-table.tsx`), on `cream`. ClassBooks follows it in the same section.

- **Data:** `planRows()` in `src/lib/curriculum/plan.ts` (unit-tested): Nursery to Class 11 in the three stages; per class the Quran portion (to Class 5, labels `home.plan.segments`), the Arabic and Islamic studies level as the books are named (আরবি-N, আরবি-KG, আরবি-১ … ৮), and the general subjects (science from Class 5, BGS from Class 6). Classes 9 and 10 are a দাখিল block (`dark`); Class 11 is মুতাওয়াসসিতা (`panel`) "অথবা কলেজ".
- **Look:** a `surface` frame (`radius-panel`, `line` border). One `tbody` per stage, headed by a `sand-pale` band (স্তর tag, name, day-care or not, hours). Subjects are chips in the map's colours: Quran `rust-deep`, Arabic `clay`, Islam `sand-deep`, general `paper` with a `line-bronze` edge. During hifz the general chips are only outlined, dashed: limited, on a special syllabus (the legend above the table says so).
- **Below 768px:** the same rows stacked in one card per stage: the stage band, then each class with its age, its Quran, Arabic and Islamic studies chips, and its general subjects in one box (dashed during hifz), so nothing hides off-screen. From 768px the table; where its frame is narrower than the columns it scrolls, as a named, focusable region.
- **Accessibility:** a real `table` with a caption, column headers, a row header per class and `rowgroup` headers for the stages.

### ClassBooks

Books and topics by class (`src/components/curriculum/class-books.tsx`, a client component), under StudyPlanTable on `cream`. From the detailed curriculum PDF: the prospectus has no book names.

- **Tabs:** one pill per class, Nursery to Class 8, then ৯ম ও ১০ম and একাদশ (44px, `line-strong` border on `surface`; the chosen one `dark`). A real tablist: arrow keys, Home and End move between classes.
- **Panel:** a `surface` card (`radius-panel`): the class (`text-h3`), its age and stage tag, then four lanes on `paper` with a 4px top edge in the subject colour: কুরআন (to Class 5 only), আরবি with its level, book and focus, ইসলাম শিক্ষা likewise, and সাধারণ with the subjects and a note (AQVI books for Nursery and KG, limited during hifz, else NCTB). Dakhil and Mutawassita show their board syllabus in one block.
- **Server HTML:** every panel is rendered, the unselected ones `hidden`, so search engines and readers without JavaScript get all twelve. Copy: `curriculum.books`.
- Beside the heading, a `rust` text link to the detailed curriculum PDF.

### HigherEducation

After Dakhil (`src/components/curriculum/higher-education.tsx`), on `dark`: the prospectus's স্কুল পরবর্তী উচ্চ শিক্ষা plus college.

- Three `panel` cards (laid out like TeachingModel's): মুতাওয়াসসিতা (here, Class 11: the one-year Talimi board syllabus and exam), কাফিয়া জামাত (at a Qawmi madrasa) and কলেজ. Each has a small tag, the title (`text-h4`) and the text. The way at this school is marked: a `sand-deep` tag and a stronger `line-dark-strong` edge; the others have outlined tags.
- Kafiya is named here because the prospectus names it. Alim and Sanawiya (detailed curriculum only) are not shown.

### CurriculumClose

The page's close (`src/components/curriculum/curriculum-close.tsx`): a `cream` card (`radius-panel`) on `paper`. Ages, admission steps and fees live on the Admissions page, so the card says so and links there (`outline` ভর্তি ও ফি). While the pre-admission form is open (`getPublishedIntake`) the rust আবেদন করুন comes first. No fees on this page.

## Contact page

যোগাযোগ (`src/app/[locale]/contact/page.tsx`, components in `src/components/contact`, details from Site Settings via `src/lib/contact/details.ts`), top to bottom: ContactHero and ContactReach (`paper`), ContactFind (`dark`), ContactMore (`paper`). No message form: calls and WhatsApp reach the office directly. WhatsApp's own green marks only its logo and buttons.

### ContactHero

The Contact page's opening (`src/components/contact/contact-hero.tsx`), on `paper`, laid out like the other page heroes.

- **Left:** the H1 যোগাযোগ (`text-hero`), what to get in touch about (`text-lead`), then the office's call button (`outline`, the admissions phone) and the WhatsApp button (`whatsapp` variant: WhatsApp's own green, `ink` text). Both count their clicks (`ContactLink`, `contact_hero`). No apply button: this page is for reaching the office.
- **Right:** a `surface` card (`radius-card`, `line` border): a description list of the office hours and the address from Site Settings → contact: each a 15px `ink-muted` label with a 24px `rust` icon beside it (clock, map pin), the value lined up under the label, and "কীভাবে আসবেন" linking down to ContactFind.
- Copy: `contact.hero`. No motion.

### ContactReach

Phone, WhatsApp and email (`src/components/contact/contact-reach.tsx`), still on `paper` under the hero. Everything comes from Site Settings → contact.

- **WhatsApp:** a plain `surface` card (`radius-panel`, `line` border), like the call card below it. Only WhatsApp's own pieces are green (`whatsapp-brand`): the 64px round logo (white glyph) and the "চ্যাট শুরু করুন" button (`whatsapp` variant). Between them the H3 হোয়াটসঅ্যাপে লিখুন, what to ask about, and the number. The owner chose this over a chat-style mock and over a whole green band (2026-10-15).
- **Calls:** an H3 with a `rust` phone icon, then each active desk in one `surface` card: side by side from about 230px a desk, rows on phones, divided by 1px `line`. The whole row is the call link (label 14px `ink-muted`, the number 20px 750, a 44px round outlined phone mark); its name is "কল করুন: desk, number". The office hours under it. No transport desk here.
- **Email:** an H2, then each active address as a `surface` chip (`radius-cell`) with a `rust` envelope; long addresses break rather than overflow.
- Every link counts its clicks (`ContactLink`, `src/components/site/contact-link.tsx`: call, WhatsApp, email). There is no message form: calls and WhatsApp reach the office directly.
- Copy: `contact.reach`.

### ContactFind

How to get here (`src/components/contact/contact-find.tsx`, `#find`), on `dark`.

- **Opening:** the homepage's "উত্তরা সেন্টার মেট্রো স্টেশন থেকে ৬০০ মিটার পূর্বে" as the H2 and the short address (`home.campus.where`).
- **Left:** the homepage's walk sketch (`WalkSketch`, `src/components/site/walk-sketch.tsx`, shared with Campus) in a `panel` card, no wider than 560px; under it the landmarks from Site Settings → location, each a `line-dark` row with a `bronze-light` train icon, the name, and the distance in the page's language ("600m" → ৬০০ মি.).
- **Right:** the map. Google's map loads only when asked for (`MapOnTap`): a `panel` box with "ম্যাপ দেখুন" (`light` pill) and a note that tapping loads Google Maps; then the embed from Site Settings (only a `google.com/maps/embed` address), and focus moves to it. Under it "দিকনির্দেশনা" (`light`, Google directions to the school) and "গুগল ম্যাপে দেখুন" (`outline-dark`, Site Settings' map link), both in a new tab.
- Copy: `contact.find`.

### ContactMore

The Contact page's close (`src/components/contact/contact-more.tsx`), on `paper` before the footer.

- **Left:** আরও জানতে, three 56px rows between `line` rules, each 18px 650 `ink` with a `rust` icon at the end: ভর্তি ও ফি and কারিকুলাম (arrows, pages) and প্রসপেক্টাস ডাউনলোড (download icon, the PDF).
- **Right:** স্কুলের খবর with one line and the school's active pages from Site Settings → social media as `quiet` pills with a `rust` logo, opening in a new tab. Shown only when Site Settings has any.
- Copy: `contact.more`.

## About page

আমাদের সম্পর্কে (`src/app/[locale]/about/page.tsx`, components in `src/components/about`, people from Studio → Directors and Advisors), top to bottom: the opening on `paper` (the H1 and the school's tagline), the chairman alone in a PersonBand (`dark`), the board (`#board`, `paper`: Portraits, then the members without a photo by name), the advisors (`#advisors`, `dark`: Portraits with their institutions), and a close on `paper` (আরও জানতে: Curriculum, Admissions and fees, Contact as `outline` pills). It replaced the Our people menu: the header has one link, আমাদের সম্পর্কে, shown while Site Settings shows Our people and the directors or the advisors; `/directors` and `/advisors` redirect to the two sections. Owner rejected (2026-10-15): a card grid, a structure diagram, an editorial timeline; the chairman beside the others.

A director's profile (`src/app/[locale]/directors/[slug]/page.tsx`): a link back to About on `paper`, the person in a PersonBand (`dark`, the name as H1), their message as ProfileText on `cream` and their biography on `paper` when Studio has them, then the rest of the board's Portraits on `dark` with a button back to the whole board.

### PersonBand

One person alone on `dark` (`src/components/about/person-band.tsx`): the chairman on the About page (his own rule: alone at the top, never beside the others) and each director on their profile page.

- **Left:** a 4:5 portrait from Studio (`radius-card`, `shadow-frame-dark`), no wider than 420px; it comes first on phones. Left out when there is no photo.
- **Right:** a 15px `bronze-light` line (the role from Studio, then a second phrase: প্রতিষ্ঠাতা চেয়ারম্যান ও প্রিন্সিপাল on About, পরিচালনা পর্ষদ on a profile), the name (an H2 in `text-h2` on About, the page's H1 in `text-hero` on a profile), then what the page puts under it.
- **On About:** the homepage founder quote (`home.founder.quote`, Tiro Bangla in Bengali only, dandas in Anek via `QuoteText`) and a `light` pill to his profile, "পূর্ণ বাণী ও পরিচিতি".
- **On a profile:** the summary (`text-lead`, `on-dark-body`), then a description list over a `line-dark` rule: education (degree, institution, year in the page's numerals) and what they do (Studio's qualifications as `line-dark-strong` outlined chips); then their links from Studio (Facebook, website…) as `outline-dark` pills opening in a new tab.

### Portraits

People as 4:5 portraits in a row (`src/components/about/portraits.tsx`): the board on the About page (`paper`), the advisors (`dark`), and the rest of the board on a profile page (`dark`).

- **Grid:** `repeat(auto-fit, minmax(min(100%, 130px), 1fr))`, so two to a row on phones from 320px; a row is never wider than 320px a person, so one or two people keep a sensible size.
- **Tile:** the photo (`radius-card`; `sand-pale` behind it on light, `panel` and `shadow-frame-dark` on dark; a `user` icon when there is none), then the role (14px 650: `rust` on light, `bronze-light` on dark), the name (17 to 21px, Anek heading weight) and, for advisors, their institution (14px muted).
- A director with a profile page (Studio → Show detail page) links there; the whole tile is the link. Advisors have no pages.
- **Board order:** Studio's display order. The first director is the chairman, in PersonBand above; the others with a photo are portraits; those without are listed under "পর্ষদের অন্য সদস্য" as name and role (17px 650 and 14px `ink-muted`) over a `line` rule (`splitBoard`, `src/lib/about/people.ts`).

### ProfileText

A profile's message (বাণী, on `cream`) or biography (জীবনী, on `paper`) from Studio (`src/components/about/profile-text.tsx`): Portable Text in a 40em reading column of 18px `ink-body` at 1.75 line height. Each section is shown only when Studio has the text.

- The section has its H2; the text's own headings become H3 (`text-h4`), lists keep their bullets or numbers, `strong` is `ink` 700, links are `rust` and underlined (new tab when external), a quotation is set off by a 3px `line-strong` rule on its left. Line breaks typed in Studio are kept.
- The biography is tidied for reading (`tidyBio`, `src/lib/about/bio.ts`): blank lines dropped; a short line led by an emoji ("👤পরিচিতি") or ending in a colon ("পরিচয়:") becomes a heading without them; a heading typed on a paragraph's first line is split off.
- `scripts/clean-director-bios.ts` applies the same tidy to Studio once (dry run by default) and removes the contact block some biographies ended with; the Contact page holds those numbers.

## Campus page

ক্যাম্পাসে একটি দিন (`src/app/[locale]/campus/page.tsx`, components in `src/components/campus`, spec `docs/campus-day.md`), top to bottom: the tour (`paper`: the steps beside the pinned stage, the first step's heading the page's H1), then the close on `dark`. Shown while Site Settings shows Campus (`showCampus`); the menu link ক্যাম্পাস after কারিকুলাম and the sitemap follow the same switch. The owner locked this concept on 15 October 2026 after rejecting a plain campus page ("should be something unique"); the stops and photos are the owner's to send.

### CampusTour

The Campus page, ক্যাম্পাসে একটি দিন (`src/components/campus/`): one school day told as the reader scrolls, from the metro at dawn to home time at 8:30 at night. Each stop is a time and a place. The steps scroll as ordinary text; beside them (on top on phones) a pinned stage plays the day. Spec: `docs/campus-day.md`.

- **Stops:** Studio → Campus: a day (`campusDay`), an ordered list. Per stop: kind, time line, place, floor number, heading, text, one to four clock rows (big time, the part of the day above it, sky, who is in school), moments (icon and label, moments kind only) and one to three landscape photos with alt and name. The animation follows the kind; editors never pick effects. While the list is empty the page shows the launch day (`src/lib/campus/launch-day.ts`), built only from real photos.
- **A stop without its photo is hidden,** except the drawn kinds (from the metro, the van arriving or leaving, moments). Stand-in photos never ship; unknown facts stay in [brackets].
- **Steps:** a 3px `line` rail that fills `rust` with the scroll, a dot per stop (filled once reached, larger at the current one), the time line (`text-15` `rust` with a clock icon), the place (`text-14` `ink-muted`), the heading (the first stop's is the page's H1 in `text-hero`; the rest H2 at 26 to 40px), one or two lines (`text-17`, `text-19` on desktop). The words hold still (sticky, 30vh from the top; under the stage on phones) while their stop plays; how long a step takes is set by its kind and its number of moments.
- **Stage (`aria-hidden`, it only repeats the text):** a `radius-panel` screen whose sky follows the time in the brown palette: dawn `sand-deep`, morning `cream`, day `sand-pale`, afternoon `sand`, late afternoon `sand-deep`, dusk `panel` with a `bronze-light` glow at the horizon, night `dark` with stars; text turns `on-dark` after dark. Across the top: the clock (the part of the day in 13px `rust` or `bronze-light`, the time in 800 weight), the sun crossing the day on a dashed track that turns solid behind it (a moon after dark; desktop only), and three chips প্রি-হিফজ, হিফজ, আফটার হিফজ, filled when that stage is in school. Below, one picture per stop: the walk from the station drawing itself, the drawn building whose windows light `bronze-light` one by one as it darkens (with the red MQD sign in `rust`), the van driving to the door with its photo pinned up like a print and driving away at one, the door opening into the entrance photo, a floor's photo settling, rooms in turn with their names, moments lit in turn and joined by a filling line, the roof photo opening from the sky down, the field coming in from the side, the evening entrance pulling back. A dark lift panel lists the floors the stops use (only with two or more) and slides its `bronze-light` marker to the current one.
- **Motion:** which stop and which moment come from a tiny scroll driver (`tour-driver.tsx`: the step whose top passed 60% of the screen, 78% on phones, and its progress for the moment); it only sets `data-pos`, `data-sky`, `data-groups` and two CSS variables, and CSS transitions do the rest. Motion inside a stop follows the scroll itself (CSS view timelines, one per step); browsers without them show every end state. Transforms, opacity and clip-path only; no animation library. Styles in `campus-day.css`.
- **Reduced motion and no script:** no stage; each step shows its own photos inline (with their alt text and names) and the steps take their natural height.

### CampusClose

The Campus page's close (`src/components/campus/campus-close.tsx`), a `dark` band before the footer: নিজে এসে দেখুন (`text-h2`), the office hours from Site Settings (`text-17` `on-dark-body`), and two `lg` pills: a `light` one with the navigation-arrow icon to Google Maps directions (new tab) and an `outline-dark` call to the office (counted as a call click, `campus_close`). The call is left out when Site Settings has no office phone. Once the gallery is on, a third `outline-dark` pill with the image icon leads to it. Copy in `campus.close`.

## Gallery page

আমাদের দিনলিপি (`src/app/[locale]/gallery/page.tsx` and `gallery/[slug]/page.tsx`, components in `src/components/gallery`, spec `docs/gallery.md`). Albums come from Studio → Gallery (`album`); photos live in Sanity, videos on the school's YouTube channel. Shown only once Site Settings switches the gallery on (`showGallery`); the menu link গ্যালারি after ক্যাম্পাস, the footer, the sitemap and the links from the homepage and the Campus page follow the same switch. The owner approved the design on the gallery canvas (https://claude.ai/artifact/FsAEecyvkzfaBn7fRHkEL5, the Final boards) in October 2026.

Top to bottom: the hero (`paper`), the filter bar and the month rows (`cream`), the videos (`dark`), the all-time albums (`paper`), the close (`cream`).

### GalleryHero

`gallery-hero.tsx`: two columns from 1024px (5:7). Left, the eyebrow গ্যালারি · ছবি ও ভিডিও (`text-14` 650 `ink-muted`), the H1 আমাদের দিনলিপি (`text-hero`), the lead, and text links to the Facebook page and the YouTube channel (Site Settings → social media, active ones only, with their Phosphor logos). Right, the latest dated album as one link: a collage of its first three photos (the first large, spanning two rows, with `shadow-photo`; 470px tall from 640px), a `dark` সবশেষ অ্যালবাম badge on it, then its name (`text-h3`), the day and counts, and অ্যালবাম দেখুন with an arrow. Copy in `gallery.hero`.

### AlbumBrowser

`album-browser.tsx` (client): the dated albums, month by month, with their wide videos in the same rows.

- **Filter bar:** sticks to the top of the screen (`cream` at 95% with a blur, `line` above and below). A year switch (a `surface` pill holding one pill per year, the chosen one `dark`) shows only once albums span two years, then a `line-strong` divider. Topic chips (40px pills, `line-strong` ring, the chosen one `dark`) for সব and each topic that has albums (কুরআন ও হিফজ, ক্লাস, অনুষ্ঠান, খেলাধুলা ও সফর, ক্যাম্পাস), then ভিডিও (videos only). Chips scroll sideways on a phone. A choice made while the bar is stuck takes the reader back to the top of the albums.
- **Rows:** the H2 (২০২৬ সালের অ্যালবাম, `text-h3`), then one row per month: the month (`text-h4`, sticky beside its cards from 768px) and its cards, three across from 1024px and two on phones. Rows are divided by `line`.
- **Album card** (`album-card.tsx`): a 4:3 cover in `radius-photo` with two sheets behind it (`sand-deep`, `line-strong`) so it reads as a set, a `surface` badge with the image icon and the number of photos, then the name (`text-19` 700, `text-17` on phones) and the day and topic (`text-14` `ink-muted`).
- **Video card:** the same frame with the YouTube cover, a play button and the length; ভিডিও and the day below.
- When a year and a topic leave nothing, a line says so with a সব অ্যালবাম দেখুন chip.

### VideoTile

`video-tile.tsx` (client): a video's cover (`i.ytimg.com`, `hqdefault`) with a round `dark` play button and the length in a `dark` tag. Nothing else from YouTube loads until it is tapped; then a window opens over a `dark` backdrop with the name, ইউটিউবে দেখুন and a close button, and the player (`youtube-nocookie.com`, upright videos 9:16). Without JavaScript the cover links to the video on YouTube. A cover YouTube cannot serve stays the frame's plain colour.

### GalleryWatch

`gallery-watch.tsx`, `dark`: দেখুন (`text-h2`), its lead and the YouTube channel link; the newest wide video large (16:9, `shadow-frame-dark`) with the next three listed beside it (16:10 covers with the length only); then ছোট ভিডিও, up to six upright videos in a row (9:16, a sideways strip on phones). Hidden when there are no videos.

### GalleryEver

`gallery-ever.tsx`, `paper`: সব সময়ের অ্যালবাম and its lead, then the all-time albums (no date: the campus, the Quran classes, the play spaces) as 340px tiles (220px on phones) in `radius-panel`, the name and the number of photos on a dark gradient at the foot of the photo.

### GalleryClose

`gallery-close.tsx`, `cream`: ছবিতে যা দেখলেন, নিজে এসে দেখুন (`text-h3`) and a line pointing to the contact page, then an `outline` pill ক্যাম্পাস দেখতে আসুন (the contact page) and the `primary` আবেদন করুন. Copy in `gallery.close`.

### Album page

`gallery/[slug]/page.tsx`, `paper`:

- **Head:** the breadcrumb (গ্যালারি / the year or সব সময়ের অ্যালবাম / the topic), the H1 (`text-hero`), the day and counts, the album's two lines when it has them (`text-lead`); on the right, হোয়াটসঅ্যাপে পাঠান (WhatsApp green) and লিংক কপি করুন (`ShareLinks`, `src/components/site/share-links.tsx`, shared with the notices).
- **With text** (Studio → Text, or a teacher's words) it opens as a short story: the first photo large (620px, 300px on phones, `shadow-photo`) with its caption, the text (`text-19`, at most 680px wide), the teacher's words (`text-quote`, Tiro Bangla in Bengali, Anek Latin in English, a 4px `bronze` rule on the left) with their name, then এই অ্যালবামের সব ছবি with ছবিতে চাপ দিলে বড় হয়. Without text the photos follow the head directly.
- **Photos** (`album-photos.tsx`, client): justified rows, each photo keeping its shape and a row sharing one height (290px, 150px on phones), 12px corners; the videos come after the third photo. On hover a `surface` corner button shows it opens, and the caption sits on a dark gradient at the foot.
- **Viewer:** a full-screen `dark` window: the album's name and the count (২ / ১৮), এই ছবিটি পাঠান (WhatsApp, the photo's own link), লিংক কপি and close; the photo whole (`object-contain`); previous and next (round `panel` buttons, 56px; on the photo on phones); the caption and the day; a strip of all the photos with the current one ringed in `bronze-light`. Arrow keys and a swipe move through the photos, Escape closes. The address follows the photo (`#photo-3`), so a shared link opens that photo.
- **Close:** on `cream`, the older and the newer album as `surface` cards (cover, আগের অ্যালবাম / পরের অ্যালবাম, the name, the day and count), then গ্যালারিতে ফিরুন.
- Link previews show the album's cover (1200 × 630, cropped on its hotspot). Structured data: an `ImageGallery` of the photos and videos (`VideoObject`), and the breadcrumb.

## Notice board

নোটিশ বোর্ড (`src/app/[locale]/notices/page.tsx` and `notices/[slug]/page.tsx`, components in `src/components/notices`, logic in `src/lib/notices/notices.ts`, spec `docs/notices.md`). Notices come from Studio → Notices (`notice`). Shown only once Site Settings switches the notice board on (`showNotices`); the menu, the footer, the sitemap, the homepage block and the old News pages (which then lead to the board) follow the same switch. The owner approved the design on the notices canvas (https://claude.ai/artifact/N9bfjbtWWnPZHjmk5MA4PQ, the Blend boards) in October 2026.

A notice is formal: paper, ink and rules, the type as plain words. No coloured tags, chips or photos in the lists; rust only for hover and links.

- **Head** (`paper`): the H1 (`text-hero`) and the lead. Pinned notices (জরুরি) follow as `surface` cards, two across from 768px, with a 3px `ink` rule along the top and a `line-strong` ring: জরুরি with the push-pin, the number and type, the title (`text-h4`), two lines of the text, then over a `line` rule the date and weekday and the PDF / ছবি marks. A pinned notice also keeps its place in the list.
- **Board** (`notice-board.tsx`, client): text tabs for the type (সব and the four types, 46px, the chosen one `ink` with a 2px `ink` underline) over a `line-strong` rule, and a year select on the right once notices span two years. Then month by month (`text-h4` with a `line-strong` rule running to the edge): rows in a `surface` box with a `line-strong` border, `radius-photo`. The first three months show; আগের মাসের নোটিশ (month) adds three more.
- **Row** (`notice-row.tsx`): the day large (34px 800, 28px on phones) with the weekday below, behind a `line` rule; then the number (নং ২০২৬/১৭, 650 `ink`), · the type (`ink-muted`), জরুরি when pinned, and নতুন in an `ink` outline for its first seven days; the title (`text-19` 700, `rust` on hover) and the first line of the text; on the right the PDF / ছবি marks and a caret. The whole row is one link.
- **Notice page** (`cream`): back to the board and প্রিন্ট above an `article` on a `surface` sheet (`radius-card`, at most 860px). A slim letterhead over a 1.5px `ink` rule: the school and its place on the left, নোটিশ নং and the date with weekday on the right. Then the type (and জরুরি), the title (`text-h2`) and the text (`text-19` at 1.75). সংযুক্তি: each PDF a `paper` row with its name, size, দেখুন (new tab) and ডাউনলোড; each picture at most 620px wide, opening the full picture in a new tab to zoom. Then অভিভাবকদের গ্রুপে পাঠান with WhatsApp and copy link (`ShareLinks`). Below the sheet, the earlier and later notices under `ink` rules. No issuer line.
- **English pages:** a notice with no English shows in Bengali, marked `lang="bn"`, and its page opens with a `surface` note that it is in Bengali only (with the office phone when Site Settings has one).
- **Print:** the sheet alone (`data-print-sheet`; globals.css hides the banner, header, footer, apply bar and cookie notice), without the buttons.
- Link previews: the title with its number; a notice with a picture shows its top (1200 × 630).
- No motion.

## Do's and Don'ts

### Do:
- **Do** alternate light (cream/paper) and dark sections, each padded `section` (64px to 112px).
- **Do** keep rust for the one primary action per view (and the single rust pre-admission card near the page end); use bronze for decoration on dark.
- **Do** draw the 50-50 claim from real data: tiles sized by percentage, the hours axis by real hours, routes by real stops from the CMS.
- **Do** use real school photographs with a caption below (14px, `ink-muted` or `on-dark-muted`) in `radius-photo` frames.
- **Do** use Phosphor regular icons inline, next to a word, never instead of one.
- **Do** write Bengali numerals on Bengali pages everywhere (dates, times, phones, percentages).
- **Do** tag goals (৩০০+ হাদিস, ৯০%+ কুরআনের অর্থ) with লক্ষ্য / Goal.
- **Do** keep unknown facts as visible bracketed placeholders until the owner supplies them.
- **Do** read changing facts (intake, phones, routes, statistics, reviews) from the CMS, never from copy.
- **Do** apply `text-wrap: balance` to headings.

### Don't:
- **Don't** use em dashes or en dashes in copy; use a comma, colon, full stop or "to" / "থেকে".
- **Don't** overlay text on photographs or put a photo carousel behind a slogan. The gallery is the one exception (approved by the owner, October 2026): a photo's caption on a dark gradient at its foot in an album, and an all-time album's name on its tile.
- **Don't** use green for anything but the open-status dot.
- **Don't** return to white surfaces with 4px radii (the rejected signage system).
- **Don't** add ornamental Islamic patterns, arches or decorative borders.
- **Don't** set headings or UI in Tiro Bangla, or use Tiro's own danda.
- **Don't** show fees on the homepage.
- **Don't** add a small uppercase label above section headings; the H2 starts the section.
- **Don't** use `font-stretch`: the fonts load without the width axis.

## Production notes (Next.js + Tailwind v4)

- **Tokens:** `src/styles/tokens.css` (`@theme static`, imported by `globals.css`). The old `primary`/`secondary`/`accent` scales in `globals.css` stay until every page is redesigned. `cn()` (`src/lib/utils.ts`) knows the token names, so `text-18 text-surface` keeps both.
- **Fonts:** Anek Latin from next/font (`src/lib/fonts.ts`). Anek Bangla (Bengali glyphs, weights 400 to 800, preloaded on Bengali pages only) and Tiro Bangla (quotations: Bengali, spaces and punctuation in one file, not preloaded; Latin letters and digits in a quotation come from Anek Latin) are self-hosted in `public/fonts` (`src/styles/fonts.css`, made by `scripts/trim-fonts.py`). Weight axis only.
- **Content:** the CMS feeds the hero photos and statistics (Site Settings), the intake (Pre-admission form), the routes (Fees & Discounts → Transport), the routine, play-space photos and FAQ (Homepage) and the guardian reviews (Guardian reviews, consent only). Where the Homepage lists are empty the launch copy in `messages/*.json` (`home.*`) shows. The Admissions page reads the published Pre-admission form (status, classes and ages, the two intake fees, what to bring) and Fees & Discounts (fees, discounts, payment rules, routes); its own copy is `admissions.page`, and it reuses the pre-admission page's approved steps and questions (`preAdmission.intro`). The Curriculum page's copy is `curriculum.*`; it reads only whether the pre-admission form is open. The gallery reads Studio → Gallery (`album`); its copy is `gallery.*`.
- **Motion:** named animations and scroll-driven utilities live in `tokens.css` (`animate-settle`, `animate-rise`, `animate-tile-in`, `animate-answer`, `draw-x`/`draw-y`, `route-stop`/`route-line`). Animate only transform, opacity and clip-path; `prefers-reduced-motion` turns everything off, and `globals.css` has a safety net.
- **Search:** pages are server-rendered; the FAQ prints FAQPage JSON-LD from the same list it shows.
