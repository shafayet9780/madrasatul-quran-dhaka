import { client } from '../src/lib/sanity/client';

/**
 * Script to populate the admission banner configuration in Sanity CMS
 * Run this script to set up the default banner configuration
 */

const bannerConfig = {
  isEnabled: true,
  title: {
    bengali: '২০২৬ শিক্ষাবর্ষে ভর্তি চলছে',
    english: 'Admissions Open for 2026 Academic Year'
  },
  subtitle: {
    bengali: 'আজই আবেদন করুন',
    english: 'Apply Now'
  },
  buttonText: {
    bengali: 'আবেদন করুন',
    english: 'Apply Now'
  },
  buttonLink: '/contact',
  backgroundColor: 'primary',
  showCloseButton: true,
  autoHide: 0 // Never auto-hide
};

async function populateBannerData() {
  try {
    console.log('🚀 Starting banner data population...');

    // First, get the current site settings
    const currentSettings = await client.fetch('*[_type == "siteSettings"][0]');
    
    if (!currentSettings) {
      console.error('❌ No site settings found. Please create site settings first.');
      return;
    }

    console.log('📋 Current site settings found:', currentSettings._id);

    // Update the site settings with banner configuration
    const updatedSettings = await client
      .patch(currentSettings._id)
      .set({
        admissionBanner: bannerConfig
      })
      .commit();

    console.log('✅ Banner configuration updated successfully!');
    console.log('📊 Banner Configuration:');
    console.log('   - Enabled:', bannerConfig.isEnabled);
    console.log('   - Title (Bengali):', bannerConfig.title.bengali);
    console.log('   - Title (English):', bannerConfig.title.english);
    console.log('   - Subtitle (Bengali):', bannerConfig.subtitle.bengali);
    console.log('   - Subtitle (English):', bannerConfig.subtitle.english);
    console.log('   - Button Text (Bengali):', bannerConfig.buttonText.bengali);
    console.log('   - Button Text (English):', bannerConfig.buttonText.english);
    console.log('   - Button Link:', bannerConfig.buttonLink);
    console.log('   - Background Color:', bannerConfig.backgroundColor);
    console.log('   - Show Close Button:', bannerConfig.showCloseButton);
    console.log('   - Auto Hide (seconds):', bannerConfig.autoHide);

    console.log('\n🎉 Banner data population completed successfully!');
    console.log('💡 You can now manage the banner from the Sanity Studio at /studio');

  } catch (error) {
    console.error('❌ Error populating banner data:', error);
    process.exit(1);
  }
}

// Run the script
populateBannerData();
