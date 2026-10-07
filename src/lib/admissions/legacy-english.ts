// English text for the converted pre-admission form (the live form is Bengali only). Applied by
// convertLegacyForm / englishPatches only where the Studio has no English yet; editors can change
// any of it in Studio afterwards.

type FieldEnglish = { label: string; placeholder?: string; help?: string; options?: Record<string, string> };

const PRAYER_TIMES = { '5_times': 'All five prayers', '4_times': 'Four prayers', '3_times': 'Three prayers', '2_times': 'Two prayers', '1_time': 'One prayer' };
const QURAN = { daily: 'Every day', sometimes: 'Sometimes', never: 'I do not recite regularly' };
const SCREEN_TIME = { '1_hour': '1 hour', '2_hours': '2 hours', '3_hours': '3 hours', '4_hours': '4 hours', '5_plus_hours': '5+ hours' };
const OCCUPATION = { business: 'Business', service: 'Service (job)', teacher: 'Teacher', doctor: 'Doctor', engineer: 'Engineer', homemaker: 'Homemaker', other: 'Other' };
const FACEBOOK = { label: 'Your Facebook ID (write “None” if you do not have one)', placeholder: 'https://facebook.com/******' };

export const FIELD_ENGLISH: Record<string, FieldEnglish> = {
  heard_from: {
    label: 'How did you hear about Madrasatul Quran?',
    placeholder: 'Select',
    options: { internet: 'Internet', friends_family: 'Friends or family', advertisement: 'Advertisement', other: 'Other' },
  },
  student_photo: { label: 'Student’s photo', placeholder: 'Upload a photo', help: 'A recent passport-size photo of the student' },
  student_name_bengali: { label: 'Name (in Bengali)', placeholder: 'Student’s name in Bengali' },
  student_name_english: { label: 'Name (in English)', placeholder: 'Student’s name in English, as on the birth certificate' },
  date_of_birth: { label: 'Date of birth' },
  desired_class: {
    label: 'Class applying for',
    placeholder: 'Select a class',
    options: { nursery: 'Nursery', kg: 'KG', class_1: 'Class 1', class_2: 'Class 2', class_3: 'Class 3', class_4: 'Class 4', class_5: 'Class 5' },
  },
  last_class_attended: { label: 'Last class attended (if any)' },
  previous_school: { label: 'Previous school (if any)' },
  student_birth_registration: { label: 'Student’s birth registration certificate' },

  father_name: { label: 'Father’s name (in Bengali)' },
  father_name_english: { label: 'Father’s name (in English)' },
  father_occupation: { label: 'Occupation', options: OCCUPATION },
  father_organization: { label: 'Organisation or type of business' },
  father_designation: { label: 'Designation' },
  father_prayer_times: { label: 'Do you pray the five daily prayers on time?', options: PRAYER_TIMES },
  father_prayer_location: { label: 'Where do you usually pray?', options: { mosque: 'At the mosque', home: 'At home', office: 'At the office' } },
  father_daily_quran: { label: 'Do you recite the Holy Quran regularly?', options: QURAN },
  father_tv_at_home: { label: 'Is there a TV at home (with a dish or cable connection)?' },
  father_screen_time: { label: 'How much time do you spend on TV, internet and mobile each day?', options: SCREEN_TIME },
  father_time_with_children: {
    label: 'On average, how much time do you spend with your children each day?',
    options: { '1_hour_plus': '1 hour or more', '30_minutes_plus': '30 minutes or more', not_regular: 'Not regularly' },
  },
  father_islamic_clothing: {
    label: 'Islamic dress you follow',
    options: { loose_clothing: 'Loose clothing', pants_above_ankle: 'Trousers above the ankle', beard: 'Beard', none: 'None of these' },
  },
  father_smoking: { label: 'Do you smoke?' },
  father_mahram: { label: 'Do you observe mahram and non-mahram rules?' },
  father_favorite_scholar: { label: 'Your favourite scholar' },
  father_facebook_id: FACEBOOK,
  father_photo: { label: 'Father’s photo', placeholder: 'Upload a photo', help: 'A recent passport-size photo' },

  mother_name: { label: 'Mother’s name (in Bengali)' },
  mother_name_english: { label: 'Mother’s name (in English)' },
  mother_occupation: { label: 'Occupation', options: OCCUPATION },
  mother_organization: { label: 'Organisation or type of business' },
  mother_designation: { label: 'Designation' },
  mother_prayer_times: { label: 'Do you pray the five daily prayers on time?', options: PRAYER_TIMES },
  mother_daily_quran: { label: 'Do you recite the Holy Quran regularly?', options: QURAN },
  mother_islamic_clothing: {
    label: 'Do you observe purdah?',
    options: { borka_niqab: 'Burqa with niqab', borka_hijab: 'Burqa with hijab', normal_clothing: 'Ordinary modest clothing' },
  },
  mother_screen_time: { label: 'How much time do you spend on TV, internet and mobile each day?', options: SCREEN_TIME },
  mother_mahram: { label: 'Do you observe mahram and non-mahram rules?' },
  mother_favorite_scholar: { label: 'Your favourite scholar' },
  mother_facebook_id: FACEBOOK,

  transport_requirement: { label: 'Is school transport important in your decision to enrol your child?' },
  transport_location: {
    label: 'If you use school transport, which area would your child come from?',
    options: { mirpur: 'Mirpur', uttara: 'Uttara', others: 'Other' },
  },
  other_class_requirement: {
    label: 'Would you like to enrol another child in a different class (if admission is open for that class)?',
    options: { play: 'Play', class_4: 'Class 4', class_5: 'Class 5', class_6: 'Class 6' },
  },
  comments: { label: 'Comments or suggestions', placeholder: 'Let us know if you have any comments or suggestions' },

  present_address: { label: 'Present address', placeholder: 'Full address, including house and road number' },
  father_phone: { label: 'Mobile number (father)' },
  mother_phone: { label: 'Mobile number (mother)' },
  email: { label: 'Email' },
};

/** The declaration shown on the review page (Bengali text from the live form). */
export const DECLARATION_ENGLISH =
  'Madrasatul Quran is a fully Islamic educational institution. I declare that all the information given above is correct and true. I understand that admission may be cancelled if any information is found to be false.';
