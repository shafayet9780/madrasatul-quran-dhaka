const { createClient } = require('@sanity/client');

// Initialize Sanity client
const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  token: process.env.SANITY_API_TOKEN,
  useCdn: false,
});

// Prospectus data
const prospectusData = {
  // Founder/Chairman information
  founder: {
    name: 'এস এম নাহিদ হাসান',
    title: 'প্রতিষ্ঠাতা চেয়ারম্যান',
    subtitle: 'চেয়ারম্যান, আল কুরআনের ভাষা ইনস্টিটিউট',
    nameEnglish: 'S M Nahid Hasan',
    titleEnglish: 'Founder Chairman',
    subtitleEnglish: 'Chairman, Al Quran Language Institute'
  },

  // Institution information
  institution: {
    name: 'মাদরাসাতুল কুরআন ঢাকা',
    subtitle: 'ইসলামিক ও সাধারণ শিক্ষার এক আদর্শ সমন্বয়',
    nameEnglish: 'Madrasatul Quran Dhaka',
    subtitleEnglish: 'An Ideal Integration of Islamic and General Education'
  },

  // 10-Year Study Plan
  studyPlan: [
    {
      age: '5+',
      classBengali: 'নার্সারি',
      classEnglish: 'Nursery',
      islamicStudiesBengali: 'কায়দা, আরবি-N, ইসলাম-N',
      islamicStudiesEnglish: 'Qaida, Arabic-N, Islam-N',
      generalBengali: 'বাংলা, ইংরেজি, গণিত',
      generalEnglish: 'Bengali, English, Mathematics'
    },
    {
      age: '6+',
      classBengali: 'কেজি',
      classEnglish: 'KG',
      islamicStudiesBengali: 'আম্মাপারা, আরবি-KG, ইসলাম-KG',
      islamicStudiesEnglish: 'Ammapara, Arabic-KG, Islam-KG',
      generalBengali: 'বাংলা, ইংরেজি, গণিত',
      generalEnglish: 'Bengali, English, Mathematics'
    },
    {
      age: '7+',
      classBengali: '১ম',
      classEnglish: 'Class 1',
      islamicStudiesBengali: 'নাজেরা, আরবি-১, ইসলাম-১',
      islamicStudiesEnglish: 'Nazera, Arabic-1, Islam-1',
      generalBengali: 'বাংলা, ইংরেজি, গণিত',
      generalEnglish: 'Bengali, English, Mathematics'
    },
    {
      age: '8+',
      classBengali: '২য়',
      classEnglish: 'Class 2',
      islamicStudiesBengali: 'হিফজ-১, আরবি-২, ইসলাম-২',
      islamicStudiesEnglish: 'Hifz-1, Arabic-2, Islam-2',
      generalBengali: 'বাংলা, ইংরেজি, গণিত',
      generalEnglish: 'Bengali, English, Mathematics'
    },
    {
      age: '9+',
      classBengali: '৩য়',
      classEnglish: 'Class 3',
      islamicStudiesBengali: 'হিফজ-২, আরবি-৩, ইসলাম-৩',
      islamicStudiesEnglish: 'Hifz-2, Arabic-3, Islam-3',
      generalBengali: 'বাংলা, ইংরেজি, গণিত',
      generalEnglish: 'Bengali, English, Mathematics'
    },
    {
      age: '10+',
      classBengali: '৪র্থ',
      classEnglish: 'Class 4',
      islamicStudiesBengali: 'হিফজ-৩, ইসলাম-৪, আরবি-৪',
      islamicStudiesEnglish: 'Hifz-3, Islam-4, Arabic-4',
      generalBengali: 'বাংলা, ইংরেজি, গণিত',
      generalEnglish: 'Bengali, English, Mathematics'
    },
    {
      age: '11+',
      classBengali: '৫ম',
      classEnglish: 'Class 5',
      islamicStudiesBengali: 'শুনানি, আরবি-৫, ইসলাম-৫',
      islamicStudiesEnglish: 'Shunani, Arabic-5, Islam-5',
      generalBengali: 'বাংলা, ইংরেজি, গণিত, বিজ্ঞান, বিজিএস',
      generalEnglish: 'Bengali, English, Mathematics, Science, BGS'
    },
    {
      age: '12+',
      classBengali: '৬ষ্ঠ',
      classEnglish: 'Class 6',
      islamicStudiesBengali: 'আরবি-৬, ইসলাম-৬',
      islamicStudiesEnglish: 'Arabic-6, Islam-6',
      generalBengali: 'বাংলা, ইংরেজি, গণিত, বিজ্ঞান, বিজিএস',
      generalEnglish: 'Bengali, English, Mathematics, Science, BGS'
    },
    {
      age: '13+',
      classBengali: '৭ম',
      classEnglish: 'Class 7',
      islamicStudiesBengali: 'আরবি-৭, ইসলাম-৭',
      islamicStudiesEnglish: 'Arabic-7, Islam-7',
      generalBengali: 'বাংলা, ইংরেজি, গণিত, বিজ্ঞান, বিজিএস',
      generalEnglish: 'Bengali, English, Mathematics, Science, BGS'
    },
    {
      age: '14+',
      classBengali: '৮ম',
      classEnglish: 'Class 8',
      islamicStudiesBengali: 'আরবি-৮, ইসলাম-৮',
      islamicStudiesEnglish: 'Arabic-8, Islam-8',
      generalBengali: 'বাংলা, ইংরেজি, গণিত, বিজ্ঞান, বিজিএস',
      generalEnglish: 'Bengali, English, Mathematics, Science, BGS'
    },
    {
      age: '15+',
      classBengali: '৯ম',
      classEnglish: 'Class 9',
      islamicStudiesBengali: 'এসএসসি/দাখিল প্রস্তুতি',
      islamicStudiesEnglish: 'SSC/DAKHIL Preparation',
      generalBengali: 'এসএসসি/দাখিল প্রস্তুতি',
      generalEnglish: 'SSC/DAKHIL Preparation'
    },
    {
      age: '16+',
      classBengali: '১০ম',
      classEnglish: 'Class 10',
      islamicStudiesBengali: 'এসএসসি/দাখিল প্রস্তুতি',
      islamicStudiesEnglish: 'SSC/DAKHIL Preparation',
      generalBengali: 'এসএসসি/দাখিল প্রস্তুতি',
      generalEnglish: 'SSC/DAKHIL Preparation'
    }
  ],

  // Unique Features
  uniqueFeatures: [
    {
      icon: 'integration',
      titleBengali: 'আদর্শ সমন্বয়',
      titleEnglish: 'Ideal Integration',
      descriptionBengali: 'আরবি ভাষা ও ইসলামী শিক্ষার সাথে সাধারণ শিক্ষার আদর্শ সমন্বয়',
      descriptionEnglish: 'Ideal integration of Arabic language and Islamic education with general education'
    },
    {
      icon: 'languages',
      titleBengali: 'ভাষার চারটি দক্ষতা',
      titleEnglish: 'Four Language Skills',
      descriptionBengali: 'ইংরেজি ও আরবি উভয় ভাষায় শোনা, বলা, পড়া ও লেখার দক্ষতা অর্জন',
      descriptionEnglish: 'Acquisition of four basic language skills (listening, speaking, reading, and writing) in both English and Arabic'
    },
    {
      icon: 'arabic-medium',
      titleBengali: 'আরবি মিডিয়াম ইসলামী শিক্ষা',
      titleEnglish: 'Arabic Medium Islamic Studies',
      descriptionBengali: '৬ষ্ঠ শ্রেণি থেকে আরবি মিডিয়ামে ইসলামী শিক্ষা প্রদান',
      descriptionEnglish: 'Islamic studies are taught in Arabic from the 6th grade onwards'
    },
    {
      icon: 'higher-education',
      titleBengali: 'উচ্চ শিক্ষার সুযোগ',
      titleEnglish: 'Higher Education Pathway',
      descriptionBengali: '৮ম শ্রেণির পর এসএসসি/দাখিল/মাদ্রাসা শিক্ষার সুযোগ',
      descriptionEnglish: 'Opportunity for SSC/Dakhil/Madrasa education after 8th grade'
    },
    {
      icon: 'hifz',
      titleBengali: 'ডে-কেয়ার হিফজ',
      titleEnglish: 'Day-care Hifz',
      descriptionBengali: 'ডে-কেয়ার হিফজ (কুরআন মুখস্থ) প্রোগ্রামের ব্যবস্থা',
      descriptionEnglish: 'Provision for a Day-care Hifz (Quran memorization) program'
    },
    {
      icon: 'transport',
      titleBengali: 'নিজস্ব পরিবহন',
      titleEnglish: 'Own Transportation',
      descriptionBengali: 'নিজস্ব পরিবহন ব্যবস্থা রয়েছে',
      descriptionEnglish: 'Own transportation system is available'
    },
    {
      icon: 'hadith',
      titleBengali: 'হাদিস মুখস্থ',
      titleEnglish: 'Hadith Memorization',
      descriptionBengali: '৯ম শ্রেণির মধ্যে ৩০০+ হাদিস মুখস্থ করা',
      descriptionEnglish: 'Memorizing 300+ Hadith (prophetic traditions) by 9th grade'
    },
    {
      icon: 'translation',
      titleBengali: 'কুরআন তর্জমা দক্ষতা',
      titleEnglish: 'Quranic Translation Proficiency',
      descriptionBengali: 'এসএসসি/দাখিল পর্যায়ে ৯০%+ কুরআন তর্জমা দক্ষতা অর্জন',
      descriptionEnglish: 'Achieving 90%+ Quranic translation proficiency at SSC/Dakhil level'
    },
    {
      icon: 'ethics',
      titleBengali: 'নৈতিকতা ও আদব',
      titleEnglish: 'Ethics and Manners',
      descriptionBengali: 'ইসলামী নৈতিকতা ও আদব শিক্ষায় সর্বোচ্চ গুরুত্ব',
      descriptionEnglish: 'Utmost importance is given to Islamic ethics and manners education'
    },
    {
      icon: 'history',
      titleBengali: 'ইসলামী ইতিহাস',
      titleEnglish: 'Islamic History',
      descriptionBengali: 'ইসলামী ইতিহাস ও সীরাত শিক্ষায় গুরুত্ব',
      descriptionEnglish: 'Emphasis on Islamic history and Seerah (biography of the Prophet)'
    },
    {
      icon: 'recreation',
      titleBengali: 'বিনোদনের সুযোগ',
      titleEnglish: 'Recreational Facilities',
      descriptionBengali: 'ছেলেদের ক্যাম্পাস সংলগ্ন মাঠে এবং মেয়েদের ছাদ বাগানে খেলার সুযোগ',
      descriptionEnglish: 'Opportunity for boys to play in the campus-adjacent field and for girls to play in the rooftop garden'
    }
  ],

  // Curriculum Breakdown
  curriculumSubjects: [
    {
      icon: 'quran',
      titleBengali: 'কুরআন',
      titleEnglish: 'Quran',
      descriptionBengali: 'সামর্থ্য অনুযায়ী হিফজ ও কুরআন তর্জমা',
      descriptionEnglish: 'Hifz (memorization) and Quranic translation according to ability'
    },
    {
      icon: 'arabic',
      titleBengali: 'আরবী ভাষা',
      titleEnglish: 'Arabic Language',
      descriptionBengali: 'আরবী বলতে পারা, শুনে বুঝতে পারা, ইবারাত পড়তে পারা ও লিখতে পারা',
      descriptionEnglish: 'Ability to speak, understand by listening, read Ibaarat (Arabic text without diacritics), and write Arabic'
    },
    {
      icon: 'aqidah',
      titleBengali: 'আকিদাহ',
      titleEnglish: 'Aqidah (Islamic Creed)',
      descriptionBengali: 'ইমান ও আকিদার বিষয়াবলি ও ইসলামিক মূল্যবোধ',
      descriptionEnglish: 'Matters of faith and creed, and Islamic values'
    },
    {
      icon: 'fiqh',
      titleBengali: 'ফিকহ',
      titleEnglish: 'Fiqh (Islamic Jurisprudence)',
      descriptionBengali: 'বেসিক মাসাইল, আদাব-তারবিয়া ও মাসনুন দোয়া',
      descriptionEnglish: 'Basic Masa\'il (rulings), Adab-Tarbiyah (manners and upbringing), and Masnoon Duas (prophetic supplications)'
    },
    {
      icon: 'hadith',
      titleBengali: 'হাদিস',
      titleEnglish: 'Hadith',
      descriptionBengali: 'নবম শ্রেণীর মধ্যে বিষয়ভিত্তিক ৩০০+ হাদিস মুখস্থ করা',
      descriptionEnglish: 'Memorizing 300+ subject-wise Hadith by 9th grade'
    },
    {
      icon: 'history',
      titleBengali: 'ইতিহাস',
      titleEnglish: 'History',
      descriptionBengali: 'নবীদের ইতিহাস, কুরআনের বিভিন্ন ইতিহাস, খলিফাদের ইতিহাস ও পরবর্তী ইতিহাস',
      descriptionEnglish: 'History of Prophets, various histories from the Quran, history of Caliphs, and subsequent history'
    }
  ],

  // Fee Structure
  feeStructure: [
    {
      itemBengali: 'ভর্তি ফি (এককালীন)',
      itemEnglish: 'Admission Fee (One-time)',
      preHifz: 20000,
      hifz: 23000
    },
    {
      itemBengali: 'সেশন ফি (বাৎসরিক)',
      itemEnglish: 'Session Fee (Annual)',
      preHifz: 15000,
      hifz: 15000
    },
    {
      itemBengali: 'বেতন (মাসিক)',
      itemEnglish: 'Tuition (Monthly)',
      preHifz: 6000,
      hifz: 10000
    },
    {
      itemBengali: 'খাবার খরচ (মাসিক)',
      itemEnglish: 'Food Cost (Monthly)',
      preHifz: 1500,
      hifz: 4000
    }
  ],

  // Higher Education Information
  higherEducation: {
    alimPathBengali: 'আলিম হওয়ার লক্ষ্যে ৮ম শ্রেণির পর শিক্ষার্থীদের তালিম বোর্ডের জন্য প্রস্তুত করা হবে এবং দাখিল/এসএসসি পরীক্ষা দিতে হবে।',
    alimPathEnglish: 'Students aiming to become Alim after Class Eight will be prepared for the Ta\'lim Board and will take Dakhil/SSC exams.',
    collegePathBengali: 'কলেজ শিক্ষার জন্য শিক্ষার্থীরা সাধারণ শিক্ষায় মনোনিবেশ করবে এবং এসএসসি পরীক্ষা দেবে।',
    collegePathEnglish: 'Students who wish to pursue college education will focus on general education and take SSC exams.'
  },

  // Special Discount Note
  specialDiscount: {
    noteBengali: 'একাধিক সন্তানের জন্য বিশেষ ছাড় থাকবে, ইনশা আল্লাহ।',
    noteEnglish: 'There will be special discounts for multiple children, Insha Allah.'
  }
};

async function uploadProspectusData() {
  try {
    console.log('🚀 Starting prospectus data upload to Sanity...');

    // Create prospectus document
    const prospectusDoc = await client.create({
      _type: 'prospectus',
      title: 'Madrasatul Quran Dhaka Prospectus',
      founder: prospectusData.founder,
      institution: prospectusData.institution,
      studyPlan: prospectusData.studyPlan,
      uniqueFeatures: prospectusData.uniqueFeatures,
      curriculumSubjects: prospectusData.curriculumSubjects,
      feeStructure: prospectusData.feeStructure,
      higherEducation: prospectusData.higherEducation,
      specialDiscount: prospectusData.specialDiscount,
      publishedAt: new Date().toISOString()
    });

    console.log('✅ Prospectus data uploaded successfully!');
    console.log('📄 Document ID:', prospectusDoc._id);
    console.log('🔗 View in Sanity Studio:', `https://${process.env.NEXT_PUBLIC_SANITY_PROJECT_ID}.api.sanity.io/v2021-10-21/data/manage/${process.env.NEXT_PUBLIC_SANITY_DATASET}/documents/${prospectusDoc._id}`);

    return prospectusDoc;

  } catch (error) {
    console.error('❌ Error uploading prospectus data:', error);
    throw error;
  }
}

// Run the upload if this script is executed directly
if (require.main === module) {
  uploadProspectusData()
    .then(() => {
      console.log('🎉 Prospectus data upload completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Upload failed:', error);
      process.exit(1);
    });
}

module.exports = { uploadProspectusData, prospectusData };
