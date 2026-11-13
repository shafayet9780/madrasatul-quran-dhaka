# Vercel usage (staying on Hobby)

On 2026-11-12 the Hobby team was paused at 154% of its 4 Active CPU hours (about 6.2 h in the month), and was moved to
Pro ($20 a month) to bring the site back. The aim is to return to Hobby. Week of Nov 6–13, about 60 CPU-minutes
(4.3 h a month):

| Where | CPU a week | Why |
|---|---|---|
| `/[locale]/pre-admission` | 17 min (10K visits) | rendered on every visit (it read the visitor's cookies) |
| `/pre-admission/start`, `/find` | 8 min (23K) | loaded in the background from the pre-admission page's buttons |
| `/api/image/[ref]` | 8 min (45K) | a redirect with no cache header: the flow's logo asked for it on every page |
| homepage and other pages | ~15 min | rebuilt from the CMS every 60 s (homepage about 0.7 s each) |

## What changed (branch `vercel-usage`)

- **The pre-admission page is cached.** Visitors with an application, a Find grant or the office's test pass
  (`PERSONAL_ADMISSION_COOKIES`, `src/lib/admissions/cookies.ts`) are shown `pre-admission/mine` at the same address by
  the proxy: it offers to continue the application, and the test pass opens the form, as before. The flow pages say
  `force-dynamic` themselves (the layout no longer does).
- **Its buttons, the start page's Find link and the flow's logo and back links load on click**, not in the background
  (a flow page's links to the pre-admission page would otherwise render `mine` in the background).
- **Images:** the flow's logo is a Sanity CDN URL; `/api/image` and `/api/favicon` redirects are cached a day.
- **Content is kept for an hour** (`CONTENT_REVALIDATE`, `src/lib/sanity-fetch.ts`), not 60 s. A publish in the Studio
  refreshes the site at once through a Sanity webhook (below); pages read Sanity's API, not its CDN, so the refresh
  can't pick up the old version. When the admission form opens or closes within the hour, the pages refresh then
  (`refreshBy`). The applications themselves read the form with a 60 s refresh (`loadCurrentCycle`), so switching it
  off or changing a fee reaches them within a minute even without the webhook; the pages showing it follow the webhook.
- **Not refreshed by the webhook:** the favicon (`/api/favicon`, cached a day) and `/api/image` redirects (a day).

## Owner steps

1. **Sanity webhook** (sanity.io/manage → the project → API → Webhooks → Create):
   - Name: `Refresh website`
   - URL: `https://www.madrasatulquranbd.com/api/webhooks/sanity/revalidate`
   - Dataset: `production`
   - Trigger on: Create, Update, Delete. Filter and projection: empty. Drafts: off. HTTP method: POST
   - Secret: a long random value
2. **Vercel** → Settings → Environment Variables: `SANITY_REVALIDATE_WEBHOOK_SECRET` = the same value (Production), then
   redeploy. Without it the webhook answers 503 and edits show within the hour.
3. **Check a week of usage** (Observability → Functions, last 7 days). Target: under 30 CPU-minutes a week
   (about 2 h a month), so a busy admissions month stays under 4 h. Then Settings → Billing → Downgrade Plan, before the
   next Pro bill.

Hobby pauses the site at 100% with no warning and no way to buy more, so look at the Usage page weekly while
admissions are open.
