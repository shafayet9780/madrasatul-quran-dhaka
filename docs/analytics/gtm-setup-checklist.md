# GTM Setup Guide (Greenfield)

Step-by-step setup for the GTM-first analytics stack. Use this when **no** GTM, GA4, or Clarity resources exist yet. Meta Pixel is assumed **already created** — you only wire it into GTM.

**Audience:** developer doing one-time account + container setup, then handing dashboards to marketing.

**Spec:** [`analytics-spec.md`](./analytics-spec.md)

---

## Locked decisions (this project)

| Item | Choice |
|------|--------|
| Account owner | Your **personal** Google / Meta / Microsoft accounts (transfer school Admin later if needed) |
| Site | `https://madrasatulquranbd.com` |
| GTM | One **production** web container named **MQD Website** |
| GA4 | Property **MQD - Website**, timezone **Asia/Dhaka**, currency **BDT** |
| Meta | Use **existing** Pixel (do not create a second Pixel) |
| Clarity | New project for this site |
| Google Ads | **Not** created in v1 — Conversion Linker only; link Ads later via GA4 |
| App env | `NEXT_PUBLIC_GTM_ID` only — set on Vercel **after** Preview verifies tags |
| GA4 events (v1) | Recommended funnel (see §8) |
| Meta events (v1) | PageView + Lead + SubmitApplication on `generate_lead`; ViewContent on admission CTAs |

**Do not** put GA4 Measurement ID, Meta Pixel ID, Clarity Project ID, or Ads IDs in the Next.js repo or app env. Only `NEXT_PUBLIC_GTM_ID` belongs in `.env` / Vercel.

---

## Prerequisites

- [ ] Personal Google account signed in
- [ ] Access to the existing Meta Business / Events Manager Pixel for Madrasatul Quran
- [ ] Personal Microsoft account (for Clarity)
- [ ] GTM-first app code deployed or runnable locally (`AnalyticsProvider` + `dataLayer` pushes)
- [ ] Ability to edit Vercel env vars for the production project (later step)

---

## Order of work

```text
1. Create GTM container          → note GTM-XXXXXXX
2. Create GA4 property           → note G-XXXXXXXX
3. Locate existing Meta Pixel ID → note numeric Pixel ID
4. Create Clarity project        → note Project ID
5. Configure GTM (variables → triggers → consent → tags)
6. Verify in GTM Preview (+ GA4 DebugView, Meta Test Events, Clarity)
7. Publish GTM version
8. Set NEXT_PUBLIC_GTM_ID on Vercel + redeploy
9. Production smoke + handoff notes
```

Do **not** set `NEXT_PUBLIC_GTM_ID` on Vercel until step 6 passes.

---

## 1. Create Google Tag Manager

### 1.1 Create account + container

1. Open [Google Tag Manager](https://tagmanager.google.com/).
2. Sign in with your personal Google account.
3. Click **Create Account**.
4. **Account Setup**
   - Account Name: `Madrasatul Quran` (or `MQD`)
   - Country: Bangladesh
5. **Container Setup**
   - Container name: `MQD Website`
   - Target platform: **Web**
6. Accept Terms of Service.
7. On the install snippet screen, copy the container ID only: `GTM-XXXXXXX`.
   - You do **not** paste the GTM snippet into the Next.js layout — the app loads GTM via `AnalyticsProvider` using `NEXT_PUBLIC_GTM_ID`.
8. Close the install dialog (or choose **OK**).

### 1.2 Workspace hygiene

1. Work in the default workspace, or create a named workspace: `Setup - YYYY-MM-DD`.
2. Publish only after Preview verification (§10). Use Preview before every publish.

### 1.3 Enable Consent Overview

1. In the container, open **Admin** (gear) → **Container** settings / **Consent Settings** (UI label may be **Consent Overview**).
2. Enable **Consent Overview** so tags show required consent types.
3. Plan to use Google **Consent Mode v2** via tags in §6 (defaults + updates from the app `dataLayer`).

**Checkpoint:** You have `GTM-XXXXXXX` written down. Leave Vercel env unset for now.

---

## 2. Create GA4 property

### 2.1 Create property + web data stream

1. Open [Google Analytics](https://analytics.google.com/).
2. **Admin** (gear) → under **Account**, create an account if needed (e.g. `Madrasatul Quran`).
3. Under **Property**, click **Create property**.
4. Property details:
   - Property name: `MQD - Website`
   - Reporting time zone: **Asia/Dhaka**
   - Currency: **Bangladeshi Taka (BDT)**
5. Continue through business details (school / education is fine).
6. Choose platform: **Web**.
7. Web stream:
   - Website URL: `https://madrasatulquranbd.com`
   - Stream name: `MQD Website` (or `Production`)
8. Create stream. Copy the **Measurement ID**: `G-XXXXXXXX`.

### 2.2 Keep for later (after GTM tags work)

- [ ] Mark `generate_lead` as a **Key event** (Admin → Data display → Events / Key events) once the event has been received at least once from a test hit.
- [ ] Google Ads linking: skip until an Ads account exists.

**Checkpoint:** You have `G-XXXXXXXX`. Do not put it in app env.

---

## 3. Locate existing Meta Pixel

Do **not** create a new Pixel.

1. Open [Meta Events Manager](https://business.facebook.com/events_manager2).
2. Select the Business / Pixel already used for Madrasatul Quran.
3. Open **Settings** (or Pixel details) and copy the **Pixel ID** (numeric).
4. Confirm you can open **Test Events** for that Pixel (needed in §10).

**Checkpoint:** You have the existing Pixel ID. If you cannot find it, stop and resolve Meta access before continuing GTM Meta tags.

---

## 4. Create Microsoft Clarity project

1. Open [Microsoft Clarity](https://clarity.microsoft.com/) and sign in with your Microsoft account.
2. **Add new project**:
   - Name: `MQD Website` (or `Madrasatul Quran`)
   - Website URL: `https://madrasatulquranbd.com`
3. Skip installing Clarity’s own script on the site — you will load Clarity **only via GTM**.
4. Copy the **Project ID** from project Settings.
5. In Clarity project settings:
   - Prefer **masking** sensitive content (default / balanced masking is fine for v1).
   - Confirm you will verify form masking on `/pre-admission` and `/contact` after go-live (app uses `data-clarity-mask="true"` on those forms).

**Checkpoint:** You have Clarity Project ID. Do not put it in app env.

---

## 5. GTM Data Layer Variables

In GTM: **Variables** → **User-Defined Variables** → **New** → Variable Type **Data Layer Variable**.

Use these exact names (for consistency in tags).

### 5.1 Consent / global

| Variable name | Data Layer Variable Name | Data Layer Version |
|---------------|--------------------------|--------------------|
| `dlv - event` | `event` | Version 2 |
| `dlv - analytics_storage` | `analytics_storage` | Version 2 |
| `dlv - ad_storage` | `ad_storage` | Version 2 |
| `dlv - region` | `region` | Version 2 |
| `dlv - consent_mode` | `consent_mode` | Version 2 |
| `dlv - page_path` | `page_path` | Version 2 |
| `dlv - page_title` | `page_title` | Version 2 |
| `dlv - locale` | `locale` | Version 2 |

### 5.2 Funnel / engagement

| Variable name | Data Layer Variable Name |
|---------------|--------------------------|
| `dlv - form_type` | `form_type` |
| `dlv - success` | `success` |
| `dlv - file_category` | `file_category` |
| `dlv - cta_location` | `cta_location` |
| `dlv - cta_source` | `cta_source` |
| `dlv - link_domain` | `link_domain` |
| `dlv - from_locale` | `from_locale` |
| `dlv - to_locale` | `to_locale` |
| `dlv - content_type` | `content_type` |
| `dlv - content_id` | `content_id` |
| `dlv - program_category` | `program_category` |

### 5.3 Attribution (safe fields only)

| Variable name | Data Layer Variable Name |
|---------------|--------------------------|
| `dlv - utm_source` | `utm_source` |
| `dlv - utm_medium` | `utm_medium` |
| `dlv - utm_campaign` | `utm_campaign` |
| `dlv - utm_content` | `utm_content` |
| `dlv - utm_term` | `utm_term` |
| `dlv - gclid_present` | `gclid_present` |
| `dlv - fbclid_present` | `fbclid_present` |
| `dlv - landing_page` | `landing_page` |
| `dlv - referrer_domain` | `referrer_domain` |
| `dlv - attribution_model` | `attribution_model` |

**Do not** create variables for raw `gclid`, `fbclid`, names, email, phone, or message content.

Optional constants (if you prefer not to hardcode IDs inside every tag):

| Variable name | Type | Value |
|---------------|------|-------|
| `const - GA4 Measurement ID` | Constant | `G-XXXXXXXX` |
| `const - Meta Pixel ID` | Constant | existing Pixel ID |
| `const - Clarity Project ID` | Constant | Clarity Project ID |

---

## 6. GTM Triggers

**Triggers** → **New** → type **Custom Event**.

| Trigger name | Event name | This trigger fires on |
|--------------|------------|------------------------|
| `CE - consent_default` | `consent_default` | All Custom Events |
| `CE - consent_update` | `consent_update` | All Custom Events |
| `CE - page_view` | `page_view` | All Custom Events |
| `CE - generate_lead` | `generate_lead` | All Custom Events |
| `CE - form_start` | `form_start` | All Custom Events |
| `CE - form_submit` | `form_submit` | All Custom Events |
| `CE - form_attempt` | `form_attempt` | All Custom Events |
| `CE - file_download` | `file_download` | All Custom Events |
| `CE - click_to_call` | `click_to_call` | All Custom Events |
| `CE - click_to_email` | `click_to_email` | All Custom Events |
| `CE - click_to_whatsapp` | `click_to_whatsapp` | All Custom Events |
| `CE - outbound_click` | `outbound_click` | All Custom Events |
| `CE - language_change` | `language_change` | All Custom Events |
| `CE - view_content` | `view_content` | All Custom Events |
| `CE - exception` | `exception` | All Custom Events |

### Consent on vendor tags (do this when you create GA4 / Meta / Clarity / Ads tags)

On each tag → **Advanced Settings** → **Consent Settings** → **Require additional consent for tag to fire**:

| Tags | Require |
|------|---------|
| GA4, Clarity | `analytics_storage` |
| Meta Pixel, Conversion Linker | `ad_storage` |

Skip extra “consent-gated” trigger conditions. Consent Mode (§7) + these tag settings are enough.

---

## 7. Consent Mode tags

**Goal:** When the app pushes `consent_default` / `consent_update` to `dataLayer`, GTM must tell Google “granted” or “denied” for analytics and ads.

**Do not** use a **Custom HTML** tag with `gtag('consent', ...)`. GTM will warn that those commands may not run in time. Use a **Consent Mode template** instead (it calls GTM’s consent APIs correctly).

### 7.1 Add the Consent Mode template (once)

1. In GTM left nav: **Templates**.
2. Under **Tag Templates**, click **Search Gallery**.
3. Search for **Consent Mode** (Google’s vendor-agnostic / “Consent Mode (Google tags)” style template, or another gallery template that exposes **Default** and **Update** commands with `setDefaultConsentState` / `updateConsentState`).
4. Click **Add to workspace** → confirm.

If the gallery template UI differs slightly, the idea is the same: one tag that sets **default** consent, one that **updates** consent, both reading your DLVs.

### 7.2 Tag: `Consent - Default`

1. **Tags** → **New** → name `Consent - Default`.
2. Tag type: the Consent Mode template you just added → choose **Default** / **Set default consent** (wording varies).
3. Map consent types from your Data Layer Variables:

   | Consent type | Value |
   |--------------|--------|
   | `analytics_storage` | `{{dlv - analytics_storage}}` |
   | `ad_storage` | `{{dlv - ad_storage}}` |
   | `ad_user_data` | `{{dlv - ad_storage}}` (same as ads in v1) |
   | `ad_personalization` | `{{dlv - ad_storage}}` (same as ads in v1) |

4. **Wait for update**: `500` (ms), if the field exists.
5. Trigger: `CE - consent_default`.
6. Save.

### 7.3 Tag: `Consent - Update`

1. **Tags** → **New** → name `Consent - Update`.
2. Same template → choose **Update** / **Update consent**.
3. Map the same four types to the same DLVs as above.
4. Trigger: `CE - consent_update`.
5. Save.

### 7.4 What you should see later in Preview

| App event | Consent tag that fires |
|-----------|-------------------------|
| `consent_default` | `Consent - Default` |
| User accepts / changes prefs → `consent_update` | `Consent - Update` |

Then GA4/Clarity only run when `analytics_storage` is granted; Meta / Conversion Linker only when `ad_storage` is granted.

**Verify in §13:** denied / opt-out must not fire GA4 or Meta until the user accepts.

---

## 8. GA4 tags (recommended funnel)

### 8.1 Google Tag (config)

1. **Tags** → **New** → name `GA4 - Google Tag`
2. Tag type: **Google Tag**
3. Tag ID: `{{const - GA4 Measurement ID}}` (or paste `G-XXXXXXXX`)
4. Configuration / shared event settings (optional but useful):
   - `locale` ← `{{dlv - locale}}`
   - `page_path` ← `{{dlv - page_path}}` (if using send on config; otherwise map on the page_view event tag)
5. Consent: require `analytics_storage`
6. Trigger: `CE - page_view`  
   - Do **not** also use All Pages + app `page_view` without checking for duplicates. This app emits SPA `page_view` on the `dataLayer`; prefer the Custom Event trigger.

### 8.2 GA4 Event tags (required for v1)

For each row: Tag type **Google Analytics: GA4 Event**, Measurement ID same as above, Consent `analytics_storage`.

| Tag name | Event name | Trigger | Event parameters to map |
|----------|------------|---------|-------------------------|
| `GA4 - generate_lead` | `generate_lead` | `CE - generate_lead` | `form_type`, `locale`, `page_path`, `cta_source`, `program_category`, plus safe attribution DLVs |
| `GA4 - form_start` | `form_start` | `CE - form_start` | `form_type`, `locale`, `page_path` |
| `GA4 - form_attempt` | `form_attempt` | `CE - form_attempt` | `form_type`, `locale`, `page_path` |
| `GA4 - form_submit` | `form_submit` | `CE - form_submit` | `form_type`, `locale`, `page_path`, `success` |
| `GA4 - file_download` | `file_download` | `CE - file_download` | `file_category`, `locale`, `page_path`, `cta_source` |
| `GA4 - click_to_call` | `click_to_call` | `CE - click_to_call` | `cta_location`, `locale`, `page_path` |
| `GA4 - click_to_email` | `click_to_email` | `CE - click_to_email` | `cta_location`, `locale`, `page_path` |
| `GA4 - click_to_whatsapp` | `click_to_whatsapp` | `CE - click_to_whatsapp` | `cta_location`, `locale`, `page_path` |
| `GA4 - outbound_click` | `outbound_click` | `CE - outbound_click` | `link_domain`, `locale`, `page_path`, `cta_location` |
| `GA4 - language_change` | `language_change` | `CE - language_change` | `from_locale`, `to_locale`, `locale`, `page_path` |
| `GA4 - view_content` | `view_content` | `CE - view_content` | `content_type`, `content_id`, `locale`, `page_path` |

Optional later: `GA4 - exception` on `CE - exception` (no PII / no stack traces — app already sanitizes).

### 8.3 Safe attribution parameter set (for `generate_lead`)

Map when present:

`utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term`, `gclid_present`, `fbclid_present`, `landing_page`, `referrer_domain`, `attribution_model`

No monetary `value` in v1.

### 8.4 GA4 Admin after first test hits

1. Open GA4 → **Admin** → **Data display** → **Events**.
2. Mark `generate_lead` as a **Key event**.
3. Confirm DebugView shows events while GTM Preview is connected (§10).

---

## 9. Meta Pixel tags (existing Pixel)

Use the **existing** Pixel ID from §3. Prefer the official **Meta Pixel** / Facebook template in GTM Gallery if available; otherwise Custom HTML (same Pixel ID).

### 9.1 Base Pixel (PageView)

1. Tag name: `Meta - Base Pixel`
2. Pixel ID: existing ID
3. Standard event: **PageView** (or base code that fires PageView)
4. Consent: require `ad_storage`
5. Trigger: `CE - page_view` (same SPA model as GA4 — avoid double-firing with All Pages)

### 9.2 Lead conversions from `generate_lead`

Create **two** event tags on `CE - generate_lead` (both require `ad_storage`):

| Tag name | Meta standard event |
|----------|---------------------|
| `Meta - Lead` | `Lead` |
| `Meta - SubmitApplication` | `SubmitApplication` |

Optional custom parameters (safe only): `form_type`, `locale`, `content_category` / `program_category` if the template supports custom data — **never** email, phone, name.

### 9.3 ViewContent (admission CTAs)

1. Tag name: `Meta - ViewContent`
2. Event: `ViewContent`
3. Trigger: `CE - view_content`
4. Consent: `ad_storage`

### 9.4 Explicitly deferred

- **Contact** Meta event: deferred until contact form has a real backend (app only sends `form_start` / `form_attempt` for contact).
- **Enhanced matching / hashed PII:** v2 only — do not enable in v1.

---

## 10. Microsoft Clarity tag

1. Tag name: `Clarity - Init`
2. Tag type: **Custom HTML** (or Clarity community template)
3. Paste Clarity’s install script with **your** Project ID (from Clarity Settings → setup snippet).
4. Consent: require `analytics_storage`
5. Trigger: `CE - page_view` (once per SPA view is fine; if Clarity double-inits, switch to a single “Consent granted once per page load” pattern — for v1, `CE - page_view` after consent is acceptable; if recordings look duplicated, change to fire once on first analytics grant only).

**Masking check (after Preview/prod smoke):**

- Open a recording that visited `/bengali/pre-admission` or `/english/pre-admission` and `/contact`.
- Form fields with `data-clarity-mask="true"` must appear masked/blocked.
- Document who verified masking before relying on recordings.

---

## 11. Google Ads readiness (no Ads account yet)

1. Tag name: `Ads - Conversion Linker`
2. Tag type: **Conversion Linker**
3. Consent: require `ad_storage`
4. Trigger: `CE - page_view` (or All Pages after ad consent — prefer one model and stick to it)

When a Google Ads account exists later:

- Link Ads to GA4, **or**
- Add a Google Ads conversion tag on `CE - generate_lead` importing the GA4 key event.

Confirm product code never stores raw `gclid` in analytics/`dataLayer` — only `gclid_present` boolean.

---

## 12. Wire the app for Preview (local / preview deploy)

Until Vercel prod env is set, use a temporary local env for verification:

1. In `.env.local` (never commit the real ID if you prefer; local-only is fine):

   ```bash
   NEXT_PUBLIC_GTM_ID=GTM-XXXXXXX
   ```

2. Restart `pnpm dev`.
3. Confirm the browser loads `googletagmanager.com/gtm.js?id=GTM-XXXXXXX` only when consent allows analytics or advertising.
4. Confirm there are **no** duplicate direct GA4 / Meta base scripts outside GTM in the layout.

Do **not** set the Vercel Production env var until §13 passes.

---

## 13. Verification

### 13.1 GTM Preview

1. In GTM: **Preview** → enter `http://localhost:3000/bengali` (or a preview deploy URL) with `NEXT_PUBLIC_GTM_ID` set.
2. Connect Tag Assistant to the tab.

Checklist:

| Step | Expected |
|------|----------|
| First load | `consent_default` in dataLayer; Consent tags fire |
| BD / general with defaults | GTM loads; after grant, GA4 + Clarity may fire; Meta needs `ad_storage` granted |
| Deny all / regulated opt-out | GA4, Clarity, Meta do not fire until accept |
| Accept all | `consent_update`; then vendor tags fire |
| Client navigations | `page_view` on each route change; GA4 + Meta PageView accordingly |
| Pre-admission success | Exactly **one** `generate_lead`; GA4 event + Meta Lead + SubmitApplication |
| Contact form | `form_start` / `form_attempt` only — **no** `generate_lead` |
| Downloads | `file_download` with `file_category` |
| Phone / email / WhatsApp / outbound | Respective CTA events |
| Language toggle | `language_change` |

### 13.2 GA4 DebugView

1. GA4 → **Admin** → **DebugView** (or Reports → DebugView).
2. With GTM Preview active, confirm `page_view` / `generate_lead` and parameters (no PII).

### 13.3 Meta Test Events

1. Events Manager → Pixel → **Test Events**.
2. Confirm PageView, Lead, SubmitApplication from your test session.
3. No hashed PII / no raw click IDs in v1 payloads.

### 13.4 Clarity

1. After a consented session, wait for a recording (can take a few minutes).
2. Verify mask on pre-admission + contact forms.

### 13.5 Automated (repo)

```bash
pnpm test -- src/lib/analytics
pnpm test:e2e -- analytics
```

### 13.6 Production smoke (after §14)

- [ ] `window.gtag` is **not** defined by the app (GTM may define it internally — OK)
- [ ] No duplicate GA4 or Meta base scripts outside GTM
- [ ] `/bengali/privacy-policy` and `/english/privacy-policy` resolve
- [ ] `/bengali/cookie-policy` and `/english/cookie-policy` resolve
- [ ] Footer “Cookie preferences” reopens the preference UI

---

## 14. Publish GTM + set Vercel env

Only after §13 Preview checks pass:

1. In GTM: **Submit** → Version name e.g. `v1 - GA4 Meta Clarity Consent` → **Publish**.
2. Record: container version number, publish date, publisher (you).
3. Vercel project → **Settings** → **Environment Variables**:

   ```bash
   NEXT_PUBLIC_GTM_ID=GTM-XXXXXXX
   ```

   Apply to **Production** (and Preview if you want preview deploys tracked with the same container).
4. Redeploy production.
5. Run §13.6 smoke on `https://madrasatulquranbd.com`.

---

## 15. ID inventory (fill in privately — do not commit secrets)

Keep this outside the repo (password manager / internal note):

| Resource | ID / name |
|----------|-----------|
| GTM Account | Madrasatul Quran / MQD |
| GTM Container | MQD Website — `GTM-_______` |
| GA4 Property | MQD - Website |
| GA4 Measurement ID | `G-_______` |
| Meta Pixel (existing) | `_______` |
| Clarity Project | `_______` |
| Google Ads | _not created in v1_ |
| Vercel env set | date: ________ |
| GTM version published | v___ on ________ |

---

## 16. Handoff notes

- Change tracking logic in **GTM**, not in the Next.js repo, except for new `dataLayer` events agreed with developers.
- Request new events via the taxonomy in [`analytics-spec.md`](./analytics-spec.md) — never add global click listeners.
- Legal review required before enhanced matching or any PII to ad platforms (v2 only).
- School staff need Admin/Edit on GTM, GA4, Meta Events Manager, and Clarity when ownership transfers from the personal account.
- Google Ads: create later → link to GA4 → import `generate_lead` key event (Conversion Linker already in place).

---

## Quick reference: consent categories

| Category | Tools |
|----------|--------|
| Analytics (`analytics_storage`) | GA4, Microsoft Clarity |
| Advertising (`ad_storage`) | Meta Pixel, Conversion Linker (future Ads tags) |

App storage key: `mq-analytics-consent-v1` in `localStorage`.
