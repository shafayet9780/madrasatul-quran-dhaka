/**
 * Test script for Google Sheets integration
 * Run with: node scripts/test-google-sheets.js
 */

const { google } = require('googleapis');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

async function testGoogleSheetsConnection() {
  console.log('🔍 Testing Google Sheets connection...\n');

  // Check required environment variables
  const requiredVars = [
    'GOOGLE_PROJECT_ID',
    'GOOGLE_PRIVATE_KEY_ID',
    'GOOGLE_PRIVATE_KEY',
    'GOOGLE_CLIENT_EMAIL',
    'GOOGLE_CLIENT_ID',
    'FORM_GOOGLE_SHEETS_ID'
  ];

  console.log('📋 Checking environment variables:');
  const missingVars = [];
  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      missingVars.push(varName);
      console.log(`❌ ${varName}: MISSING`);
    } else {
      console.log(`✅ ${varName}: SET`);
    }
  }

  if (missingVars.length > 0) {
    console.log('\n❌ Missing required environment variables:');
    missingVars.forEach(v => console.log(`   - ${v}`));
    console.log('\nPlease set these in your .env.local file');
    return;
  }

  console.log('\n🚀 Attempting to connect to Google Sheets...');

  try {
    // Initialize Google Sheets API client
    const auth = new google.auth.GoogleAuth({
      credentials: {
        type: 'service_account',
        project_id: process.env.GOOGLE_PROJECT_ID,
        private_key_id: process.env.GOOGLE_PRIVATE_KEY_ID,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        client_id: process.env.GOOGLE_CLIENT_ID,
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });

    // Test data to append
    const testData = [
      new Date().toISOString(),
      'Test Student Name',
      'test@example.com',
      'Test submission from script'
    ];

    console.log('📤 Attempting to append test data...');

    // Append test data
    const response = await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.FORM_GOOGLE_SHEETS_ID,
      range: 'A:D', // Adjust range as needed
      valueInputOption: 'RAW',
      requestBody: {
        values: [testData],
      },
    });

    console.log('✅ Success! Data appended to Google Sheets');
    console.log('📊 Response:', response.data);

    // Get current sheet data to verify
    console.log('\n📖 Reading current sheet data...');
    const readResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.FORM_GOOGLE_SHEETS_ID,
      range: 'A1:D10', // Read first 10 rows
    });

    console.log('📋 Current sheet data:');
    if (readResponse.data.values) {
      readResponse.data.values.forEach((row, index) => {
        console.log(`${index + 1}: ${row.join(' | ')}`);
      });
    } else {
      console.log('No data found in sheet');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);

    if (error.message.includes('PERMISSION_DENIED')) {
      console.log('\n🔐 Permission Error Solutions:');
      console.log('1. Check if service account email is added to sheet sharing');
      console.log('2. Verify the email has "Editor" permissions');
      console.log('3. Ensure spreadsheet ID is correct');
    }

    if (error.message.includes('invalid_grant')) {
      console.log('\n🔑 Authentication Error Solutions:');
      console.log('1. Verify all environment variables are correct');
      console.log('2. Check private key format (should have proper newlines)');
      console.log('3. Ensure service account is not disabled');
    }
  }
}

// Run the test
testGoogleSheetsConnection().catch(console.error);
