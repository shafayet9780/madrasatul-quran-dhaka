# Campus page: a day on campus (locked concept)

Owner locked this on 15 October 2026. Build it in a fresh session from this file.

- Prototype (claude.ai design canvas, opens on it): https://claude.ai/artifact/UU9DjAsLNYBEhx8b4EP5Hz
  boards `Day.dc.html` (desktop) and `DayPhone.dc.html`. A copy of their source is in `docs/campus-day-prototype/`.
  The other boards on that canvas (concepts A, B, C, the place-only tour, the first draft) are history.
- How we got here: a plain campus page was rejected ("should be something unique"); of three concepts the owner
  chose B (a journey from the metro to the roof), asked for it as a scroll-animated tour, then widened it into a
  whole day: time and place together.

## The idea

One school day told as the reader scrolls: from the metro station in the morning to home time at 8:30 at night.
Each stop is a time and a place. Text scrolls normally on one side; on the other a pinned stage plays the day.

Always on the stage:

- **Clock**: the hour (or a part of the day: আসরের পর, মাগরিব) and the part of the day above it.
- **Sun → moon**: a dot crossing a track over the whole day (desktop only); it becomes a moon after dark.
- **Sky**: the stage background follows the time (brown palette only): dawn `#e3c9a6`, morning `cream`,
  day `sand-pale`, afternoon `sand`, late afternoon `#e3c9a6`, dusk `panel`, night `dark`. Drawn windows light
  up (`bronze-light`) as it darkens.
- **Who is in school**: chips প্রি-হিফজ, হিফজ, আফটার হিফজ, lit when present, dimmed when not.
- **Lift**: the floor list with a marker that slides to the current floor, shown only inside the building.

## The stops (prototype order; the owner will send the real list and photos)

| Time | Place | Stop | Motion |
|---|---|---|---|
| ভোরে | Uttara Center metro | মাদরাসাতুল কুরআনে একটি দিন (H1); 600 m east | the walk path draws (scroll-linked) |
| 7:00 | the road | স্কুলের গাড়ি আসছে; vans from Uttara and Mirpur | a drawn van drives to the building; the real van photo pops in |
| 7:00 | ground floor | প্রবেশপথ | the drawn building's door opens (clip-path) into the daytime entrance photo |
| 7:00 | [floor] | Hifz: সবক ও সাত সবক | photo settles; lift rises; হিফজ chip lights |
| 8:00 | [floor] | After-Hifz (Class 6 to Mutawassita), 8 to 1 | same; আফটার হিফজ lights |
| 9:00 | [floor] | Pre-Hifz (Nursery to Class 1), 9 to 1 | same; প্রি-হিফজ lights |
| 10:00 | [floor] | Hifz students' Arabic, Islam and general class, 2.5 hours | same |
| morning | [floor] | office and other rooms | photos change with the scroll, each named |
| 1:00 | entrance | Pre-Hifz and After-Hifz go home | the van drives away; their chips dim mid-stop |
| meanwhile, 12:30 to 2:45 | [dining/rest] | salat, bath, lunch, nap | moments (salat, meal, sleep) light in turn |
| 3:00 | [hifz room] | আমুখতা, তিলাওয়াত ও নাজেরা | |
| after Asr | roof | girls in the roof garden | the picture opens from the sky down |
| after Asr | beside the building | boys on the field | the picture slides in from the side |
| Maghrib to 8:20 | [salat space, hifz room] | Maghrib, new sabak, Isha | sky to dusk then night; moments light in turn; moon |
| 8:30 | entrance | বাড়ি ফেরা | the lit evening entrance pulls back; the last chip fades |

Close: "নিজে এসে দেখুন", office hours, directions and call buttons (dark band), then the footer.

Facts come from the prospectus (14 Oct) and the hifz routine (`home.day.parts`): stage hours, the routine's order
(revision at 3:00 comes before play after Asr; the owner first listed play first and was told), play spaces,
600 m from the metro, vans from Uttara and Mirpur. Anything unknown stays in [brackets] until the owner's list.

## Owner input still to come

- The list of stops: time, place (floor number), what happens (one or two lines), 1 to 3 photos each (landscape).
- Photos needed: each floor's class, Hifz class, dining and rest area, afternoon revision, roof garden, field,
  evening salat; better entrance photos optional (daytime and evening ones exist).
- Children eating or sleeping: wide shots, backs or empty rooms; consent for clear faces.
- Sign-off of the new copy: মাদরাসাতুল কুরআনে একটি দিন; চলুন, সকাল থেকে রাত পর্যন্ত ক্যাম্পাসের একটি দিন দেখি।;
  স্কুলের গাড়ি আসছে; প্রি-হিফজ ও আফটার হিফজের ছুটি; একই সময়ে; বাড়ি ফেরা; নিজে এসে দেখুন. English later.
- Open: menu link "ক্যাম্পাস" after কারিকুলাম, behind Site Settings `showCampus` until the photos are in?

## Content model (Studio)

A `campusDay` singleton (or `campusPage`) with an ordered list of stops. Per stop:

- `kind`: approach | arrive (van) | entrance | floor | rooms | leave (van) | moments | roof | field | exit | other.
  The animation follows the kind; editors never pick effects.
- `label` (text-side time line, bn/en), `clock` (one or more HUD values, bn/en; several = moments within the stop),
  `part` (part of the day), `sky` (dawn | morning | day | afternoon | late | dusk | night; one per moment).
- `place` (bn/en), `floor` (number; puts it on the lift), `title`, `text` (bn/en).
- `groups` present (per moment): pre-hifz, hifz, after-hifz.
- `photos`: 1 to 3 with alt (bn/en); `moments`: icon (salat, meal, sleep, book…) + label for the moments kind.
- `show` on/off. Any number of stops; the lift lists only floors that appear. A stop without its photo is hidden.

## Mechanics (as prototyped; keep them in the build)

- Text steps are normal sections (headings, paragraphs) in the HTML: readable, indexable, never animated.
  The stage is `aria-hidden` and only repeats what the text says.
- Desktop: steps left, the stage `position: sticky` on the right (100vh). Phone: the stage pinned on top (50vh),
  steps pass under it; `view-timeline-inset` accounts for the stage.
- Two layers of motion:
  1. **Which stop and which moment** (clock, sky, chips, lift, layer cross-fades): a small scroll handler
     (rAF-throttled; in the build an IntersectionObserver plus progress) picks the step whose top passed the
     reading line (55% of the viewport; 74% on phones) and the moment inside it; CSS transitions do the rest.
  2. **Motion inside a stop** (path draw, van drive, door, settle, roof, field, pull back): CSS view timelines,
     one per step (`--t0…`, `timeline-scope` on the tour). Base styles are the end states, so browsers without
     scroll timelines (Firefox today) still show every stop correctly, just without the in-stop motion.
- Reduced motion: no stage; each step shows its own photo inline.
- No animation library; transforms, opacity and clip-path only. Server-render everything; the client part is the
  scroll handler.

## Build checklist (for the fresh session)

1. Read this file and the prototype source; open the canvas to feel the timing.
2. Schema + Studio entry; the owner's list into Studio (or seed from it); stand-in photos never ship.
3. Components in `src/components/campus/` (replace the old facilities/virtual-tour/safety components and the seed
   `facility` data use); page `src/app/[locale]/campus/page.tsx`; messages `campus.*` (old keys out).
4. Menu link + sitemap entry following `showCampus`.
5. Unit tests for the pure parts (stop normalisation, groups/lift per moment, sky per moment), e2e for the page
   (all stops' text present, no overflow at 320/390/1280, reduced-motion shows stills), axe, Lighthouse.
6. Design system module (m14) + DESIGN.md Campus section; memory; full diff review before reporting.

## Build notes (15 October 2026)

Built on `design-revamp` from this spec; where the build differs from the prototype:

- **Words hold still while their stop plays.** In the prototype each step's text sat in the middle of a tall box, so the
  stage changed before the reader saw the new words. Now each step's text sits at the top of its step and is sticky
  (30vh from the top on desktop, just under the stage on phones); the reading line is 60% of the screen (78% on
  phones), so the stage changes as the new words come up. A step's height is how long its stop plays.
- **Launch day.** While Studio → Campus: a day has no stops, the page shows the day in `src/lib/campus/launch-day.ts`
  (this spec's stops and copy, English drafted). Only real photos: the floors, roof and field stay hidden until their
  photos exist (the roof and field take Studio → Homepage → Play spaces once those are added). The lift needs two
  floors, so it shows once the floor photos are in.
- **Moments:** the midday stop has four (salat, shower, lunch, nap) to match its heading; 3:00 has three (আমুখতা,
  তিলাওয়াত, নাজেরা). Icons: Phosphor shower and arrows-clockwise added.
- **Motion polish:** the walker dot rides the drawn path; van wheels turn with the drive and its headlight shows at dawn;
  the door's two leaves open before the photo comes through; windows light one by one; the clock rolls; the sun's
  track turns solid behind it; moment tiles are joined by a filling line and ring once as they light. Photos further
  on load as the day comes to them (only the stops beside the current one are laid out).
- **No script:** like reduced motion, each step shows its own photos (a `<noscript>` style).
- `showCampus` was unset in live Site Settings on 15 October (counts as shown): switch it off in Studio before this
  branch deploys if the page should wait for the photos.
