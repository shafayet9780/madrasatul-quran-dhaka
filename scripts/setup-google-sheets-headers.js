/**
 * Script to populate Google Sheets headers from Sanity CMS pre-admission form configuration
 * This script reads the form structure from Sanity and creates appropriate headers in Google Sheets
 * 
 * Usage: node scripts/setup-google-sheets-headers.js
 * 
 * Features:
 * - Fetches form configuration from Sanity CMS
 * - Generates headers based on form fields
 * - Updates Google Sheets with proper column headers
 * - Supports multilingual field names
 * - Can be run anytime when form structure changes
 */

const { google } = require('googleapis');
const { createClient } = require('@sanity/client');
const { config } = require('dotenv');
const { resolve } = require('path');

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });

// Sanity client
const sanityClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN,
  useCdn: false,
});

// Google Sheets client setup
function getGoogleSheetsClient() {
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

  return google.sheets({ version: 'v4', auth });
}

// Helper function to get localized text
function getLocalizedText(textObj, locale = 'english') {
  if (!textObj) return '';
  return textObj[locale] || textObj.english || textObj.bengali || '';
}

// Helper function to convert number to Excel column letter (A, B, C, ..., Z, AA, AB, etc.)
function numberToColumnLetter(num) {
  let result = '';
  while (num > 0) {
    num--; // Adjust for 0-based indexing
    result = String.fromCharCode(65 + (num % 26)) + result;
    num = Math.floor(num / 26);
  }
  return result;
}

// Generate headers from form configuration
function generateHeaders(formConfig, locale = 'english') {
  const fieldKeys = ['timestamp']; // Always start with timestamp
  const displayHeaders = ['Timestamp']; // Display version

  // Helper function to add field to headers
  function addFieldToHeaders(field, sectionName = '', fieldIndex = 0) {
    if (!field) return;

    let fieldKey = '';
    let displayLabel = '';
    
    // For fields with fieldName, use that as the key
    if (field.fieldName) {
      fieldKey = field.fieldName;
    } else if (field.question) {
      // For general questions, create a key from the question text
      // This must match the frontend getFieldKey logic exactly
      const questionText = getLocalizedText(field.question, locale);
      const cleanText = questionText.toLowerCase().replace(/[^a-z0-9]/g, '_');
      fieldKey = `general_${cleanText}_${fieldIndex}`;
    }

    // Get the display label
    if (field.label) {
      displayLabel = getLocalizedText(field.label, locale);
    } else if (field.question) {
      displayLabel = getLocalizedText(field.question, locale);
    } else {
      displayLabel = fieldKey;
    }

    // Add section prefix if provided
    if (sectionName) {
      displayLabel = `${sectionName} - ${displayLabel}`;
    }

    fieldKeys.push(fieldKey);
    displayHeaders.push(displayLabel);
  }

  // Process General Questions
  if (formConfig.generalQuestions && formConfig.generalQuestions.length > 0) {
    formConfig.generalQuestions.forEach((field, index) => {
      addFieldToHeaders(field, 'General', index);
    });
  }

  // Process Student Information Fields
  if (formConfig.studentInfoFields && formConfig.studentInfoFields.length > 0) {
    formConfig.studentInfoFields.forEach((field, index) => {
      addFieldToHeaders(field, 'Student', index);
    });
  }

  // Process Student Assessment Fields
  if (formConfig.studentAssessmentFields && formConfig.studentAssessmentFields.length > 0) {
    formConfig.studentAssessmentFields.forEach((field, index) => {
      addFieldToHeaders(field, 'Student Assessment', index);
    });
  }

  // Process Father's Information Fields
  if (formConfig.parentInfoFields?.fatherFields && formConfig.parentInfoFields.fatherFields.length > 0) {
    formConfig.parentInfoFields.fatherFields.forEach((field, index) => {
      addFieldToHeaders(field, 'Father', index);
    });
  }

  // Process Mother's Information Fields
  if (formConfig.parentInfoFields?.motherFields && formConfig.parentInfoFields.motherFields.length > 0) {
    formConfig.parentInfoFields.motherFields.forEach((field, index) => {
      addFieldToHeaders(field, 'Mother', index);
    });
  }

  // Process Additional Questions
  if (formConfig.additionalQuestions && formConfig.additionalQuestions.length > 0) {
    formConfig.additionalQuestions.forEach((field, index) => {
      addFieldToHeaders(field, 'Additional', index);
    });
  }

  // Process Contact Information Fields
  if (formConfig.contactInfoFields && formConfig.contactInfoFields.length > 0) {
    formConfig.contactInfoFields.forEach((field, index) => {
      addFieldToHeaders(field, 'Contact', index);
    });
  }

  // Add declaration field
  fieldKeys.push('declaration');
  displayHeaders.push('Declaration Accepted');

  return { fieldKeys, displayHeaders };
}

// Main function to setup Google Sheets headers
async function setupGoogleSheetsHeaders() {
  console.log('🚀 Starting Google Sheets headers setup...\n');

  try {
    // Check required environment variables
    const requiredVars = [
      'NEXT_PUBLIC_SANITY_PROJECT_ID',
      'NEXT_PUBLIC_SANITY_DATASET',
      'SANITY_API_TOKEN',
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

    // Fetch form configuration from Sanity
    console.log('\n📡 Fetching form configuration from Sanity...');
    const formConfig = await sanityClient.fetch(`
      *[_type == "preAdmissionForm"][0] {
        _id,
        formSettings {
          isEnabled,
          formTitle {
            bengali,
            english
          },
          formDescription {
            bengali,
            english
          },
          submissionDate,
          googleSheetsId
        },
        generalQuestions[] {
          question {
            bengali,
            english
          },
          fieldType,
          options[] {
            label {
              bengali,
              english
            },
            value
          },
          isRequired,
          placeholder {
            bengali,
            english
          },
          helpText {
            bengali,
            english
          }
        },
        studentInfoFields[] {
          fieldName,
          label {
            bengali,
            english
          },
          fieldType,
          options[] {
            label {
              bengali,
              english
            },
            value
          },
          isRequired,
          placeholder {
            bengali,
            english
          }
        },
        studentAssessmentFields[] {
          fieldName,
          label {
            bengali,
            english
          },
          fieldType,
          options[] {
            label {
              bengali,
              english
            },
            value
          },
          isRequired,
          placeholder {
            bengali,
            english
          }
        },
        parentInfoFields {
          fatherFields[] {
            fieldName,
            label {
              bengali,
              english
            },
            fieldType,
            options[] {
              label {
                bengali,
                english
              },
              value
            },
            isRequired,
            placeholder {
              bengali,
              english
            }
          },
          motherFields[] {
            fieldName,
            label {
              bengali,
              english
            },
            fieldType,
            options[] {
              label {
                bengali,
                english
              },
              value
            },
            isRequired,
            placeholder {
              bengali,
              english
            }
          }
        },
        additionalQuestions[] {
          fieldName,
          question {
            bengali,
            english
          },
          fieldType,
          options[] {
            label {
              bengali,
              english
            },
            value
          },
          isRequired,
          placeholder {
            bengali,
            english
          },
          helpText {
            bengali,
            english
          }
        },
        contactInfoFields[] {
          fieldName,
          label {
            bengali,
            english
          },
          fieldType,
          isRequired,
          placeholder {
            bengali,
            english
          }
        },
        declarationText {
          bengali,
          english
        },
        successMessage {
          bengali,
          english
        }
      }
    `);

    if (!formConfig) {
      console.log('❌ No form configuration found in Sanity CMS');
      return;
    }

    console.log('✅ Form configuration fetched successfully');
    console.log(`📝 Form Title: ${getLocalizedText(formConfig.formSettings.formTitle)}`);

    // Generate headers for English (primary language)
    console.log('\n📋 Generating headers...');
    const { fieldKeys, displayHeaders } = generateHeaders(formConfig, 'english');

    console.log(`📊 Generated ${fieldKeys.length} field keys and ${displayHeaders.length} display headers`);
    console.log('🔑 Field Keys:', fieldKeys.join(' | '));
    console.log('📝 Display Headers:', displayHeaders.join(' | '));

    // Initialize Google Sheets client
    console.log('\n🔗 Connecting to Google Sheets...');
    const sheets = getGoogleSheetsClient();

    // Update headers in Google Sheets
    console.log('📝 Updating Google Sheets headers...');
    
    // Calculate the proper range based on number of headers
    const endColumn = numberToColumnLetter(fieldKeys.length);
    const range = `A1:${endColumn}2`; // Two rows: keys and display headers
    
    console.log(`📊 Using range: ${range} for ${fieldKeys.length} columns`);
    
    // Update both rows: field keys (row 1) and display headers (row 2)
    await sheets.spreadsheets.values.update({
      spreadsheetId: process.env.FORM_GOOGLE_SHEETS_ID,
      range: range,
      valueInputOption: 'RAW',
      requestBody: {
        values: [fieldKeys, displayHeaders],
      },
    });

    // Format the header rows
    console.log('🎨 Formatting header rows...');
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: process.env.FORM_GOOGLE_SHEETS_ID,
      requestBody: {
        requests: [
          // Format row 1 (field keys) - light blue background
          {
            repeatCell: {
              range: {
                sheetId: 0,
                startRowIndex: 0,
                endRowIndex: 1,
                startColumnIndex: 0,
                endColumnIndex: fieldKeys.length,
              },
              cell: {
                userEnteredFormat: {
                  backgroundColor: {
                    red: 0.8,
                    green: 0.9,
                    blue: 1.0,
                  },
                  textFormat: {
                    foregroundColor: {
                      red: 0.0,
                      green: 0.0,
                      blue: 0.0,
                    },
                    bold: true,
                    fontSize: 10,
                  },
                },
              },
              fields: 'userEnteredFormat(backgroundColor,textFormat)',
            },
          },
          // Format row 2 (display headers) - dark blue background
          {
            repeatCell: {
              range: {
                sheetId: 0,
                startRowIndex: 1,
                endRowIndex: 2,
                startColumnIndex: 0,
                endColumnIndex: fieldKeys.length,
              },
              cell: {
                userEnteredFormat: {
                  backgroundColor: {
                    red: 0.2,
                    green: 0.4,
                    blue: 0.8,
                  },
                  textFormat: {
                    foregroundColor: {
                      red: 1.0,
                      green: 1.0,
                      blue: 1.0,
                    },
                    bold: true,
                    fontSize: 12,
                  },
                },
              },
              fields: 'userEnteredFormat(backgroundColor,textFormat)',
            },
          },
          {
            autoResizeDimensions: {
              dimensions: {
                sheetId: 0,
                dimension: 'COLUMNS',
                startIndex: 0,
                endIndex: fieldKeys.length,
              },
            },
          },
        ],
      },
    });

    console.log('✅ Google Sheets headers updated successfully!');
    console.log(`🔗 Sheet URL: https://docs.google.com/spreadsheets/d/${process.env.FORM_GOOGLE_SHEETS_ID}/edit`);
    
    console.log('\n📊 Summary:');
    console.log(`   - Total columns: ${fieldKeys.length}`);
    console.log(`   - Row 1: Field keys (light blue background)`);
    console.log(`   - Row 2: Display headers (dark blue background)`);
    console.log(`   - Row 3+: Form data will be inserted here`);
    console.log(`   - General questions: ${formConfig.generalQuestions?.length || 0}`);
    console.log(`   - Student fields: ${formConfig.studentInfoFields?.length || 0}`);
    console.log(`   - Student assessment fields: ${formConfig.studentAssessmentFields?.length || 0}`);
    console.log(`   - Father fields: ${formConfig.parentInfoFields?.fatherFields?.length || 0}`);
    console.log(`   - Mother fields: ${formConfig.parentInfoFields?.motherFields?.length || 0}`);
    console.log(`   - Additional questions: ${formConfig.additionalQuestions?.length || 0}`);
    console.log(`   - Contact fields: ${formConfig.contactInfoFields?.length || 0}`);

  } catch (error) {
    console.error('❌ Error setting up Google Sheets headers:', error);
    
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

// Run the script
if (require.main === module) {
  setupGoogleSheetsHeaders().catch(console.error);
}

module.exports = { setupGoogleSheetsHeaders, generateHeaders };
