const { createClient } = require('@sanity/client');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

// Initialize Sanity client
const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'development',
  token: process.env.SANITY_API_TOKEN,
  apiVersion: '2024-01-01',
  useCdn: false,
});

console.log('🔧 Using project ID:', process.env.NEXT_PUBLIC_SANITY_PROJECT_ID);
console.log('🔧 Using dataset:', process.env.NEXT_PUBLIC_SANITY_DATASET || 'development');

// Centralized site settings data
const siteSettingsData = {
  _type: 'siteSettings',
  title: {
    bengali: 'মাদরাসাতুল কুরআন',
    english: 'Madrasatul Quran'
  },
  description: {
    bengali: 'ইসলামী শিক্ষায় উৎকর্ষতা',
    english: 'Excellence in Islamic Education'
  },
  contactInfo: {
    address: {
      bengali: 'ঢাকা, বাংলাদেশ',
      english: 'Dhaka, Bangladesh'
    },
    phone: [
      {
        label: { bengali: 'প্রধান অফিস', english: 'Main Office' },
        number: '+880 1234 567890',
        type: 'main',
        isPrimary: true,
        isActive: true
      },
      {
        label: { bengali: 'ভর্তি অফিস', english: 'Admission Office' },
        number: '+880 1234 567891',
        type: 'admission',
        isPrimary: false,
        isActive: true
      },
      {
        label: { bengali: 'প্রিন্সিপাল অফিস', english: 'Principal Office' },
        number: '+880 1234 567892',
        type: 'principal',
        isPrimary: false,
        isActive: true
      },
      {
        label: { bengali: 'জরুরি যোগাযোগ', english: 'Emergency Contact' },
        number: '+880 1234 567893',
        type: 'emergency',
        isPrimary: false,
        isActive: true
      }
    ],
    email: [
      {
        label: { bengali: 'সাধারণ তথ্য', english: 'General Information' },
        address: 'info@madrasatulquran.edu.bd',
        type: 'info',
        isPrimary: true,
        isActive: true
      },
      {
        label: { bengali: 'ভর্তি', english: 'Admissions' },
        address: 'admission@madrasatulquran.edu.bd',
        type: 'admission',
        isPrimary: false,
        isActive: true
      },
      {
        label: { bengali: 'প্রিন্সিপাল', english: 'Principal' },
        address: 'principal@madrasatulquran.edu.bd',
        type: 'principal',
        isPrimary: false,
        isActive: true
      },
      {
        label: { bengali: 'একাডেমিক', english: 'Academic' },
        address: 'academic@madrasatulquran.edu.bd',
        type: 'academic',
        isPrimary: false,
        isActive: true
      }
    ],
    officeHours: {
      bengali: 'রবি - বৃহস্পতি: সকাল ৮টা - বিকাল ৫টা',
      english: 'Sun - Thu: 8:00 AM - 5:00 PM'
    }
  },
  socialMedia: [
    {
      platform: 'Facebook',
      url: 'https://facebook.com/madrasatulquran',
      icon: 'facebook',
      isActive: true,
      order: 1
    },
    {
      platform: 'YouTube',
      url: 'https://youtube.com/@madrasatulquran',
      icon: 'youtube',
      isActive: true,
      order: 2
    },
    {
      platform: 'Instagram',
      url: 'https://instagram.com/madrasatulquran',
      icon: 'instagram',
      isActive: true,
      order: 3
    }
  ],
  prayerTimes: [
    {
      prayerName: { bengali: 'ফজর', english: 'Fajr' },
      time: '5:15 AM',
      isActive: true,
      order: 1
    },
    {
      prayerName: { bengali: 'যুহর', english: 'Dhuhr' },
      time: '12:30 PM',
      isActive: true,
      order: 2
    },
    {
      prayerName: { bengali: 'আসর', english: 'Asr' },
      time: '4:15 PM',
      isActive: true,
      order: 3
    },
    {
      prayerName: { bengali: 'মাগরিব', english: 'Maghrib' },
      time: '6:00 PM',
      isActive: true,
      order: 4
    },
    {
      prayerName: { bengali: 'ইশা', english: 'Isha' },
      time: '7:30 PM',
      isActive: true,
      order: 5
    }
  ],
  departments: [
    {
      name: { bengali: 'একাডেমিক বিভাগ', english: 'Academic Department' },
      head: { bengali: 'ড. আহমদ হাসান', english: 'Dr. Ahmad Hasan' },
      phone: '+880 1234 567894',
      email: 'academic@madrasatulquran.edu.bd',
      type: 'academic',
      isActive: true
    },
    {
      name: { bengali: 'ইসলামিক স্টাডিজ বিভাগ', english: 'Islamic Studies Department' },
      head: { bengali: 'মাওলানা আব্দুর রহমান', english: 'Maulana Abdur Rahman' },
      phone: '+880 1234 567895',
      email: 'islamic@madrasatulquran.edu.bd',
      type: 'islamic',
      isActive: true
    },
    {
      name: { bengali: 'ছাত্র বিষয়ক বিভাগ', english: 'Student Affairs Department' },
      head: { bengali: 'জনাব মোহাম্মদ আলী', english: 'Mr. Mohammad Ali' },
      phone: '+880 1234 567896',
      email: 'student@madrasatulquran.edu.bd',
      type: 'student',
      isActive: true
    },
    {
      name: { bengali: 'অর্থ বিভাগ', english: 'Finance Department' },
      head: { bengali: 'জনাবা ফাতিমা খাতুন', english: 'Mrs. Fatima Khatun' },
      phone: '+880 1234 567897',
      email: 'finance@madrasatulquran.edu.bd',
      type: 'finance',
      isActive: true
    }
  ],
  admissionInfo: {
    admissionPhone: '+880 1234 567891',
    admissionEmail: 'admission@madrasatulquran.edu.bd',
    admissionHours: {
      bengali: 'রবি - বৃহস্পতি: সকাল ৯টা - বিকাল ৪টা',
      english: 'Sun - Thu: 9:00 AM - 4:00 PM'
    }
  },
  statistics: {
    yearsOfService: 25,
    totalStudents: 1200,
    graduationRate: 95,
    teacherCount: 85,
    achievements: [
      {
        title: { bengali: 'জাতীয় পুরস্কার', english: 'National Awards' },
        value: '15'
      },
      {
        title: { bengali: 'সফল স্নাতক', english: 'Successful Graduates' },
        value: '5000+'
      }
    ]
  }
};

// Updated footer data to use global settings
const footerData = {
  _type: 'footer',
  title: {
    bengali: 'মাদরাসাতুল কুরআন',
    english: 'Madrasatul Quran'
  },
  subtitle: {
    bengali: 'ইসলামী শিক্ষায় উৎকর্ষতা',
    english: 'Excellence in Islamic Education'
  },
  description: {
    bengali: 'কুরআন ও সুন্নাহর আলোকে শিক্ষার্থীদের চরিত্র গঠন এবং আধুনিক শিক্ষায় দক্ষতা অর্জনের মাধ্যমে একটি আদর্শ মুসলিম সমাজ গড়ে তোলা।',
    english: 'Building an ideal Muslim society through character development of students in the light of Quran and Sunnah and achieving excellence in modern education.'
  },
  useGlobalContactInfo: true,
  useGlobalSocialLinks: true,
  useGlobalPrayerTimes: true,
  quickLinks: [
    {
      label: { bengali: 'হোম', english: 'Home' },
      url: '/',
      isActive: true,
      order: 1
    },
    {
      label: { bengali: 'আমাদের সম্পর্কে', english: 'About' },
      url: '/about',
      isActive: true,
      order: 2
    },
    {
      label: { bengali: 'প্রোগ্রাম', english: 'Programs' },
      url: '/programs',
      isActive: true,
      order: 3
    },
    {
      label: { bengali: 'ভর্তি', english: 'Admissions' },
      url: '/admissions',
      isActive: true,
      order: 4
    },
    {
      label: { bengali: 'ক্যাম্পাস', english: 'Campus' },
      url: '/campus',
      isActive: true,
      order: 5
    },
    {
      label: { bengali: 'সংবাদ', english: 'News' },
      url: '/news',
      isActive: true,
      order: 6
    },
    {
      label: { bengali: 'যোগাযোগ', english: 'Contact' },
      url: '/contact',
      isActive: true,
      order: 7
    }
  ],
  legalLinks: [
    {
      label: { bengali: 'গোপনীয়তা নীতি', english: 'Privacy Policy' },
      url: '/privacy',
      isActive: true
    },
    {
      label: { bengali: 'ব্যবহারের শর্তাবলী', english: 'Terms of Service' },
      url: '/terms',
      isActive: true
    },
    {
      label: { bengali: 'সাইটম্যাপ', english: 'Sitemap' },
      url: '/sitemap',
      isActive: true
    }
  ],
  copyright: {
    bengali: '© ২০২৪ মাদরাসাতুল কুরআন। সকল অধিকার সংরক্ষিত।',
    english: '© 2024 Madrasatul Quran. All rights reserved.'
  },
  isActive: true
};

async function populateCentralizedData() {
  try {
    console.log('🚀 Starting centralized data population...');
    
    // Update or create site settings
    const existingSiteSettings = await client.fetch(
      `*[_type == "siteSettings"][0]`
    );

    if (existingSiteSettings) {
      console.log('⚠️  Site settings already exist. Updating...');
      const updatedSiteSettings = await client
        .patch(existingSiteSettings._id)
        .set(siteSettingsData)
        .commit();
      console.log('✅ Site settings updated successfully!');
      console.log('📄 Site Settings ID:', updatedSiteSettings._id);
    } else {
      console.log('📝 Creating new site settings...');
      const newSiteSettings = await client.create(siteSettingsData);
      console.log('✅ Site settings created successfully!');
      console.log('📄 Site Settings ID:', newSiteSettings._id);
    }

    // Update footer to use global settings
    const existingFooter = await client.fetch(
      `*[_type == "footer" && isActive == true][0]`
    );

    if (existingFooter) {
      console.log('⚠️  Footer already exists. Updating to use global settings...');
      const updatedFooter = await client
        .patch(existingFooter._id)
        .set(footerData)
        .commit();
      console.log('✅ Footer updated successfully!');
      console.log('📄 Footer ID:', updatedFooter._id);
    } else {
      console.log('📝 Creating new footer with global settings...');
      const newFooter = await client.create(footerData);
      console.log('✅ Footer created successfully!');
      console.log('📄 Footer ID:', newFooter._id);
    }

    console.log('\n📋 Centralized data summary:');
    console.log('   • Contact Info: Centralized in Site Settings');
    console.log('   • Social Media: Centralized in Site Settings');
    console.log('   • Prayer Times: Centralized in Site Settings');
    console.log('   • Departments: Centralized in Site Settings');
    console.log('   • Phone Numbers:', siteSettingsData.contactInfo.phone.length);
    console.log('   • Email Addresses:', siteSettingsData.contactInfo.email.length);
    console.log('   • Social Links:', siteSettingsData.socialMedia.length);
    console.log('   • Prayer Times:', siteSettingsData.prayerTimes.length);
    console.log('   • Departments:', siteSettingsData.departments.length);

    console.log('\n🎉 Centralized data population completed successfully!');
    console.log('🌐 All components will now use centralized data from Site Settings.');
    console.log('📝 Footer is configured to use global contact info, social links, and prayer times.');
    
  } catch (error) {
    console.error('❌ Error populating centralized data:', error);
    console.error('Error details:', error.message);
    process.exit(1);
  }
}

// Run the script
populateCentralizedData();