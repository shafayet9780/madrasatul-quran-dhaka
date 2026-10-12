// The pre-admission 2027 updates agreed on 2026-10-11 (docs/pre-admission-2027-updates.md), as
// changes to the Sanity documents. Used by scripts/setup-admissions-updates.ts (Studio drafts) and
// by the local preview's built-in form, so both get the same form. Pure and re-runnable: a step
// that is already done is skipped, and text is replaced only while it still has the old wording,
// so edits made in the Studio are kept.

type Bi = { bengali: string; english: string };
type Doc = Record<string, any>;

const bi = (bengali: string, english: string): Bi => ({ bengali, english });
const field = (f: Doc) => ({ _key: f.key, _type: 'admissionField', ...f });

const STUDIED_YES = { field: 'studied_before', values: ['yes'] };

export const STUDENT_PREVIOUS_FIELDS = {
  studied_before: field({
    key: 'studied_before',
    label: bi('শিক্ষার্থী কি আগে কোনো শিক্ষা প্রতিষ্ঠানে পড়েছে?', 'Has the child studied at a school or madrasa before?'),
    type: 'yesno',
    required: true,
    group: 'previous',
  }),
  previous_result_card: field({
    key: 'previous_result_card',
    label: bi('সর্বশেষ ফলাফল কার্ড', 'Latest result card'),
    help: bi('সর্বশেষ পরীক্ষার ফলাফল কার্ড বা রিপোর্ট কার্ডের ছবি বা PDF।', 'A photo or PDF of the latest exam result card or report card.'),
    type: 'file',
    fileKind: 'document',
    required: true,
    group: 'previous',
    showWhen: STUDIED_YES,
    allowMissing: true,
    missingLabel: bi('এখন নেই, অ্যাসেসমেন্টের দিন মূল কপি সঙ্গে আনব', "I don't have it now, I'll bring the original on assessment day"),
    missingNote: bi(
      'ঠিক আছে। অ্যাসেসমেন্টের দিন ফলাফল কার্ডের মূল কপি সঙ্গে আনবেন। পরে পেলে এখানে যুক্ত করতে পারবেন।',
      'All right. Bring the original result card on assessment day. If you find it later, you can add it here.',
    ),
  }),
};

const BIRTH_CERTIFICATE_MISSING = {
  allowMissing: true,
  missingLabel: bi('এখন নেই, অ্যাসেসমেন্টের দিন ফটোকপি সঙ্গে আনব', "I don't have it now, I'll bring a photocopy on assessment day"),
  missingNote: bi('ঠিক আছে। অ্যাসেসমেন্টের দিন জন্ম নিবন্ধন সনদের ফটোকপি সঙ্গে আনবেন।', 'All right. Bring a photocopy of the birth certificate on assessment day.'),
};

export const TRANSPORT_GROUP = {
  _key: 'transport',
  _type: 'admissionGroup',
  key: 'transport',
  title: bi('পরিবহন সুবিধা', 'Transport'),
  description: bi(
    'মাদরাসার নিজস্ব মাইক্রো ও অটো নিচের রুটগুলোতে চলে। মাসিক ভাড়া প্রতিটি রুটের সাথে দেওয়া আছে।',
    "The madrasa's own micro and auto vans run on the routes below. The monthly charge is shown with each route.",
  ),
};

export const TRANSPORT_FIELDS = [
  field({
    key: 'transport_interest',
    label: bi('আপনি কি সন্তানের জন্য মাদরাসার পরিবহন সুবিধা নিতে আগ্রহী?', "Would you like to use the madrasa's transport for your child?"),
    type: 'yesno',
    required: true,
    group: 'transport',
  }),
  field({
    key: 'transport_stop',
    label: bi('আপনার বাসার সবচেয়ে কাছের স্টপ কোনটি?', 'Which stop is nearest to your home?'),
    help: bi('যে স্টপ থেকে সন্তান গাড়িতে উঠবে। উপরের রুটে সেটি চিহ্নিত হবে।', 'Where your child will get on. It is marked on the route above.'),
    type: 'transportStop',
    required: true,
    group: 'transport',
    showWhen: { field: 'transport_interest', values: ['yes'] },
  }),
  field({
    key: 'transport_area',
    label: bi('আপনার এলাকার নাম লিখুন', 'Write your area'),
    help: bi('কোন এলাকায় নতুন রুট দরকার, তা বুঝতে এটি কাজে লাগবে।', 'This helps us see where a new route is needed.'),
    type: 'text',
    required: true,
    group: 'transport',
    showWhen: { field: 'transport_stop', values: ['none'] },
  }),
];

const OLD_TRANSPORT_KEYS = ['transport_requirement', 'transport_location'];

/** With a transport group in the chapter, the questions around it get groups too (else they would join it). */
const AROUND_TRANSPORT = [
  { field: 'heard_from', group: { _key: 'heard', _type: 'admissionGroup', key: 'heard', title: bi('যেভাবে জেনেছেন', 'How you heard about us') }, before: true },
  { field: 'comments', group: { _key: 'comments', _type: 'admissionGroup', key: 'comments', title: bi('মন্তব্য ও পরামর্শ', 'Comments and suggestions') }, before: false },
];

export const DECLARATION = bi(
  'মাদরাসাতুল কুরআন একটি সম্পূর্ণ ইসলামিক শিক্ষা প্রতিষ্ঠান। আমি স্বীকৃতি প্রদান করছি যে, উপরে প্রদত্ত সকল তথ্য সঠিক ও সত্য। কোন তথ্য ভুল প্রমাণিত হলে কর্তৃপক্ষ ভর্তি বাতিল করতে পারবে।',
  'Madrasatul Quran is a fully Islamic educational institution. I confirm that all the information given above is correct and true. If any information is found to be false, the authority may cancel the admission.',
);
/** The old declaration still contained the code of conduct point (now on the pledge page). */
const OLD_DECLARATION_START = 'মাদরাসাতুল কুরআন একটি সম্পূর্ণ ইসলামিক শিক্ষা প্রতিষ্ঠান। আমি স্বীকৃতি প্রদান করছি যে,  \n\n১।';

const PDF_INSTRUCTIONS = bi(
  'এই আবেদনপত্রটি (৪ পৃষ্ঠা) প্রিন্ট করুন। শেষ পৃষ্ঠায় পিতা ও মাতা স্বাক্ষর করে অ্যাসেসমেন্টের দিন অবশ্যই সঙ্গে আনুন।',
  'Print this application (4 pages). The father and mother sign the last page; bring it on assessment day.',
);
const OLD_PDF_INSTRUCTIONS = 'এই আবেদনপত্রটি প্রিন্ট করে মূল্যায়নের দিন অবশ্যই সঙ্গে আনুন। সঙ্গে আনবেন শিক্ষার্থীর জন্ম নিবন্ধন সনদের মূল কপি এবং নগদ মূল্যায়ন ফি।';

const rule = (bengali: string, english: string, i: number) => ({ _key: `r${i}`, _type: 'conductRule', bengali, english });

export const CONDUCT = {
  conductIntro: bi(
    'মাদরাসা ও পরিবার একসাথে কাজ করলেই সন্তানের সঠিক গঠন সম্ভব। মনোযোগ দিয়ে পড়ুন, তারপর নিচের দুটি অঙ্গীকারে সম্মতি দিন।',
    'A child is shaped well only when the madrasa and the family work together. Read carefully, then agree to the two pledges below.',
  ),
  conductGroups: [
    {
      _key: 'madrasa',
      _type: 'conductGroup',
      title: bi('মাদরাসায়', 'At the madrasa'),
      rules: [
        rule('মাদ্রাসা প্রাঙ্গণে অবশ্যই শরীয়ত সম্মত পোশাক ও পর্দার বিধিমালা অনুসরণ করতে হবে।', 'Follow Shariah-compliant dress and the rules of purdah on the madrasa premises.', 1),
        rule(
          'মাদ্রাসার কোন স্টাফের সাথে রূঢ় আচরণ করা যাবে না। কোন অভিযোগ থাকলে যথাযথ কর্তৃপক্ষকে অবহিত করবেন।',
          'Do not be rude to any madrasa staff. If you have a complaint, tell the proper authority.',
          2,
        ),
        rule('নিয়মিত বেতনাদি ও অন্যান্য ফি পরিশোধ করতে হবে।', 'Pay the monthly and other fees on time.', 3),
      ],
    },
    {
      _key: 'home',
      _type: 'conductGroup',
      title: bi('বাড়িতে', 'At home'),
      rules: [
        rule(
          'বাড়ীর পরিবেশ ও প্রতিবেশ বিশুদ্ধ ও সুন্দর না হলে, তাদের চারিত্রিক গঠন নিয়ন্ত্রণ করা সম্ভব নয়। সুতরাং বাড়িতে দ্বীনি পরিবেশ নিশ্চিত করতে হবে।',
          "A child's character cannot be shaped if the home and its surroundings are not pure and wholesome, so keep a religious environment at home.",
          4,
        ),
        rule('আপনার ছেলেমেয়েদেরকে স্মার্টফোন, ইন্টারনেট, টেলিভিশন থেকে দূরে রাখুন।', 'Keep your children away from smartphones, the internet and television.', 5),
        rule(
          'সাধারণ ভাবে আপনার সকল সন্তানকেই রাতে তাড়াতাড়ি ঘুমাতে যাবার অভ্যাস গড়ে তুলতে তাগিদ দেবেন। সেই সাথে, সকালে তারা যেন নাস্তার অন্তত এক ঘন্টা আগে ঘুম থেকে ওঠে এবং বিছানা ছাড়ে সে দিকে খেয়াল করবেন ইনশা\'আল্লাহ! ক্লাসে অমনোযোগী হবার দু\'টো প্রধান কারণ হচ্ছে: রাতে দেরী করে ঘুমানো এবং সকালে "পরিপূর্ণ" নাস্তা না করে আসা।',
          'Help all your children build the habit of sleeping early, and see that they wake up and leave bed at least an hour before breakfast, in sha Allah. The two main reasons for inattention in class are sleeping late and coming without a full breakfast.',
          6,
        ),
      ],
    },
    {
      _key: 'child',
      _type: 'conductGroup',
      title: bi('সন্তানের সাথে', 'With your child'),
      rules: [
        rule(
          'বাচ্চাদের সামনে তাদের শিক্ষক-শিক্ষিকাদের গীবত, সমালোচনা অথবা তাদের নিয়ে কোন বিরূপ মন্তব্য করবেন না।',
          'Do not backbite, criticise or speak badly of their teachers in front of the children.',
          7,
        ),
        rule(
          'ছেলেমেয়েকে যত বেশী সম্ভব সময় দেবেন, তাদের বন্ধু হবার চেষ্টা করবেন। পৃথিবীর প্রতিকূল পরিবেশে কোন অসুন্দর বা অকল্যাণকর ইঙ্গিতের সম্মুখীন হলে, তারা যেন প্রাণ খুলে সবার আগে আপনাকেই সে কথা জানাতে পারে।',
          'Give your children as much time as you can and try to be their friend, so that if they meet anything unpleasant or harmful, you are the first person they openly tell.',
          8,
        ),
        rule(
          'অন্যদের সাথে যেকোন মূল্যে প্রতিযোগিতায় জিততেই হবে এমন ধারণা দিয়ে তাদেরকে, মুসলিম "ভাই-বন্ধুর" বিরুদ্ধে হিংসা-ঘৃণা-বিদ্বেষ পোষণ করে জীবনের সিঁড়ি বেয়ে ওপরে উঠতে প্ররোচিত করবেন না।',
          'Do not push them to get ahead in life by teaching them to win against others at any cost, holding envy, hatred or malice towards their Muslim brothers and friends.',
          9,
        ),
      ],
    },
  ],
  conductPledge: bi('আমি অভিভাবকদের আচরণবিধি পড়েছি এবং তা মেনে চলতে বাধ্য থাকব।', "I have read the Parents' Code of Conduct and will follow it."),
  familyDeclaration: bi(
    'আমি ঘোষণা করছি যে, শিক্ষার্থীর পিতা বা মাতা কেউই কোনো রাষ্ট্রবিরোধী বা সন্ত্রাসী কার্যক্রমের সাথে জড়িত নন। কখনো এমন সম্পৃক্ততা পাওয়া গেলে মাদরাসা কর্তৃপক্ষ শিক্ষার্থীর ভর্তি তাৎক্ষণিকভাবে বাতিল করবে।',
    "I declare that neither the student's father nor mother is involved in any anti-state or terrorist activity. If any such involvement is found, the madrasa authority will cancel the student's admission immediately.",
  ),
};

/** 2027: class 7 takes girls only, who know Arabic nahw and sarf (owner, 2026-10-11). */
const CLASS_7_REQUIRES = [
  { _key: 'girls', _type: 'classRequirement', field: 'student_gender', values: ['female'], message: bi('শুধু মেয়েদের জন্য', 'Girls only') },
  { _key: 'nahw_sarf', _type: 'classRequirement', field: 'arabic_level', values: ['knows_nahw_sarf'], message: bi('আরবি ভাষায় নাহু-সরফ জানা আবশ্যক', 'Must know Arabic nahw and sarf') },
];

const item = (key: string, text: Bi, extra: Doc = {}) => ({ _key: key, _type: 'bringItem', text, ...extra });

export const BRING_LIST = [
  item('application', bi('এই আবেদনপত্রের প্রিন্ট (৪ পৃষ্ঠা), পিতা ও মাতার স্বাক্ষরসহ', 'This application, printed (4 pages) and signed by the father and mother')),
  item('birth_certificate', bi('জন্ম নিবন্ধন সনদের ফটোকপি', 'Photocopy of the birth certificate'), { document: 'student_birth_registration' }),
  item('result_card', bi('সর্বশেষ ফলাফল কার্ডের মূল কপি', 'The original latest result card'), { showWhen: STUDIED_YES, document: 'previous_result_card' }),
  item('photos', bi('পাসপোর্ট সাইজ ছবি: শিক্ষার্থীর ২ কপি, পিতার ১ কপি', 'Passport-size photos: 2 of the student, 1 of the father')),
  item('fee', bi('অ্যাসেসমেন্ট ফি ৳{fee} (ক্যাশ)', 'Assessment fee ৳{fee} in cash')),
];

/**
 * Applies the form updates to a `preAdmissionForm` document (published or draft). Returns the
 * changed parts and a line per change; `changed` is empty when everything is already done.
 */
export function applyFormUpdates(doc: Doc): { sections: Doc[]; cycle: Doc; declarationText: Doc; changed: string[] } {
  const changed: string[] = [];
  const sections: Doc[] = structuredClone(doc.sections ?? []);
  const cycle: Doc = structuredClone(doc.cycle ?? {});
  let declarationText: Doc = structuredClone(doc.declarationText ?? {});
  const section = (key: string) => sections.find((s) => s.key === key);

  const student = section('student');
  if (student) {
    const fields: Doc[] = student.fields;
    const at = (key: string) => fields.findIndex((f) => f.key === key);
    const get = (key: string) => fields[at(key)];
    const move = (key: string, after: string) => {
      const [f] = fields.splice(at(key), 1);
      fields.splice(at(after) + 1, 0, f);
    };

    if (at('studied_before') < 0) {
      const first = at('last_class_attended');
      fields.splice(first < 0 ? fields.length : first, 0, structuredClone(STUDENT_PREVIOUS_FIELDS.studied_before));
      changed.push('Student: new question “studied before” (yes/no, required).');
    }
    for (const [key, label] of [
      ['last_class_attended', bi('সর্বশেষ যে শ্রেণীতে পড়েছে', 'Last class attended')],
      ['previous_school', bi('পূর্ববর্তী শিক্ষা প্রতিষ্ঠানের নাম', 'Name of the previous school or madrasa')],
    ] as const) {
      const f = get(key);
      if (f && !f.showWhen) {
        Object.assign(f, { required: true, showWhen: STUDIED_YES, group: 'previous' });
        if (/প্রযোজ্য/.test(f.label?.bengali ?? '')) f.label = label;
        changed.push(`Student: “${key}” now required, shown only if the child studied before.`);
      }
    }
    const general = get('general_subjects_level');
    if (general && general.showWhen?.field !== 'studied_before') {
      general.showWhen = STUDIED_YES;
      general.group = 'previous';
      general.options = (general.options ?? []).filter((o: Doc) => o.value !== 'did_not_attend_school');
      move('general_subjects_level', at('previous_school') >= 0 ? 'previous_school' : 'studied_before');
      changed.push('Student: “general_subjects_level” moved to previous schooling, shown only if the child studied before; option “did_not_attend_school” removed.');
    }
    if (at('previous_result_card') < 0) {
      const after = ['general_subjects_level', 'previous_school', 'studied_before'].find((k) => get(k)?.group === 'previous') ?? 'studied_before';
      fields.splice(at(after) + 1, 0, structuredClone(STUDENT_PREVIOUS_FIELDS.previous_result_card));
      changed.push('Student: new upload “latest result card” (required, with “don’t have it now”).');
    }
    const birth = fields.find((f) => f.role === 'birthCertificate');
    if (birth && !birth.allowMissing) {
      Object.assign(birth, { required: true, ...structuredClone(BIRTH_CERTIFICATE_MISSING) });
      changed.push(`Student: birth certificate (“${birth.key}”) now required, with “don’t have it now”.`);
    }

    const classField = fields.find((f) => f.role === 'classApplied');
    const class7 = classField?.options?.find((o: Doc) => o.value === 'class_7');
    if (class7) {
      // Class 7 came after the questions asked "for every class but play": ask them for class 7 too.
      for (const f of fields) {
        const values: string[] | undefined = f.showWhen?.field === classField!.key ? f.showWhen.values : undefined;
        if (values?.includes('class_6') && !values.includes('class_7')) {
          values.push('class_7');
          changed.push(`Student: “${f.key}” is now asked for class 7 too.`);
        }
      }
      const hasOption = (key: string, value: string) => get(key)?.options?.some((o: Doc) => o.value === value);
      if (!class7.requires?.length && hasOption('student_gender', 'female') && hasOption('arabic_level', 'knows_nahw_sarf')) {
        class7.requires = structuredClone(CLASS_7_REQUIRES);
        changed.push('Student: class 7 only for girls who know Arabic nahw and sarf.');
      }
    }
  }

  const clothing = section('father')?.fields.find((f: Doc) => f.key === 'father_islamic_clothing');
  const none = clothing?.options?.find((o: Doc) => o.value === 'none');
  if (none && !none.exclusive) {
    none.exclusive = true;
    changed.push('Father: “none of the above” in Islamic dress is now “only this choice”.');
  }

  const additional = section('additional');
  if (additional && !additional.fields.some((f: Doc) => f.key === 'transport_interest')) {
    const fields: Doc[] = additional.fields;
    const first = fields.findIndex((f) => OLD_TRANSPORT_KEYS.includes(f.key));
    const comments = fields.findIndex((f) => f.key === 'comments');
    const insertAt = first >= 0 ? first : comments >= 0 ? comments : fields.length;
    const kept = fields.filter((f, i) => i < insertAt && !OLD_TRANSPORT_KEYS.includes(f.key));
    const rest = fields.filter((f, i) => i >= insertAt && !OLD_TRANSPORT_KEYS.includes(f.key));
    additional.fields = [...kept, ...structuredClone(TRANSPORT_FIELDS), ...rest];
    additional.groups = [...(additional.groups ?? []).filter((g: Doc) => g.key !== 'transport'), structuredClone(TRANSPORT_GROUP)];
    changed.push('Additional: transport questions replaced by interest, nearest stop and area (group “পরিবহন সুবিধা”).');
  }
  if (additional?.groups?.some((g: Doc) => g.key === 'transport')) {
    for (const { field: key, group, before } of AROUND_TRANSPORT) {
      const f = additional.fields.find((x: Doc) => x.key === key);
      if (!f || f.group || additional.groups.some((g: Doc) => g.key === group.key)) continue;
      f.group = group.key;
      const at = additional.groups.findIndex((g: Doc) => g.key === 'transport');
      additional.groups.splice(before ? at : at + 1, 0, structuredClone(group));
      changed.push(`Additional: “${key}” gets its own heading (${group.title.bengali}), apart from transport.`);
    }
  }

  if (!declarationText.bengali || declarationText.bengali.startsWith(OLD_DECLARATION_START)) {
    declarationText = { ...DECLARATION };
    changed.push('Declaration: code of conduct point removed (it moves to the pledge page).');
  }
  if (!cycle.pdfInstructions?.bengali || cycle.pdfInstructions.bengali === OLD_PDF_INSTRUCTIONS) {
    cycle.pdfInstructions = { ...PDF_INSTRUCTIONS };
    changed.push('Cycle: PDF instructions (4 pages, signatures, assessment day).');
  }
  for (const [name, value] of Object.entries(CONDUCT)) {
    if (cycle[name] == null) {
      cycle[name] = structuredClone(value);
      changed.push(`Cycle: ${name}.`);
    }
  }
  if (cycle.bringList == null) {
    cycle.bringList = structuredClone(BRING_LIST);
    changed.push('Cycle: what to bring on assessment day (5 items).');
  }
  return { sections, cycle, declarationText, changed };
}

const line = (bengali: string, english: string) => ({ bengali, english });
const stops = (route: string, names: [string, string][]) => names.map(([b, e], i) => ({ _key: `${route}_${i + 1}`, _type: 'transportStop', name: line(b, e) }));
const route = (key: string, name: [string, string], area: [string, string], vehicle: string, list: [string, string][]) => ({
  _key: key,
  _type: 'transportRoute',
  visible: true,
  name: line(...name),
  area: line(...area),
  vehicle,
  stops: stops(key, list),
});
const MIRPUR: [string, string] = ['মিরপুর', 'Mirpur'];
const UTTARA: [string, string] = ['উত্তরা', 'Uttara'];

export const ROUTES = [
  route('mirpur_micro', ['মিরপুর মাইক্রো', 'Mirpur micro'], MIRPUR, 'micro', [
    ['মিরপুর ১০', 'Mirpur 10'],
    ['মিরপুর ১৩', 'Mirpur 13'],
    ['মিরপুর ১১', 'Mirpur 11'],
    ['কালশী', 'Kalshi'],
    ['শাগুফতা', 'Shagufta'],
    ['মিরপুর ডিওএইচএস', 'Mirpur DOHS'],
  ]),
  route('mirpur_auto', ['মিরপুর অটো', 'Mirpur auto'], MIRPUR, 'auto', [
    ['রূপনগর আবাসিক এলাকা', 'Rupnagar R/A'],
    ['পল্লবী', 'Pallabi'],
    ['মিরপুর সাড়ে ১১', 'Mirpur 11.5'],
    ['মিরপুর ১২ (বি/সি ব্লক)', 'Mirpur 12 (B/C block)'],
  ]),
  route('uttara_micro_1', ['উত্তরা মাইক্রো ১', 'Uttara micro 1'], UTTARA, 'micro', [
    ['হাউস বিল্ডিং', 'House Building'],
    ['সেক্টর ৭', 'Sector 7'],
    ['সেক্টর ১১', 'Sector 11'],
    ['সেক্টর ১৩', 'Sector 13'],
    ['খালপাড়', 'Khalpar'],
  ]),
  route('uttara_micro_2', ['উত্তরা মাইক্রো ২', 'Uttara micro 2'], UTTARA, 'micro', [
    ['জসীমউদ্দীন রোড', 'Jashim Uddin Road'],
    ['সেক্টর ১৪', 'Sector 14'],
    ['সেক্টর ১২', 'Sector 12'],
    ['সেক্টর ১৫', 'Sector 15'],
  ]),
  route('uttara_auto', ['উত্তরা অটো', 'Uttara auto'], UTTARA, 'auto', [['সেক্টর ১৮', 'Sector 18']]),
];

const VEHICLE_CHARGES: Record<string, number> = { micro: 5000, auto: 2500 };

// The seat note is shown under the route cards, so it is not repeated here.
const TRANSPORT_INTRODUCTION = { ...TRANSPORT_GROUP.description };
const OLD_TRANSPORT_INTRODUCTION = 'ঐচ্ছিক মাসিক পরিবহন সুবিধা রয়েছে। যানবাহনের ভাড়া ও প্রাপ্যতা জানতে অফিসে যোগাযোগ করুন।';

/** Applies the transport updates to the `feeSettings` document: charges, routes, introduction. */
export function applyFeeUpdates(doc: Doc): { transport: Doc[]; transportRoutes: Doc[]; transportIntroduction: Doc; changed: string[] } {
  const changed: string[] = [];
  const transport: Doc[] = structuredClone(doc.transport ?? []);
  for (const v of transport) {
    const amount = VEHICLE_CHARGES[v._key];
    if (amount != null && v.price?.status !== 'priced') {
      v.price = { status: 'priced', amount };
      changed.push(`Vehicle ${v.name?.bengali ?? v._key}: ৳${amount} a month.`);
    }
  }
  let transportRoutes: Doc[] = structuredClone(doc.transportRoutes ?? []);
  if (!transportRoutes.length) {
    const vehicles = new Set(transport.map((v) => v._key));
    transportRoutes = structuredClone(ROUTES.filter((r) => vehicles.has(r.vehicle)));
    changed.push(`Routes: ${transportRoutes.map((r) => r.name.bengali).join(', ')}.`);
  }
  let transportIntroduction: Doc = structuredClone(doc.transportIntroduction ?? {});
  if (!transportIntroduction.bengali || transportIntroduction.bengali === OLD_TRANSPORT_INTRODUCTION) {
    transportIntroduction = { ...TRANSPORT_INTRODUCTION };
    changed.push('Transport introduction: routes and charges are now shown.');
  }
  return { transport, transportRoutes, transportIntroduction, changed };
}
