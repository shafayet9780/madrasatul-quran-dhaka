# Blend notes: A "The Line" (opus.html) x B "The Routine Board" (fable.html)

Paths are relative to `scratchpad/`. Line numbers refer to `mqd/opus.html` (A, 641 lines) and `mqd/fable.html` (B, 607 lines).

Shared gap (this is the user's complaint): **neither prototype uses anything from the current site** beyond address, phones and people. Neither has news, the teachers teaser, facilities, the subject list or photos. The only exception is B's one `assets/school.jpg` (the façade with the Arabic and Bengali signage, which is a good photo). Scraped current-site content is in `r2/raw/{bengali,english}_{home,about,campus,curriculum,programs,teachers,news,advisors,directors,contact,downloads}.txt`. `mqd/assets/*-subject.webp` and `*-realistic.webp` are probably illustrations or AI images, so check `r2/photos.md` before using them, and never use them in the hero.

---

## 1. Strongest and weakest moments

### A: "The Line" (Opus)

**Strongest**
1. **Hero tile treatment** (L84–88, L298). "৫০" in a solid date-brown tile, then "–", then "৫০" in an outlined sand tile, all in Anek 800 at clamp(38px, 6.6vw, 84px). The headline is itself the diagram. It is the best type moment in either file, and it still reads at 390px (opus-mob-0top).
2. **Station line** (L121–144, JS L573–598). Walnut rings with date-brown borders sit on a date-to-brass gradient track. The selected station gets a brass fill and scale(1.12), and `.fill` advances along the track. The interchange pills after the last station (L135–136, L348–350) show "two doors open" without any words. This metaphor is native to Dhaka (MRT Line-6).
3. **Share deep link** (L602–610, plus `history.replaceState` L596 and hash boot L599–601). Each station has a URL (`#pre`, `#hifz`…). It calls `navigator.share` and falls back to `wa.me` with a pre-built Bengali text and a toast. This suits how parents in Bangladesh actually pass things around (WhatsApp).
4. **Walk map** (L491–507, `.walk` L223–224). The line is a vertical MRT-6 bar, Uttara Center is a ringed station, a brass dotted walking path carries "600 m →", and the school block sits east of the station. It is honest, inline and on-brand.
5. **Trust details**: brown "closed" status dot (L92–93, L306) instead of a misleading green one; visible field labels and Bangladeshi mobile regex on the waitlist (L519–526, L626–632); `.draft` badge system (L45–46); 48px buttons (L56); reduced-motion block (L255–258); ticker of proof facts on walnut (L110–115, L318–326).

**Weakest**
1. **Content is hidden at rest.** `.js .reveal.pre{opacity:.001;filter:blur(6px)}` (L253–254, JS L634–638) blanks everything below the first viewport until the IntersectionObserver fires. opus-desk-2, -3, -4 and the mobile captures are **empty sand/walnut slabs**: the proofs, day-care, people, fees, visit and waitlist sections all failed to render. This breaks screenshots, print, slow devices and anything that doesn't scroll.
2. **Invented 50/50 for Dakhil and Mutawassita** (data L566–571: `mix` 50/50 with only a `mixDraft` caption). The share text (L604) then broadcasts those invented percentages to WhatsApp.
3. **Mobile Line goes vertical** (L137–144). Five stacked 58px rings plus labels push the board below the fold (opus-mob-1). The station-to-board relationship is lost, and the interchange pills dangle under station 5.
4. **Double-encoded data and duplicate instruments.** The board shows the same split twice, once as a 56px `.stack` and again as `.bar-row`s (L152–158, L594). The separate day-care timetable (L172–191, L404–417, JS L612–623) repeats each stage's hours away from the Line, so there are two instruments saying the same thing. The scrub slider is a fake clock: it is user-dragged, not "now".
5. **Polish and craft slips**:
   - On the hero plate's mobile layout, the Arabic `العربية` (absolute, L104) overlaps the "50%" (opus-mob-0top).
   - Plate/ticker numbers mix Latin "50%" with Bengali "৫০".
   - Tick labels read "৭am" with Bengali digits and a Latin suffix (L616), and `fmt` outputs AM/PM (L614).
   - The walk-map SVG uses hard-coded hex values and font names (L493–505).
   - "ক্যাম্পাস ভিজিট" and the nav "ক্যাম্পাস দেখুন" both link to `#waitlist`, so a visit CTA lands on a form (L289, L302). Prospectus is `href="#"` (L304).
   - There are no photographs at all.
   - The ticker on mobile shows two items with a hidden scrollbar and no fade or affordance (L112–113, opus-mob-1).
   - The sticky nav uses `top:0` with no safe area (L68).

### B: "The Routine Board" (Fable)

**Strongest**
1. **Day ruler** (CSS L131–137, DOM L331–341, JS L557–558 and L572–574). This is a 7:00–20:30 axis with a brass gradient span that slides (`left`/`width` .7s expo) to each stage's hours, plus "দিনের ৪ ঘণ্টা". It is the most legible single data graphic in either file. Hifz day-care's 13.5h span against Pre-Hifz's 4h makes the service argument without copy.
2. **Board header and panel grammar** (L115–130, L315–318). The walnut board has a raised `.board-top` strip ("দৈনিক রুটিন · Pre-Hifz" plus a brass bell and "উত্তরা, ঢাকা"). Below it, `dl.row`s pair small dim labels with big values. It reads as a painted madrasa routine board.
3. **Subject balance bar** (L138–147, JS L575–581). One 64px bar labels its segments in place ("কুরআন ২৫ · আরবি ২৫ · সাধারণ ৫০") with a legend underneath. It shows a single encoding, and **hides itself when the split is unknown** (`q:null` → `bar-wrap` display none, L576). That is the honest handling A lacks.
4. **Fee table and documents** (L202–213, L461–485). The two stage columns sit side by side in one real `<table>` (`caption` "টাকায়"). The three documents are an `ol` with a `counter(d,bengali)` brass numeral (L212). A "ফি নিয়ে কথা বলুন" secondary sits next to the PDF. This is calmer and more comparable than A's two cards.
5. **Human voice and real place**:
   - The basmala above the hero (L85, L280).
   - People names set in Tiro (L196) with hairline rows (fable-desk-3).
   - The one real photograph with a signage-style caption strip `figcaption` (L186–188, L416–419). This is the model for the contract's "honest captions in signage strips".
   - Waitlist success swap `.wait.done` (L228–230, JS L597–603).
   - Map link "ম্যাপে দেখুন" (L502).

**Weakest**
1. **The header CTA overflows at 390px** (fable-mob-0top). The phone pill wraps to two lines and the brass "প্রসপেক্টাস" is clipped off the right edge, causing horizontal scroll. The flex row (L58, L64–65) has `white-space:nowrap` on the brand (L59), no `min-width:0`/shrink and no icon-only state. The L77 hide-rule did not save it in the capture.
2. **The board is invisible at rest.** `.board{opacity:0;transform:translateY(24px)}` until IO (L243–244, JS L593–595). This is the signature instrument, and it is blank to anyone whose observer never fires.
3. **Ruler ticks are hard-coded and ambiguous** (L334–339). "৭:০০" appears at both 0% (7am) and 88.9% (7pm) with no সকাল/রাত. The 100% "৮:৩০" label overhangs and clips at the board edge. On mobile, "৭:০০ ৮:৩০" collide (fable-mob-1).
4. **Weak tabs**:
   - No roving tabindex, so all five tabs are in the tab order.
   - No Home/End keys, no `id`/`aria-controls`/`aria-labelledby`, no hash deep link and no share (L319–326, L588–591).
   - The `.journey` index under the board (L149–157, L358–364) repeats every stage a second time. Its mini-bars start at different x positions on desktop (fable-desk-1).
5. **Semantics and honesty slips**:
   - A **green** status dot sits on "ভর্তি ফর্ম আপাতত বন্ধ" (L91, L288). Green means open.
   - The hero "৫০ / ইসলামী শিক্ষা · Quran · Hifz…" tile (L291–301) implies 50/50 across hifz years, which is actually 70/15/15. A correctly scoped its plate to "Class 6–8 · After-Hifz" (L309).
   - The hero is a dark slab rather than a reading ground.
   - The invented Arabic slogan `نَتَعَلَّمُ الدِّينَ بِلُغَتِهِ` (L372) is not real school text.
   - "সনদসহ হাদিস হিফজ" (L377) is an unverified claim.
   - Uses Amiri, not Noto Naskh.
   - No Latin face. Body gets `tabular-nums` globally (L37).
   - Waitlist has placeholder-as-label (sr-only labels, L510–513), no phone-format check and no `role=alert` (L600–601).
   - In the service clock, "সকাল · শুরু" collides with the first service card heading (fable-desk-2, L172–178).

---

## 2. What to carry into the blend

### From A (opus.html)
| Carry | Where | How to adapt |
|---|---|---|
| Tokens | L12–35 | Base palette. Brass is `#c99a4b`. Add `--now:#2f7a4c` (rename `--ok`) for the live dot only. Add dark-mode tokens per the artifact contract. Change `--ar` to Noto Naskh only (drop Amiri). Add `--voice:"Tiro Bangla"`. |
| `.btn`, `.btn-primary`, `.btn-ghost`, `.btn-brass`, `.dark .btn-ghost` | L55–65 | As is. Keep 48px min-height (nav 44px minimum, not 40px as at L76). |
| `.draft` badge | L45–46 | As is, used on every [DRAFT] string. |
| Hero tiles `.hero h1 .split/.half/.h-a/.h-b` | L84–88, markup L298 | As is. It is the hero voice. |
| `.status` + `.dot.closed` | L91–93, L306 | Closed equals date-brown. Link the text to `#waitlist`. |
| Ticker `.ticker/.t` | L110–115, L318–326 | Restyle as a departure board: walnut, Schibsted tabular, brass figures. Add an edge-fade mask plus `scroll-snap` on mobile, and give the scroller `tabindex=0` plus an aria-label. Optional single split-flap settle (≤600ms, once). Use the contract's five items. |
| Line `.map .track .fill .stn .ring .nm .cl .interchange` | L121–136, JS build L573–582 | Becomes the **top of THE BOARD**. Replace the ≤760px vertical layout (L137–144) with a horizontally scrolling strip inside its own `overflow-x:auto` container (`scroll-snap-type:x`, ring 48px, `.stn` min-width ~120px, `scrollIntoView({inline:'center'})` on select). Move the interchange to sit after Dakhil, branching to মাদরাসা / কাফিয়া / SSC→কলেজ. |
| `select(i,push,focus)` | L585–598 | Core controller. Keep the roving tabindex, `aria-selected`, `replaceState`, toast reset and fill width. Add Home/End, give each tab an id and the panel `aria-labelledby`. It should call B's ruler and bar updaters. Use contract hashes `#pre-hifz #hifz #after-hifz #dakhil #mutawassita` and add a `hashchange` listener. |
| Hash boot | L599–601 | Keep, but scroll to the board and skip the `setTimeout` (scroll after fonts load or use `scroll-margin-top`). |
| Share handler `#shareBtn` | L602–610 | Keep the `navigator.share` → `wa.me` → copy-link fallback. **Rebuild the text** from verified fields only: name, classes, hours, and the split only when known. For Dakhil/Mutawassita, send no numbers. |
| `bn()` | L555 | As is. |
| Stage data `S` | L556–572 | Use as the base shape with minutes `from/to` (merge B's `name/en/cls/hours`). **Set `mix:null` for dakhil/mutawassita.** |
| `T0/T1/pct/fmt` | L613–614 | Feed B's ruler (minutes-based). Rewrite `fmt` to Bengali with সকাল/দুপুর/বিকাল/রাত instead of AM/PM. |
| Walk map `.walk` + SVG | L223–224, L491–507 | Carry. Swap hex for `currentColor`/CSS vars (classes on paths), and swap `font-family` for inherited fonts. Add a "২.৫ কিমি · মিরপুর ডিওএইচএস" note. Draw-on dash animation of `#walkpath` is the one motion here. |
| `.phones` | L226–228, L486–488 | Keep tap-to-call pills, but render numbers as plain selectable text with `user-select:text` (no `-webkit-touch-callout` blocking). Add the transport number. |
| Waitlist `.wl` form + validation | CSS L230–242, markup L519–526, JS L626–632 | Keep visible labels, `inputmode=tel`, the regex `/^(\+?88)?01\d{9}$/`, focus-to-error and `role=alert`. Replace the reset-only ending with B's `.done` success panel. |
| Reduced-motion block | L255–258 | Keep the rules. **Delete** `.reveal.pre` hiding (L253–254, L634–638). |

### From B (fable.html)
| Carry | Where | How to adapt |
|---|---|---|
| `.board`, `.board-top`, `.bell` | L115–118, L315–318 | Shell for THE BOARD. The header reads "দৈনিক রুটিন · {stage}" plus bell/location, then the Line strip, then the panel. Remove the `opacity:0` entrance (L243–244). The entrance is the one orchestrated moment: ruler span and bar flex-basis tween from the previous stage, 200–600ms expo, and it never hides content. |
| `.panel` + `.row dl` (`.big`, `.sub`) | L124–130, L327–330 | Rows: স্তর (name plus Arabic name in Naskh), শ্রেণি, সময় (plus day length, written "১৩ ঘণ্টা ৩০ মিনিট", not "১৩.৫"). Set `.big` in Anek 700, not Tiro. |
| Day ruler `.ruler .axis .tick .span .lbl` | L131–137, DOM L331–341 | Carry the DOM and CSS, but **generate ticks in JS** from `T0..T1` with Bengali 12h plus a period word, and clamp the end labels (`transform:none` / `translateX(-100%)`). On mobile show only ৭টা / দুপুর ১টা / রাত ৮:৩০. Add a brass **now-line** (from A's `.nowline` L187) positioned from Asia/Dhaka time. |
| Ruler update in `show()` | L572–574 | Fold into A's `select()`. Mutawassita has no hours, so show "দাখিলের পর এক বছর" and hide the span. |
| Balance bar `.bar .seg .q/.a/.g`, `.legend` | L138–147, JS L575–581 | Single encoding (drop A's `.stack` plus `.bar-row` duplication). Move segment colours into the brown family: quran `--hifz #4a2a14`, arabic `#b07a3c`, general `#d9c29a`. B's gold quran segment fights brass-as-only-metal. If `mix==null`, hide the bar and show "বিষয় বিভাজন শীঘ্রই" [DRAFT]. |
| Tablist keydown | L588–591 | Pattern reference only. A's per-button handler plus roving tabindex is better; merge into one tablist listener with ←/→/Home/End. |
| Fee table `.ftable` | L202–209, L461–472 | Carry the table structure. Use tabular numerals on Bengali digits (verify Anek column alignment). Add a sibling-discount row/note. |
| Docs list with `counter(d,bengali)` | L210–213, L474–480 | Carry. Counter colour should be date-brown on sand (see brass contrast below). |
| Photo `figcaption` caption strip | L186–188 | Becomes the signage-strip caption for every real photo and for the hero board frame ("এখন ক্যাম্পাসে" strip). |
| Waitlist success state `.wait.done .ok-msg` | L228–230 | Merge with A's validation. Move focus to the success message (`tabindex=-1`). |
| Basmala | L85, L280 | Keep, set in Noto Naskh, exactly as printed on the prospectus/site. Small, brass on walnut or date on sand. |
| People names in Tiro `.people li b` | L196, L433–447 | Tiro for names only. Add A's `.mono` monogram plate (L204–207) unless the current site has portraits (check `r2/raw/*teachers*`, `*directors*`, `dir_*.html`). |
| Map link | L502 | "ম্যাপে দেখুন" next to A's walk map. |

### New logic the blend needs (not in either file)
- **"এখন ক্যাম্পাসে" strip**:
  - Read the time with `Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Dhaka',hour:'2-digit',minute:'2-digit',hourCycle:'h23'})` → minutes, then filter `S` by `from<=m<to`.
  - At 10:00 several stages are on, so list them joined with " · ". At 15:40 only হিফজ ডে-কেয়ার is on. Outside 7:00–20:30, show "ক্যাম্পাস খুলবে সকাল ৭:০০-এ".
  - Green dot only when something is on.
  - Re-evaluate every 60s.
  - The weekly holiday is **unknown**, so either ask or mark [DRAFT]; don't show "open" on a Friday.
  - Render the server-free fallback text in HTML so the strip is complete at rest.

---

## 3. Pitfalls to avoid

1. **Never invent splits.** A gives Dakhil/Mutawassita 50/50 (L566–571) and shares them (L604). Only Pre-Hifz 25/25/50, Hifz 70/15/15 and After-Hifz 50/50 are sourced. Also, don't let the hero imply 50/50 during hifz years (B L291–301). Scope the claim as A did.
2. **Header overflow at 360–390** (B). Make the brand `min-width:0`, use icon-only secondary buttons ≤420px with an `aria-label`, keep one primary only, and add `top:env(safe-area-inset-top,0px)`. Test at 360 with Bengali fonts loaded: Anek is wider than fallbacks.
3. **Content hidden at rest** (A L253–254, B L243–244). No `opacity:0`/blur gating. Motion may only animate values that are already visible (ruler span, bar flex, fill width, walk-path dash).
4. **Horizontal page scroll**. Only the station strip and ticker scroll, each in its own container. Watch the ruler end labels, the hero tiles (`white-space:nowrap` on `.split`, A L85, at 360px with 38px min font), the fee table (wrap it in `overflow-x:auto`), and long people credentials.
5. **Brass on sand fails contrast.** `#c99a4b` on `#efe4d0` ≈ 2.0:1, which fails 3:1 for focus rings and icons. A's brass focus ring (L40) is invisible on sand. Use a date-brown focus ring on sand and brass on walnut. Never put brass text on sand (B's doc counters L212, B `.svc h3 svg` L182).
6. **Green means open or now only.** B uses it for "closed" (L91).
7. **Fonts**: no Amiri (B) and no Tiro for headings or UI (B L44). Arabic only for real Arabic, which rules out B's slogan L372. A's `.pan .ar` overlap at mobile (L104): don't position Arabic absolutely over numerals.
8. **Numerals**: Bengali digits in Bengali copy everywhere, including tiles, ticks, "50%" (A L311–312) and "600 m" (A L500). Latin only in English sublines. No "৭am".
9. **Duplicate instruments**: one Board only. Drop A's separate timetable section (L401–417) and B's `.journey` repeat (L358–364). The day-care section can reference the board via a `#hifz` deep link.
10. **CTA destinations**:
    - "ক্যাম্পাস ভিজিট" goes to `#visit`, not the waitlist form (A L289/302).
    - Prospectus goes to the real PDF route (`/api/download-prospectus` or the current-site downloads link from `r2/raw/*downloads*`), never `#`.
    - Phones should be `tel:+880…` (B style) and also selectable text.
11. **Unverified copy**: "সনদসহ" (B L377), "অভিভাবক কাজ সেরে ফেরার পর…" (B L389) and safety/communication lines (both) must carry [DRAFT] or come verbatim from the current site or prospectus.
12. **Share text** must be built from verified fields and stay Bengali, and the WhatsApp URL must be `encodeURIComponent`'d (A does this). Include the deep link with the contract hash names (A uses `#pre`/`#after`/`#mut`, which don't match).
13. **Tap targets**: B `.tab` padding 9px gives ~38px height, and A nav `.btn` is 40px. Make both ≥44.
14. **Ticker** must not be the only place a fact lives (it's decorative motion). Each fact recurs in the reasons, outcomes or board, and the scroller needs a visible affordance on mobile.
15. **Current-site content** is mandatory this round: news as announcements, teachers teaser, facilities, subject list, play spaces, real photos. Source it from `r2/raw/*.txt` and `r2/assets` (populated per `r2/photos.md`). Use no carousel, no stock images, and no `*-realistic.webp`/`*-subject.webp` in the hero unless photos.md confirms they are real photographs.
