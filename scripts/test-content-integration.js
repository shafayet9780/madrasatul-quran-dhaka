/**
 * Simple JavaScript test script for content management integration
 * This can run without additional TypeScript dependencies
 */

const { createClient } = require('@sanity/client');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN,
  useCdn: false,
});

async function testContentIntegration() {
  console.log('🧪 Testing Content Management Integration...\n');

  try {
    // Test 1: Site Settings
    console.log('1. Testing Site Settings...');
    const siteSettings = await client.fetch('*[_type == "siteSettings"][0]');
    if (siteSettings) {
      console.log('✅ Site Settings loaded successfully');
      console.log(`   - Title (Bengali): ${siteSettings.title?.bengali}`);
      console.log(`   - Title (English): ${siteSettings.title?.english}`);
      console.log(`   - Total Students: ${siteSettings.statistics?.totalStudents}`);
    } else {
      console.log('❌ Site Settings not found');
    }

    // Test 2: News Events
    console.log('\n2. Testing News Events...');
    const newsEvents = await client.fetch('*[_type == "newsEvent"] | order(publishedAt desc)');
    console.log(`✅ Found ${newsEvents.length} news events`);
    if (newsEvents.length > 0) {
      const firstEvent = newsEvents[0];
      console.log(`   - First event: ${firstEvent.title?.english || firstEvent.title?.bengali}`);
      console.log(`   - Category: ${firstEvent.category}`);
      console.log(`   - Featured: ${firstEvent.featured}`);
    }

    // Test 3: Featured News
    console.log('\n3. Testing Featured News...');
    const featuredNews = await client.fetch('*[_type == "newsEvent" && featured == true] | order(publishedAt desc) [0...3]');
    console.log(`✅ Found ${featuredNews.length} featured news events`);

    // Test 4: Academic Programs
    console.log('\n4. Testing Academic Programs...');
    const programs = await client.fetch('*[_type == "academicProgram"] | order(order asc)');
    console.log(`✅ Found ${programs.length} academic programs`);
    if (programs.length > 0) {
      const firstProgram = programs[0];
      console.log(`   - First program: ${firstProgram.title?.english || firstProgram.title?.bengali}`);
      console.log(`   - Age Range: ${firstProgram.ageRange}`);
    }

    // Test 5: Facilities
    console.log('\n6. Testing Facilities...');
    const facilities = await client.fetch('*[_type == "facility"] | order(displayOrder asc)');
    console.log(`✅ Found ${facilities.length} facilities`);
    
    const featuredFacilities = await client.fetch('*[_type == "facility" && featured == true] | order(displayOrder asc)');
    console.log(`✅ Found ${featuredFacilities.length} featured facilities`);

    // Test 7: Translation Tasks
    console.log('\n7. Testing Translation Tasks...');
    const translationTasks = await client.fetch('*[_type == "translationTask"]');
    console.log(`✅ Found ${translationTasks.length} translation tasks`);

    console.log('\n🎉 All content integration tests completed successfully!');
    console.log('\nSummary:');
    console.log(`- Site Settings: ${siteSettings ? '✅' : '❌'}`);
    console.log(`- News Events: ${newsEvents.length} items`);
    console.log(`- Featured News: ${featuredNews.length} items`);
    console.log(`- Academic Programs: ${programs.length} items`);
    console.log(`- Staff Members: ${staff.length} items`);
    console.log(`- Leadership Team: ${leadership.length} items`);
    console.log(`- Facilities: ${facilities.length} items`);
    console.log(`- Featured Facilities: ${featuredFacilities.length} items`);
    console.log(`- Translation Tasks: ${translationTasks.length} items`);

    if (newsEvents.length === 0 && programs.length === 0 && staff.length === 0) {
      console.log('\n💡 No content found. Run "npm run populate-sanity populate" to add sample data.');
    }

  } catch (error) {
    console.error('❌ Content integration test failed:', error.message);
    
    if (error.message.includes('projectId')) {
      console.error('\n💡 Make sure your .env.local file has the correct Sanity configuration:');
      console.error('   - NEXT_PUBLIC_SANITY_PROJECT_ID');
      console.error('   - NEXT_PUBLIC_SANITY_DATASET');
      console.error('   - SANITY_API_TOKEN');
    }
    
    process.exit(1);
  }
}

async function testConnection() {
  console.log('🔌 Testing Sanity connection...');
  
  try {
    await client.fetch('*[_type == "siteSettings"][0]');
    console.log('✅ Sanity connection successful');
    return true;
  } catch (error) {
    console.error('❌ Failed to connect to Sanity:', error.message);
    return false;
  }
}

async function main() {
  const command = process.argv[2];
  
  switch (command) {
    case 'connection':
      await testConnection();
      break;
    case 'content':
    default:
      const connected = await testConnection();
      if (connected) {
        await testContentIntegration();
      }
      break;
  }
}

// Run the script
if (require.main === module) {
  main().catch(console.error);
}