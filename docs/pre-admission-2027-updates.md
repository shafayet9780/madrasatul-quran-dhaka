# Pre-admission 2027: updates before opening

Status: **requirements agreed with the owner 2026-10-11. Mockups approved 2026-10-11** (with two nits applied: PDF page order, offline answer boxes): canvas pages "আপডেট · …" and "অফলাইন ফর্ম ২০২৭" at https://claude.ai/artifact/YNFRWPUJiTvhJRrTzW1Myb, sources in [`pre-admission-mockups/`](pre-admission-mockups/README.md). Build starts after approval.
Builds on [`pre-admission-2027.md`](pre-admission-2027.md) (spec) and [`pre-admission-implementation-plan.md`](pre-admission-implementation-plan.md).

The form has **not opened yet**, so questions and field keys can still be renamed or removed freely. Delete any staff test applications before launch.

## Summary

| # | Change | Where |
|---|---|---|
| 1 | Guardian code of conduct (9 rules + a new declaration) on its own **অঙ্গীকার** (pledge) page | Online form, application PDF, offline form |
| 2 | Rules for editing questions in Sanity; export columns never disappear | Sanity, Sheet, Excel |
| 3 | Previous school + **result card upload**; "don't have it now" option for documents | Student chapter |
| 4 | **What to bring** on assessment day, one list everywhere | Success page, PDF, email, intro |
| 5 | **Transport routes** with stops and charges; guardian picks the nearest stop | Fees & Discounts, form, Admissions page |
| 6 | Evaluation fee is renamed **অ্যাসেসমেন্ট ফি / Assessment fee** | Everywhere in admissions |
| 7 | **WhatsApp** card highlighted; QR code with the WhatsApp logo | Success page, Find page, email, PDF |
| 8 | **Printable offline form** for 2027, generated from the Sanity form | Intro page, admin |
| 9 | **Paper forms stay on paper**: not entered into the system; the guardian keeps a receipt + WhatsApp page | Offline form |
| 10 | **"None of the above"** in a checkbox question clears the other choices, and the reverse | Form (Father: ইসলামী পোশাক) |

---

## 1. Code of conduct and pledge

### Where it appears
- **Online:** a new step **অঙ্গীকার** after the last chapter and before Review, shown in the checklist like a chapter. It is "done" when both boxes are ticked.
- **Review page:** keeps only the "information is true" declaration (point ২ about the code of conduct is removed from it).
- **Application PDF** (after payment, 4 pages), ordered by who fills it, so the office section stays last:
  - page 3: contact, additional information, then the **code of conduct** (the 9 rules only), with "অঙ্গীকার ও স্বাক্ষর: পৃষ্ঠা ৪"
  - page 4: the **three consents** (conduct pledge, boxed declaration, "information is true", each with its online consent time), **father's and mother's signatures** with dates, then the **office/assessor section**
- **Offline form:** the last page holds the rules, the three consents with tick boxes, both signatures and the office-use strip.

### The pledge page
1. Heading **অভিভাবকদের আচরণবিধি**, then the 9 rules in **three groups**, numbered 1–9 continuously.
2. ☐ **আমি অভিভাবকদের আচরণবিধি পড়েছি এবং তা মেনে চলতে বাধ্য থাকব।** / I have read the Parents' Code of Conduct and will follow it.
3. A separate, boxed declaration with its own ☐ (point 10):
   > আমি ঘোষণা করছি যে, শিক্ষার্থীর পিতা বা মাতা কেউই কোনো রাষ্ট্রবিরোধী বা সন্ত্রাসী কার্যক্রমের সাথে জড়িত নন। কখনো এমন সম্পৃক্ততা পাওয়া গেলে মাদরাসা কর্তৃপক্ষ শিক্ষার্থীর ভর্তি তাৎক্ষণিকভাবে বাতিল করবে।
   >
   > I declare that neither the student's father nor mother is involved in any anti-state or terrorist activity. If any such involvement is found, the madrasa authority will cancel the student's admission immediately.

   (Owner: do not use "জঙ্গি".)
4. Both boxes are required. The time of each tick is saved with the application.

All text (group titles, rules, both pledges) is edited in Sanity → Cycle settings, in Bengali and English.

### The rules, grouped
Source: `parents_code_of_conduct_mqd.pdf`. Bengali exactly as in the PDF, except two spelling fixes marked *(fix)*. The English is a draft for the owner to review.

**মাদরাসায় / At the madrasa**
1. মাদ্রাসা প্রাঙ্গণে অবশ্যই শরীয়ত সম্মত পোশাক ও পর্দার বিধিমালা অনুসরণ করতে হবে।
   Follow Shariah-compliant dress and the rules of purdah on the madrasa premises.
2. মাদ্রাসার কোন স্টাফের সাথে রূঢ় আচরণ করা যাবে না। কোন অভিযোগ থাকলে যথাযথ কর্তৃপক্ষকে অবহিত করবেন।
   Do not be rude to any madrasa staff. If you have a complaint, tell the proper authority.
3. নিয়মিত বেতনাদি ও অন্যান্য ফি পরিশোধ করতে হবে।
   Pay the monthly and other fees on time.

**বাড়িতে / At home**

4. বাড়ীর পরিবেশ ও প্রতিবেশ বিশুদ্ধ ও সুন্দর না হলে, তাদের চারিত্রিক গঠন নিয়ন্ত্রণ করা সম্ভব নয়। সুতরাং বাড়িতে দ্বীনি পরিবেশ নিশ্চিত করতে হবে। *(PDF 4)*
   A child's character cannot be shaped if the home and its surroundings are not pure and wholesome, so keep a religious environment at home.
5. আপনার ছেলেমেয়েদেরকে স্মার্টফোন, ইন্টারনেট, টেলিভিশন থেকে দূরে রাখুন। *(PDF 6)*
   Keep your children away from smartphones, the internet and television.
6. সাধারণ ভাবে আপনার সকল সন্তানকেই রাতে তাড়াতাড়ি ঘুমাতে যাবার অভ্যাস গড়ে তুলতে তাগিদ দেবেন। সেই সাথে, সকালে তারা যেন নাস্তার অন্তত এক ঘন্টা আগে ঘুম থেকে ওঠে এবং বিছানা ছাড়ে সে দিকে খেয়াল করবেন ইনশা'আল্লাহ! ক্লাসে অমনোযোগী হবার দু'টো প্রধান কারণ হচ্ছে: রাতে দেরী করে ঘুমানো এবং সকালে "পরিপূর্ণ" নাস্তা না করে আসা। *(PDF 7)*
   Help all your children build the habit of sleeping early, and see that they wake up and leave bed at least an hour before breakfast, in sha Allah. The two main reasons for inattention in class are sleeping late and coming without a full breakfast.

**সন্তানের সাথে / With your child**

7. বাচ্চাদের সামনে তাদের শিক্ষক-শিক্ষিকাদের গীবত, সমালোচনা অথবা তাদের নিয়ে কোন বিরূপ মন্তব্য করবেন না। *(PDF 5)*
   Do not backbite, criticise or speak badly of their teachers in front of the children.
8. ছেলেমেয়েকে যত বেশী সম্ভব সময় দেবেন, তাদের বন্ধু হবার চেষ্টা করবেন। পৃথিবীর প্রতিকূল পরিবেশে কোন অসুন্দর বা অকল্যাণকর ইঙ্গিতের সম্মুখীন হলে, তারা যেন প্রাণ খুলে সবার আগে আপনাকেই সে কথা জানাতে পারে। *(PDF 8)*
   Give your children as much time as you can and try to be their friend, so that if they meet anything unpleasant or harmful, you are the first person they openly tell.
9. অন্যদের সাথে যেকোন মূল্যে প্রতিযোগিতায় *(fix)* জিততেই হবে এমন ধারণা দিয়ে তাদেরকে, মুসলিম "ভাই-বন্ধুর" বিরুদ্ধে হিংসা-ঘৃণা-বিদ্বেষ পোষণ করে জীবনের সিঁড়ি বেয়ে ওপরে উঠতে প্ররোচিত *(fix)* করবেন না। *(PDF 9)*
   Do not push them to get ahead in life by teaching them to win against others at any cost, holding envy, hatred or malice towards their Muslim brothers and friends.

### New review-page declaration (Sanity → declaration text)
> মাদরাসাতুল কুরআন একটি সম্পূর্ণ ইসলামিক শিক্ষা প্রতিষ্ঠান। আমি স্বীকৃতি প্রদান করছি যে, উপরে প্রদত্ত সকল তথ্য সঠিক ও সত্য। কোন তথ্য ভুল প্রমাণিত হলে কর্তৃপক্ষ ভর্তি বাতিল করতে পারবে।

---

## 2. Editing questions in Sanity (for the office)

After publishing, the website picks up the change within about a minute. **No developer or database change is needed.**

| You do this in Sanity | Form | Database | Sheet / Excel | Applications already submitted |
|---|---|---|---|---|
| Change a label, help text or option label | Updated | Nothing changes | Header updated | Keep the wording they answered |
| Add a question | Appears | Stored under its key | New column | Column is blank for them |
| Delete a question | Disappears | Old answers stay | **Column stays** (new) | Still shown on their PDF and admin page |
| Change a field **key** or option **value** | Treated as a new question | Old answers stay under the old key | New column | Lose the link to the old answer |

- **Before the form opens:** keys can be changed freely.
- **After it opens:** never change a key or an option's stored value. Change labels instead.
- **If something in the form is invalid**, Studio shows the problem and the website keeps using the last good version.
- **New:** Sheet and Excel columns are built from **every version** of the form, so deleting a question never hides answers already given.

---

## 3. Previous school, result card, missing documents

### Student chapter (group "previous")
| Key | Question | Type | Shown | Required |
|---|---|---|---|---|
| `studied_before` | শিক্ষার্থী কি আগে কোনো শিক্ষা প্রতিষ্ঠানে পড়েছে? / Has the child studied at a school or madrasa before? | Yes/No | Always | Yes |
| `last_class_attended` | (existing) সর্বশেষ যে শ্রেণীতে অধ্যয়ন করেছে | Short answer | If yes | Yes |
| `previous_school` | (existing) পূর্ববর্তী শিক্ষা প্রতিষ্ঠানের নাম | Short answer | If yes | Yes |
| `previous_result_card` | সর্বশেষ ফলাফল কার্ড / Latest result card | Document: **one photo or one PDF**, up to 4 MB | If yes | Yes, with "don't have it now" |
| `general_subjects_level` | (existing) জেনারেল শিক্ষার দক্ষতা | Multiple choice | **Now: if yes** (was: by class) | Yes. The option "এখনো কোন প্রতিষ্ঠানে পড়ে নি" is **removed** |

Help text for the result card: "সর্বশেষ পরীক্ষার ফলাফল কার্ড বা রিপোর্ট কার্ডের ছবি বা PDF।"

### "Don't have it now" for documents
- **New setting on upload fields in Sanity:** *allow "don't have it now"*. Turned on for the **birth certificate** (which becomes required) and the **result card**.
- **On the form,** under the upload, a tick box whose text is set per field in Sanity. Ticking it satisfies "required".
  - Birth certificate: ☐ **এখন নেই, অ্যাসেসমেন্টের দিন ফটোকপি সঙ্গে আনব** / I don't have it now, I'll bring a photocopy on assessment day.
  - Result card: ☐ **এখন নেই, অ্যাসেসমেন্টের দিন মূল কপি সঙ্গে আনব** / I don't have it now, I'll bring the original on assessment day.
- **Review page, application PDF, admin detail and export** show "জমা দেওয়া হয়নি, সঙ্গে আনবেন" (not uploaded, will bring) for that document.

---

## 4. What to bring on assessment day

One list, shown on the **success page**, the **application PDF**, the **confirmation email**, and the intro page timeline:

1. এই আবেদনপত্রের প্রিন্ট, পিতা ও মাতার স্বাক্ষরসহ / This application, printed and signed by the father and mother
2. জন্ম নিবন্ধন সনদের ফটোকপি / Photocopy of the birth certificate
3. সর্বশেষ ফলাফল কার্ডের মূল কপি / The original latest result card. *Only if the child studied before.*
4. পাসপোর্ট সাইজ ছবি: শিক্ষার্থীর ২ কপি, পিতার ১ কপি / Passport-size photos: 2 of the student, 1 of the father
5. অ্যাসেসমেন্ট ফি ৳৫০০, নগদে / Assessment fee ৳500 in cash

- **Personalised:** item 3 appears only when `studied_before` = yes. A document marked "don't have it now" is shown as **not uploaded online, must bring** (highlighted).
- **Editable** in Sanity → Cycle settings: each item has Bengali/English text and an optional "show only when". The fee amount fills in automatically.
- **On the success page** it is its own clearly headed section, "অ্যাসেসমেন্টের দিন সঙ্গে আনবেন", after the two tasks.

---

## 5. Transport

### Data (Sanity → Fees & Discounts → Transport)
- **Vehicles (existing):** **মাইক্রো ৳৫,০০০ / month**, **অটো ৳২,৫০০ / month** (charges are per vehicle type; the setup script writes them as drafts, the owner publishes). A vehicle without a charge shows "অফিসে যোগাযোগ করুন" (contact the office).
- **Routes (new):** name, area (**মিরপুর** / **উত্তরা**), vehicle (মাইক্রো / অটো), stops **in order**, with a Bengali and an English name for each. The last stop is always the madrasa. Routes can be dragged to reorder, and hidden.

| Route | Area | Vehicle | Stops (start → end) |
|---|---|---|---|
| মিরপুর মাইক্রো (৳৫,০০০) | মিরপুর | মাইক্রো | মিরপুর ১০ → মিরপুর ১৩ → মিরপুর ১১ → কালশী → শাগুফতা → মিরপুর ডিওএইচএস → মাদরাসা |
| মিরপুর অটো (৳২,৫০০) | মিরপুর | অটো | রূপনগর আবাসিক এলাকা → পল্লবী → মিরপুর সাড়ে ১১ → মিরপুর ১২ (বি/সি ব্লক) → মাদরাসা |
| উত্তরা মাইক্রো ১ (৳৫,০০০) | উত্তরা | মাইক্রো | হাউস বিল্ডিং → সেক্টর ৭ → সেক্টর ১১ → সেক্টর ১৩ → খালপাড় → মাদরাসা |
| উত্তরা মাইক্রো ২ (৳৫,০০০) | উত্তরা | মাইক্রো | জসীমউদ্দীন রোড → সেক্টর ১৪ → সেক্টর ১২ → সেক্টর ১৫ → মাদরাসা |
| উত্তরা অটো (৳২,৫০০) | উত্তরা | অটো | সেক্টর ১৮ → মাদরাসা |

English: Mirpur 10 → Mirpur 13 → Mirpur 11 → Kalshi → Shagufta → Mirpur DOHS · Rupnagar R/A → Pallabi → Mirpur 11.5 → Mirpur 12 (B/C block) · House Building → Sector 7 → Sector 11 → Sector 13 → Khalpar · Jashim Uddin Road → Sector 14 → Sector 12 → Sector 15 · Sector 18.

### How routes are shown
- **Tabs মিরপুর | উত্তরা.** Each route is a card: name, a মাইক্রো/অটো badge, the monthly charge, and the stops drawn as a **connected line** (dots joined by a line, ending at the madrasa).
- **Phones:** the line runs top to bottom. **Desktop:** left to right, wrapping.
- **The same cards appear** on the public Admissions page's Transport section and in the form.

### Form (chapter অতিরিক্ত তথ্য, group "পরিবহন সুবিধা")
Replaces `transport_requirement` and `transport_location`.

- **Intro:** "মাদরাসার নিজস্ব মাইক্রো ও অটো নিচের রুটগুলোতে চলে। মাসিক ভাড়া প্রতিটি রুটের সাথে দেওয়া আছে।" / The madrasa's own micro and auto vans run on the routes below. The monthly charge is shown with each route.
- **`transport_interest`** (Yes/No, required): **আপনি কি সন্তানের জন্য মাদরাসার পরিবহন সুবিধা নিতে আগ্রহী?** / Would you like to use the madrasa's transport for your child?
- **If yes, `transport_stop`** (new field type "transport stop", required): **আপনার বাসার সবচেয়ে কাছের স্টপ কোনটি?** / Which stop is nearest to your home?
  - The guardian taps a stop on a route card. The answer stores route + stop, so the office knows the route, vehicle and pickup point.
  - Last option: **আমার এলাকা কোনো রুটে নেই** / My area is not on any route.
- **If "not on any route", `transport_area`** (short answer, required): **আপনার এলাকার নাম লিখুন** / Write your area.
- **Note under the routes:** "আসন সীমিত। ভর্তি নিশ্চিত হওয়ার পর পরিবহন বরাদ্দ জানানো হবে।" / Seats are limited. Transport is assigned after admission is confirmed.
- **Charges are frozen** with the form version, so the PDF and admin show the charge the guardian saw. Changing routes or charges in Fees & Discounts also creates a new form version.
- **Export, Sheet and PDF** show the route, vehicle, stop and charge (or the area typed in).

---

## 6. "Evaluation" becomes "Assessment"

- **Bengali:** "মূল্যায়ন" → **"অ্যাসেসমেন্ট"** (fee, day and timeline step): অ্যাসেসমেন্ট ফি, অ্যাসেসমেন্টের দিন.
- **English:** "evaluation" → **"assessment"**: Assessment fee, Assessment day.
- **Scope:** pre-admission pages, the application PDF (including the office section; "evaluator" becomes **পরীক্ষক** / assessor), the email, admin labels, and the Studio field title.
- **Not in scope:** the public Admissions page's general text about the entrance assessment ("প্রবেশিকা মূল্যায়ন") stays unless asked.

---

## 7. WhatsApp

### Success page task card
- **The WhatsApp logo** (shared icon, from the existing support button).
- **A WhatsApp-green button,** dark enough for white text to stay readable. This is a deliberate exception to the brown-only accent.
- **A green card border** and a small **গুরুত্বপূর্ণ** (important) badge.
- **After tapping,** the button stays (as "আবার খুলুন", open again) and a **"যোগ দিয়েছি ✓"** (I've joined) button marks the task done. Today the task ticks on tap and the button disappears.

### QR code
- **Strongest error-correction level,** with the WhatsApp logo on a small white square in the centre. The QR squares stay black.
- **Screen:** green logo. **PDF and print:** black logo.
- **Caption:** "অন্য ফোন দিয়ে স্ক্যান করুন" (scan with another phone) on screen; "ফোনের ক্যামেরা দিয়ে স্ক্যান করুন" (scan with your phone camera) on paper.
- **Test** with at least two phones (Android and iPhone) before launch.

### Also
The same green WhatsApp button on the **Find my application** results and in the **confirmation email**.

---

## 8. Printable offline form (2027)

Last year's form (`~/Documents/shafayet/mqd-form/form.html`) was typed by hand. The new one is **generated from the same Sanity form** by the existing PDF engine in a "blank" mode, so it always matches the online form.

- **Download:** from the pre-admission intro page ("অফলাইন ফর্ম (PDF)") and from admin (to print copies).
- **Format:** Bengali, A4, Noto Sans Bengali, numbered questions, two columns where questions pair up. Black text with the application PDF's brown (`#7a4d32`) as a small accent (chapter bands, number badges, office box) and only light tints, so it survives photocopying. Chapters run on from page to page, breaking only between questions (a heading never ends a page, a chapter never leaves one question behind); name boxes are full-width beside the passport-size (35 × 45 mm) photo frames. (Revised 2026-10-11 after the owner's print review.)
- **Answer spaces:**
  - text: a quiet answer box (thin grey border, 5px corner, about 8.5 mm tall), not a line and not a web-style rounded field
  - long answer (address, comments): one taller box
  - date of birth: দিন / মাস / বছর boxes
  - mobile: a plain answer box, like the other text answers (owner's choice)
  - short office fill-ins (receipt no., ID): plain lines
  - one choice: ◯; several choices: ☐; yes/no: ◯ হ্যাঁ ◯ না
  - photos: passport-size frames for the student and father ("ছবি সংযুক্ত করুন")
  - documents: "ফটোকপি সংযুক্ত করুন"
- **Conditional questions** are printed with a hint, e.g. "(আগের প্রশ্নে ‘হ্যাঁ’ হলে)".
- **"None of the above" options** (section 10) are printed with the hint "(এটি বাছলে অন্যগুলো নয়)" (if you tick this, tick nothing else).
- **Contents, in order** (revised 2026-10-11: the code of conduct on a page of its own, the rest in 4 pages). Pages 1 to 4 are handed in to the office; page 5 stays with the family; page 6 is handed back to the guardian.
  1. **Page 1:** header (logo, প্রি-অ্যাডমিশন ফর্ম ২০২৭), **office box** (application ID, received on, received by) beside the instructions (pages 1 to 4 go in with the ৳500 fee; keep page 5; the last page comes back), photo frames, student questions and documents.
  2. **Pages 1 to 4:** the chapters run on (student, father, mother, contact, additional with the transport **route table** grouped by মিরপুর / উত্তরা, ☐ beside each stop), breaking only between questions; then **অঙ্গীকার ও ঘোষণা**: a note that the rules are on page 5, the three consents with tick boxes, **father's and mother's signatures and dates**, and **office use only** (photo, documents checked, fee received + receipt no., application ID, signature), kept together.
  3. **Page 5, অভিভাবকদের আচরণবিধি:** the 9 rules in 3 groups in larger type; "do not hand this in, keep it; tick the pledges on page 4".
  5. **Page 6, অভিভাবকের কপি (guardian's copy):** "do not hand this in"; the **application fee receipt** the office fills (student name, class, application ID, receipt no., date, ৳500 received in cash and non-refundable, signature and seal) and the **WhatsApp group** (large QR with the logo; assessment date, time and all news are posted only there, by application ID). Office phone and website in the footer. Nothing else.
---

## 9. Paper forms stay on paper

- **Paper applications are not typed into the system.** The office keeps pages 1 to 4 (with the signatures) and works from them on assessment day.
- **Nothing is emailed** to paper applicants and there is **no admin step** for them: no cash-payment action, no Sheet row, no application PDF.
- **The guardian keeps page 6:** the fee receipt (filled and signed by the office) and the WhatsApp group QR, where every later update is posted.
---

---

## 10. "None of the above" in checkbox questions

Example: Father → **আপনার ইসলামী পোশাক (লিবাস) মেনে চলা**: ঢিলেঢালা পোশাক · প্যান্ট গোড়ালির উপরে · দাড়ি · **উপরোক্ত কোনটিই নয়** (`none`).

- **New option setting in Sanity:** *"Only this choice"* (exclusive), for checkbox questions. Turned on for `none` in this question; it can be used on any future checkbox question.
- **Ticking an exclusive option** unticks all the others. **Ticking any other option** unticks the exclusive one. The options stay visible, so the guardian can see what was cleared and change their mind. A short note under the question says so the first time it happens: "‘উপরোক্ত কোনটিই নয়’ বাছাই করায় অন্যগুলো বাদ দেওয়া হয়েছে" (other choices were cleared because "none of the above" was ticked).
- **The server rejects** an exclusive option combined with others (the same rule, not only in the browser).
- **Offline form:** the hint described in section 8.

## Owner answers (2026-10-11)

1. **Transport:** মাইক্রো ৳৫,০০০ and অটো ৳২,৫০০ a month.
2. **English translation of the rules:** accepted as drafted.
3. **Result card on assessment day:** the **original** (birth certificate stays a photocopy).
4. **`general_subjects_level`:** shown only when the child studied before; "এখনো কোন প্রতিষ্ঠানে পড়ে নি" removed.
5. **Paper applicants:** not entered into the system (owner, 2026-10-11). The guardian's copy keeps only the fee receipt and the WhatsApp group.

No open items remain.

## Paper application ID (owner, 2026-10-11)

- **The office numbers paper forms itself:** class code + `P` + a running number from its register (e.g. `KG-P01`). The `P` keeps it apart from system IDs. The office writes it in the box on page 1 and on page 6 ("আবেদন আইডি (অফিস পূরণ করবে)"), and WhatsApp announces paper and online applicants alike by ID.

## Build notes (found while planning, 2026-10-11)

- **Live 2027 form** is the `preAdmissionForm` document's `sections` (Sanity, published, no draft). Chapters: `student` (groups `photo_names, birth_class, previous, current_level, character_goals, documents`), `father`, `mother`, `contact`, `additional`. `transport_requirement` / `transport_location` are in `additional`; `father_islamic_clothing` option `none` is the exclusive one; `student_birth_registration` has role `birthCertificate` and is not required yet. The cycle has no `opensAt`/`closesAt`/`whatsappUrl` yet (form not open).
- **Schema and rules:** `sanity/schemas/admissionForm.ts` (field, option, section, cycle types) and `src/lib/admissions/form-config.ts` (`FIELD_TYPES`, roles, `checkFormConfig`, zod). `showWhen` is one condition on an earlier choice/yes-no field; hidden fields are dropped on save (`isVisible` in `src/lib/admissions/answers.ts`). New field type "transport stop" and option flag "exclusive" and file setting "allow don't have it now" go here, plus the validator in `answers.ts`.
- **Snapshot:** `src/lib/admissions/snapshot.ts` (`buildSnapshot`) and `cycle.ts` (`syncCycle`, keyed by the form's `_rev`). Routes come from `feeSettings` (`sanity/schemas/feeSettings.ts`, today: vehicles মাইক্রো/অটো with `price.status = contactOffice`), so the snapshot must include them and a change to the fee document must also create a new version.
- **Export columns from every version:** `src/lib/admissions/export-rows.ts` (`exportHeader`, `fieldColumns`), used by `src/app/admin/admissions/export/route.ts` and `sheet-copy.ts` (`prepareTab` rewrites the header and re-queues rows).
- **Pledge step:** new page between the last chapter and review (`src/app/[locale]/pre-admission/form/…`, hub in `form/page.tsx`); review declaration in `src/components/pre-admission/review-submit.tsx` and `src/app/[locale]/pre-admission/actions.ts` / `drafts.ts` (`submitDraft` records the declaration). Store each consent time.
- **PDF:** `src/lib/admissions/pdf-html.ts` + `pdf.ts`; `pdf.chromium.test.ts` checks the page count (now 4). Page 3 = contact, additional, rules; page 4 = consents, signatures, office section.
- **Offline form:** new "blank" mode of the same PDF engine, generated from the current snapshot; download from the intro page and admin.
- **"Assessment" rename:** `messages/bengali.json`, `messages/english.json`, `pdf-html.ts`, `mail-templates.ts`, `src/app/admin/admissions/[id]/page.tsx`, `evaluation-day/page.tsx`, Studio field title in `admissionForm.ts`, tests that assert the text. Not the public Admissions page.
- **WhatsApp:** `src/components/pre-admission/confirmation-tasks.tsx`; the logo path is in `src/components/ui/whatsapp-support.tsx` (move to a shared icon); QR via `qrcode` with error correction H and a centred logo; also `find-form.tsx` and `mail-templates.ts`.
- **Sanity content** goes in as drafts through a script, like `scripts/setup-admissions.ts` (`pnpm setup:admissions`, `--write`); the owner publishes in Studio.
- **Mockups:** canvas https://claude.ai/artifact/YNFRWPUJiTvhJRrTzW1Myb pages "আপডেট · অভিভাবক", "আপডেট · আবেদনপত্র PDF", "অফলাইন ফর্ম ২০২৭"; sources in `docs/pre-admission-mockups/` (`U*`, `Off1`–`Off6`, `QRWhatsApp`). The update boards win over the older locked boards where they differ.

## Delivery

1. **Mockups** (canvas): pledge page (phone + desktop), result card with "don't have it now", the "none of the above" behaviour, transport route cards and stop choice, success page (WhatsApp card, QR with logo, what to bring), application PDF pledge page, offline form pages. Owner approves, then they are locked.
2. **Sanity:**
   - schema: pledge texts, bring-list, "don't have it now" setting (with its own text per field), exclusive option setting, routes, transport-stop field type
   - a setup script that writes **drafts only**: new questions, transport fields, rules, declaration, routes and vehicle charges, `none` marked exclusive

   The owner reviews and publishes in Studio.
3. **Code:**
   - pledge step and saved consent times
   - the "don't have it now" option
   - exclusive checkbox options (browser and server)
   - bring-list
   - transport cards and field
   - the "assessment" rename
   - the WhatsApp card and QR
   - export columns from all versions
   - offline form generator
4. **Checks:** `pnpm test`, `pnpm lint`, `pnpm build`, then one `pnpm test:e2e:admissions` run at the end; a printed offline form and PDF checked on paper; the QR scanned with two phones.

## Build status

| Milestone | State | Notes |
|---|---|---|
| M1 Schema + Sanity draft script | Done (`bd4ec0c`, `f0ac748`) | `src/lib/admissions/updates-2027.ts` (shared by `pnpm setup:admissions-updates` and the local preview); drafts written 2026-10-11, publish after deploy |
| M2 Guardian pages | Done (`965092f`, `e416aa2`) | pledge step (`/pledge`, migration `0007_pledges.sql`: run `pnpm db:migrate` before deploy), "don't have it now", exclusive checkbox, route cards (`route-cards.tsx`), bring list (`bring-list.ts`) |
| M3 Application PDF (4 pages) | Done (`999aac2`) | `pdf-html.ts`; checked with the local and the published form, both 4 pages |
| M4 Offline form | Done | `offline-html.ts`, `/api/admissions/offline-form` (stored under a hash of its pages); "অফলাইন ফর্ম (PDF)" on the intro page while open, "অফলাইন ফর্ম" on the admin overview; 6 pages with the published form |
| M5 Rename + WhatsApp | Done | অ্যাসেসমেন্ট / assessment in pre-admission messages, email, admin, export header, Studio title; shared logo `src/lib/whatsapp-logo.ts` + `whatsapp-icon.tsx`; QR `whatsapp-qr.ts` (level H, logo green on screen, black on paper; decoded with jsQR); success card states join → opened → joined; green button on Find and in the email (no logo: Gmail strips SVG); email lists what to bring |
| M6 Export columns from all versions | Done | Excel and Sheet columns from the current version plus every version a submitted application answered (`loadAnsweredSnapshots`, `exportForm`); a deleted question keeps its column next to the one it followed; each row uses its own version's wording; transport stop → route, vehicle, stop, monthly charge (area typed in is its own column); "don't have it now" documents read জমা দেওয়া হয়নি, সঙ্গে আনবেন |
| End of build | Done | e2e updated (pledge step, WhatsApp joined, offline form download); `pnpm test:e2e:admissions` 49 passed; admin guide and implementation plan (section 7: release steps) updated. Left for the owner: merge + deploy, `pnpm db:migrate`, publish the Sanity drafts, print check, two-phone QR scan |
| Print review (2026-10-11) | Done | Offline form redesigned after the owner's print check: brown accent (chapter bands, number badges, office box), roomier answers, names full-width beside 35 × 45 mm photo frames, short questions two to a row (later revised: see Print review 2); pledge page waits for every tick to be saved before opening the review |
| Print review 2 (2026-10-11) | Done | Offline form: the 9-rule code of conduct on its own page (kept by the family, larger type); chapters, pledges, signatures and office checks in 4 pages (chapters run on between questions). Application PDF and offline form: a 0.6 mm inset so borders at the right edge are not clipped |
| E2E | At the end | update `e2e/pre-admission.spec.ts` (pledge step, "সব ধাপ শেষ হলে খুলবে"); blank `SSLCOMMERZ_*` in `playwright.admissions.config.ts` (`.env.local` now has sandbox credentials) |
