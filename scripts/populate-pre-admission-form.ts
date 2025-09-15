import { config } from 'dotenv';
import { createClient } from '@sanity/client';
import { resolve } from 'path';

// Load environment variables from .env.local (same approach as working scripts)
config({ path: resolve(process.cwd(), '.env.local') });

/**
 * Script to populate the pre-admission form configuration in Sanity CMS
 * Run this script to set up the default form configuration
 */

const defaultFormConfig = {
  formSettings: {
    isEnabled: true,
    formTitle: {
      bengali: 'প্রি-অ্যাডমিশন ফর্ম',
      english: 'Pre-Admission Form'
    },
    formDescription: {
      bengali: 'প্রি-অ্যাডমিশনের জন্য ফরমটি সাবধানে পূরণ করুন।',
      english: 'Please fill out the form carefully for pre-admission.'
    },
    submissionDate: '2025-09-14',
    googleSheetsId: 'your-google-sheets-id-here' // Replace with actual Google Sheets ID
  },
  generalQuestions: [
    {
      question: {
        bengali: 'আপনি কিভাবে মাদরাসাতুল কুরআন সম্পর্কে জানতে পেরেছেন?',
        english: 'How did you learn about Madrasatul Quran?'
      },
      fieldType: 'select',
      options: [
        { label: { bengali: 'ইন্টারনেট', english: 'Internet' }, value: 'internet' },
        { label: { bengali: 'বন্ধু/পরিবার', english: 'Friends/Family' }, value: 'friends_family' },
        { label: { bengali: 'বিজ্ঞাপন', english: 'Advertisement' }, value: 'advertisement' },
        { label: { bengali: 'অন্যান্য', english: 'Other' }, value: 'other' }
      ],
      isRequired: true,
      placeholder: {
        bengali: 'বিস্তারিত লিখুন',
        english: 'Please provide details'
      }
    }
  ],
  studentInfoFields: [
    {
      fieldName: 'student_name_english',
      label: {
        bengali: 'নাম (ইংরেজিতে)',
        english: 'Name (in English)'
      },
      fieldType: 'text',
      isRequired: true,
      placeholder: {
        bengali: 'শিক্ষার্থীর নাম লিখুন',
        english: 'Enter student name'
      }
    },
    {
      fieldName: 'date_of_birth',
      label: {
        bengali: 'জন্ম তারিখ',
        english: 'Date of Birth'
      },
      fieldType: 'date',
      isRequired: true
    },
    {
      fieldName: 'desired_class',
      label: {
        bengali: 'যে ক্লাসে ভর্তি হতে ইচ্ছুক',
        english: 'Desired Class for Admission'
      },
      fieldType: 'select',
      options: [
        { label: { bengali: 'নার্সারি', english: 'Nursery' }, value: 'nursery' },
        { label: { bengali: 'কেজি', english: 'KG' }, value: 'kg' },
        { label: { bengali: '১ম শ্রেণী', english: 'Class 1' }, value: 'class_1' },
        { label: { bengali: '২য় শ্রেণী', english: 'Class 2' }, value: 'class_2' },
        { label: { bengali: '৩য় শ্রেণী', english: 'Class 3' }, value: 'class_3' },
        { label: { bengali: '৪র্থ শ্রেণী', english: 'Class 4' }, value: 'class_4' },
        { label: { bengali: '৫ম শ্রেণী', english: 'Class 5' }, value: 'class_5' }
      ],
      isRequired: true
    },
    {
      fieldName: 'last_class_attended',
      label: {
        bengali: 'সর্বশেষ যে শ্রেণীতে অধ্যয়ন করেছে (যদি প্রযোজ্য হয়)',
        english: 'Last Class Attended (if applicable)'
      },
      fieldType: 'text',
      isRequired: false
    },
    {
      fieldName: 'previous_school',
      label: {
        bengali: 'পূর্ববর্তী স্কুল/মাদ্রাসার নাম (প্রযোজ্য ক্ষেত্রে)',
        english: 'Previous School/Madrasa Name (if applicable)'
      },
      fieldType: 'text',
      isRequired: false
    }
  ],
  parentInfoFields: {
    fatherFields: [
      {
        fieldName: 'father_name',
        label: {
          bengali: 'পিতার নাম',
          english: 'Father\'s Name'
        },
        fieldType: 'text',
        isRequired: true
      },
      {
        fieldName: 'father_name_english',
        label: {
          bengali: 'Father\'s Name (English)',
          english: 'Father\'s Name (English)'
        },
        fieldType: 'text',
        isRequired: true
      },
      {
        fieldName: 'father_nationality',
        label: {
          bengali: 'জাতীয়তা (Nationality)',
          english: 'Nationality'
        },
        fieldType: 'text',
        isRequired: true
      },
      {
        fieldName: 'father_education',
        label: {
          bengali: 'শিক্ষাগত যোগ্যতা',
          english: 'Educational Qualification'
        },
        fieldType: 'select',
        options: [
          { label: { bengali: 'এসএসসি', english: 'SSC' }, value: 'ssc' },
          { label: { bengali: 'এইচএসসি', english: 'HSC' }, value: 'hsc' },
          { label: { bengali: 'স্নাতক', english: 'Bachelor' }, value: 'bachelor' },
          { label: { bengali: 'স্নাতকোত্তর', english: 'Master\'s' }, value: 'masters' },
          { label: { bengali: 'পিএইচডি', english: 'PhD' }, value: 'phd' },
          { label: { bengali: 'অন্যান্য', english: 'Other' }, value: 'other' }
        ],
        isRequired: true
      },
      {
        fieldName: 'father_occupation',
        label: {
          bengali: 'পেশার বিবরণ',
          english: 'Occupation'
        },
        fieldType: 'select',
        options: [
          { label: { bengali: 'ব্যবসায়ী', english: 'Business' }, value: 'business' },
          { label: { bengali: 'চাকরিজীবী', english: 'Service' }, value: 'service' },
          { label: { bengali: 'শিক্ষক', english: 'Teacher' }, value: 'teacher' },
          { label: { bengali: 'ডাক্তার', english: 'Doctor' }, value: 'doctor' },
          { label: { bengali: 'ইঞ্জিনিয়ার', english: 'Engineer' }, value: 'engineer' },
          { label: { bengali: 'অন্যান্য', english: 'Other' }, value: 'other' }
        ],
        isRequired: true
      },
      {
        fieldName: 'father_organization',
        label: {
          bengali: 'প্রতিষ্ঠান / ব্যবসার ধরণ (Organization)',
          english: 'Organization Type'
        },
        fieldType: 'text',
        isRequired: false
      },
      {
        fieldName: 'father_designation',
        label: {
          bengali: 'পদবী (Designation)',
          english: 'Designation'
        },
        fieldType: 'text',
        isRequired: false
      },
      {
        fieldName: 'father_income',
        label: {
          bengali: 'মাসিক আনুমানিক আয়',
          english: 'Monthly Income'
        },
        fieldType: 'select',
        options: [
          { label: { bengali: '২০,০০০-৫০,০০০', english: '20,000-50,000' }, value: '20000-50000' },
          { label: { bengali: '৫০,০০০-১,০০,০০০', english: '50,000-100,000' }, value: '50000-100000' },
          { label: { bengali: '১,০০,০০০-২,০০,০০০', english: '100,000-200,000' }, value: '100000-200000' },
          { label: { bengali: '২,০০,০০০+', english: '200,000+' }, value: '200000+' }
        ],
        isRequired: true
      },
      {
        fieldName: 'father_expertise',
        label: {
          bengali: 'আপনি যে বিষয়ে অবিজ্ঞ (Expertise Field)',
          english: 'Your Area of Expertise'
        },
        fieldType: 'text',
        isRequired: false
      },
      // পিতার মৌলিক ইসলামিক অনুশীলন (Father's Basic Islamic Practices)
      {
        fieldName: 'father_prayer_times',
        label: {
          bengali: 'আপনি কত ওয়াক্ত সলাহ সময়ের মধ্যে আদায় করেন?',
          english: 'How many daily prayers do you perform on time?'
        },
        fieldType: 'radio',
        options: [
          { label: { bengali: '৫ ওয়াক্ত', english: '5 times' }, value: '5_times' },
          { label: { bengali: '৪ ওয়াক্ত', english: '4 times' }, value: '4_times' },
          { label: { bengali: '৩ ওয়াক্ত', english: '3 times' }, value: '3_times' },
          { label: { bengali: '২ ওয়াক্ত', english: '2 times' }, value: '2_times' },
          { label: { bengali: '১ ওয়াক্ত', english: '1 time' }, value: '1_time' }
        ],
        isRequired: true
      },
      {
        fieldName: 'father_prayer_location',
        label: {
          bengali: 'সলাহ কোথায় আদায় করেন?',
          english: 'Where do you perform prayers?'
        },
        fieldType: 'radio',
        options: [
          { label: { bengali: 'মসজিদে', english: 'At Mosque' }, value: 'mosque' },
          { label: { bengali: 'বাসায়', english: 'At Home' }, value: 'home' },
          { label: { bengali: 'অফিসে', english: 'At Office' }, value: 'office' }
        ],
        isRequired: true
      },
      {
        fieldName: 'father_tahajjud',
        label: {
          bengali: 'আপনি কি সলাতুত তাহাজ্জুদ পড়েন?',
          english: 'Do you perform Tahajjud prayer?'
        },
        fieldType: 'radio',
        options: [
          { label: { bengali: 'নিয়মিত', english: 'Regularly' }, value: 'regularly' },
          { label: { bengali: 'অনিয়মিত', english: 'Irregularly' }, value: 'irregularly' },
          { label: { bengali: 'মাঝে মাঝে', english: 'Sometimes' }, value: 'sometimes' }
        ],
        isRequired: true
      },
      {
        fieldName: 'father_quran_reading',
        label: {
          bengali: 'আপনি কি কুরআনুল কারীম পড়তে পারেন?',
          english: 'Can you read the Holy Quran?'
        },
        fieldType: 'boolean',
        isRequired: true
      },
      {
        fieldName: 'father_daily_quran',
        label: {
          bengali: 'প্রতিদিন আল-কুরআনুল কারীম তেলাওয়াত করেন?',
          english: 'Do you recite the Holy Quran daily?'
        },
        fieldType: 'radio',
        options: [
          { label: { bengali: 'নিয়মিত', english: 'Regularly' }, value: 'regularly' },
          { label: { bengali: 'অনিয়মিত', english: 'Irregularly' }, value: 'irregularly' },
          { label: { bengali: 'মাঝে মাঝে', english: 'Sometimes' }, value: 'sometimes' }
        ],
        isRequired: true
      },
      {
        fieldName: 'father_quran_quality',
        label: {
          bengali: 'কুরআন তেলাওয়াতের মান (১০ এর মধ্যে)',
          english: 'Quality of Quran recitation (out of 10)'
        },
        fieldType: 'select',
        options: [
          { label: { bengali: '১', english: '1' }, value: '1' },
          { label: { bengali: '২', english: '2' }, value: '2' },
          { label: { bengali: '৩', english: '3' }, value: '3' },
          { label: { bengali: '৪', english: '4' }, value: '4' },
          { label: { bengali: '৫', english: '5' }, value: '5' },
          { label: { bengali: '৬', english: '6' }, value: '6' },
          { label: { bengali: '৭', english: '7' }, value: '7' },
          { label: { bengali: '৮', english: '8' }, value: '8' },
          { label: { bengali: '৯', english: '9' }, value: '9' },
          { label: { bengali: '১০', english: '10' }, value: '10' }
        ],
        isRequired: true
      },
      {
        fieldName: 'father_tv_at_home',
        label: {
          bengali: 'আপনার বাসায় কি টিভি আছে?',
          english: 'Do you have TV at home?'
        },
        fieldType: 'boolean',
        isRequired: true
      },
      {
        fieldName: 'father_screen_time',
        label: {
          bengali: 'টিভি/ইন্টারনেট/মোবাইলের সাথে প্রতিদিন কত সময় ব্যয় করেন?',
          english: 'How much time do you spend daily with TV/Internet/Mobile?'
        },
        fieldType: 'select',
        options: [
          { label: { bengali: '১ ঘণ্টা', english: '1 hour' }, value: '1_hour' },
          { label: { bengali: '২ ঘণ্টা', english: '2 hours' }, value: '2_hours' },
          { label: { bengali: '৩ ঘণ্টা', english: '3 hours' }, value: '3_hours' },
          { label: { bengali: '৪ ঘণ্টা', english: '4 hours' }, value: '4_hours' },
          { label: { bengali: '৫+ ঘণ্টা', english: '5+ hours' }, value: '5_plus_hours' }
        ],
        isRequired: true
      },
      {
        fieldName: 'father_leisure_activity',
        label: {
          bengali: 'অবসর সময়ে আপনি কী করেন?',
          english: 'What do you do in your leisure time?'
        },
        fieldType: 'radio',
        options: [
          { label: { bengali: 'ইসলামিক স্টাডি', english: 'Islamic Studies' }, value: 'islamic_studies' },
          { label: { bengali: 'সাধারণ অধ্যয়ন', english: 'General Study' }, value: 'general_study' },
          { label: { bengali: 'টিভি', english: 'TV' }, value: 'tv' },
          { label: { bengali: 'অন্যান্য', english: 'Other' }, value: 'other' }
        ],
        isRequired: true
      },
      {
        fieldName: 'father_time_with_children',
        label: {
          bengali: 'প্রতিদিন গড়ে সন্তানদের সাথে সময়',
          english: 'Average daily time with children'
        },
        fieldType: 'radio',
        options: [
          { label: { bengali: '১ ঘণ্টা+', english: '1 hour+' }, value: '1_hour_plus' },
          { label: { bengali: '৩০ মিনিট-', english: '30 minutes-' }, value: '30_minutes_minus' },
          { label: { bengali: 'নিয়মিত নয়', english: 'Not regular' }, value: 'not_regular' }
        ],
        isRequired: true
      },
      {
        fieldName: 'father_favorite_scholar',
        label: {
          bengali: 'প্রিয় ইসলামী পণ্ডিতের নাম',
          english: 'Name of favorite Islamic scholar'
        },
        fieldType: 'text',
        isRequired: false
      },
      {
        fieldName: 'father_bank_loan',
        label: {
          bengali: 'ব্যাংক বা আর্থিক প্রতিষ্ঠানে ঋণ আছে?',
          english: 'Do you have any bank or financial institution loans?'
        },
        fieldType: 'boolean',
        isRequired: true
      },
      {
        fieldName: 'father_bank_deposit',
        label: {
          bengali: 'ব্যাংক বা আর্থিক প্রতিষ্ঠানে স্থায়ী আমানত আছে?',
          english: 'Do you have fixed deposits in bank or financial institutions?'
        },
        fieldType: 'boolean',
        isRequired: true
      },
      {
        fieldName: 'father_harmful_habits',
        label: {
          bengali: 'ধূমপান বা ক্ষতিকর খাবার/পানীয় আসক্তি আছে?',
          english: 'Do you have any smoking or harmful food/drink addictions?'
        },
        fieldType: 'boolean',
        isRequired: true
      },
      {
        fieldName: 'father_wake_time',
        label: {
          bengali: 'ঘুম থেকে ওঠার সময়',
          english: 'Wake up time'
        },
        fieldType: 'time',
        isRequired: true
      },
      {
        fieldName: 'father_sleep_time',
        label: {
          bengali: 'ঘুমানোর সময়',
          english: 'Sleep time'
        },
        fieldType: 'time',
        isRequired: true
      },
      {
        fieldName: 'father_islamic_clothing',
        label: {
          bengali: 'ইসলামী পোশাক (লিবাস) মেনে চলা',
          english: 'Following Islamic clothing (Libas)'
        },
        fieldType: 'checkbox',
        options: [
          { label: { bengali: 'ঢিলেঢালা পোশাক', english: 'Loose clothing' }, value: 'loose_clothing' },
          { label: { bengali: 'প্যান্ট গোড়ালির উপরে', english: 'Pants above ankle' }, value: 'pants_above_ankle' },
          { label: { bengali: 'দাড়ি', english: 'Beard' }, value: 'beard' },
          { label: { bengali: 'উপরোক্ত কোনটিই নয়', english: 'None of the above' }, value: 'none' }
        ],
        isRequired: true
      }
    ],
    motherFields: [
      {
        fieldName: 'mother_name',
        label: {
          bengali: 'মায়ের নাম',
          english: 'Mother\'s Name'
        },
        fieldType: 'text',
        isRequired: true
      },
      {
        fieldName: 'mother_name_english',
        label: {
          bengali: 'Mother\'s Name (English)',
          english: 'Mother\'s Name (English)'
        },
        fieldType: 'text',
        isRequired: true
      },
      {
        fieldName: 'mother_nationality',
        label: {
          bengali: 'জাতীয়তা (Nationality)',
          english: 'Nationality'
        },
        fieldType: 'text',
        isRequired: true
      },
      {
        fieldName: 'mother_education',
        label: {
          bengali: 'শিক্ষাগত যোগ্যতা',
          english: 'Educational Qualification'
        },
        fieldType: 'select',
        options: [
          { label: { bengali: 'এসএসসি', english: 'SSC' }, value: 'ssc' },
          { label: { bengali: 'এইচএসসি', english: 'HSC' }, value: 'hsc' },
          { label: { bengali: 'স্নাতক', english: 'Bachelor' }, value: 'bachelor' },
          { label: { bengali: 'স্নাতকোত্তর', english: 'Master\'s' }, value: 'masters' },
          { label: { bengali: 'পিএইচডি', english: 'PhD' }, value: 'phd' },
          { label: { bengali: 'অন্যান্য', english: 'Other' }, value: 'other' }
        ],
        isRequired: true
      },
      {
        fieldName: 'mother_occupation',
        label: {
          bengali: 'পেশার বিবরণ',
          english: 'Occupation'
        },
        fieldType: 'select',
        options: [
          { label: { bengali: 'গৃহিণী', english: 'Homemaker' }, value: 'homemaker' },
          { label: { bengali: 'ব্যবসায়ী', english: 'Business' }, value: 'business' },
          { label: { bengali: 'চাকরিজীবী', english: 'Service' }, value: 'service' },
          { label: { bengali: 'শিক্ষক', english: 'Teacher' }, value: 'teacher' },
          { label: { bengali: 'ডাক্তার', english: 'Doctor' }, value: 'doctor' },
          { label: { bengali: 'অন্যান্য', english: 'Other' }, value: 'other' }
        ],
        isRequired: true
      },
      {
        fieldName: 'mother_organization',
        label: {
          bengali: 'প্রতিষ্ঠান / ব্যবসার ধরণ (Organization)',
          english: 'Organization Type'
        },
        fieldType: 'text',
        isRequired: false
      },
      {
        fieldName: 'mother_designation',
        label: {
          bengali: 'পদবী (Designation)',
          english: 'Designation'
        },
        fieldType: 'text',
        isRequired: false
      },
      {
        fieldName: 'mother_income',
        label: {
          bengali: 'মাসিক আনুমানিক আয়',
          english: 'Monthly Income'
        },
        fieldType: 'text',
        isRequired: false
      },
      {
        fieldName: 'mother_expertise',
        label: {
          bengali: 'আপনি যে বিষয়ে অবিজ্ঞ (Expertise Field)',
          english: 'Your Area of Expertise'
        },
        fieldType: 'text',
        isRequired: false
      },
      // মায়ের মৌলিক ইসলামিক অনুশীলন (Mother's Basic Islamic Practices)
      {
        fieldName: 'mother_prayer_times',
        label: {
          bengali: 'আপনি কত ওয়াক্ত সলাহ সময়ের মধ্যে আদায় করেন?',
          english: 'How many daily prayers do you perform on time?'
        },
        fieldType: 'radio',
        options: [
          { label: { bengali: '৫ ওয়াক্ত', english: '5 times' }, value: '5_times' },
          { label: { bengali: '৪ ওয়াক্ত', english: '4 times' }, value: '4_times' },
          { label: { bengali: '৩ ওয়াক্ত', english: '3 times' }, value: '3_times' },
          { label: { bengali: '২ ওয়াক্ত', english: '2 times' }, value: '2_times' },
          { label: { bengali: '১ ওয়াক্ত', english: '1 time' }, value: '1_time' }
        ],
        isRequired: true
      },
      {
        fieldName: 'mother_prayer_location',
        label: {
          bengali: 'সলাহ কোথায় আদায় করেন?',
          english: 'Where do you perform prayers?'
        },
        fieldType: 'radio',
        options: [
          { label: { bengali: 'মসজিদে', english: 'At Mosque' }, value: 'mosque' },
          { label: { bengali: 'বাসায়', english: 'At Home' }, value: 'home' },
          { label: { bengali: 'অফিসে', english: 'At Office' }, value: 'office' }
        ],
        isRequired: true
      },
      {
        fieldName: 'mother_tahajjud',
        label: {
          bengali: 'আপনি কি সলাতুত তাহাজ্জুদ পড়েন?',
          english: 'Do you perform Tahajjud prayer?'
        },
        fieldType: 'radio',
        options: [
          { label: { bengali: 'নিয়মিত', english: 'Regularly' }, value: 'regularly' },
          { label: { bengali: 'অনিয়মিত', english: 'Irregularly' }, value: 'irregularly' },
          { label: { bengali: 'মাঝে মাঝে', english: 'Sometimes' }, value: 'sometimes' }
        ],
        isRequired: true
      },
      {
        fieldName: 'mother_quran_reading',
        label: {
          bengali: 'আপনি কি কুরআনুল কারীম পড়তে পারেন?',
          english: 'Can you read the Holy Quran?'
        },
        fieldType: 'boolean',
        isRequired: true
      },
      {
        fieldName: 'mother_daily_quran',
        label: {
          bengali: 'প্রতিদিন আল-কুরআনুল কারীম তেলাওয়াত করেন?',
          english: 'Do you recite the Holy Quran daily?'
        },
        fieldType: 'radio',
        options: [
          { label: { bengali: 'নিয়মিত', english: 'Regularly' }, value: 'regularly' },
          { label: { bengali: 'অনিয়মিত', english: 'Irregularly' }, value: 'irregularly' },
          { label: { bengali: 'মাঝে মাঝে', english: 'Sometimes' }, value: 'sometimes' }
        ],
        isRequired: true
      },
      {
        fieldName: 'mother_quran_quality',
        label: {
          bengali: 'কুরআন তেলাওয়াতের মান (১০ এর মধ্যে)',
          english: 'Quality of Quran recitation (out of 10)'
        },
        fieldType: 'select',
        options: [
          { label: { bengali: '১', english: '1' }, value: '1' },
          { label: { bengali: '২', english: '2' }, value: '2' },
          { label: { bengali: '৩', english: '3' }, value: '3' },
          { label: { bengali: '৪', english: '4' }, value: '4' },
          { label: { bengali: '৫', english: '5' }, value: '5' },
          { label: { bengali: '৬', english: '6' }, value: '6' },
          { label: { bengali: '৭', english: '7' }, value: '7' },
          { label: { bengali: '৮', english: '8' }, value: '8' },
          { label: { bengali: '৯', english: '9' }, value: '9' },
          { label: { bengali: '১০', english: '10' }, value: '10' }
        ],
        isRequired: true
      },
      {
        fieldName: 'mother_tv_at_home',
        label: {
          bengali: 'আপনার বাসায় কি টিভি আছে?',
          english: 'Do you have TV at home?'
        },
        fieldType: 'boolean',
        isRequired: true
      },
      {
        fieldName: 'mother_screen_time',
        label: {
          bengali: 'টিভি/ইন্টারনেট/মোবাইলের সাথে প্রতিদিন কত সময় ব্যয় করেন?',
          english: 'How much time do you spend daily with TV/Internet/Mobile?'
        },
        fieldType: 'select',
        options: [
          { label: { bengali: '১ ঘণ্টা', english: '1 hour' }, value: '1_hour' },
          { label: { bengali: '২ ঘণ্টা', english: '2 hours' }, value: '2_hours' },
          { label: { bengali: '৩ ঘণ্টা', english: '3 hours' }, value: '3_hours' },
          { label: { bengali: '৪ ঘণ্টা', english: '4 hours' }, value: '4_hours' },
          { label: { bengali: '৫+ ঘণ্টা', english: '5+ hours' }, value: '5_plus_hours' }
        ],
        isRequired: true
      },
      {
        fieldName: 'mother_leisure_activity',
        label: {
          bengali: 'অবসর সময়ে আপনি কী করেন?',
          english: 'What do you do in your leisure time?'
        },
        fieldType: 'radio',
        options: [
          { label: { bengali: 'ইসলামিক স্টাডি', english: 'Islamic Studies' }, value: 'islamic_studies' },
          { label: { bengali: 'সাধারণ অধ্যয়ন', english: 'General Study' }, value: 'general_study' },
          { label: { bengali: 'টিভি', english: 'TV' }, value: 'tv' },
          { label: { bengali: 'অন্যান্য', english: 'Other' }, value: 'other' }
        ],
        isRequired: true
      },
      {
        fieldName: 'mother_time_with_children',
        label: {
          bengali: 'প্রতিদিন গড়ে সন্তানদের সাথে সময়',
          english: 'Average daily time with children'
        },
        fieldType: 'radio',
        options: [
          { label: { bengali: '১ ঘণ্টা+', english: '1 hour+' }, value: '1_hour_plus' },
          { label: { bengali: '৩০ মিনিট-', english: '30 minutes-' }, value: '30_minutes_minus' },
          { label: { bengali: 'নিয়মিত নয়', english: 'Not regular' }, value: 'not_regular' }
        ],
        isRequired: true
      },
      {
        fieldName: 'mother_favorite_scholar',
        label: {
          bengali: 'প্রিয় ইসলামী পণ্ডিতের নাম',
          english: 'Name of favorite Islamic scholar'
        },
        fieldType: 'text',
        isRequired: false
      },
      {
        fieldName: 'mother_islamic_clothing',
        label: {
          bengali: 'ইসলামী পোশাক (লিবাস) মেনে চলা',
          english: 'Following Islamic clothing (Libas)'
        },
        fieldType: 'checkbox',
        options: [
          { label: { bengali: 'আবায়া/জিলবাব/বোরকা', english: 'Abaya/Jilbab/Burqa' }, value: 'abaya_jilbab_burqa' },
          { label: { bengali: 'নিকাব', english: 'Niqab' }, value: 'niqab' },
          { label: { bengali: 'হাত মোজা', english: 'Hand gloves' }, value: 'hand_gloves' },
          { label: { bengali: 'মোজা', english: 'Socks' }, value: 'socks' },
          { label: { bengali: 'উপরোক্ত কোনটিই নয়', english: 'None of the above' }, value: 'none' }
        ],
        isRequired: true
      }
    ]
  },
  contactInfoFields: [
    {
      fieldName: 'residential_address',
      label: {
        bengali: 'আবাসিক ঠিকানা',
        english: 'Residential Address'
      },
      fieldType: 'textarea',
      isRequired: true
    },
    {
      fieldName: 'father_phone',
      label: {
        bengali: 'মোবাইল ফোন নম্বর (পিতা)',
        english: 'Mobile Phone Number (Father)'
      },
      fieldType: 'tel',
      isRequired: true
    },
    {
      fieldName: 'mother_phone',
      label: {
        bengali: 'মোবাইল ফোন নম্বর (মাতা)',
        english: 'Mobile Phone Number (Mother)'
      },
      fieldType: 'tel',
      isRequired: true
    },
    {
      fieldName: 'email',
      label: {
        bengali: 'ইমেইল',
        english: 'Email'
      },
      fieldType: 'email',
      isRequired: true
    }
  ],
  declarationText: {
    bengali: `মাদরাসাতুল কুরআন একটি সম্পূর্ণ ইসলামিক শিক্ষা প্রতিষ্ঠান। এখানে ইসলামিক শিক্ষার পাশাপাশি আধুনিক শিক্ষাও প্রদান করা হয়। আমি ঘোষণা করছি যে উপরে প্রদত্ত সকল তথ্য সঠিক ও সত্য। আমি জানি যে ভুল তথ্য প্রদানের ক্ষেত্রে ভর্তি বাতিল হতে পারে।`,
    english: `Madrasatul Quran is a complete Islamic educational institution. Here, along with Islamic education, modern education is also provided. I declare that all the information provided above is correct and true. I understand that providing false information may result in cancellation of admission.`
  },
  successMessage: {
    bengali: 'আপনার আবেদন সফলভাবে জমা দেওয়া হয়েছে। আমরা শীঘ্রই আপনার সাথে যোগাযোগ করব।',
    english: 'Your application has been submitted successfully. We will contact you soon.'
  }
};

async function populatePreAdmissionForm() {
  try {
    console.log('🚀 Starting pre-admission form data population...');

    // Create Sanity client inside the function after env vars are loaded
    const client = createClient({
      projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
      dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
      apiVersion: '2024-01-01',
      useCdn: false,
      token: process.env.SANITY_API_TOKEN,
    });

    // Debug environment variables
    console.log('🔧 Using project ID:', process.env.NEXT_PUBLIC_SANITY_PROJECT_ID);
    console.log('🔧 Using dataset:', process.env.NEXT_PUBLIC_SANITY_DATASET);
    console.log('🔧 API Token length:', process.env.SANITY_API_TOKEN?.length || 0);

    // Check if form already exists
    const existingForm = await client.fetch('*[_type == "preAdmissionForm"][0]');
    
    if (existingForm) {
      console.log('📋 Pre-admission form already exists:', existingForm._id);
      console.log('🔄 Updating existing form...');
      
      const updatedForm = await client
        .patch(existingForm._id)
        .set(defaultFormConfig)
        .commit();

      console.log('✅ Pre-admission form updated successfully!');
    } else {
      console.log('📝 Creating new pre-admission form...');
      
      const newForm = await client
        .create({
          _type: 'preAdmissionForm',
          ...defaultFormConfig
        });

      console.log('✅ Pre-admission form created successfully!');
    }

    console.log('📊 Form Configuration:');
    console.log('   - Form Title (Bengali):', defaultFormConfig.formSettings.formTitle.bengali);
    console.log('   - Form Title (English):', defaultFormConfig.formSettings.formTitle.english);
    console.log('   - Submission Date:', defaultFormConfig.formSettings.submissionDate);
    console.log('   - General Questions:', defaultFormConfig.generalQuestions.length);
    console.log('   - Student Info Fields:', defaultFormConfig.studentInfoFields.length);
    console.log('   - Father Info Fields (including Islamic practices):', defaultFormConfig.parentInfoFields.fatherFields.length);
    console.log('   - Mother Info Fields (including Islamic practices):', defaultFormConfig.parentInfoFields.motherFields.length);
    console.log('   - Contact Info Fields:', defaultFormConfig.contactInfoFields.length);

    console.log('\n🎉 Pre-admission form data population completed successfully!');
    console.log('💡 You can now manage the form from the Sanity Studio at /studio');
    console.log('⚠️  Remember to update the Google Sheets ID in the form settings!');

  } catch (error) {
    console.error('❌ Error populating pre-admission form data:', error);
    process.exit(1);
  }
}

// Run the script
populatePreAdmissionForm();
