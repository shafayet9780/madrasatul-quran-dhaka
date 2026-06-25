# GTM Setup Checklist

Use this checklist after deploying the GTM-first analytics code. The application only loads `NEXT_PUBLIC_GTM_ID` and pushes sanitized `dataLayer` events. All vendor tags live in Google Tag Manager.

Reference: [`analytics-spec.md`](./analytics-spec.md)

---

## 1. Container prerequisites

- [ ] Create or open the production GTM container matching `NEXT_PUBLIC_GTM_ID`
- [ ] Publish only from a reviewed workspace; use Preview mode before each publish
- [ ] Enable **Consent Overview** and Google **Consent Mode v2** defaults in the container
- [ ] Document container version, publish date, and who approved the release

---

## 2. Data Layer Variables

Create **Data Layer Variables** for each field the app may send.

### Consent / global

| Variable name | Data Layer key |
|---------------|----------------|
| `dlv - event` | `event` |
| `dlv - analytics_storage` | `analytics_storage` |
| `dlv - ad_storage` | `ad_storage` |
| `dlv - region` | `region` |
| `dlv - consent_mode` | `consent_mode` |
| `dlv - page_path` | `page_path` |
| `dlv - page_title` | `page_title` |
| `dlv - locale` | `locale` |

### Funnel / engagement

| Variable name | Data Layer key |
|---------------|----------------|
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

### Attribution (safe fields only)

| Variable name | Data Layer key |
|---------------|----------------|
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

---

## 3. Triggers

| Trigger name | Type | Condition |
|--------------|------|-----------|
| `CE - consent_default` | Custom Event | Event equals `consent_default` |
| `CE - consent_update` | Custom Event | Event equals `consent_update` |
| `CE - page_view` | Custom Event | Event equals `page_view` |
| `CE - generate_lead` | Custom Event | Event equals `generate_lead` |
| `CE - form_start` | Custom Event | Event equals `form_start` |
| `CE - form_submit` | Custom Event | Event equals `form_submit` |
| `CE - form_attempt` | Custom Event | Event equals `form_attempt` |
| `CE - file_download` | Custom Event | Event equals `file_download` |
| `CE - click_to_call` | Custom Event | Event equals `click_to_call` |
| `CE - click_to_email` | Custom Event | Event equals `click_to_email` |
| `CE - click_to_whatsapp` | Custom Event | Event equals `click_to_whatsapp` |
| `CE - outbound_click` | Custom Event | Event equals `outbound_click` |
| `CE - language_change` | Custom Event | Event equals `language_change` |
| `CE - view_content` | Custom Event | Event equals `view_content` |
| `CE - exception` | Custom Event | Event equals `exception` |

Optional consent gating on vendor tags:

- Analytics tags: fire only when `analytics_storage` equals `granted` **or** after `consent_update` grants analytics
- Advertising tags: fire only when `ad_storage` equals `granted`

---

## 4. Consent Mode tags

- [ ] Add **Google tag: Consent Mode (default)** tag on `CE - consent_default`
  - Map `analytics_storage` and `ad_storage` from Data Layer
  - Set `wait_for_update` (recommended: 500ms) so updates can arrive before tags fire
- [ ] Add **Google tag: Consent Mode (update)** tag on `CE - consent_update`
- [ ] Verify in GTM Preview that denied regions do not load GA4/Meta until accept

---

## 5. GA4 configuration

- [ ] Create **Google Tag** or **GA4 Configuration** tag with your GA4 Measurement ID (GTM-only, not in app env)
- [ ] Trigger: `CE - page_view` and/or All Pages after consent granted
- [ ] Map `locale` and `page_path` as event parameters where useful
- [ ] Create **GA4 Event** tag for `generate_lead`
  - Event name: `generate_lead`
  - Parameters: `form_type`, `locale`, `page_path`, `cta_source`, `program_category`, safe attribution fields
- [ ] Mark `generate_lead` as a **Key event** in GA4 Admin
- [ ] Add GA4 event tags for secondary events (`file_download`, `form_start`, `form_attempt`, CTA events) as needed for reporting
- [ ] Exclude PII: confirm no user-supplied form values reach GA4

---

## 6. Meta Pixel

- [ ] Add **Meta Pixel** base tag (PageView) — advertising consent required
- [ ] Map `generate_lead` → **Lead** and **SubmitApplication** standard events
- [ ] Map optional `view_content` for admission CTA clicks
- [ ] Do not send hashed PII or raw click IDs in v1
- [ ] Verify events in Meta Events Manager Test Events tool

---

## 7. Microsoft Clarity

- [ ] Add Clarity tag in GTM (analytics consent category)
- [ ] Confirm recordings appear for allowed regions after consent
- [ ] Verify form areas with `data-clarity-mask="true"` are masked in Clarity dashboard (pre-admission + contact forms)
- [ ] Document who verifies masking before relying on recordings

---

## 8. Google Ads readiness

- [ ] Enable **Conversion Linker** tag (all pages, after ad consent if required)
- [ ] Import `generate_lead` as a Google Ads conversion via GA4 key event linkage **or** create a Google Ads conversion tag triggered on `CE - generate_lead`
- [ ] Confirm only boolean `gclid_present` is used in app/Sheets — never store raw `gclid` in analytics or Sheets
- [ ] No monetary `value` parameters in v1

---

## 9. Verification steps

### GTM Preview

1. Open site in Preview with container linked
2. Denied region / first visit: confirm `consent_default` fires, GTM respects denied storage
3. Accept all: confirm `consent_update`, GTM loads, `page_view` fires on navigation
4. Submit pre-admission (test): confirm exactly one `generate_lead` on success only
5. Contact form: confirm `form_start` / `form_attempt` only — **no** `generate_lead`
6. Download prospectus/curriculum/code-of-conduct: confirm `file_download`
7. Click phone/email/WhatsApp/outbound: confirm respective CTA events

### Production smoke

- [ ] `window.gtag` is **not** defined by the app (GTM may define it internally — that is OK)
- [ ] No duplicate GA4 or Meta base scripts outside GTM
- [ ] Privacy and cookie policy URLs resolve in both locales
- [ ] Footer “Cookie preferences” reopens the preference UI

### Automated

```bash
pnpm test -- src/lib/analytics
pnpm test:e2e -- analytics
```

---

## 10. Handoff notes for marketers

- Change tracking logic in GTM, not in the Next.js repo, except for new `dataLayer` events agreed with developers
- Request new events via the taxonomy in `analytics-spec.md` — never add global click listeners
- Legal review required before enabling enhanced matching or sending any PII to ad platforms (v2 only)
