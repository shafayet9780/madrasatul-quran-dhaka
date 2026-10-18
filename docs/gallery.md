# Gallery: photos and videos

The owner approved the design in October 2026.

- Design canvas: https://claude.ai/artifact/FsAEecyvkzfaBn7fRHkEL5, the Final boards at the top:
  - Final (Bengali), FinalPhone, FinalEn, FinalEnPhone: the gallery page.
  - FilterLater: the filter bar from the second year.
  - FinalAlbum (with text), FinalAlbumPlain (without), FinalAlbumPhone: the album page.
  - Viewer and ViewerPhone: the photo viewer.
- The other boards on that canvas are history: the first concepts, Blend, Wall and Stories, the first draft, and HifzWall, which is a separate idea and not part of the launch.
- Design details: DESIGN.md, Gallery page.

## What it is

আমাদের দিনলিপি, "our school diary": classes, events and days on campus, kept album by album.

- `/[locale]/gallery`, top to bottom:
  - the hero, with the latest album as a collage
  - a filter bar that sticks to the top
  - the dated albums, month by month, with their videos
  - the videos on dark
  - the all-time albums
  - the close: come and see, or apply
- `/[locale]/gallery/[slug]`: one album.
  - With text it opens as a short story: the first photo large, two or three lines, a teacher's words, then all the photos.
  - Without text it is its photos.
  - A photo opens the viewer, which has its own link (`#photo-3`) for sending on WhatsApp.
- No counts or statistics at launch.

## Where things live

- **Albums:** Studio → Gallery (`sanity/schemas/album.ts`). One document per album:
  - name, link, date (or all-time), topic, two lines (optional)
  - photos, each with alt text and a caption in both languages; the first photo is the cover
  - videos as YouTube links
  - text (optional) and a teacher's words (optional)
  - a show switch
- **Photos:** in Sanity. **Videos:** on the school's YouTube channel; only the link comes to Studio. Originals stay in Drive.
  - A link with /shorts/ is upright, and so is any video marked upright. Upright videos go in the row of short videos; wide ones go in the month rows and the video band.
- **Switch:** Site Settings → Navigation Visibility → Gallery (`showGallery`).
  - Unlike the other switches it is off until someone turns it on, so the menu never links to an empty gallery.
  - It controls the page, the albums, the menu link after ক্যাম্পাস, the footer, the sitemap, and the links from the homepage campus section and the Campus page's close.
- **Code:**
  - `src/lib/gallery/albums.ts` (pure, unit-tested): normalising an album, dates in words, month rows, filtering, neighbours, structured data.
  - `src/components/gallery/`: the sections, the video tile and the viewer.
  - Copy: `messages/*.json` `gallery.*`.
- **Local preview** (`ADMISSIONS_LOCAL=1`): the gallery is on, with sample albums made of the site's own photos (`src/lib/gallery/testing/sample-albums.ts`). `e2e/gallery.spec.ts` runs there (`pnpm test:e2e:admissions`).

## Rules for the content (owner, October 2026)

- No photos of girls above Class 1. Children's faces are fine.
- No music in videos.
- Captions in both languages. Studio warns when only one is filled in.
- Missing facts stay in [brackets]; nothing is invented.

## Open with the owner

- Confirm the storage: photos in Sanity, videos on the school's YouTube channel, originals in Drive. Does the school have a YouTube channel?
- May adult women (mothers) appear in photos?
- The news link on the album page (এই অনুষ্ঠানের খবর পড়ুন) is left out until the news pages are redesigned. The live news items are samples without photos.
