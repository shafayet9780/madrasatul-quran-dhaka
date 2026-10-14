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

Found in the same audit. Each touches every page, so it goes with the page redesigns:

- **Cached pages.** Every `[locale]` route renders on each request (`Cache-Control: no-store`, rendered in Singapore, about 0.35 s to the first byte). Static pages refreshed every 60 s need `setRequestLocale` and `generateStaticParams` in each layout and page. (`cacheComponents` stays off; see CLAUDE.md.)
- **Only the page's own text in the browser.** `src/app/[locale]/layout.tsx` sends all of `messages/{locale}.json` to the client (about 20 KB compressed, a fifth of the homepage HTML). Send the shared namespaces (`site`, `admissionCta`, `analytics`) from the layout and each page's own namespaces from the page.
- **A lighter Bengali font.** Anek Bangla is 153 KB. Trim it to the characters and weights the site uses.
