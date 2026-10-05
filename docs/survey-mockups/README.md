# Survey mockups

Design prototype for the survey system specified in [`../survey-system.md`](../survey-system.md). **Status: LOCKED (2026-10-04, canvas version `1791113828-b9b5`).** This is the reference for the build; change it only by an explicit design decision, and update this folder and the canvas together.

**Live canvas (interactive, private until shared):** https://claude.ai/artifact/9oDoh5gaceN2N55JSq6Z4s

The `.dc.html` files are the canvas source (Design Component format): each file is one artboard, with markup inside `<x-dc>` and sample data in the script's `renderVals()`. They rely on the canvas runtime (`support.js`) and do not render as standalone pages. `canvas.json` holds the artboard layout, titles and sizes. All names and numbers are sample data.

## Artboards

| Area | Files |
|---|---|
| Teacher survey (T1), phone | `Main` (intro), `T1-Teacher`, `T1-Class`, `T1-Duplicate`, `T1-Rate`, `T1-Review`, `T1-EditMark`, `T1-Note`, `T1-Review-Incomplete`, `T1-Receipt` |
| Guardian identity + G1, phone | `G-Intro`, `G-Class`, `G-Identify`, `G-Identify-Error`, `G-Match`, `G-Match-Unverified`, `G1-Rate`, `G1-Review`, `G1-Receipt` |
| G2 + states, phone | `G2-Question`, `G2-DayCare`, `G2-Review`, `G2-Receipt`, `G-Closed`, `Survey-States` |
| Desktop survey | `T1-Rate-Desktop`, `T1-Review-Desktop`, `G1-Rate-Desktop`, `G2-Question-Desktop` |
| Reports, desktop | `R1-Overview`, `R2-Teaching`, `R3-Class`, `R4-Student`, `R5-Raters`, `R6-Tracker`, `R-States` |
| Admin, desktop | `R7-Rounds`, `R8-Import` |
| Reports, phone | `RM1-Overview`, `RM2-Teaching`, `RM3-Class`, `RM4-Student`, `RM6-Tracker` |
| Print | `R4-Print-Guardian` (A4, guardian-safe) |
| **Phase 2 additions (approved by the owner 2026-10-05)** | `G-Match-Submitted` ("already submitted" warning, date only), `G1-Rate-Subject` + `G1-Rate-Subject-Desktop` (G1 default: one subject, all questions), `G1-Review-Subject`, `R6-Tracker-Guardian` (one guardian round, no drafts). The locked `G1-Rate`/`G1-Review`/`G1-Rate-Desktop` remain the "one question, all subjects" option; the locked `R6-Tracker`/`RM6-Tracker` combined guardian view is replaced by the per-round tracker. |

## Design system (locked 2026-10-04): Bronze & Stone

Reference board: `V3-Components.dc.html`. Rules:

- **One solid colour per screen:** the primary button, bronze `#875B3D` (pressed `#6E4A31`, soft bronze shadow, radius 16, 56 px).
- **Selection is never solid:** bronze tint `#F6EEE6` + 2 px bronze outline + small bronze check disc; text `#5E3B24`.
- **Surfaces:** warm paper page `#FCFBF8` (reports `#F8F7F4`), stone tiles/inputs `#F4F2EE`, mark track `#EFECE6`, hairlines `#E7E3DC`; raised white cards only for one highlighted object.
- **Text:** `#1F2A2E` primary, `#5B6670` secondary. No black.
- **Status:** verified/success sage `#2E6A55` on `#E7F1EC` (shield + text, no box); reversed-scale hint amber `#8A4416` on `#FBF1E6`; error `#A2341E` on `#FBECE8`; info `#3B6684` on `#EAF1F6`.
- **Controls:** secondary buttons are stone fills (no borders); 2–3-option choices are a sliding switch with a white thumb; marks ১০/৮/৬/৪ sit in one track, the chosen one gets the bronze ring (one ring per row → unmarked rows stand out).
- **Header:** 3 px segmented progress line at the very top (done bronze, current `#D9BFA9`), plain back chevron, centred context label.
- **Type:** Anek Bangla 600 (no 700) for headings and numerals (screen title 26/1.35–30/1.4, question 21/1.5, numerals 19–22); Hind Siliguri 400–600 for body (17/1.6) and captions (13.5).
- **Charts:** guardian `#B86A2E`, teacher `#2F6FA3` (colour-vision validated); teaching quality (G1) uses a sage sequential heatmap and the single colour `#3A6B5D`, never as a third line on the guardian/teacher chart.

## Flows (prototype links)

- **T1:** `Main` → `T1-Teacher` → `T1-Class` (→ `T1-Duplicate`) → `T1-Rate` → `T1-Review` (→ `T1-EditMark`, `T1-Note`, `T1-Review-Incomplete`) → `T1-Receipt`
- **G1:** `G-Intro` → `G-Class` → `G-Identify` (→ `G-Identify-Error`) → `G-Match` (→ `G-Match-Unverified`) → `G1-Rate` → `G1-Review` → `G1-Receipt`
- **G2:** identity as G1 → `G2-DayCare` / `G2-Question` → `G2-Review` → `G2-Receipt`
- **States:** `Survey-States`, `G-Closed`; reports `R-States`

## Known limits of the prototype

- Built from source without visual QA in a browser; spacing may need minor adjustment during implementation.
- Sample data only; reference numbers, names and figures are illustrative.
