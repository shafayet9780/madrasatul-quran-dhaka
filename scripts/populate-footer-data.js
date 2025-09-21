const { createClient } = require('@sanity/client');
const { config } = require('dotenv');
const { resolve } = require('path');

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') });

/**
 * Footer Data Population Script (Updated for Global Settings Integration)
 * 
 * This script creates a footer document that references global settings from Site Settings
 * instead of duplicating contact information, social media links, and prayer times.
 * 
 * Benefits:
 * - Ensures consistency across the website
 * - Reduces data duplication
 * - Makes updates easier (update once in Site Settings, reflects everywhere)
 */

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN,
  useCdn: false,
});

// Footer data to populate
const footerData = {
  _type: 'footer',
  title: {
    bengali: 'মাদরাসাতুল কুরআন',
    english: 'Madrasatul Quran'
  },
  subtitle: {
    bengali: 'ইসলামিক শিক্ষায় উৎকর্ষতা',
    english: 'Excellence in Islamic Education'
  },
  description: {
    bengali: 'কুরআন ও সুন্নাহর আলোকে শিক্ষার্থীদের চরিত্র গঠন এবং আধুনিক শিক্ষায় দক্ষতা অর্জনের মাধ্যমে একটি আদর্শ মুসলিম সমাজ গড়ে তোলা। আমরা বিশ্বাস করি যে প্রতিটি শিশুই আল্লাহর বিশেষ দান এবং তাদের প্রতিভা বিকাশের জন্য আমাদের দায়িত্ব।',
    english: 'Building an ideal Muslim society through character development of students in the light of Quran and Sunnah and achieving excellence in modern education. We believe that every child is a special gift from Allah and it is our responsibility to nurture their talents.'
  },
  // Use global settings from Site Settings instead of duplicating data
  useGlobalContactInfo: true,
  useGlobalSocialLinks: true,
  quickLinks: [
    {
      label: {
        bengali: 'হোম',
        english: 'Home'
      },
      url: '/',
      isActive: true,
      order: 1
    },
    {
      label: {
        bengali: 'আমাদের সম্পর্কে',
        english: 'About'
      },
      url: '/about',
      isActive: true,
      order: 2
    },
    {
      label: {
        bengali: 'প্রোগ্রাম',
        english: 'Programs'
      },
      url: '/programs',
      isActive: true,
      order: 3
    },
    {
      label: {
        bengali: 'ভর্তি',
        english: 'Admissions'
      },
      url: '/admissions',
      isActive: true,
      order: 4
    },
    {
      label: {
        bengali: 'ক্যাম্পাস',
        english: 'Campus'
      },
      url: '/campus',
      isActive: true,
      order: 5
    },
    {
      label: {
        bengali: 'সংবাদ',
        english: 'News'
      },
      url: '/news',
      isActive: true,
      order: 6
    },
    {
      label: {
        bengali: 'যোগাযোগ',
        english: 'Contact'
      },
      url: '/contact',
      isActive: true,
      order: 7
    }
  ],
  legalLinks: [
    {
      label: {
        bengali: 'গোপনীয়তা নীতি',
        english: 'Privacy Policy'
      },
      url: '/privacy',
      isActive: true
    },
    {
      label: {
        bengali: 'ব্যবহারের শর্তাবলী',
        english: 'Terms of Service'
      },
      url: '/terms',
      isActive: true
    },
    {
      label: {
        bengali: 'সাইটম্যাপ',
        english: 'Sitemap'
      },
      url: '/sitemap',
      isActive: true
    }
  ],
  copyright: {
    bengali: '© ২০২৪ মাদরাসাতুল কুরআন। সর্বস্বত্ব সংরক্ষিত।',
    english: '© 2024 Madrasatul Quran. All rights reserved.'
  },
  isActive: true
};

async function populateFooterData() {
  try {
    console.log('🚀 Starting footer data population...');
    
    // Check if footer already exists
    const existingFooter = await client.fetch(
      `*[_type == "footer" && isActive == true][0]`
    );

    if (existingFooter) {
      console.log('⚠️  Footer already exists. Updating existing footer...');
      
      // Update existing footer
      const updatedFooter = await client
        .patch(existingFooter._id)
        .set(footerData)
        .commit();
      
      console.log('✅ Footer updated successfully!');
      console.log('📄 Footer ID:', updatedFooter._id);
    } else {
      console.log('📝 Creating new footer...');
      
      // Create new footer
      const newFooter = await client.create(footerData);
      
      console.log('✅ Footer created successfully!');
      console.log('📄 Footer ID:', newFooter._id);
    }

    console.log('\n📋 Footer data summary:');
    console.log('   • Title:', footerData.title.english);
    console.log('   • Uses Global Contact Info:', footerData.useGlobalContactInfo);
    console.log('   • Uses Global Social Links:', footerData.useGlobalSocialLinks);
    console.log('   • Quick Links:', footerData.quickLinks.length);
    console.log('   • Legal Links:', footerData.legalLinks.length);

    console.log('\n🎉 Footer data population completed successfully!');
    console.log('🌐 You can now view the footer on your website.');
    
  } catch (error) {
    console.error('❌ Error populating footer data:', error);
    console.error('Error details:', error.message);
    
    if (error.message.includes('token')) {
      console.log('\n💡 Make sure you have set the SANITY_API_TOKEN environment variable with write permissions.');
    }
    
    process.exit(1);
  }
}

// Run the script
populateFooterData();

