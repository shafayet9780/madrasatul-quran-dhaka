# Fees, transport, discounts, and admissions contacts

## First-time setup

Run `pnpm setup:fees` with the existing `.env.local` Sanity credentials. This creates **drafts only**. It preserves existing fee documents and editorial changes, and only fills missing contact settings. Rerunning is safe. A concurrent Site Settings edit causes setup to fail rather than overwrite it; rerun after reviewing the draft.

In `/studio`, review **Fees & Discounts**, then publish. Also review and publish **Site Settings → Contact Information** for the admissions phone and WhatsApp number. Do this before deploying the page changes when possible. Until financial settings are published, visitors see a contact-office message, never old code-defined prices.

## Editing financial information

- Both Admissions and Curriculum read the same Fees & Discounts document.
- Complete Bengali and English text. Program identities remain Pre-Hifz and Hifz; their display names are editable.
- Add, hide, remove, or drag fee rows. Monthly fees appear first, one-time/annual second, and custom frequencies last. Drag order is preserved within each group.
- Each program price is **Priced**, **Not applicable**, or **Contact office**. A priced value of zero explicitly means **Free**; do not use zero for an unknown amount.
- Standard frequencies are monthly, one-time, and annual. Custom frequencies need labels in both languages.
- Vehicles have one optional monthly price shared by both programs. Micro and Auto initially show Contact office.
- Discounts are text descriptions with eligibility and selected applicable fees/vehicles. No amount is deducted or estimated. Renaming/reordering fees preserves selection. Before hiding/deleting a selected fee, update or hide the affected discount; validation prevents publishing broken eligibility claims.
- Headings, introductions, payment instructions, policies, the financial FAQ, and unavailable-content wording are editable here.
- Hidden/empty transport and discount sections disappear together with their navigation links.

## Contacts and application actions

Site Settings contains international-format admissions phone and WhatsApp fields, e.g. `+8801301226644`. The same WhatsApp number drives both contact panels and the existing floating support button. Do not include the local trunk zero after `+880`.

Before new fields are published, the existing active admissions/primary phone and existing normalized WhatsApp number are used. Invalid explicitly configured numbers do not render clickable destinations. The Contact-page link remains available.

The existing **Pre-Admission Form → Form Settings → Enabled** control determines whether the primary action opens the form or Contact Admissions. No calendar dates or inquiry-delivery promise are shown. The simulated inquiry form has been removed.

## Publication and cache

Public pages use published content only. Production uses the existing 60-second revalidation policy; changes appear eventually and can take longer because of caching. There is no new instant-publish webhook or visual draft-preview workflow. Cached published content can remain visible during a temporary fetch failure.

The financial settings do not regenerate prospectus/curriculum PDFs. Replace those separately under **Downloads Library → Public Download Files** when needed.

## Verification

Run `pnpm test`, `pnpm lint`, `pnpm build`, and `pnpm test:e2e e2e/admissions-curriculum.spec.ts`. Use a test dataset for publication checks. Check both locales and phone/desktop layouts. Do not edit live prices solely to test rendering.
