# Madrasatul Quran — Sanity + repo + live-site content sweep (read-only)

Sources: Sanity project `ohoxdsld`, dataset `development` (public CDN GROQ, published docs; token-auth raw read for drafts only), repo worktree `madrasatul-quran-dhaka-1` (messages/*.json, hard-coded components, docs/*.md), and live HTML of https://madrasatulquranbd.com/bengali/* (fetched 2026-10-04). Nothing was written anywhere except this file.

Legend: **[APPROVED-LIVE]** = words currently shown on the live site (approved copy, reusable). **[PROSPECTUS]** = matches printed prospectus. **[STALE]** = conflicts with owner-approved prospectus facts; prospectus wins. **[PLACEHOLDER]** = seed/demo text, not true for this school; do not reuse. **[RICHER]** = real content in Sanity/repo that the live pages do not surface (or barely surface).

---

## 0. Document types and counts (published)

| type | n | verdict |
|---|---|---|
| siteSettings | 1 (+1 draft) | real; some stale contact facts |
| footer | 1 | real; stale copyright year |
| page | 1 | PLACEHOLDER ("established 1998") |
| academicProgram | 2 | PLACEHOLDER / STALE (Primary I–V, Secondary VI–X, Physics/Chem/Bio) |
| director | 9 | real; 2 with long bios + messages (RICHER) |
| advisor | 4 | real, with photos |
| staffMember | 1 | legacy; Nahid Hasan as "Principal" |
| teacher | 1 / department 1 | real but thin (1 Hifz teacher, dept "Quran") |
| facility | 5 | PLACEHOLDER (500-seat mosque, 40-PC lab, 10,000-book library) |
| newsEvent | 6 | PLACEHOLDER (2025 seed news, duplicated) |
| feeSettings | 1 | real but STALE amounts (Hifz) |
| preAdmissionForm | 1 | real; `isEnabled:false` (form closed — correct) |
| downloadCategory 1 / downloadable 1 | real (prospectus PDF filed as "Syllabus → Class One") |
| surveyArea/Class/Template | 22 | internal surveys, not public content |
| sanity.imageAsset | 30 | real campus/people photos (see §9) |

No `testimonial`, `faq`, `prospectus`, `curriculum`, `admission`, or `homepage` document types exist. Curriculum/why/target-abilities copy lives hard-coded in React components (§7). No "80-20" anywhere in Sanity, messages or src.

Drafts: only `drafts.siteSettings`, which differs from published by two added fields: `admissionsPhone: "+8801302332244"`, `whatsappNumber: "+8801301226644"`.

---

## 1. siteSettings (published)

- title: বাংলা "মাদরাসাতুল কুরআন ঢাকা " / EN "Madrasatul Quran Dhaka"
- description **[APPROVED-LIVE, home hero line]**: "ইসলামিক ও সাধারণ শিক্ষার একটি আদর্শ সমন্বয় (50-50)" / "An ideal combination of islamic and general education (50-50)"
  - Note: live renders "(50-50)" with Latin digits inside Bengali. Prospectus term is "শিক্ষা পদ্ধতি (৫০-৫০ মডেল)".
- seo.metaTitle: "মাদরাসাতুল কুরআন - ইসলামী শিক্ষায় উৎকর্ষতা" / "Madrasatul Quran - Excellence in Islamic Education"
- seo.keywords bn: ইসলামিক স্কুল, কুরআন শিক্ষা, হিফয, সাধারণ শিক্ষা, আরবী ভাষা, হাদীস, ইসলাম শিক্ষা, আদব, আখলাক, ফিকহ
- contactInfo.address: "বাসা ৩৭, রোড ২/এ, ব্লক-আই, সেক্টর-১৭ (উত্তরা সেন্টার মেট্রো স্টেশন এর পাশে), উত্তরা, ঢাকা।" / "House 37, Road 2/A, Block-i, Sector-17 (beside uttara center metro station), Uttara, Dhaka."
  - **[STALE wording]** prospectus: "600 m east of Uttara Center metro station; 2.5 km from Mirpur DOHS". "পাশে/beside" is looser.
- phones (all active, all flagged isPrimary):
  - সিনিয়র এডমিন / Senior Admin: +880 1302-332244  **[not in prospectus list]**
  - এডমিন সেকশন / Admin: +880 1301 226644 [PROSPECTUS 01301-226644]
  - একাউন্টস সেকশন / Accounts: +880 1304 226644 [PROSPECTUS 01304-226644]
  - **[STALE: missing]** prospectus also lists 01304-223350 and 01711-083463; transport line 01733-202368 is nowhere in Sanity.
- emails: info@madrasatulquranbd.com, mqdhakaoffice@gmail.com (both "সাধারণ তথ্য / General Information")
  - **[STALE]** prospectus email is office.mqd@gmail.com — not present anywhere in Sanity.
- admissionInfo: email mqdhakaoffice@gmail.com, phone +880 1302-332244, hours "শনি - বৃহস্পতি: সকাল ৮টা - বিকাল ৫টা" / "Sat - Thu: 8:00 AM - 5:00 PM"
- officeHours **[APPROVED-LIVE]**: "শনি - বৃহস্পতি: সকাল ৮টা - বিকাল ৫টা" (not in prospectus; keep)
- locationInfo: Google Maps https://maps.app.goo.gl/QBe1yWBvnweTWnfM9 + embed URL; landmarks: "উত্তরা সেন্টার মেট্রোরেল স্টেশন / Uttara Center Metrorail Station — 600m" [PROSPECTUS]; "উত্তরা দক্ষিণ মেট্রোরেল স্টেশন / Uttara south metro station — 3 km" (**[STALE vs prospectus]**: prospectus uses Mirpur DOHS 2.5 km instead).
- socialMedia: Facebook https://www.facebook.com/madrasatulqurandhaka.bd (active); YouTube https://www.youtube.com/@madrasatulqurandhaka (active); Instagram (inactive).
- statistics **[PLACEHOLDER — do not show]**: totalStudents 130, teacherCount 28, graduationRate 95, yearsOfService 1. (Home stats section is already commented out in code.)
- heroImages (6, see §9): titles "ক্যাম্পাস/Campus" (alt "principal's office"), "কনফারেন্স রুম/Conference Room", "ড্রয়িং ক্লাস/Drawing Class", "মাদরাসা ভবন/Madrasa Building", + 2 untitled.
- admissionBanner.isEnabled: false (good — no "apply now" banner).
- navigationVisibility: about OFF, programs OFF, teachers OFF; academics/admissions/advisors/books/contact/curriculum/directors/people ON.
- logo: MQD Logo PNG 4500x4500 (asset 71c59977…).

## 2. footer

- title "মাদরাসাতুল কুরআন" / "Madrasatul Quran"; subtitle "ইসলামিক ও সাধারণ শিক্ষার একটি আদর্শ সমন্বয়" / "An ideal combination of islamic and general education"
- description **[APPROVED-LIVE, mission line]**: "কুরআন ও সুন্নাহর আলোকে শিক্ষার্থীদের চরিত্র গঠন এবং আধুনিক শিক্ষায় দক্ষতা অর্জনের মাধ্যমে একটি আদর্শ মুসলিম সমাজ গড়ে তোলা।" / "Building an ideal Muslim society through character development of students in the light of Quran and Sunnah and achieving excellence in modern education."
- copyright "© ২০২৫ মাদরাসাতুল কুরআন। সকল অধিকার সংরক্ষিত।" — **[STALE year]**, it is 2026.
- legalLinks: /privacy, /terms, /sitemap; quickLinks: Home, Contact, Curriculum, Admissions.
- Live footer additionally shows "মোবাইল অ্যাপ" (Android: play.google.com …com.eximusedu.app, iOS: apps.apple.com … eximusedu id1459487310) and header "লগইন" (eximusedu.com/go/mqd) and "আমাদের বইসমূহ" (https://alquranervasha.com/downloads) — **[RICHER/live-only]** parent-app + books links worth keeping.

## 3. People

### 3a. Advisors (4, all with photos) [PROSPECTUS-consistent] [APPROVED-LIVE on /advisors]
1. প্রফেসর মোখতার আহমাদ / Professor Mokhter Ahmad — "চেয়ারম্যান, তারবিয়াহ ফাউন্ডেশন" / "Chairman, Tarbiyah Foundation" — photo https://cdn.sanity.io/images/ohoxdsld/development/04a7387ccffb82d96998b9fe828f913df3f42989-1024x1024.jpg
2. শাইখ আব্দুন নূর মাদানী / Sheikh Abdun Noor Madani — "প্রিন্সিপাল, দারুস সুন্নাহ মিরপুর-১২" / "Principal, Darus Sunnah Mirpur-12" — https://cdn.sanity.io/images/ohoxdsld/development/f420a8cd9ed10b3c63de3e03455500a923ed5594-1044x1024.jpg
3. শাইখ সাঈদ আহমাদ / Sheikh Saeed Ahmad — "উস্তায, জামিয়া রাহমানিয়া আজিজিয়া, মোহাম্মাদপুর ঢাকা" / "Ustaz, Jamia Rahmania Azizia, Mohammadpur Dhaka" — https://cdn.sanity.io/images/ohoxdsld/development/0982b46440c3629f4f4836b2f6dd083768549cb3-1024x1024.jpg
4. ব্রি. জে. (অবঃ) শাহ আলম চৌধুরী / Brig. Gen. (Retd) Shah Alam Chowdhury — "আরবী ভাষা প্রশিক্ষক, অবসরপ্রাপ্ত সেনা কর্মকর্তা" / "Arabic Language Instructor, Retired Military Officer" — https://cdn.sanity.io/images/ohoxdsld/development/0067c2ec50bcc00fa1308d32a5aa7dae99f28bf2-1008x1047.jpg
- UI copy (messages): title "আমাদের উপদেষ্টাবৃন্দ"; subtitle "প্রজ্ঞা ও পরামর্শ দিয়ে আমাদের লক্ষ্যকে এগিয়ে নেওয়া অভিজ্ঞ দিকনির্দেশকগণ।" [APPROVED-LIVE]

### 3b. Directors (9). Founding four = prospectus; five more exist only on the site.
UI copy [APPROVED-LIVE]: "আমাদের পরিচালকবৃন্দ" — "ইসলামী ও আধুনিক শিক্ষায় উৎকর্ষের লক্ষ্যে আমাদের নেতৃত্ব।"

1. **এস এম নাহিদ হাসান / S M Nahid Hasan — সভাপতি / Chairman** (featured, detail page). Photo https://cdn.sanity.io/images/ohoxdsld/development/b31c7f3bd22c694e7a190e401d5187048ea40c45-1278x1230.png
   - summary: "সিভিল ইঞ্জিনিয়ার, বুয়েট। আরবী ভাষা প্রশিক্ষক ও চেয়ারম্যান: আল কুরআনের ভাষা ইনস্টিটিউট" / "Civil Engineer, BUET. Arabic Language Instructor and Chairman: Al Quraner Vasha Institute"
   - qualifications: সিভিল ইঞ্জিনিয়ার; "বিদায়াতুল আরাবিয়া" সিরিজের লেখক; আরবি ভাষা প্রশিক্ষক; কারিকুলাম ও সিলেবাস প্রণেতা; হজ ও উমরাহ ট্রেইনার / Civil Engineer; Author of "Bidayatul Arabiya" Series; Arabic Language Trainer; Curriculum & Syllabus Architect; Hajj and Umrah Trainer
   - education: B.Sc. Civil Engineering, BUET (2003). socials: facebook.com/share/1L5RBerv3o, alquranervasha.com/about-us
   - **message [RICHER — chairman's message, signature "S M Nahid Hasan"]**:
     > আসসালামু আলাইকুম ওয়া রহমাতুল্লাহ।
     > জ্ঞান অর্জন করা কোন ঐচ্ছিক বিষয় নয়। দুনিয়া ও আখিরাত এই দুই জগতের সফলতার জন্য আমাদের যেমন কুরআন হাদিস তথা ইসলামি শরীয়াত শিখতে হয় তেমনি অধুনা সভ্যতার জ্ঞানও শিখতে হয়। আমাদের এই শিক্ষা প্রতিষ্ঠানের মূল লক্ষ্য হলো শিক্ষার্থীদের কুরআন ও সুন্নাহর সঠিক জ্ঞান প্রদানের পাশাপাশি আধুনিক শিক্ষা প্রদান করা। যাতে আমাদের বাচ্চারা একেকজন আদর্শ মানুষ হিসেবে গড়ে ওঠে।
     > আমাদের এই পথচলায় আপনাদের আন্তরিক সহযোগিতা ও দোয়া আমাদের পাথেয়। আল্লাহ আমাদের এই প্রচেষ্টাকে কবুল করুন। আমীন।

     > Assalamu Alaikum wa Rahmatullah. Seeking knowledge is not an optional matter. For success in both this world and the Hereafter, just as we must learn the Quran, Hadith, and Islamic Shari'ah, we must also acquire the knowledge of modern civilization. The core objective of our educational institution is to provide students with the correct knowledge of the Quran and Sunnah, alongside a modern education, so that our children can grow into ideal human beings. Your sincere cooperation and prayers are our guiding strength in this journey. May Allah accept our efforts. Ameen.
   - **fullBio [RICHER]** key verbatim facts (bn): "দায়ী ইলা-আল্লাহ, শিক্ষাবিদ, লেখক ও প্রকৌশলী"; "প্রতিষ্ঠাতা ও চেয়ারম্যান — মাদরাসাতুল কুরআন ঢাকা এবং আল কুরআনের ভাষা ইনস্টিটিউট"; born 1984 Barishal; Notre Dame College; BUET 2003; teaching Arabic since 2014; "বিদায়াতুল আরাবিয়া" series "২০০ টিরও বেশি শিক্ষা প্রতিষ্ঠানের পাঠ্যসূচিতে (সিলেবাস) অন্তর্ভুক্ত"; books: আল-কুরআনের ভাষা; কুরআনীয় আরবি শিক্ষা; বিদায়াতুল আরাবিয়া সিরিজ (৬ খন্ড); রাওদ্বাতুল আত্বফাল (২ খন্ড); ইসলাম শিক্ষা (৫ খন্ড); ইসলামের ইতিহাস; হজের পথের নিদর্শন। Institutions: আল কুরআনের ভাষা ইনস্টিটিউট; "মাদরাসাতুল কুরআন বরিশাল — ২০২৪ সালে বরিশালে তিনি এই আধুনিক হিফজখানাটি প্রতিষ্ঠা করেন"; "মাদরাসাতুল কুরআন ঢাকা — সময়ের চাহিদা ও বহু অভিভাবকের আকুল আবেদনের প্রেক্ষিতে ২০২৬ সালে তিনি এই আধুনিক ইসলামিক স্কুলটি প্রতিষ্ঠা করেন। বর্তমানে তিনি এই প্রতিষ্ঠানের প্রতিষ্ঠাতা, চেয়ারম্যান ও প্রিন্সিপাল হিসেবে…" Mission: "দ্বীনি শিক্ষা প্রসার, আরবি ভাষা সহজীকরণ এবং কুরআনের ভাষা সাধারণ মানুষের কাছে পৌঁছে দেওয়াই তাঁর শিক্ষা কার্যক্রমের মূল লক্ষ্য।" (Full EN translation exists.) Bio contains emoji headings (👤📚🏫🎯) and repeats school contacts incl. the 01302-332244 line — strip on reuse. AQVI WhatsApp in bio: 01304-223350, 01324-339966.
   - Useful link: AQVI is the author of the Arabic/Islamic curriculum (prospectus) and Nahid Hasan chairs AQVI — the bio substantiates the curriculum-uniqueness claim.
2. **মোঃ মুঈনুল ইসলাম / Md. Muinul Islam — সহ-সভাপতি / Vice Chairman** — summary "সহকারী সংকলক ও কোষাধ্যক্ষ: আল কুরআনের ভাষা ইনস্টিটিউট" / "Assistant Compiler and Treasurer: Al Quraner Vasha Institute" — photo https://cdn.sanity.io/images/ohoxdsld/development/6ae3d54a755365d66b7ac31548570c057f913b00-1013x1013.jpg
3. **মুহাম্মাদ আশরাফউদ্দৌলা / Muhammad Ashrafuddowla — ব্যবস্থাপনা পরিচালক / Managing Director** — summary "সিভিল ইঞ্জিনিয়ার, বুয়েট। চেয়ারম্যান: IIRK" — photo https://cdn.sanity.io/images/ohoxdsld/development/6cb7c8eba99fc3a94e053a3b37378ff846ba4fd3-4500x4500.jpg — education BUET B.Sc. CE 2004; East West Univ. M.Sc Actuarial Science 2016.
   - **message [RICHER]**: "আসসালামু আলাইকুম ওয়া রহমাতুল্লাহ। সকল প্রশংসা আল্লাহর যিনি আমাদের উত্তম জাতি হিসেবে পৃথিবীতে প্রেরণ করেছেন। আমরা মানুষকে কল্যাণের দিকে ডাকবো এবং অকল্যাণ থেকে দূরে রাখবো। আধুনিক প্রযুক্তির উৎকর্ষতা এবং ইসলামের শাশ্বত জ্ঞানের সঠিক সমন্বয়ই হলো একটি সমৃদ্ধ ও আদর্শ জাতি গঠনের মূল ভিত্তি। শিক্ষা কেবল বই পড়ার বিষয় নয়, এটি হৃদয় গড়ার মিশন। আমাদের লক্ষ্য আধুনিক জ্ঞান ও সুন্নাহর আলোয় এমন এক প্রজন্ম গড়ে তোলা, যারা হবে আগামী দিনের নৈতিক আলোকবর্তিকা।" (EN: "…Education is not merely about reading textbooks; it is a sacred mission to cultivate the heart and shape human character…")
   - fullBio [RICHER]: ICC (USA) certified structural engineer; roles: MD Madrasatul Quran Dhaka; Chairman, Islamic Institute of Revealed Knowledge (IIRK), Bogura; Co-founder GoZiyarah; Founder & CEO Torque Consulting Engineers; MD Torque Engineering Ltd. Bio explicitly says "(৫০/৫০ মডেল)" [PROSPECTUS-consistent]. Quotes the hadith of three continuing deeds (in Bengali translation).
   - Name inconsistency: card "মুহাম্মাদ আশরাফউদ্দৌলা / Muhammad Ashrafuddowla" vs bio "মোঃ আশরাফউদ্দৌলা, S.Eng. / Md. Ashrafuddoula". Prospectus: Muhammad Ashrafuddowla.
4. **শাফায়েত আহম্মেদ / Shafayet Ahmmed — নির্বাহী পরিচালক / Executive Director** — summary "সফটওয়্যার ইঞ্জিনিয়ার। শিক্ষক: আল কুরআনের ভাষা ইনস্টিটিউট" / "Software Engineer. Teacher: Al Quraner Vasha Institute" — photo https://cdn.sanity.io/images/ohoxdsld/development/507e1dbf1f10c361e3a24acd0b368f02933a2e8f-540x660.jpg
5–9. **[RICHER — not in prospectus; no photo, no detail page]**: মোঃ সাজেদুর রহমান / Md. Sajedur Rahman (পরিচালক); এন. মুহাম্মদ ফয়সাল / N. Muhammad Faisal (পরিচালক); মোঃ সামিউল হুদা সুমেল / Md. Samiul Huda Sumel (পরিচালক); শায়লা রহমান / Shayla Rahman (পরিচালক, female); **আবিদা সুলতানা / Abida Sultana — "পরিচালক ও উপাধ্যক্ষ (মহিলা বিভাগ)" / "Director & Vice Principal (Female Section)"** — the only evidence of a girls' section leader; useful for parent trust (prospectus mentions girls' rooftop garden). All shown on live /directors.

### 3c. staffMember (legacy, 1)
- এস এম নাহিদ হাসান — "অধ্যক্ষ / Principal"; qualifications "সিভিল ইঞ্জিনিয়ার, বুয়েট; আরবি ভাষা শিক্ষক; লেখক"; contactEmail principal@madrasatulquranbd.com; yearsOfExperience 20; no photo. Consistent with bio ("প্রতিষ্ঠাতা, চেয়ারম্যান ও প্রিন্সিপাল").

### 3d. Teachers / departments
- department "কুরআন / Quran". teacher "রাকিবুল ইসলাম নূর / Rakibul Islam Nur — হিফয শিক্ষক / Hifz Teacher", 1.5 yrs, no photo. Teachers nav is OFF. Too thin to feature.

## 4. Fees — feeSettings (single doc; drives live /admissions and /curriculum)

Copy [APPROVED-LIVE]: heading "স্কুলের ফি / School fees"; intro "প্রি-হিফজ ও হিফজের প্রতিটি ফি এবং প্রদানের সময়কাল নিচে দেওয়া হলো।"; labels প্রি-হিফজ / হিফজ.

| fee | freq | Pre-Hifz (Sanity) | Hifz (Sanity) | Prospectus | verdict |
|---|---|---|---|---|---|
| বেতন / Tuition | monthly | ৬,০০০ | ১০,০০০ | ৬,০০০ / ১০,০০০ | OK |
| খাবার / Food | monthly | প্রযোজ্য নয় | **৪,০০০** | — / **৪,৫০০** | **[STALE]** |
| ভর্তি / Admission | one-time | ২০,০০০ | **২৩,০০০** | ২০,০০০ / **২৫,০০০** | **[STALE]** |
| সেশন / Session | annual | ১৫,০০০ | **১৫,০০০** | ১৫,০০০ / **২০,০০০** | **[STALE]** |

The live site currently shows the stale Hifz numbers (২৩,০০০ / ১৫,০০০ / ৪,০০০).

- discount "ভাইবোন ছাড় / Sibling discount": "একাধিক সন্তান ভর্তি থাকলে ভাইবোন ছাড়ের সুবিধা রয়েছে। বিস্তারিত জানতে অফিসে যোগাযোগ করুন।" condition "দ্বিতীয় সন্তান থেকে প্রযোজ্য।" applies to tuition. Prospectus wording: "একাধিক সন্তানের জন্য বিশেষ ছাড় থাকবে, ইনশা আল্লাহ" (prefer this).
- transport: heading "পরিবহন"; intro "ঐচ্ছিক মাসিক পরিবহন সুবিধা রয়েছে। যানবাহনের ভাড়া ও প্রাপ্যতা জানতে অফিসে যোগাযোগ করুন।"; vehicles মাইক্রো / অটো = contact office. **[STALE/thin]**: no Uttara/Mirpur routes, no "অভিজ্ঞ চালক ও দায়িত্বশীল সহকারী", no transport phone 01733-202368.
- payment: "আপনার সন্তান নির্বাচিত হলে ক্যাম্পাসে পেমেন্ট সম্পন্ন করে ভর্তি নিশ্চিত করুন।" policies: "ভর্তির সময় ভর্তি ফি প্রদান করতে হবে।" / "মাসিক বেতন প্রতি মাসের ১০ তারিখের মধ্যে প্রদান করতে হবে।" / "রিফান্ড স্কুল কর্তৃপক্ষের সিদ্ধান্তের উপর নির্ভরশীল।" [APPROVED-LIVE]
- FAQ: "কী ধরনের ছাড় পাওয়া যায়?" → "বর্তমান ছাড়ের তথ্য দেখুন এবং যোগ্যতা ও শর্তাবলী নিশ্চিত করতে অফিসে যোগাযোগ করুন।"
- unavailableMessage: "বর্তমান ফি জানতে অফিসে যোগাযোগ করুন।"

## 5. Admissions

- preAdmissionForm.formSettings.isEnabled = **false** (submissionDate 2026-01-05) — correct per owner (form closed). Title "প্রি-অ্যাডমিশন ফর্ম". Success msg "আলহামদুলিল্লাহ, আপনার আবেদন সফলভাবে জমা দেওয়া হয়েছে। আমরা শীঘ্রই আপনার সাথে যোগাযোগ করব ইন শা আল্লাহ।" Declaration: "মাদরাসাতুল কুরআন একটি সম্পূর্ণ ইসলামিক শিক্ষা প্রতিষ্ঠান। …" Class options include ১ম/২য়/৩য় শ্রেণী and ৪র্থ–৬ষ্ঠ শ্রেণী "(বিশেষ বিবেচনায়)". Parent-practice questions (salat, Quran recitation, pardah, TV, smoking) signal the school's values — **[RICHER]** but private, not marketing copy. Transport question options: মিরপুর / উত্তরা / অন্যান্য (consistent with routes).
- Live admissions steps [APPROVED-LIVE]: "০১ আপনার সন্তানের আবেদন নিয়ে ভর্তি অফিসে যোগাযোগ করুন। ০২ পরবর্তী ধাপ সম্পর্কে স্কুলের নির্দেশনার জন্য অপেক্ষা করুন। ০৩ নির্বাচিত হলে ক্যাম্পাসে পেমেন্ট সম্পন্ন করে ভর্তি নিশ্চিত করুন।" Contact panel "আমরা সাহায্য করতে প্রস্তুত — ভর্তির সময়সূচি, ফি বা আপনার সন্তানের বিষয়ে জানতে অফিসে যোগাযোগ করুন।" buttons "ভর্তি অফিসে কল করুন", "হোয়াটসঅ্যাপ".
- **[STALE] admissions FAQ (messages/*.json `faq.q1…`, rendered live)**: min age "প্রথম শ্রেণীতে … কমপক্ষে ৫ বছর" (study plan says Nursery 5+, Class 1 7+); "সকল শিক্ষার্থীকে … প্রবেশিকা পরীক্ষা"; documents list (আবেদনপত্র, জন্ম সনদ, ট্রান্সক্রিপ্ট, স্থানান্তর সনদ, চিকিৎসা সনদ, ছবি) vs prospectus 3 documents (ভর্তি ফর্ম; শিক্ষার্থীর ২ কপি ছবি ও জন্ম নিবন্ধন সনদ; অভিভাবকের ১ কপি ছবি ও জাতীয় পরিচয়পত্র); campus visit "সকাল ৯:০০ থেকে বিকাল ৪:০০" vs office hours 8–5; "ইসলামী শিক্ষা আরবিতে বাংলা ব্যাখ্যাসহ … তিনটি ভাষায়ই দক্ষতা" (prospectus: Arabic medium from Class 6). Keep only the campus-visit invitation idea.
- **[STALE] live homepage CTA band**: "ভর্তি 2026–2027 — আমাদের অনন্য কারিকুলামে ভর্তি হতে আজই আবেদন করুন — [ভর্তি আবেদন করুন]" (src/components/homepage/featured-content-section.tsx:454). Violates "form closed / never apply now".
- **[PLACEHOLDER] messages admissions.requirements / feeStructure / importantDates** (60% marks, scholarships, orphan support, 10% sibling, fake bKash/bank numbers, 5% late fine) — not rendered on the new admissions page; never reuse.

## 6. Downloads

- downloadCategory "সিলেবাস / Syllabus"; downloadable "প্রথম শ্রেণী / Class One" → file `madrasatul-quran-prospectus.pdf` (2.29 MB, Vercel Blob, uploaded 2026-07-18). Mislabelled: the prospectus is filed as Class-One syllabus.
- Public endpoints (repo): /api/download-prospectus, /api/download-curriculum, /api/download-code-of-conduct. Live CTAs: "প্রসপেক্টাস ডাউনলোড করুন", "বিস্তারিত কারিকুলাম ডাউনলোড".
- docs/downloads-library.md and docs/fees-and-admissions.md are operational (no parent-facing copy). docs/directors-teachers.md: no content beyond schema notes; demo seed script exists (do not run).

## 7. Curriculum copy (hard-coded in repo, all shown on live site) — the strongest approved words

Files: src/components/homepage/unique-features-showcase.tsx, homepage/curriculum-showcase.tsx, curriculum/unique-features.tsx, curriculum/curriculum-breakdown.tsx, curriculum/ten-year-study-plan.tsx, app/[locale]/curriculum/page.tsx. (Violates the "CMS-driven" rule but is the live, approved copy.)

### 7a. Why intro — live paraphrase vs prospectus original
- Live [APPROVED-LIVE]: "অনেক ভালো ইসলামী স্কুল থাকা সত্ত্বেও মাদরাসাতুল কুরআন প্রতিষ্ঠার কারণ হলো, আমরা এমন বাংলা মিডিয়াম স্কুল খুঁজে পাইনি যেখানে আরবি ও ইসলামী শিক্ষার সাথে সাধারণ শিক্ষার সমান গুরুত্ব দেওয়া হয়।" / "Despite the availability of many good Islamic schools, Madrasatul Quran was established because we could not find a Bengali medium school that equally emphasizes Arabic and Islamic education alongside general education."
- Prospectus p3 (verified against page image, verbatim incl. spelling "কারন"): "বিসমিল্লাহির রাহমানির রাহীম, ওয়াস সলাতু ওয়াসসালামু আলা রসুলিল্লাহ। এতো এতো ভালো ইসলামিক স্কুল থাকতে আমরা কেন মাদরাসাতুল কুরআনের কথা ভাবলাম? এর একটা বড় কারন হলো জেনারেল শিক্ষার পাশাপাশি আমরা যেভাবে আরবি ও ইসলাম শিক্ষায় জোর দিতে চেয়েছি এমন বাংলা মিডিয়াম স্কুল পাচ্ছিলাম না। মূলত আমরা কয়েকটা বিষয়কে আমাদের স্কুলের অনন্য বৈশিষ্ট্য হবে বলে আশা করি। ইনশা আল্লাহ"
- Home section header [APPROVED-LIVE]: "কেন মাদরাসাতুল কুরআন?" — "আমাদের স্কুলের স্বতন্ত্র বৈশিষ্ট্যগুলো যা আমাদেরকে অন্যান্য শিক্ষা প্রতিষ্ঠান থেকে আলাদা করে তোলে" / "The unique characteristics of our school that set us apart from other educational institutions".

### 7b. 11 reasons — prospectus p3 (verified) vs live card title + text
Corrections to the computed brief: #3 is "ইসলাম শিক্ষা" (not "ইসলামিক শিক্ষা"); #10 ends "জোরদান"; #11 is longer.
1. P: "আরবি ভাষা ও ইসলামিক শিক্ষার সাথে জেনারেল শিক্ষার আদর্শ সমন্বয়।" — Live: **আদর্শ সমন্বয়** / "আরবি ভাষা ও ইসলামী শিক্ষার সাথে সাধারণ শিক্ষার আদর্শ সমন্বয়" (EN Ideal Integration)
2. P: "ইংরেজি ও আরবি ভাষার ক্ষেত্রে ভাষার চারটি মৌলিক দক্ষতা অর্জন (শোনা, বলা, পড়া ও লেখা)" — Live: **ভাষার চারটি দক্ষতা** / "ইংরেজি ও আরবি উভয় ভাষায় শোনা, বলা, পড়া ও লেখার দক্ষতা অর্জন" (Four Language Skills)
3. P: "৬ষ্ঠ শ্রেণি থেকে ইসলাম শিক্ষা আরবি ভাষায় পাঠদান।" — Live: **আরবি মিডিয়াম ইসলামী শিক্ষা** / "৬ষ্ঠ শ্রেণি থেকে আরবি মিডিয়ামে ইসলামী শিক্ষা প্রদান" (Arabic Medium Islamic Studies)
4. P: "৮ম শ্রেণির পর এস.এস.সি/দাখিল/মাদ্রাসা শিক্ষার সুযোগ।" — Live (curriculum only): **উচ্চ শিক্ষার সুযোগ** / "৮ম শ্রেণির পর এসএসসি/দাখিল/মাদ্রাসা শিক্ষার সুযোগ"
5. P: "ডে-কেয়ার হিফজের ব্যবস্থা।" — Live: **ডে-কেয়ার হিফজ** / "ডে-কেয়ার হিফজ (কুরআন মুখস্থ) প্রোগ্রামের ব্যবস্থা"
6. P: "নিজস্ব যাতায়াত ব্যবস্থা।" — Live (curriculum only): **নিজস্ব পরিবহন** / "নিজস্ব পরিবহন ব্যবস্থা রয়েছে"
7. P: "নবম শ্রেণির মধ্যে ৩০০+ হাদিস মুখস্থ করা।" — Live: **হাদিস মুখস্থ** / "৯ম শ্রেণির মধ্যে ৩০০+ হাদিস মুখস্থ করা"
8. P: "এস.এস.সি/দাখিল লেভেলে কুরআনের ৯০%+ অনুবাদে সক্ষমতা অর্জন।" — Live: **কুরআন তর্জমা দক্ষতা** / "এসএসসি/দাখিল পর্যায়ে ৯০%+ কুরআন তর্জমা দক্ষতা অর্জন"
9. P: "ইসলামিক নৈতিকতা ও শিষ্টাচার শিক্ষায় সর্বোচ্চ গুরুত্ব প্রদান।" — Live (curriculum only): **নৈতিকতা ও আদব** / "ইসলামী নৈতিকতা ও আদব শিক্ষায় সর্বোচ্চ গুরুত্ব"
10. P: "ইসলামের ইতিহাস ও সীরাহ শিক্ষার উপর জোরদান।" — Live (curriculum only): **ইসলামী ইতিহাস** / "ইসলামী ইতিহাস ও সীরাত শিক্ষায় গুরুত্ব"
11. P: "ছেলেদের ক্যাম্পাস সংলগ্ন মাঠে খেলার সুযোগ এবং মেয়েদের ছাদবাগানে খেলার সুযোগ।" — Live (curriculum only): **বিনোদনের সুযোগ** / "ছেলেদের ক্যাম্পাস সংলগ্ন মাঠে এবং মেয়েদের ছাদ বাগানে খেলার সুযোগ"
- Live homepage shows only 6 of 11 (1,2,3,7,8,5). Live closer: "উপরের বিষয়গুলো আমাদের স্কুলের স্বতন্ত্র বৈশিষ্ট্য হিসেবে বিবেচিত।" English titles/texts for all 11 exist in the components (e.g. "Memorizing 300+ Hadith (prophetic traditions) by 9th grade", "Achieving 90%+ Quranic translation proficiency at SSC/Dakhil level").

### 7c. Curriculum line + 10-year target abilities (prospectus p3 verified; live identical)
- "বাংলা মিডিয়াম NCTB (দাখিল/এস.এস.সি) এর সাথে নিজস্ব ইসলামী শিক্ষার কারিকুলাম।" / "Own Islamic education curriculum integrated with Bengali Medium NCTB (Dakhil/SSC)"
- Heading: "দশ বছরে ইসলাম শিক্ষায় উদ্দিষ্ট যোগ্যতা" (prospectus + live use "দশ বছরে", not "দশ বছরের")
- কুরআন — "সামর্থ্য অনুযায়ী হিফজ ও কুরআন তর্জমা"
- আরবী ভাষা — "আরবী বলতে পারা, শুনে বুঝতে পারা, ইবারাত পড়তে পারা ও লিখতে পারা"
- আকিদাহ — "ইমান ও আকিদার বিষয়াবলি ও ইসলামিক মূল্যবোধ"
- ফিকহ — "বেসিক মাসায়িল, আদাব-তারবিয়া ও মাসনুন দোয়া" (live spells "মাসাইল")
- হাদিস — "নবম শ্রেণির মধ্যে বিষয়ভিত্তিক ৩০০+ হাদিস মুখস্থ করা।"
- ইতিহাস — "নবীদের ইতিহাস, কুরআনের বিভিন্ন ইতিহাস, খলিফাদের ইতিহাস ও পরবর্তী ইতিহাস"
  - Corrections to the computed brief: it is "কুরআনের বিভিন্ন **ইতিহাস**" (not "ঘটনা") and "**খলিফাদের** ইতিহাস" (not "খিলাফতের"); "আরবী" with দীর্ঘ-ঈ in the box title.
- EN (live): Quran "Hifz (memorization) and Quranic translation according to ability"; Arabic "Ability to speak, understand by listening, read Ibaarat (Arabic text without diacritics), and write Arabic"; Aqidah "Matters of faith and creed, and Islamic values"; Fiqh "Basic Masa'il (rulings), Adab-Tarbiyah (manners and upbringing), and Masnoon Duas (prophetic supplications)"; Hadith "Memorizing 300+ subject-wise Hadith by 9th grade"; History "History of Prophets, various histories from the Quran, history of Caliphs, and subsequent history".

### 7d. Curriculum page hero + 10-year study plan [APPROVED-LIVE, RICHER than prospectus]
- Hero: "আমাদের কারিকুলাম — কুরআন-সুন্নাহ ভিত্তিক তারবিয়াহ্‌, আরবী ও দীনী শিক্ষা এবং NCTB একাডেমিকের সমন্বয়ে পরিকল্পিত সমন্বিত কারিকুলাম" / "Integrated curriculum combining Quran-Sunnah based Tarbiyah, Arabic & Islamic education with NCTB academic standards"
- Table heading: "দশ বছরের পাঠ পরিকল্পনা (পূর্ণ হিফজ সহ)" (age | class | Islamic studies | general):
  - ৫+ নার্সারি — কায়দা, আরবি-N, ইসলাম-N | বাংলা, ইংরেজি, গণিত
  - ৬+ কেজি — আম্মাপারা, আরবি-KG, ইসলাম-KG | বাংলা, ইংরেজি, গণিত
  - ৭+ ১ম — নাজেরা, আরবি-১, ইসলাম-১ | বাংলা, ইংরেজি, গণিত
  - ৮+ ২য় — হিফজ-১, আরবি-২, ইসলাম-২ | বাংলা, ইংরেজি, গণিত
  - ৯+ ৩য় — হিফজ-২, আরবি-৩, ইসলাম-৩ | বাংলা, ইংরেজি, গণিত
  - ১০+ ৪র্থ — হিফজ-৩, ইসলাম-৪, আরবি-৪ | বাংলা, ইংরেজি, গণিত
  - ১১+ ৫ম — শুনানি, আরবি-৫, ইসলাম-৫ | বাংলা, ইংরেজি, গণিত, বিজ্ঞান, বিজিএস
  - ১২+ ৬ষ্ঠ / ১৩+ ৭ম / ১৪+ ৮ম — আরবি-৬…৮, ইসলাম-৬…৮ | বাংলা, ইংরেজি, গণিত, বিজ্ঞান, বিজিএস
  - ১৫+ ৯ম / ১৬+ ১০ম — এসএসসি/দাখিল প্রস্তুতি
  - Consistent with prospectus stages (Pre-Hifz Nursery–1 = Kaida/Ammapara/Nazera; Hifz 2–5 = Hifz-1..3 + Shunani; After-Hifz 6–8; Dakhil 9–10). **[STALE gap]**: no Class 11 মুতাওয়াসসিতা row; no stage names, hours or 25/25/50 · 70/15/15 · 50/50 splits anywhere in repo/Sanity.
  - Live renders this as an 8-period grid with many "কোনো বিষয় নির্ধারিত নেই" cells — visually weak.
- Higher education [APPROVED-LIVE]: "স্কুল পরবর্তী উচ্চ শিক্ষা" — "আলিম হওয়ার লক্ষ্যে ৮ম শ্রেণির পর শিক্ষার্থীদের তালিম বোর্ডের জন্য প্রস্তুত করা হবে এবং দাখিল/এসএসসি পরীক্ষা দিতে হবে।" / "কলেজ শিক্ষার জন্য শিক্ষার্থীরা সাধারণ শিক্ষায় মনোনিবেশ করবে এবং এসএসসি পরীক্ষা দেবে।" — **[partly STALE]** prospectus path is Dakhil → in-house Mutawassita (Class 11) or Kafiya at a Qawmi madrasa, or SSC → college.

## 8. Other site copy

- Home hero [APPROVED-LIVE]: "﷽" (decorative bismillah glyph at top — owner rule: Arabic only with reverence, no decorative use; flag) · "মাদরাসাতুল কুরআন ঢাকা" · "ইসলামিক ও সাধারণ শিক্ষার একটি আদর্শ সমন্বয় (50-50)" · buttons "যোগাযোগ", "প্রসপেক্টাস ডাউনলোড করুন". Footer also repeats "﷽".
- Home "আমাদের কারিকুলাম" block → "সম্পূর্ণ কারিকুলাম এবং ১০ বছরের পাঠ পরিকল্পনা দেখুন" / "সম্পূর্ণ কারিকুলাম দেখুন".
- Home "দ্রুত অ্যাক্সেস" cards: "কারিকুলাম — আমাদের ইসলামী শিক্ষা ও NCTB কারিকুলাম সম্পর্কে জানুন"; "ভর্তি — ভর্তির প্রয়োজনীয়তা, আবেদন প্রক্রিয়া এবং গুরুত্বপূর্ণ তারিখসমূহ" (stale: no dates exist); "যোগাযোগ — যেকোনো প্রশ্ন, ক্যাম্পাস পরিদর্শন বা অতিরিক্ত তথ্যের জন্য আমাদের সাথে যোগাযোগ করুন"; buttons in English "Learn More" (untranslated).
- messages homepage.hero/mission (not the live hero, older): "ইসলামী শিক্ষা ও আধুনিক শিক্ষায় উৎকর্ষতা"; "মন, শরীর ও আত্মার সামগ্রিক উন্নয়নের জন্য ঐতিহ্যবাহী ইসলামী মূল্যবোধের সাথে সমসাময়িক শিক্ষার সমন্বয়" (generic; used as meta description).
- /about live = "শীঘ্রই আসছে" (coming soon). /news live = stuck "সংবাদ ও ইভেন্ট লোড হচ্ছে...". /campus live = placeholder facilities + "ভার্চুয়াল ক্যাম্পাস ট্যুর … বিশ্বমানের সুবিধাসমূহ" (PLACEHOLDER).
- /contact live: real address/phones/hours + **[PLACEHOLDER]** heading "ঢাকার হৃদয়ে আমাদের ক্যাম্পাসে আমাদের দেখতে আসুন" and an English "Get in Touch" inquiry form. messages contact.* still holds a fake Dhanmondi address, +880 2-98765xx numbers, @madrasatulquran.edu.bd emails, fake department heads — **[PLACEHOLDER]**, must never surface.
- page "school-history": "মাদরাসাতুল কুরআন ১৯৯৮ সালে প্রতিষ্ঠিত হয়েছিল…" — **[PLACEHOLDER/STALE]** (school founded 2026 per chairman bio).
- academicProgram (2): "প্রাথমিক স্তর (প্রথম-পঞ্চম শ্রেণী)" and "মাধ্যমিক স্তর (ষষ্ঠ-দশম শ্রেণী)" with Tafsir/Physics/Chemistry/Biology/Higher Math, "Annual Quran recitation competition", "Football, cricket" — **[STALE]** vs stage model; programs nav is OFF.
- facility (5): প্রধান মসজিদ (500 worshippers), কম্পিউটার ল্যাব (40 PCs), বিজ্ঞান গবেষণাগার, লাইব্রেরি (10,000+ books), খেলার মাঠ (football/cricket/volleyball, spectator gallery) — **[PLACEHOLDER]**, shown live on /campus; contradicts prospectus (boys use adjacent field; girls rooftop garden). No images attached.
- newsEvent (6 = 3 stories × 2 duplicates, all dated 2025, no images): "বার্ষিক ক্রীড়া প্রতিযোগিতা ২০২৫" (15 Feb 2025); "জাতীয় কুরআন প্রতিযোগিতায় প্রথম স্থান" (student "মোহাম্মদ আব্দুল্লাহ", class 8 — fabricated; school has no class 8 yet); "নতুন বিজ্ঞান গবেষণাগার উদ্বোধন"; "২০২৫-২৬ শিক্ষাবর্ষে ভর্তি চলছে … প্রাক-প্রাথমিক থেকে দশম শ্রেণী … আগে আসলে আগে পাবেন" — **all [PLACEHOLDER/STALE]**; do not feed a news strip from these.

## 9. Real photo assets in Sanity (cdn.sanity.io/images/ohoxdsld/development/…)

Campus/activity (WhatsApp photos, 2025-10 → 2026-04) — the only real school imagery:
- b37d36ab2ced7a8432fcbbdc55b05b57ea6eb985-1599x1200.jpg (hero "ক্যাম্পাস", alt principal's office)
- 796ea8d908956e5e625c3df447e56f85e5210743-1599x1200.jpg (hero "কনফারেন্স রুম")
- 9509430fb103921765cf9383de4d94a5094ba5e7-1600x900.jpg (hero "ড্রয়িং ক্লাস")
- 3ef2d31be88c55d6e86c1f627d10805b3d11123a-1599x1200.jpg (hero "মাদরাসা ভবন")
- 3f1df297fd325afe683a94cb32893b8766f83fbe-1599x1200.jpg, b39b4636f12fba3c6159e0eff257f42e4992a43e-1599x1200.jpg (hero, untitled)
- Unreferenced but uploaded: 07e6578a6ee7e9ec7296467714b91c403b11dc1f-1600x1200.jpg, 41ba835d4bd0d8ef68cf573dc6ca7acd0e69ab5e-1600x1200.jpg, 2acd3a8acc3080b8cec442e5ca4dba9be16e743a-1599x1200.jpg, 72cbdcb4e18660296d87fec3b513bd6bf309a1e1-1599x1200.jpg, 7ba185b851e4ad9c56fabefc76cab29b77da4288-1599x1200.jpg, a090698583792647bf5cd681792a09b661b95ef5-1600x1182.jpg, 1ee07b8d985706fc508d2ff45290d7444aeaf522-882x637.jpg
- **"MQD Car.jpeg" ×2 (portrait 960x1280)**: 3865e2e4d9d376dea367b023842d42209c313e17-960x1280.jpg, dd71e3f23c67aa6503c26f888b1f3691239f12a2-960x1280.jpg — real school transport photo, ideal for the transport/service section.
- **"mqd-banner.jpg" 3733x2100**: b08daa6c7d52ad85d2cd52ed418276328e8e88ae-3733x2100.jpg — unreferenced wide banner.
- Logo: 71c59977ad4c3771aba8dc5e7c75af240b0ef56b-4500x4500.png. Favicon 2f57c9ee…-32x32.png.
- People: listed in §3; also unreferenced "ashraf ustaz" 5a20736f…-472x591.jpg, "ashraf-01" a9655dde…-3124x4500.jpg, "my photo" 54d8fe03…-449x567.jpg; "images.jpeg" b8e357fb…-278x181.jpg (junk).

## 10. STALE / conflict checklist (prospectus wins)

1. Hifz fees: admission ২৩,০০০→**২৫,০০০**; session ১৫,০০০→**২০,০০০**; meals ৪,০০০→**৪,৫০০** (Sanity feeSettings + live pages).
2. Email: add **office.mqd@gmail.com** (Sanity has info@madrasatulquranbd.com, mqdhakaoffice@gmail.com only).
3. Phones: prospectus set is 01301-226644, 01304-226644, 01304-223350, 01711-083463 (+ transport 01733-202368). Sanity/live lead with 01302-332244 (Senior Admin), not in prospectus; 01304-223350 appears only as AQVI WhatsApp in the chairman bio; 01711-083463 and 01733-202368 are absent.
4. Location: "beside metro" → "600 m east of Uttara Center metro; 2.5 km from Mirpur DOHS"; drop "Uttara South metro 3 km".
5. Documents: 6-item FAQ list → prospectus 3 items.
6. Live home CTA "আজই আবেদন করুন / ভর্তি আবেদন করুন" + "ভর্তি 2026–2027" → visit / call / prospectus / waitlist.
7. No Mutawassita (Class 11), stage names, daily hours or subject-weight splits anywhere; higher-ed path text ("তালিম বোর্ড") differs from prospectus (Mutawassita / Kafiya / SSC→college).
8. Transport: no routes, driver/assistant line or transport phone in Sanity.
9. Placeholders live in production: facilities, news, about "coming soon", school-history 1998, statistics, academicProgram, contact.* in messages, admissions FAQ.
10. Footer © ২০২৫ → ২০২৬. "(50-50)" Latin digits → "৫০-৫০ মডেল" in Bengali.
11. Decorative "﷽" glyph in hero and footer conflicts with "Arabic only for real content, with reverence".
12. Name spelling: Ashrafuddowla (card) vs Ashrafuddoula (bio).
