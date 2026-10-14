# Live site content crawl — www.madrasatulquranbd.com (2026-10-04)

Source: curl of /bengali/<route> and /english/<route> (server-rendered HTML, script/style stripped), plus the site's public Sanity dataset (`ohoxdsld` / `development`, read via the public GROQ API) for news items and image assets. Raw text dumps: `r2/raw/*.body` (page body without header/footer), `r2/raw/*.txt` (full page + links).

Legend: **STALE** = conflicts with the printed prospectus (prospectus wins). **PLACEHOLDER** = template/seed copy that is not real school info (do not reuse). **USE** = approved, real copy worth carrying forward.

## Route status

| Route | Status | Verdict |
|---|---|---|
| `/` home | 200 | USE (strongest page: 50-50 headline, 6 reasons, 6 target abilities) |
| `/about` | 200, "শীঘ্রই আসছে / Coming Soon" | empty |
| `/curriculum` | 200 | USE (11 reasons, founder line, 10-year study plan table, higher-ed pathway) — fees STALE |
| `/programs` | 200 | PLACEHOLDER (generic primary/secondary copy, science/humanities/business groups) |
| `/admissions` | 200 | Partly USE (3 steps, payment rules, WhatsApp) — fees STALE, FAQ mostly PLACEHOLDER |
| `/campus` | 200 | PLACEHOLDER (500-capacity mosque, 40-PC lab, 10,000+ books, fake 1712-345678 phones) |
| `/news` | 200, client-rendered ("লোড হচ্ছে...") | seed data only; detail pages return **500** |
| `/teachers` | **404** | — |
| `/directors` | 200 + 4 profile pages | USE (names, roles, credentials, two long Bengali bios + messages) |
| `/advisors` | 200 | USE |
| `/downloads` | 200, "লিংকটি অবৈধ অথবা মেয়াদ শেষ" (share-only, needs token) | — |
| `/contact` | 200 | USE (address, landmarks, map, phones) — phones/email differ from prospectus |
| `/pre-admission` | 200, "ফর্ম পাওয়া যায়নি — প্রি-অ্যাডমিশন বর্তমানে গ্রহণ করা হচ্ছে না।" | closed (matches owner rule) |

---

## Global chrome (every page)

**Header**
- Logo (`MQD Logo PNG.png`, 4500x4500 brown roundel) + "মাদরাসাতুল কুরআন ঢাকা" / tagline "ইসলামিক ও সাধারণ শিক্ষার একটি আদর্শ সমন্বয়" — EN "Madrasatul Quran Dhaka" / "An ideal combination of islamic and general education"
- Nav (BN / EN): হোম / Home · একাডেমিক ▾ / Academics ▾ · আমাদের সদস্যবৃন্দ ▾ / Our People ▾ · ভর্তি / Admissions · যোগাযোগ / Contact · আমাদের বইসমূহ / Our Books (→ https://alquranervasha.com/downloads)
  - Academics dropdown (from repo `messages/bengali.json`): কারিকুলাম, একাডেমিক প্রোগ্রাম, ক্যাম্পাস ও সুবিধা, সংবাদ ও ইভেন্ট
  - Our People dropdown: পরিচালকবৃন্দ (+ each director), উপদেষ্টাবৃন্দ, শিক্ষকমণ্ডলী (by department) — teachers route 404s
- Utility: লগইন / Login (→ https://www.eximusedu.com/go/mqd — school ERP), কল করুন / Call Us, language toggle বাংলা / English
- Page `<title>`: "মাদরাসাতুল কুরআন - ইসলামী শিক্ষা ও আধুনিক শিক্ষায় উৎকর্ষতা" / "Madrasatul Quran - Excellence in Islamic Education & Modern Learning"

**Footer**
- ﷽ (decorative — owner rule says no decorative Arabic; flag)
- H3 "মাদরাসাতুল কুরআন" + "ইসলামিক ও সাধারণ শিক্ষার একটি আদর্শ সমন্বয়"
- Mission line (USE): "কুরআন ও সুন্নাহর আলোকে শিক্ষার্থীদের চরিত্র গঠন এবং আধুনিক শিক্ষায় দক্ষতা অর্জনের মাধ্যমে একটি আদর্শ মুসলিম সমাজ গড়ে তোলা।" / "Building an ideal Muslim society through character development of students in the light of Quran and Sunnah and achieving excellence in modern education."
- দ্রুত লিংক / Quick Links: হোম, যোগাযোগ, কারিকুলাম, ভর্তি
- যোগাযোগের তথ্য / Contact Information:
  - ঠিকানা: "বাসা ৩৭, রোড ২/এ, ব্লক-আই, সেক্টর-১৭ (উত্তরা সেন্টার মেট্রো স্টেশন এর পাশে), উত্তরা, ঢাকা।" / "House 37, Road 2/A, Block-i, Sector-17 (beside uttara center metro station), Uttara, Dhaka."
  - ফোন: সিনিয়র এডমিন +880 1302-332244 · এডমিন সেকশন +880 1301 226644 · একাউন্টস সেকশন +880 1304 226644 — **STALE vs prospectus** (prospectus lists 01301-226644, 01304-226644, 01304-223350, 01711-083463; 01302-332244 not in prospectus)
  - ইমেইল: info@madrasatulquranbd.com — **STALE vs prospectus** (office.mqd@gmail.com)
  - অফিস সময়: "শনি - বৃহস্পতি: সকাল ৮টা - বিকাল ৫টা" / "Sat - Thu: 8:00 AM - 5:00 PM"
- মোবাইল অ্যাপ: Android (Google Play `com.eximusedu.app`), iOS (App Store id1459487310) — EximusEdu parent app
- Social: Facebook https://www.facebook.com/madrasatulqurandhaka.bd · YouTube https://www.youtube.com/@madrasatulqurandhaka (Instagram in CMS but inactive)
- "© ২০২৫ মাদরাসাতুল কুরআন। সকল অধিকার সংরক্ষিত।" · গোপনীয়তা নীতি · ব্যবহারের শর্তাবলী · সাইটম্যাপ
- WhatsApp: https://wa.me/8801301226644 (admissions CTA)
- Google Maps: https://maps.app.goo.gl/QBe1yWBvnweTWnfM9 (place "Madrasatul Quran Dhaka", ~23.8415, 90.3624 embed)

---

## Home `/bengali`

Purpose: brand statement + reasons + curriculum outcomes + quick access.

1. **Hero carousel** (6 Sanity photos, alt "1","3","6","8","principal's office","conference room" — see photos.md) with ﷽, wordmark "মাদরাসাতুল / কুরআন / ঢাকা"
   - H2 "ইসলামিক ও সাধারণ শিক্ষার একটি আদর্শ সমন্বয় (50-50)" / "An ideal combination of islamic and general education (50-50)" — USE (matches prospectus ৫০-৫০ positioning)
   - CTAs: যোগাযোগ / Contact · প্রসপেক্টাস ডাউনলোড করুন / Download Prospectus
2. **H2 কেন মাদরাসাতুল কুরআন? / Why Madrasatul Quran?**
   - Sub: "আমাদের স্কুলের স্বতন্ত্র বৈশিষ্ট্যগুলো যা আমাদেরকে অন্যান্য শিক্ষা প্রতিষ্ঠান থেকে আলাদা করে তোলে" / "The unique characteristics of our school that set us apart from other educational institutions"
   - 6 cards (BN title — BN body / EN title — EN body):
     1. আদর্শ সমন্বয় — আরবি ভাষা ও ইসলামী শিক্ষার সাথে সাধারণ শিক্ষার আদর্শ সমন্বয় / Ideal Integration — Ideal integration of Arabic language and Islamic education with general education
     2. ভাষার চারটি দক্ষতা — ইংরেজি ও আরবি উভয় ভাষায় শোনা, বলা, পড়া ও লেখার দক্ষতা অর্জন / Four Language Skills — Acquisition of four basic language skills (listening, speaking, reading, and writing) in both English and Arabic
     3. আরবি মিডিয়াম ইসলামী শিক্ষা — ৬ষ্ঠ শ্রেণি থেকে আরবি মিডিয়ামে ইসলামী শিক্ষা প্রদান / Arabic Medium Islamic Studies — Islamic studies are taught in Arabic from the 6th grade onwards
     4. হাদিস মুখস্থ — ৯ম শ্রেণির মধ্যে ৩০০+ হাদিস মুখস্থ করা / Hadith Memorization — Memorizing 300+ Hadith (prophetic traditions) by 9th grade
     5. কুরআন তর্জমা দক্ষতা — এসএসসি/দাখিল পর্যায়ে ৯০%+ কুরআন তর্জমা দক্ষতা অর্জন / Quranic Translation Proficiency — Achieving 90%+ Quranic translation proficiency at SSC/Dakhil level
     6. ডে-কেয়ার হিফজ — ডে-কেয়ার হিফজ (কুরআন মুখস্থ) প্রোগ্রামের ব্যবস্থা / Day-care Hifz — Provision for a Day-care Hifz (Quran memorization) program
   - "আরও জানতে আমাদের কারিকুলাম পেজ দেখুন অথবা বিস্তারিত কারিকুলাম ডাউনলোড করুন" → কারিকুলাম দেখুন · বিস্তারিত কারিকুলাম ডাউনলোড
3. **H2 আমাদের কারিকুলাম / Our Curriculum**
   - "বাংলা মিডিয়াম NCTB (দাখিল/এস.এস.সি) এর সাথে নিজস্ব ইসলামী শিক্ষার কারিকুলাম" / "Own Islamic education curriculum integrated with Bengali Medium NCTB (Dakhil/SSC)" — USE (verbatim prospectus)
   - 6 target abilities (verbatim prospectus p3, verified against p3.png):
     - কুরআন — সামর্থ্য অনুযায়ী হিফজ ও কুরআন তর্জমা / Quran — Hifz (memorization) and Quranic translation according to ability
     - আরবী ভাষা — আরবী বলতে পারা, শুনে বুঝতে পারা, ইবারাত পড়তে পারা ও লিখতে পারা / Arabic Language — Ability to speak, understand by listening, read Ibaarat (Arabic text without diacritics), and write Arabic
     - আকিদাহ — ইমান ও আকিদার বিষয়াবলি ও ইসলামিক মূল্যবোধ / Aqidah (Islamic Creed) — Matters of faith and creed, and Islamic values
     - ফিকহ — বেসিক মাসাইল, আদাব-তারবিয়া ও মাসনুন দোয়া / Fiqh (Islamic Jurisprudence) — Basic Masa'il (rulings), Adab-Tarbiyah (manners and upbringing), and Masnoon Duas
     - হাদিস — নবম শ্রেণীর মধ্যে বিষয়ভিত্তিক ৩০০+ হাদিস মুখস্থ করা / Hadith — Memorizing 300+ subject-wise Hadith by 9th grade
     - ইতিহাস — নবীদের ইতিহাস, কুরআনের বিভিন্ন ইতিহাস, খলিফাদের ইতিহাস ও পরবর্তী ইতিহাস / History — History of Prophets, various histories from the Quran, history of Caliphs, and subsequent history
   - "সম্পূর্ণ কারিকুলাম এবং ১০ বছরের পাঠ পরিকল্পনা দেখুন" → সম্পূর্ণ কারিকুলাম দেখুন
4. **H2 দ্রুত অ্যাক্সেস / Quick Access** — "আমাদের সবচেয়ে গুরুত্বপূর্ণ বিভাগগুলির মাধ্যমে দ্রুত খুঁজে নিন"
   - কারিকুলাম — আমাদের ইসলামী শিক্ষা ও NCTB কারিকুলাম সম্পর্কে জানুন
   - ভর্তি — ভর্তির প্রয়োজনীয়তা, আবেদন প্রক্রিয়া এবং গুরুত্বপূর্ণ তারিখসমূহ
   - যোগাযোগ — যেকোনো প্রশ্ন, ক্যাম্পাস পরিদর্শন বা অতিরিক্ত তথ্যের জন্য আমাদের সাথে যোগাযোগ করুন
   - (buttons say "Learn More" in English on the Bengali page — i18n bug)
   - **H3 ভর্তি 2026–2027 — "আমাদের অনন্য কারিকুলামে ভর্তি হতে আজই আবেদন করুন" → ভর্তি আবেদন করুন** — **STALE** (form is closed; owner rule: no "apply now")

## Curriculum `/bengali/curriculum`

Purpose: the real substance page. In-page tabs: স্কুলের বৈশিষ্ট্য · পাঠ পরিকল্পনা · শিক্ষার লক্ষ্য · ফি · পরিবহন · ছাড় · পেমেন্ট.

- H1 "আমাদের কারিকুলাম" — lead: "কুরআন-সুন্নাহ ভিত্তিক তারবিয়াহ্‌, আরবী ও দীনী শিক্ষা এবং NCTB একাডেমিকের সমন্বয়ে পরিকল্পিত সমন্বিত কারিকুলাম" / "Integrated curriculum combining Quran-Sunnah based Tarbiyah, Arabic & Islamic education with NCTB academic standards" — USE
- CTAs: ভর্তি বিষয়ে যোগাযোগ / Contact Admissions · বিস্তারিত কারিকুলাম ডাউনলোড
- **H2 কেন মাদরাসাতুল কুরআন?** — founder line (site's condensed version of prospectus p3 paragraph):
  "অনেক ভালো ইসলামী স্কুল থাকা সত্ত্বেও মাদরাসাতুল কুরআন প্রতিষ্ঠার কারণ হলো, আমরা এমন বাংলা মিডিয়াম স্কুল খুঁজে পাইনি যেখানে আরবি ও ইসলামী শিক্ষার সাথে সাধারণ শিক্ষার সমান গুরুত্ব দেওয়া হয়।" / "Despite the availability of many good Islamic schools, Madrasatul Quran was established because we could not find a Bengali medium school that equally emphasizes Arabic and Islamic education alongside general education."
  - Prospectus original (p3.png, verified, prefer this): "বিসমিল্লাহির রাহমানির রাহীম, ওয়াস সলাতু ওয়াসসালামু আলা রসুলিল্লাহ। এতো এতো ভালো ইসলামিক স্কুল থাকতে আমরা কেন মাদরাসাতুল কুরআনের কথা ভাবলাম? এর একটা বড় কারন হলো জেনারেল শিক্ষার পাশাপাশি আমরা যেভাবে আরবি ও ইসলাম শিক্ষায় জোর দিতে চেয়েছি এমন বাংলা মিডিয়াম স্কুল পাচ্ছিলাম না। মূলত আমরা কয়েকটা বিষয়কে আমাদের স্কুলের অনন্য বৈশিষ্ট্য হবে বলে আশা করি। ইনশা আল্লাহ"
- 11 feature cards (site wording; each with an AI "প্রতীকী ছবি" illustration from `/images/curriculum/*.webp` — illustrative, not real photos):
  1. আদর্শ সমন্বয় — আরবি ভাষা ও ইসলামী শিক্ষার সাথে সাধারণ শিক্ষার আদর্শ সমন্বয়
  2. ভাষার চারটি দক্ষতা — ইংরেজি ও আরবি উভয় ভাষায় শোনা, বলা, পড়া ও লেখার দক্ষতা অর্জন
  3. আরবি মিডিয়াম ইসলামী শিক্ষা — ৬ষ্ঠ শ্রেণি থেকে আরবি মিডিয়ামে ইসলামী শিক্ষা প্রদান
  4. উচ্চ শিক্ষার সুযোগ — ৮ম শ্রেণির পর এসএসসি/দাখিল/মাদ্রাসা শিক্ষার সুযোগ / Higher Education Pathway
  5. ডে-কেয়ার হিফজ — ডে-কেয়ার হিফজ (কুরআন মুখস্থ) প্রোগ্রামের ব্যবস্থা
  6. নিজস্ব পরিবহন — নিজস্ব পরিবহন ব্যবস্থা রয়েছে / Own Transportation
  7. হাদিস মুখস্থ — ৯ম শ্রেণির মধ্যে ৩০০+ হাদিস মুখস্থ করা
  8. কুরআন তর্জমা দক্ষতা — এসএসসি/দাখিল পর্যায়ে ৯০%+ কুরআন তর্জমা দক্ষতা অর্জন
  9. নৈতিকতা ও আদব — ইসলামী নৈতিকতা ও আদব শিক্ষায় সর্বোচ্চ গুরুত্ব / Ethics and Manners
  10. ইসলামী ইতিহাস — ইসলামী ইতিহাস ও সীরাত শিক্ষায় গুরুত্ব / Islamic History — Emphasis on Islamic history and Seerah
  11. বিনোদনের সুযোগ — ছেলেদের ক্যাম্পাস সংলগ্ন মাঠে এবং মেয়েদের ছাদ বাগানে খেলার সুযোগ / Recreational Facilities
  - Prospectus verbatim list (p3.png, verified — differs slightly from the task brief): ১ "আরবি ভাষা ও ইসলামিক শিক্ষার সাথে জেনারেল শিক্ষার আদর্শ সমন্বয়।" ২ "ইংরেজি ও আরবি ভাষার ক্ষেত্রে ভাষার চারটি মৌলিক দক্ষতা অর্জন (শোনা, বলা, পড়া ও লেখা)" ৩ "৬ষ্ঠ শ্রেণি থেকে ইসলাম শিক্ষা আরবি ভাষায় পাঠদান।" ৪ "৮ম শ্রেণির পর এস.এস.সি/দাখিল/মাদ্রাসা শিক্ষার সুযোগ।" ৫ "ডে-কেয়ার হিফজের ব্যবস্থা।" ৬ "নিজস্ব যাতায়াত ব্যবস্থা।" ৭ "নবম শ্রেণির মধ্যে ৩০০+ হাদিস মুখস্থ করা।" ৮ "এস.এস.সি/দাখিল লেভেলে কুরআনের ৯০%+ অনুবাদে সক্ষমতা অর্জন।" ৯ "ইসলামিক নৈতিকতা ও শিষ্টাচার শিক্ষায় সর্বোচ্চ গুরুত্ব প্রদান।" ১০ "ইসলামের ইতিহাস ও সীরাহ শিক্ষার উপর জোরদান।" ১১ "ছেলেদের ক্যাম্পাস সংলগ্ন মাঠে খেলার সুযোগ এবং মেয়েদের ছাদবাগানে খেলার সুযোগ।"
  - Note: prospectus target-ability wording for ফিকহ is "বেসিক মাসায়িল, আদাব-তারবিয়া ও মাসনুন দোয়া" and for ইতিহাস "নবীদের ইতিহাস, কুরআনের বিভিন্ন ইতিহাস, খলিফাদের ইতিহাস ও পরবর্তী ইতিহাস" (live site matches the image; the task brief's "ঘটনা / খিলাফতের" paraphrase is not the printed text).
- **H2 দশ বছরের পাঠ পরিকল্পনা (পূর্ণ হিফজ সহ) / 10-Year Study Plan (With Complete Hifz)** — table: বয়স · ক্লাস · ইসলামিক স্টাডিজ · সাধারণ বিষয় · পিরিয়ড ১–৮ (USE — unique, concrete)

  | বয়স | ক্লাস | Islamic periods | General periods |
  |---|---|---|---|
  | ৫+ | নার্সারি | কায়দা · আরবি-N · ইসলাম-N | ইংরেজি · গণিত |
  | ৬+ | কেজি | আম্মাপারা · আরবি-KG · ইসলাম-KG | ইংরেজি · গণিত |
  | ৭+ | ১ম | নাজেরা · আরবি-১ · ইসলাম-১ | ইংরেজি · গণিত |
  | ৮+ | ২য় | হিফজ-১ · আরবি-২ · ইসলাম-২ | ইংরেজি · গণিত |
  | ৯+ | ৩য় | হিফজ-২ · আরবি-৩ · ইসলাম-৩ | ইংরেজি · গণিত |
  | ১০+ | ৪র্থ | হিফজ-৩ · ইসলাম-৪ · আরবি-৪ | ইংরেজি · গণিত |
  | ১১+ | ৫ম | শুনানি · আরবি-৫ · ইসলাম-৫ | ইংরেজি · গণিত · বিজ্ঞান · বিজিএস |
  | ১২+–১৪+ | ৬ষ্ঠ–৮ম | আরবি-৬..৮ · ইসলাম-৬..৮ | ইংরেজি · গণিত · বিজ্ঞান · বিজিএস |
  | ১৫+–১৬+ | ৯ম–১০ম | এসএসসি/দাখিল প্রস্তুতি | |

  Empty cells render "কোনো বিষয় নির্ধারিত নেই". Note: Bangla is not listed as a period (site gap). Prospectus stage names (Pre-Hifz/Hifz Day-care/After-Hifz/Dakhil/Mutawassita) and hours are NOT on the live site.
- **H2 দশ বছরে ইসলাম শিক্ষায় উদ্দিষ্ট যোগ্যতা / Targeted qualifications in Islamic education in ten years** — same 6 abilities as home.
- **H3 স্কুল পরবর্তী উচ্চ শিক্ষা / Higher Education After School** — "আলিম হওয়ার লক্ষ্যে ৮ম শ্রেণির পর শিক্ষার্থীদের তালিম বোর্ডের জন্য প্রস্তুত করা হবে এবং দাখিল/এসএসসি পরীক্ষা দিতে হবে। কলেজ শিক্ষার জন্য শিক্ষার্থীরা সাধারণ শিক্ষায় মনোনিবেশ করবে এবং এসএসসি পরীক্ষা দেবে।" / "Students aiming to become Alim after Class Eight will be prepared for the Ta'lim Board and will take Dakhil/SSC exams. Students who wish to pursue college education will focus on general education and take SSC exams." — partly STALE: prospectus adds Mutawassita (Class 11 in-house) / Kafiya at Qawmi madrasa route.
- **H2 স্কুলের ফি** — "প্রি-হিফজ ও হিফজের প্রতিটি ফি এবং প্রদানের সময়কাল নিচে দেওয়া হলো।" — **STALE amounts:**

  | Fee | Pre-Hifz (site) | Hifz (site) | Prospectus |
  |---|---|---|---|
  | বেতন মাসিক | ৬,০০০৳ | ১০,০০০৳ | same |
  | খাবার মাসিক | প্রযোজ্য নয় | **৪,০০০৳** | Hifz meals **৪,৫০০** |
  | ভর্তি এককালীন | ২০,০০০৳ | **২৩,০০০৳** | Hifz **২৫,০০০** |
  | সেশন বাৎসরিক | ১৫,০০০৳ | **১৫,০০০৳** | Hifz **২০,০০০** |

  "সকল পরিমাণ বাংলাদেশি টাকায়"
- **H2 পরিবহন / Transport** — "ঐচ্ছিক · মাসিক" — "ঐচ্ছিক মাসিক পরিবহন সুবিধা রয়েছে। যানবাহনের ভাড়া ও প্রাপ্যতা জানতে অফিসে যোগাযোগ করুন।" Vehicles: মাইক্রো, অটো — "অফিসে যোগাযোগ করুন". (Prospectus adds Uttara & Mirpur routes, "অভিজ্ঞ চালক ও দায়িত্বশীল সহকারী", transport phone 01733-202368 — not on site.)
- **H2 ছাড় / H3 ভাইবোন ছাড়** — "একাধিক সন্তান ভর্তি থাকলে ভাইবোন ছাড়ের সুবিধা রয়েছে। বিস্তারিত জানতে অফিসে যোগাযোগ করুন।" "দ্বিতীয় সন্তান থেকে প্রযোজ্য।" "প্রযোজ্য ফি: বেতন" (consistent with prospectus "একাধিক সন্তানের জন্য বিশেষ ছাড় থাকবে, ইনশা আল্লাহ")
- **H2 পেমেন্ট সম্পর্কিত তথ্য** — "আপনার সন্তান নির্বাচিত হলে ক্যাম্পাসে পেমেন্ট সম্পন্ন করে ভর্তি নিশ্চিত করুন।" — LI "ভর্তির সময় ভর্তি ফি প্রদান করতে হবে।" · "মাসিক বেতন প্রতি মাসের ১০ তারিখের মধ্যে প্রদান করতে হবে।" · "রিফান্ড স্কুল কর্তৃপক্ষের সিদ্ধান্তের উপর নির্ভরশীল।" (USE)
- **H2 আমরা সাহায্য করতে প্রস্তুত / Talk to Admissions** — "ভর্তির সময়সূচি, ফি বা আপনার সন্তানের বিষয়ে জানতে অফিসে যোগাযোগ করুন।" CTAs: ভর্তি অফিসে কল করুন · হোয়াটসঅ্যাপ · যোগাযোগের বিস্তারিত · প্রসপেক্টাস ডাউনলোড করুন. "অফিসের সময়: শনি - বৃহস্পতি: সকাল ৮টা - বিকাল ৫টা"

## Admissions `/bengali/admissions`

- H1 "ভর্তি তথ্য" — "আপনার সন্তানের পরবর্তী পদক্ষেপ সম্পর্কে জানুন" / "Admissions — Plan your child's next step at Madrasatul Quran"
- Tabs: ভর্তির ধাপ · ফি · পরিবহন · ছাড় · পেমেন্ট · সাধারণ প্রশ্ন · যোগাযোগ
- **H2 ভর্তির ধাপ / How to apply** (USE):
  - ০১ "আপনার সন্তানের আবেদন নিয়ে ভর্তি অফিসে যোগাযোগ করুন।" / "Contact the admissions office to discuss your child's application."
  - ০২ "পরবর্তী ধাপ সম্পর্কে স্কুলের নির্দেশনার জন্য অপেক্ষা করুন।" / "Await guidance from the school about the next steps."
  - ০৩ "নির্বাচিত হলে ক্যাম্পাসে পেমেন্ট সম্পন্ন করে ভর্তি নিশ্চিত করুন।" / "After selection, confirm admission and complete payment at the campus."
- Fees / Transport / Discount / Payment — identical blocks to curriculum page (fees STALE as above)
- **H2 প্রায়শই জিজ্ঞাসিত প্রশ্ন / FAQ**:
  - ন্যূনতম বয়স? — "প্রথম শ্রেণীতে ভর্তির জন্য শিক্ষার্থীর বয়স কমপক্ষে ৫ বছর হতে হবে..." — **STALE** (study plan: Nursery ৫+, Class 1 ৭+)
  - প্রবেশিকা পরীক্ষা? — "হ্যাঁ, সকল শিক্ষার্থীকে ... প্রবেশিকা পরীক্ষা দিতে হবে।" — unverified, not in prospectus
  - কাগজপত্র? — "পূরণকৃত আবেদনপত্র, জন্ম সনদ, একাডেমিক ট্রান্সক্রিপ্ট, স্থানান্তর সনদ, চিকিৎসা সনদ, এবং সাম্প্রতিক ছবি..." — **STALE** (prospectus: 3 documents — ভর্তি ফর্ম; শিক্ষার্থীর ২ কপি ছবি ও জন্ম নিবন্ধন সনদ; অভিভাবকের ১ কপি ছবি ও জাতীয় পরিচয়পত্র)
  - ছাড়? — "বর্তমান ছাড়ের তথ্য দেখুন এবং যোগ্যতা ও শর্তাবলী নিশ্চিত করতে অফিসে যোগাযোগ করুন।"
  - ক্যাম্পাস দেখতে পারি? — "অবশ্যই! আমরা সম্ভাব্য পরিবারগুলোকে আমাদের ক্যাম্পাস দেখতে উৎসাহিত করি। গাইডেড ট্যুরের জন্য আমাদের ভর্তি অফিসে যোগাযোগ করুন। শনিবার থেকে বৃহস্পতিবার সকাল ৯:০০ থেকে বিকাল ৪:০০ পর্যন্ত ক্যাম্পাস ভিজিট করা যায়।" — USE with care (visit hours 9–4 vs office 8–5)
  - শিক্ষার মাধ্যম? — "আমাদের প্রধান শিক্ষার মাধ্যম বাংলা, এনসিটিবি পাঠ্যক্রম অনুসরণ করে। ইংরেজি একটি বিষয় হিসেবে পড়ানো হয়, এবং ইসলামী শিক্ষা আরবিতে বাংলা ব্যাখ্যাসহ পরিচালিত হয়..." — partly STALE (prospectus: Islamic studies in Arabic from Class 6, not throughout)

## Programs `/bengali/programs` — PLACEHOLDER

- H1 "একাডেমিক প্রোগ্রাম" — "ইসলামী শিক্ষা ও আধুনিক পাঠ্যক্রমের সমন্বয়ে সামগ্রিক শিক্ষা"; tabs ইসলামী শিক্ষা · এনসিটিবি পাঠ্যক্রম · সহ-পাঠক্রমিক
- H2 "ইসলামী শিক্ষা পাঠ্যক্রম" — "কুরআন, হাদিস, ফিকহ ও আরবি ভাষায় গভীর জ্ঞান অর্জনের মাধ্যমে ইসলামী চরিত্র গঠন"
- H3 প্রাথমিক স্তর (প্রথম-পঞ্চম শ্রেণী) "5-10 years" / H3 মাধ্যমিক স্তর (ষষ্ঠ-দশম শ্রেণী) "11-16 years" — generic paragraphs; mentions "বিজ্ঞান, মানবিক ও ব্যবসায় শিক্ষা বিভাগ" — **STALE** (prospectus stages are Pre-Hifz / Hifz Day-care / After-Hifz / Dakhil / Mutawassita)
- H2 "এনসিটিবি পাঠ্যক্রম" — "জাতীয় শিক্ষাক্রম ও পাঠ্যপুস্তক বোর্ডের অনুমোদিত পাঠ্যক্রম অনুসরণে আধুনিক শিক্ষা"
- H2 "সহ-পাঠক্রমিক কার্যক্রম" — "শিক্ষার্থীদের সামগ্রিক বিকাশের জন্য বিভিন্ন প্রতিযোগিতা, সাংস্কৃতিক অনুষ্ঠান ও সমাজসেবামূলক কার্যক্রম"; categories with emoji: ইসলামী প্রতিযোগিতা (কুরআন প্রতিযোগিতা), সাংস্কৃতিক অনুষ্ঠান, খেলাধুলা, একাডেমিক প্রতিযোগিতা, সমাজসেবা

## Campus `/bengali/campus` — PLACEHOLDER (do not reuse)

- H1 "ভার্চুয়াল ক্যাম্পাস ট্যুর" — "আমাদের সুন্দর ক্যাম্পাস এবং বিশ্বমানের সুবিধাসমূহ দেখুন"
- Facilities (all with `/images/campus/default-facility.jpg`): প্রধান মসজিদ (৫০০ মুসল্লি), কম্পিউটার ল্যাব (৪০ কম্পিউটার), বিজ্ঞান গবেষণাগার, লাইব্রেরি (১০,০০০+ বই), খেলার মাঠ (ফুটবল, ক্রিকেট, ভলিবল) — **fabricated template numbers**; contradicts the real campus (an Uttara apartment-style building; boys' field adjacent, girls' rooftop garden)
- H2 "নিরাপত্তা ও সুরক্ষা" — long English-only lists (24/7 CCTV, school nurse, etc.) and stats "24/7 · 100% Staff Background Checked · 15min · 5+ Years Zero Incidents" — **fabricated** (school opened 2026)
- Emergency phones +880 1712-345678 / 1812-345678 / 1912-345678 / 1612-345678 — **fake**
- Only defensible ideas: "Supervised entry and exit", "Safe Transportation", "Parent Communication System" — rewrite from prospectus service facts instead.

## News `/bengali/news` — seed data, detail pages 500

Client-rendered list (HTML shows "সংবাদ ও ইভেন্ট লোড হচ্ছে..."). Sanity `newsEvent` docs (6, with duplicates, no images, created 2025-08-20 — look like seed data):

| Title (BN / EN) | Date | Category | One-line |
|---|---|---|---|
| ২০২৫-২৬ শিক্ষাবর্ষে ভর্তি চলছে / Admission Open for Academic Year 2025-26 | 2025-08-17 | announcement | "নতুন শিক্ষাবর্ষের জন্য ভর্তির আবেদন চলছে। সীমিত আসন।" — STALE |
| নতুন বিজ্ঞান গবেষণাগার উদ্বোধন / New Science Laboratory Inauguration | 2025-08-18 | news | "আধুনিক যন্ত্রপাতি সহ নতুন বিজ্ঞান গবেষণাগার উদ্বোধন করা হয়েছে।" — likely PLACEHOLDER |
| জাতীয় কুরআন প্রতিযোগিতায় প্রথম স্থান / First Place in National Quran Competition (x2) | 2025-08-19 | achievement | "আমাদের শিক্ষার্থী মোহাম্মদ আব্দুল্লাহ ... প্রথম স্থান অধিকার করেছে।" — likely PLACEHOLDER (school opened 2026) |
| বার্ষিক ক্রীড়া প্রতিযোগিতা ২০২৫ / Annual Sports Competition 2025 (x2) | event 2025-02-15 | event | "আমাদের বার্ষিক ক্রীড়া প্রতিযোগিতা অনুষ্ঠিত হবে ১৫ ফেব্রুয়ারি ২০২৫ তারিখে।" — PLACEHOLDER |

Detail pages `/bengali/news/{admission-open-2025-26,quran-competition-first-place,annual-sports-2025}` → HTTP 500. No real news on the site. Real events evidenced only by photos (teachers' meeting, event stage — see photos.md).

## Directors `/bengali/directors` (USE)

H1 "আমাদের পরিচালকবৃন্দ" — "ইসলামী ও আধুনিক শিক্ষায় উৎকর্ষের লক্ষ্যে আমাদের নেতৃত্ব।" / "Our Directors — The leadership steering our mission of excellence in Islamic and modern education."

| Name (BN / EN) | Role | Credential (site) | Photo |
|---|---|---|---|
| এস এম নাহিদ হাসান / S M Nahid Hasan | সভাপতি / Chairman (also listed as staff "অধ্যক্ষ / Principal") | "সিভিল ইঞ্জিনিয়ার, বুয়েট। আরবী ভাষা প্রশিক্ষক ও চেয়ারম্যান: আল কুরআনের ভাষা ইনস্টিটিউট" | https://cdn.sanity.io/images/ohoxdsld/development/b31c7f3bd22c694e7a190e401d5187048ea40c45-1278x1230.png → assets/portrait-dir-nahid-hasan.jpg |
| মোঃ মুঈনুল ইসলাম / Md. Muinul Islam | সহ-সভাপতি / Vice Chairman | "সহকারী সংকলক ও কোষাধ্যক্ষ: আল কুরআনের ভাষা ইনস্টিটিউট" | …/6ae3d54a755365d66b7ac31548570c057f913b00-1013x1013.jpg → portrait-dir-muinul-islam.jpg |
| মুহাম্মাদ আশরাফউদ্দৌলা / Muhammad Ashrafuddowla | ব্যবস্থাপনা পরিচালক / Managing Director | "সিভিল ইঞ্জিনিয়ার, বুয়েট। চেয়ারম্যান: IIRK" | …/6cb7c8eba99fc3a94e053a3b37378ff846ba4fd3-4500x4500.jpg → portrait-dir-ashrafuddowla.jpg |
| শাফায়েত আহম্মেদ / Shafayet Ahmmed | নির্বাহী পরিচালক / Executive Director | "সফটওয়্যার ইঞ্জিনিয়ার। শিক্ষক: আল কুরআনের ভাষা ইনস্টিটিউট" | …/507e1dbf1f10c361e3a24acd0b368f02933a2e8f-540x660.jpg → portrait-dir-shafayet-ahmmed.jpg |
| মোঃ সাজেদুর রহমান / Md. Sajedur Rahman | পরিচালক / Director | — | none |
| এন. মুহাম্মদ ফয়সাল / N. Muhammad Faisal | পরিচালক | — | none |
| মোঃ সামিউল হুদা সুমেল / Md. Samiul Huda Sumel | পরিচালক | — | none |
| শায়লা রহমান / Shayla Rahman | পরিচালক | — | none |
| আবিদা সুলতানা / Abida Sultana | পরিচালক ও উপাধ্যক্ষ (মহিলা বিভাগ) / Director & Vice Principal (Female Section) | — | none |

(Prospectus names only the first four as founding directors; the five others are site-only — not STALE, just extra.)

**Profile: S M Nahid Hasan** (`/bengali/directors/s-m-nahid-hasan`) — richest people content:
- H2 বাণী (message, USE as founder's message): "আসসালামু আলাইকুম ওয়া রহমাতুল্লাহ। জ্ঞান অর্জন করা কোন ঐচ্ছিক বিষয় নয়। দুনিয়া ও আখিরাত এই দুই জগতের সফলতার জন্য আমাদের যেমন কুরআন হাদিস তথা ইসলামি শরীয়াত শিখতে হয় তেমনি অধুনা সভ্যতার জ্ঞানও শিখতে হয়। আমাদের এই শিক্ষা প্রতিষ্ঠানের মূল লক্ষ্য হলো শিক্ষার্থীদের কুরআন ও সুন্নাহর সঠিক জ্ঞান প্রদানের পাশাপাশি আধুনিক শিক্ষা প্রদান করা। যাতে আমাদের বাচ্চারা একেকজন আদর্শ মানুষ হিসেবে গড়ে ওঠে। আমাদের এই পথচলায় আপনাদের আন্তরিক সহযোগিতা ও দোয়া আমাদের পাথেয়। আল্লাহ আমাদের এই প্রচেষ্টাকে কবুল করুন। আমীন।"
- H2 জীবনী: "দায়ী ইলা-আল্লাহ, শিক্ষাবিদ, লেখক ও প্রকৌশলী · প্রতিষ্ঠাতা ও চেয়ারম্যান — মাদরাসাতুল কুরআন ঢাকা এবং আল কুরআনের ভাষা ইনস্টিটিউট"; born 1984 Barishal, raised Patuakhali; SSC 2001, Notre Dame College, BUET 2003; teaching Arabic since 2014.
- Key facts: author of "বিদায়াতুল আরাবিয়া" series (৬ খন্ড) — "২০০ টিরও বেশি শিক্ষা প্রতিষ্ঠানের পাঠ্যসূচিতে (সিলেবাস) অন্তর্ভুক্ত"; books: আল-কুরআনের ভাষা, কুরআনীয় আরবি শিক্ষা, রাওদ্বাতুল আত্বফাল (২ খন্ড), ইসলাম শিক্ষা (৫ খন্ড), ইসলামের ইতিহাস, হজের পথের নিদর্শন.
- Institutions: আল কুরআনের ভাষা ইনস্টিটিউট (chairman, lead Arabic trainer); মাদরাসাতুল কুরআন বরিশাল ("২০২৪ সালে বরিশালে তিনি এই আধুনিক হিফজখানাটি প্রতিষ্ঠা করেন"); মাদরাসাতুল কুরআন ঢাকা ("সময়ের চাহিদা ও বহু অভিভাবকের আকুল আবেদনের প্রেক্ষিতে ২০২৬ সালে তিনি এই আধুনিক ইসলামিক স্কুলটি প্রতিষ্ঠা করেন। বর্তমানে তিনি এই প্রতিষ্ঠানের প্রতিষ্ঠাতা, চেয়ারম্যান ও প্রিন্সিপাল ...").
- লক্ষ্য ও দর্শন: "দ্বীনি শিক্ষা প্রসার, আরবি ভাষা সহজীকরণ এবং কুরআনের ভাষা সাধারণ মানুষের কাছে পৌঁছে দেওয়াই তাঁর শিক্ষা কার্যক্রমের মূল লক্ষ্য।"
- যোগ্যতা: সিভিল ইঞ্জিনিয়ার · "বিদায়াতুল আরাবিয়া" সিরিজের লেখক · আরবি ভাষা প্রশিক্ষক · কারিকুলাম ও সিলেবাস প্রণেতা · হজ ও উমরাহ ট্রেইনার. শিক্ষা: বি.এস.সি. ইন সিভিল ইঞ্জিনিয়ারিং, বুয়েট (2003).
- AQVI contact: WhatsApp 01304-223350, 01324-339966 (note 01304-223350 is also a prospectus school number).

**Profile: Muhammad Ashrafuddowla** — বাণী: "আসসালামু আলাইকুম ওয়া রহমাতুল্লাহ। সকল প্রশংসা আল্লাহর ... আধুনিক প্রযুক্তির উৎকর্ষতা এবং ইসলামের শাশ্বত জ্ঞানের সঠিক সমন্বয়ই হলো একটি সমৃদ্ধ ও আদর্শ জাতি গঠনের মূল ভিত্তি। শিক্ষা কেবল বই পড়ার বিষয় নয়, এটি হৃদয় গড়ার মিশন। আমাদের লক্ষ্য আধুনিক জ্ঞান ও সুন্নাহর আলোয় এমন এক প্রজন্ম গড়ে তোলা, যারা হবে আগামী দিনের নৈতিক আলোকবর্তিকা।" Bio: ICC (USA) certified structural engineer; BUET civil (2004); MSc Actuarial Science, East West University (2016); Chairman IIRK Bogura; co-founder GoZiyarah; founder/CEO Torque Consulting Engineers; MD Torque Engineering Ltd. Mentions "ভারসাম্য (৫০/৫০ মডেল)". Quotes a hadith on sadaqah jariyah / beneficial knowledge / righteous child.
**Profile: Md. Muinul Islam** — role only. **Profile: Shafayet Ahmmed** — "যোগ্যতা: সফটওয়্যার ইঞ্জিনিয়ার" only.

## Advisors `/bengali/advisors` (USE — matches prospectus)

H1 "আমাদের উপদেষ্টাবৃন্দ" — "প্রজ্ঞা ও পরামর্শ দিয়ে আমাদের লক্ষ্যকে এগিয়ে নেওয়া অভিজ্ঞ দিকনির্দেশকগণ।" / "Our Advisors — Experienced guides supporting our mission with wisdom and counsel."

| Name (BN / EN) | Role | Photo |
|---|---|---|
| প্রফেসর মোখতার আহমাদ / Professor Mokhter Ahmad | চেয়ারম্যান, তারবিয়াহ ফাউন্ডেশন / Chairman, Tarbiyah Foundation | …/04a7387ccffb82d96998b9fe828f913df3f42989-1024x1024.jpg → portrait-adv-mokhter-ahmad.jpg |
| শাইখ আব্দুন নূর মাদানী / Sheikh Abdun Noor Madani | প্রিন্সিপাল, দারুস সুন্নাহ মিরপুর-১২ | …/f420a8cd9ed10b3c63de3e03455500a923ed5594-1044x1024.jpg → portrait-adv-abdun-noor-madani.jpg |
| শাইখ সাঈদ আহমাদ / Sheikh Saeed Ahmad | উস্তায, জামিয়া রাহমানিয়া আজিজিয়া, মোহাম্মাদপুর ঢাকা | …/0982b46440c3629f4f4836b2f6dd083768549cb3-1024x1024.jpg → portrait-adv-saeed-ahmad.jpg |
| ব্রি. জে. (অবঃ) শাহ আলম চৌধুরী / Brig. Gen. (Retd) Shah Alam Chowdhury | আরবী ভাষা প্রশিক্ষক, অবসরপ্রাপ্ত সেনা কর্মকর্তা | …/0067c2ec50bcc00fa1308d32a5aa7dae99f28bf2-1008x1047.jpg → portrait-adv-shah-alam-chowdhury.jpg |

## Teachers — `/teachers` 404. Sanity has one `teacher` doc: "রাকিবুল ইসলাম নূর / Rakibul Islam Nur" (no position).

## Contact `/bengali/contact` (USE, update phones/email)

- H1 "যোগাযোগ করুন" — "আমরা সাহায্য করতে এবং আপনার যেকোনো প্রশ্নের উত্তর দিতে প্রস্তুত আছি"
- H2 যোগাযোগের তথ্য — "প্রধান কার্যালয়": +880 1302-332244 · info@madrasatulquranbd.com · "শনি - বৃহস্পতি: সকাল ৮টা - বিকাল ৫টা" · address (as footer) — phones/email **STALE** vs prospectus
- H2 আমাদের অবস্থান — "ঢাকার হৃদয়ে আমাদের ক্যাম্পাসে আমাদের দেখতে আসুন"; ইন্টারেকটিভ ম্যাপ · দিক নির্দেশনা · গুগল ম্যাপে দেখুন
- H3 নিকটবর্তী ল্যান্ডমার্ক: উত্তরা সেন্টার মেট্রোরেল স্টেশন **600m** · উত্তরা দক্ষিণ মেট্রোরেল স্টেশন **3 km** (prospectus adds "2.5 km from Mirpur DOHS")
- Form (H2 "Get in Touch" in English on BN page): tabs সাধারণ অনুসন্ধান ফর্ম · ভর্তি অনুসন্ধান · মতামত ফর্ম; fields পূর্ণ নাম, ইমেইল, ফোন, বিভাগ (সাধারণ তথ্য / ভর্তি প্রক্রিয়া / একাডেমিক প্রোগ্রাম / ক্যাম্পাস সুবিধা / ফি কাঠামো / ইভেন্ট ও কার্যক্রম / অন্যান্য), বিষয়, বার্তা → "বার্তা পাঠান"

## Downloads / Pre-admission / About

- `/downloads`: H1 "লিংকটি অবৈধ অথবা মেয়াদ শেষ" — "এই ডাউনলোড সংগ্রহটি দেখতে একটি সক্রিয় শেয়ার করা লিংক প্রয়োজন..." (share-token only)
- `/pre-admission`: H1 "ফর্ম পাওয়া যায়নি" — "প্রি-অ্যাডমিশন বর্তমানে গ্রহণ করা হচ্ছে না। অনুগ্রহ করে পরে আবার চেষ্টা করুন।" → "ভর্তি পেজে ফিরুন"
- `/about`: "আমাদের সম্পর্কে — শীঘ্রই আসছে — আমরা কাজ করছি"

## Testimonials — none (no testimonial type in Sanity, none on pages).

## Stats/numbers found (live)
৫০-৫০ · ৩০০+ হাদিস by Class 9 · ৯০%+ Quran translation at SSC/Dakhil · ৬ষ্ঠ শ্রেণি থেকে আরবি মিডিয়াম · ১০ বছরের পাঠ পরিকল্পনা · 8 periods/day · ages ৫+ to ১৬+ · Uttara Center metro 600 m · Uttara South metro 3 km · office Sat–Thu 8–5 · tuition due by 10th · বিদায়াতুল আরাবিয়া in 200+ institutions · founded 2026 (Dhaka), Barishal hifzkhana 2024 · fees (STALE, see table). Campus-page numbers (500, 40, 10,000+, 15min, 5+ years) are fabricated.

## STALE / conflict summary (prospectus wins)
1. Hifz fees: admission 23,000→**25,000**, session 15,000→**20,000**, meals 4,000→**4,500**.
2. Contact: email info@madrasatulquranbd.com → **office.mqd@gmail.com**; phones 01302-332244 not in prospectus; add 01304-223350, 01711-083463; transport 01733-202368.
3. "ভর্তি 2026–2027 — আজই আবেদন করুন / ভর্তি আবেদন করুন" CTA and news "ভর্তি চলছে" → form is closed; use visit/call/prospectus/waitlist.
4. Admission documents (6 items) → prospectus **3 items**.
5. Programs page levels (primary/secondary, science/humanities/business) → prospectus 5 stages (Pre-Hifz … Mutawassita) with hours and splits.
6. FAQ "Class 1 at age 5" → study plan says Nursery 5+, Class 1 7+.
7. Higher-ed text lacks Mutawassita / Kafiya / SSC→college framing.
8. Campus and safety page: fabricated facilities, stats, fake phone numbers.
9. News: seed items dated 2025 (before the 2026 founding), detail pages 500.
10. Decorative ﷽ in hero and footer — owner rule: no decorative Arabic.
