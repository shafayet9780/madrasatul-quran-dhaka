# Pre-admission admin guide (session 2027)

For the principal and the admissions office. Screens are in Bengali; this guide names them as they appear.
The admin is at **`/admin/admissions`** (same login as the Studio). Use the switcher at the top of the sidebar to move between **ভর্তি** (admissions) and **জরিপ** (the teacher and guardian survey).
The form itself, the fees and the deadline are set in the **Studio → প্রি-অ্যাডমিশন ফর্ম** (sidebar: *ফর্ম ও ফি (স্টুডিও)*).

## How an application moves

| Stage | Where it shows | What it means |
|---|---|---|
| অসম্পূর্ণ | ফি বাকি | The guardian started the form but has not finished it. |
| ফি বাকি | ফি বাকি | The form is complete and declared; the ৳500 application fee is not paid yet. |
| জমা হয়েছে | আবেদন | SSLCommerz confirmed the fee. The application has its ID (e.g. `KG-017`), the guardian got the PDF by email, and a row was added to the Google Sheet. |
| মূল্যায়ন নির্ধারিত → মূল্যায়িত → ভর্তি / অপেক্ষমাণ / নির্বাচিত হয়নি → ERP-তে পাঠানো | আবেদন | Set by the office, one by one or in bulk. |

Only a fee confirmed by SSLCommerz's validation service gives an ID. IDs count up per class (`N-001`, `KG-001`, `C1-001`…) and are never reused.

## ওভারভিউ

Totals (paid, fee pending, new today, evaluation fees received), paid applications per day, per class, how guardians heard about the school, and the latest applications. Tiles open the matching list. **Excel এক্সপোর্ট** downloads every paid application (see below).

### Testing the form before launch (ফর্ম পরীক্ষা, শুধু এই ডিভাইসে)

At the bottom of the overview. **এই ডিভাইসে ফর্ম খুলুন** opens the *published* form in this browser for 12 hours, even while it is switched off or outside its dates; everyone else still sees it closed. Publish the form in the Studio first with **Enable Form** off. Applications started with the pass are tests: the fee is ৳10 (SSLCommerz's minimum), the ID is `TEST-001`, `TEST-002`…, the real numbering is untouched, and nothing is copied to the Google Sheet. The emails and the PDF are sent as usual. Tests show in the lists and counts until deleted: open each one and press **মুছুন** (allowed even when paid), then **পরীক্ষা শেষ করুন**. Refund the ৳10 from the SSLCommerz panel if you want it back.

## আবেদন (paid) and ফি বাকি (fee pending)

- **Search** by ID (typed any way: `kg 17`, `KG-017`), the child's name in Bengali or English, or any part of the guardian's mobile.
- **Filters**: শ্রেণী, অবস্থা, মূল্যায়ন ফি (paid list); শ্রেণী and ধাপ (fee pending). Filters and search are in the address, so a filtered list can be bookmarked or shared with a colleague.
- **Bulk change** (paid list): tick rows, choose the new status, **প্রয়োগ করুন**. **আবেদনপত্র PDF** downloads the ticked applications' PDFs as one file for printing (up to 25 at a time). If it says the PDFs are still being made, wait a minute and press it again.
- **Fee pending**: shows how far each form got, when the guardian was last active, and the payment attempts (*ব্যর্থ, ১ বার* = one failed attempt). Tap the mobile number to call. **মুছুন** deletes an application that was never paid, with its uploaded documents; this cannot be undone, and the activity log keeps a record that it was deleted. A paid application, or one whose payment is waiting for review, can never be deleted; while the guardian is on the payment page (an attempt less than two hours old), deleting waits.

## One application

- All answers, grouped as in the form, with the documents. Documents are private: they open only from the admin.
- **অবস্থা**: change and **সংরক্ষণ**.
- **মূল্যায়নের দিন**: switch on **উপস্থিত** when the child arrives, and **মূল্যায়ন ফি গৃহীত** when the ৳500 cash fee is paid (type the receipt number first, if there is one). Both can be switched off again if pressed by mistake; every change is logged.
- **পেমেন্ট**: every attempt with its SSLCommerz transaction IDs. *যাচাই দরকার* means SSLCommerz flagged the payment as risky or the amount did not match: check the transaction in the SSLCommerz merchant panel, then tick the box and press **পেমেন্ট গ্রহণ করে আইডি দিন**. If the payment was not genuine, refund it from the SSLCommerz panel and leave the application unpaid.
- **ইমেইল আবার পাঠান**: sends the confirmation email with the PDF again (e.g. the guardian deleted it).
- **নোট**: office notes, visible only here.
- **কার্যক্রম**: everything that happened to the application, with times; office actions are marked *অফিস*.

A *দ্বিতীয়বার পরিশোধ, ফেরত দিতে হবে* entry in the log means the guardian paid twice: refund the second payment from the SSLCommerz panel.

## মূল্যায়নের দিন (evaluation day)

Each application PDF has an **অফিস ব্যবহারের জন্য** QR code. Scanning it with a phone camera (logged in to the admin) opens that application directly. Without a phone, type the ID on the **মূল্যায়নের দিন** page; a USB barcode scanner also works there. The page lists everyone marked present today and whose evaluation fee was received.

## Excel export and the Google Sheet

- **Excel এক্সপোর্ট** (overview and the paid list): one row per paid application, one column per form field, plus status, payment and evaluation-day columns. Dates are `YYYY-MM-DD`, mobiles `01XXXXXXXXX`, ready for the ERP import.
- **Google Sheet**: every paid application is copied to the tab **ভর্তি ২০২৭** of the pre-admission spreadsheet (`FORM_GOOGLE_SHEETS_ID`), with the same columns. A status or evaluation-day change rewrites that application's row. If Google is unreachable, the daily job copies what was missed. Edit applications in the admin, not in the Sheet: the next change overwrites the row.

## Good to know

- Changing the form in the Studio after applications arrived is safe: each application keeps the version of the form it was filled in with.
- The local preview (`ADMISSIONS_LOCAL=1`, developers only) can add sample applications with `POST /api/admissions/dev/seed`; that route does not exist on the live site.
