# Site revamp: release steps

Steps to take when the redesigned site goes live, after every page is redesigned. Agreed with the owner on 2026-10-15.

## 1. One main address: www.madrasatulquranbd.com

**Now (found in the audit of 2026-10-14):** pages are served from `https://www.madrasatulquranbd.com`, but the canonical links, sitemap, robots.txt, share links and the homepage's School data all point to `https://madrasatulquranbd.com`. That address answers with a **307 (temporary)** redirect back to www, so Google is told the main address is one that redirects away.

**Decision:** www is the main address. It is where the site already ends up, and it is what Vercel recommends.

Where things live: DNS is on Cloudflare, set to DNS only (grey cloud), pointing at Vercel. The redirect is made by Vercel. Leave Cloudflare as it is.

**Steps (Vercel, Project → Settings):**

1. **Environment Variables:** set `NEXT_PUBLIC_SITE_URL` to `https://www.madrasatulquranbd.com` for Production, then redeploy. Everything listed above reads this value (`getSiteUrl()`), so no code change is needed. This is the step that matters.
2. **Domains:** on `madrasatulquranbd.com`, set the redirect to www as **308 (permanent)** or keep **307**:
   - 308 (or 301; Google treats them the same) is the clearest signal to Google. Browsers may remember it, though: Vercel's current 308s (http to https) send no `Cache-Control` header. If the main address were ever switched back to the non-www one, visitors who remember it would get a "too many redirects" error until they clear their browser data.
   - 307 is never remembered by browsers (Vercel sends `max-age=0` with it). With step 1 done, the canonical links and sitemap already tell Google which address is the main one.
   - Choose 308 only if www is final. After switching, check what it sends: `curl -sI https://madrasatulquranbd.com/ | grep -i "cache-control\|location"`.
3. **Google Search Console:** submit `https://www.madrasatulquranbd.com/sitemap.xml` (add the www property first if it is not there).

**Check afterwards:**

```bash
curl -s https://www.madrasatulquranbd.com/bengali | grep -o '<link rel="canonical" href="[^"]*"'   # www
curl -s https://www.madrasatulquranbd.com/robots.txt | grep -i sitemap                            # www
curl -sI https://madrasatulquranbd.com/bengali | grep -i "^HTTP\|location"                        # 307/308 to www
```

## 2. Performance work left for the redesign

Found in the same audit; all three done on 2026-10-18 (results in section 3):

- **Cached pages.** Every `[locale]` route rendered on each request (`Cache-Control: no-store`, rendered in Singapore, about 0.35 s to the first byte). Now the pages are built ahead of time and refreshed every 60 s (`setRequestLocale` in each layout and page; `[locale]/layout.tsx` is the root layout; the visitor's country comes from a cookie). Pre-admission and downloads still render on each visit. (`cacheComponents` stays off; see CLAUDE.md.)
- **Only the page's own text in the browser.** The layout sent all of `messages/{locale}.json` to the client (about 20 KB compressed, a fifth of the homepage HTML). Now it sends the shared namespaces (`admissionCta`, `analytics.consent`, `preview`), and pre-admission, teachers and news add their own (`src/lib/i18n-messages.ts`).
- **A lighter Bengali font.** Anek Bangla was 153 KB. Trimming it to the characters the site uses isn't possible, since the CMS text can use any of them. It is now self-hosted at weights 400 to 800 (138 KB) and preloaded on Bengali pages only, so an English page no longer downloads it. Tiro Bangla is one 54 KB file with its own spaces and punctuation, replacing Google's file plus a 20 KB Latin one.

**Check at launch:** the cache was confirmed on the preview (`x-vercel-cache: HIT`), but only with a Vercel login cookie, so a first visit (no cookies, when the proxy sets the country cookie) could not be tried there. curl sends no cookies, so every run is a first visit. On the live site, run this twice. Both runs should set `mq-country`, and the second should say `HIT` (or `STALE`):

```bash
curl -sI https://www.madrasatulquranbd.com/bengali | grep -i "x-vercel-cache\|set-cookie"
```

If it stays `MISS`, the cookie is stopping Vercel from caching first visits (`src/proxy.ts`); fix that before relying on the cache.

## 3. Audit of 2026-10-18 (design-revamp, local production build)

Lighthouse on eight pages (phone and desktop) and a crawl of the sitemap and every internal link.

- **Scores:** desktop 99 to 100 everywhere. On a phone (Lighthouse's slow 4G and slow phone), 79 to 89, LCP 3.7 to 5.2 s; no layout shift and little blocking time. What holds the phone back is how much each page sends before it can draw: fonts, the page's HTML (with every message of the language) and JavaScript.
- **Fixed the same day:**
  - The homepage no longer loads GSAP (an unused old section was still exported from `src/components/homepage/index.ts`), so its JavaScript fell from about 232 to 187 KB compressed.
  - Page titles end with the school's name in the page's language (`[locale]/layout.tsx`); the English homepage title is under 60 characters.
  - The privacy and cookie pages have canonical links and hreflang.
  - The old News and Programs pages are `noindex` until they are redesigned, and Programs follows its Site Settings switch.
- **After section 2 (same day, same eight pages):** phone scores 84 to 93 (from 79 to 89), LCP 3.2 to 4.5 s (from 3.7 to 5.2 s); desktop 99 to 100. Server response under 40 ms on the cached pages (it was up to 200 ms). The HTML is 18 to 20 KB smaller on every page. Fonts on a Bengali page are 182 to 237 KB (from 197 to 270), and on an English page 44 KB (from 197); the English homepage now sends 397 KB in all (from 582). The JavaScript grew by about 5 KB with the new 404 page's boundary.
- **Done later the same day:**
  - Pre-admission reads the intake from the published form in season, like the Admissions page, so a new visitor's page needs no database (it asked it twice, 200 to 600 ms). The database's cycle is still used for a test pass, a draft preview, and a form switched off or not building (`getLandingIntake`).
  - Longer descriptions: a director's page says who they are at the school, then their summary (115 to 153 characters on the four profiles); pre-admission's is about 150.
  - The homepage's School data has the photo of the school's front, its place on the map, and the office hours from Site Settings (when written like "Sat - Thu: 8:00 AM - 5:00 PM").
- **Still to do:**
  - Turn on Vercel Speed Insights (commented out in `src/app/[locale]/layout.tsx`) to see what parents' phones actually get.
