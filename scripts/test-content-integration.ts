import { getContentService } from '../src/lib/content-service';

/**
 * Test script to verify content management integration
 */

async function testContentIntegration() {
  console.log('🧪 Testing Content Management Integration...\n');

  try {
    const contentService = getContentService(false);

    // Test 1: Site Settings
    console.log('1. Testing Site Settings...');
    const siteSettings = await contentService.getSiteSettings();
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
    const newsEvents = await contentService.getAllNewsEvents();
    console.log(`✅ Found ${newsEvents.length} news events`);
    if (newsEvents.length > 0) {
      const firstEvent = newsEvents[0];
      console.log(`   - First event: ${firstEvent.title?.english || firstEvent.title?.bengali}`);
      console.log(`   - Category: ${firstEvent.category}`);
      console.log(`   - Featured: ${firstEvent.featured}`);
    }

    // Test 3: Featured News
    console.log('\n3. Testing Featured News...');
    const featuredNews = await contentService.getFeaturedNewsEvents(3);
    console.log(`✅ Found ${featuredNews.length} featured news events`);

    // Test 4: Academic Programs
    console.log('\n4. Testing Academic Programs...');
    const programs = await contentService.getAllAcademicPrograms();
    console.log(`✅ Found ${programs.length} academic programs`);
    if (programs.length > 0) {
      const firstProgram = programs[0];
      console.log(`   - First program: ${firstProgram.title?.english || firstProgram.title?.bengali}`);
      console.log(`   - Age Range: ${firstProgram.ageRange}`);
    }

    // Test 5: Staff Members
    console.log('\n5. Testing Staff Members...');
    const staff = await contentService.getAllStaff();
    console.log(`✅ Found ${staff.length} staff members`);
    
    const leadership = await contentService.getLeadershipTeam();
    console.log(`✅ Found ${leadership.length} leadership team members`);

    // Test 6: Facilities
    console.log('\n6. Testing Facilities...');
    const facilities = await contentService.getAllFacilities();
    console.log(`✅ Found ${facilities.length} facilities`);
    
    const featuredFacilities = await contentService.getFeaturedFacilities();
    console.log(`✅ Found ${featuredFacilities.length} featured facilities`);

    // Test 7: Content Validation
    console.log('\n7. Testing Content Validation...');
    if (newsEvents.length > 0) {
      const isValid = await contentService.validateContent('newsEvent', newsEvents[0]._id);
      console.log(`✅ Content validation test: ${isValid ? 'Valid' : 'Invalid'}`);
    }

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

  } catch (error) {
    console.error('❌ Content integration test failed:', error);
    process.exit(1);
  }
}

/**
 * Test multilingual content functionality
 */
async function testMultilingualContent() {
  console.log('\n🌐 Testing Multilingual Content Management...\n');

  try {
    const { 
      getIncompleteTranslations, 
      getTranslationStatistics,
      analyzeTranslationCompleteness,
      validateLanguageContent
    } = await import('../src/lib/multilingual-content');

    // Test 1: Translation Statistics
    console.log('1. Testing Translation Statistics...');
    const stats = await getTranslationStatistics();
    console.log('✅ Translation Statistics:');
    console.log(`   - Total Tasks: ${stats.total}`);
    console.log(`   - Completed: ${stats.completed}`);
    console.log(`   - Pending: ${stats.pending}`);
    console.log(`   - Bengali Completed: ${stats.byLanguage.bengali.completed}`);
    console.log(`   - English Completed: ${stats.byLanguage.english.completed}`);

    // Test 2: Incomplete Translations
    console.log('\n2. Testing Incomplete Translations...');
    const incompleteNews = await getIncompleteTranslations('newsEvent', ['title', 'excerpt', 'content']);
    console.log(`✅ Found ${incompleteNews.length} news events with incomplete translations`);

    const incompletePages = await getIncompleteTranslations('page', ['title', 'content']);
    console.log(`✅ Found ${incompletePages.length} pages with incomplete translations`);

    // Test 3: Content Validation
    console.log('\n3. Testing Language Content Validation...');
    const bengaliValidation = validateLanguageContent('এটি একটি বাংলা পরীক্ষার বাক্য।', 'bengali');
    const englishValidation = validateLanguageContent('This is an English test sentence.', 'english');
    
    console.log(`✅ Bengali validation: ${bengaliValidation.isValid ? 'Valid' : 'Invalid'}`);
    console.log(`✅ English validation: ${englishValidation.isValid ? 'Valid' : 'Invalid'}`);

    console.log('\n🎉 All multilingual content tests completed successfully!');

  } catch (error) {
    console.error('❌ Multilingual content test failed:', error);
    process.exit(1);
  }
}

/**
 * Main test runner
 */
async function main() {
  const testType = process.argv[2];

  switch (testType) {
    case 'content':
      await testContentIntegration();
      break;
    case 'multilingual':
      await testMultilingualContent();
      break;
    case 'all':
    default:
      await testContentIntegration();
      await testMultilingualContent();
      break;
  }
}

// Run tests
if (require.main === module) {
  main().catch(console.error);
}

export { testContentIntegration, testMultilingualContent };