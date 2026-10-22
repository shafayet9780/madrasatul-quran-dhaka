---
version: 1
slug: "src-app-locale-page-tsx"
primary_target: "src/app/[locale]/page.tsx"
related_targets: []
---

# Homepage (Persuade)

Scope: bilingual homepage (`/bengali`, `/english`), phase 1 of the 2027 revamp. Visitor: practising, educated Dhaka parent on an Android phone, sceptical of madrasa quality, deciding over weeks and sharing links in family WhatsApp groups. Job: understand the 50-50 model, trust the service and the founder, then apply (pre-admission 2027) or visit. Proof on hand: prospectus facts, three sourced splits, stage hours, the class-by-class study plan, transport routes, the founder's letter, ~15 phone photos. Constraints: brown family only, green only as the open-status dot, no fees on home, no invented facts or schedules, Bengali digits in Bengali, Anek Bangla + Anek Latin, Tiro Bangla for quotations only, no em or en dashes.

Owner red lines: not traditional or ornamental, not long or busy, not empty or proof-light, not the austere white "transit signage" look (rejected 2026-10-10).

Unresolved: floor-by-floor use of the building, application dates ([শেষ তারিখ] placeholders), each stage's daily routine (the day chart takes blocks once it exists), final copy sign-off on new lines.

## Direction contract

THESIS: A warm cream and deep-brown school page that proves 50-50 with its own graphics: the giant solid/outlined ৫০/৫০, a stage split card, the class-by-class plan, and the day on one time axis. Light and dark sections alternate. Refuses the photo carousel over a slogan, a people grid, and the white signage page.

OWN-WORLD: Cream #F4ECDD and paper #FBF7EF for light sections, deep brown #2C1F15 for dark ones (panels #3A2A1E), ink #2B1608, rust #8A3F0A from the logo for the primary button, the selected state and the closing card, bronze #C58A4B on dark. Radius rule: cards 16-20px, photos 12-14px, chips 6px, buttons and stage tabs pill (tabs 14px when they wrap). Anek Bangla/Latin for everything, Tiro Bangla for the two quotations. Real phone photos with captions below, never overlaid. Phosphor (regular) for the few icons.

STORY: Sees 50-50 and how the mix changes per stage; reads the ten-year plan class by class; sees the day and the transport; sees the campus and how to reach it; reads why parents chose the school and the founder's own words; applies or books a visit.

FIRST VIEWPORT (revised 2026-10-12 after team review): Cream. Left: H1 "মাদরাসাতুল কুরআন" (rust) over the approved line "ইসলামি ও সাধারণ শিক্ষার আদর্শ সমন্বয়", then two buttons only: আবেদন করুন (rust) and প্রসপেক্টাস ডাউনলোড (outlined). No sub-copy. Right: a three-photo mosaic from the CMS hero images (drawings classroom, round table, entrance with signboard) with selling-point chips overlapping its lower edge: ৫০/৫০ (dark), day-care hifz with general study, Arabic medium from Class 6. Directly below: a dark numbers band from siteSettings.statistics, counts shown as a rounded floor with "+" (130 to ১৩০+, 28 to ২৫+; step 10 from 100, else 5), the teacher ratio derived from the exact values, plus the achievements list. The former hero (৫০/৫০ mark, strands, stage split card) follows as the "শিক্ষা পদ্ধতি" section, H2.

FORM: Blend pinned by the owner: concept A hero, The Line's split card and day chart with time slider, Ten Years' class table with subject chips, C's dark founder letter. Then: station line over the table, transport route diagrams with the van, campus photos plus a rooftop/field drawing and a metro walking map, eight "why" cards (two photos, two goal figures, four icons), a parents' questions list (six answers restating facts on the page; FAQPage JSON-LD), a rust pre-admission card, a dark footer, and a phone-only apply bar that appears after the hero.

MOTION (2026-10-12): motion only where it explains: hero photos settle and chips rise on load; numbers count up on view; split tiles glide between stage splits (signature); the ten-year line and van routes draw with scroll (CSS scroll-driven); button, answer-open and page-change micro motion. Reading text never animates. No library; transform/opacity/clip-path only; full content in HTML first; H1, buttons and first photo never fade; prefers-reduced-motion turns all off. Spec board: Motion.dc.html on the canvas.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
