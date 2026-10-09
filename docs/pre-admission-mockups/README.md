# Pre-admission 2027 mockups

Design prototype for the flow specified in [`../pre-admission-2027.md`](../pre-admission-2027.md). **Status: LOCKED (2026-10-07, canvas version `1791382724-d14a`).** This is the reference for the build; change it only by an explicit design decision, and update this folder and the canvas together.

**Live canvas (interactive, private until shared):** https://claude.ai/artifact/YNFRWPUJiTvhJRrTzW1Myb

The `.dc.html` files are the canvas source (Design Component format): each file is one artboard, with markup inside `<x-dc>` and sample data in the script's `renderVals()`. They rely on the canvas runtime (`support.js`) and do not render as standalone pages. `canvas.json` holds the pages, artboard layout, titles and sizes. All names, numbers, IDs and dates are sample data; text in square brackets (`[শেষ তারিখ]`, `[ঠিকানা]`) is a placeholder for a real value.

## Artboards

| Canvas page | Files |
|---|---|
| Guardian flow, phone | `Main` (intro), `Start` (mobile + email), `Hub` (chapter checklist), `Student`, `Father`, `Review` (review, fee, declaration), `PayFailed`, `Confirmation`, `Find` (find my application; Tweaks: paid / unpaid), `QR` (component) |
| Guardian flow, desktop | `IntroDesktop`, `StartDesktop`, `HubDesktop`, `StudentDesktop`, `FatherDesktop`, `ReviewDesktop`, `PayFailedDesktop`, `ConfirmationDesktop`, `FindDesktop` |
| Application PDF (A4, 3 pages) | `Pdf1` (print banner, ID, photo, staff QR, student, receipt, evaluation day + WhatsApp QR), `Pdf2` (father, mother), `Pdf3` (contact, additional, declaration, office/evaluator section) |
| Admin | `AdminOverview`, `AdminList` (paid / fee-pending tabs), `AdminDetail`, `AdminSide` (sidebar component with the ভর্তি / জরিপ module switcher) |

Mother, contact and additional chapters follow the Father/Student page patterns and are not drawn separately.

## Design language (locked)

shadcn/ui conventions, themed with the school's colour. Reviewed against the design-taste-frontend skill.

- **Tokens (light):** background `#fafafa`, surface `#fff`, text `#171717`, muted text `#525252`, muted fill `#f5f5f5`, border `#e5e5e5`, input border `#d4d4d4`, primary `#7a4d32` (hover `#663f28`), focus ring `rgba(122,77,50,.3)`, success `#15803d`, warning `#b45309`, destructive `#dc2626`.
- **Tokens (dark, guardian pages):** background `#111`, surface `#171717`, text `#f5f5f5`, muted text `#a3a3a3`, muted `#262626`, border `#2a2a2a`, input `#404040`, primary `#c8946b` with dark text `#1c130d`. Every guardian board has a light / dark Tweak.
- **One accent:** brown only on primary buttons, selected radio/checkbox/switch, focus rings and progress bars. Status colours appear as icon or text colour, never as pastel fills.
- **Shape:** 8px radius for controls and buttons, 12px for cards. Buttons 44px tall on guardian pages (36px in admin).
- **Structure:** form sections are separated by a heading and a hairline, not boxed. Cards only for objects that stand alone (ID, the two confirmation tasks, fee summary, admin panels). Desktop forms use the settings layout: section title and description on the left, fields on the right, chapter rail on the far left.
- **Controls:** shadcn RadioGroup / Checkbox / Switch (16–18px, primary when checked); bordered radio cards only for the class choice; native selects; outline badges.
- **Type:** Noto Sans Bengali for Bengali, Inter for Latin text and IDs (the site's existing fonts). Headings 600–700 with slight negative tracking.
- **Icons:** lucide (`lucide-react`), stroke 2, muted colour.
- **Copy rules:** no em-dashes; at most one middle dot per line; empty answers read “দেওয়া হয়নি”; no decorative status dots.
- **Not used:** cream or beige backgrounds, tinted icon squares, pastel alert boxes, coloured pill badges, eyebrow labels, fake document previews.

## Flows (prototype links)

- **Phone:** `Main` → `Start` → `Hub` → `Student` → `Father` → `Review` → `Confirmation` (→ `Pdf1`); `PayFailed` → retry or `Find`.
- **Desktop:** `IntroDesktop` → `StartDesktop` → `HubDesktop` → `StudentDesktop` → `FatherDesktop` → `ReviewDesktop` → `ConfirmationDesktop`.
- **Admin:** `AdminOverview` ↔ `AdminList` → `AdminDetail` (→ `Pdf1`).
