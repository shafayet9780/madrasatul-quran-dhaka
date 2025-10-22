const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

/**
 * Google Sheets client for fetching pre-admission form submissions
 */
class GoogleSheetsClient {
  constructor() {
    this.sheets = null;
    this.formQuestions = null; // Optional - loaded for future use
    this.init();
  }

  async init() {
    try {
      // Load form questions configuration (optional - for future use)
      try {
        const formQuestionsPath = path.join(
          __dirname,
          '../pre-admission-form-questions.json'
        );
        this.formQuestions = JSON.parse(
          fs.readFileSync(formQuestionsPath, 'utf8')
        );
        console.log('📋 Form questions loaded');
      } catch (formError) {
        console.log(
          '⚠️ Form questions not found or invalid - continuing without them'
        );
        this.formQuestions = null;
      }

      // Initialize Google Sheets API
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

      this.sheets = google.sheets({ version: 'v4', auth });
      console.log('✅ Google Sheets client initialized');
    } catch (error) {
      console.error('❌ Error initializing Google Sheets client:', error);
      throw error;
    }
  }

  /**
   * Fetch all form submissions from Google Sheets
   * @returns {Promise<Array>} Array of submission objects
   */
  async fetchSubmissions() {
    try {
      console.log('📡 Fetching submissions from Google Sheets...');

      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: process.env.FORM_GOOGLE_SHEETS_ID,
        range: 'A:BB', // Get all columns
      });

      if (!response.data.values || response.data.values.length < 3) {
        console.log('⚠️ No submissions found in Google Sheets');
        return [];
      }

      // First row: field keys, Second row: display headers, Third row+: data
      const fieldKeys = response.data.values[0];
      const displayHeaders = response.data.values[1];
      const dataRows = response.data.values.slice(2);

      console.log(`📊 Found ${dataRows.length} submissions`);

      // Process each submission
      const submissions = dataRows
        .map((row, index) => {
          const submission = this.parseSubmission(row, fieldKeys, index + 3); // +3 for 1-based indexing
          return submission;
        })
        .filter(submission => submission !== null);

      console.log(`✅ Processed ${submissions.length} valid submissions`);
      return submissions;
    } catch (error) {
      console.error('❌ Error fetching submissions:', error);
      throw error;
    }
  }

  /**
   * Parse a single submission row
   * @param {Array} row - The data row
   * @param {Array} fieldKeys - The field keys from header row
   * @param {number} rowNumber - The row number for error reporting
   * @returns {Object|null} Parsed submission or null if invalid
   */
  parseSubmission(row, fieldKeys, rowNumber) {
    try {
      const submission = {
        rowNumber,
        timestamp: '',
        studentName: '',
        studentNameEnglish: '',
        desiredClass: '',
        fatherName: '',
        motherName: '',
        email: '',
        phone: '',
        rawData: {},
        sections: {
          general: {},
          student: {},
          assessment: {},
          father: {},
          mother: {},
          additional: {},
          contact: {},
        },
      };

      // Map each field to its value
      fieldKeys.forEach((fieldKey, index) => {
        const value = row[index] || '';
        submission.rawData[fieldKey] = value;

        // Extract key information for display
        if (fieldKey === 'timestamp') {
          submission.timestamp = value;
        } else if (fieldKey === 'student_name_bengali') {
          submission.studentName = value;
        } else if (fieldKey === 'student_name_english') {
          submission.studentNameEnglish = value;
        } else if (fieldKey === 'father_name') {
          submission.fatherName = value;
        } else if (fieldKey === 'mother_name') {
          submission.motherName = value;
        } else if (fieldKey === 'email') {
          submission.email = value;
        } else if (fieldKey === 'father_phone') {
          submission.phone = value;
        }

        // Categorize fields by section
        this.categorizeField(fieldKey, value, submission.sections);
      });

      // Validate required fields
      if (!submission.studentName || !submission.timestamp) {
        console.log(`⚠️ Skipping row ${rowNumber}: Missing required fields`);
        return null;
      }

      return submission;
    } catch (error) {
      console.error(`❌ Error parsing row ${rowNumber}:`, error);
      return null;
    }
  }

  /**
   * Categorize fields into sections
   * @param {string} fieldKey - The field key
   * @param {string} value - The field value
   * @param {Object} sections - The sections object to populate
   */
  categorizeField(fieldKey, value, sections) {
    // General questions
    if (
      fieldKey.startsWith('general_') &&
      fieldKey !== 'general_subjects_level'
    ) {
      sections.general[fieldKey] = value;
    }
    // Student information
    else if (
      fieldKey.startsWith('student_') ||
      [
        'student_name_bengali',
        'student_name_english',
        'student_gender',
        'date_of_birth',
        'desired_class',
        'last_class_attended',
        'previous_school',
        'student_birth_registration',
      ].includes(fieldKey)
    ) {
      sections.student[fieldKey] = value;
    }
    // Student assessment
    else if (
      [
        'quran_level',
        'arabic_level',
        'general_subjects_level',
        'obeying_parents',
        'purpose_of_study',
      ].includes(fieldKey)
    ) {
      sections.assessment[fieldKey] = value;
    }
    // Father information
    else if (
      (fieldKey.startsWith('father_') ||
        ['father_name', 'father_name_english'].includes(fieldKey)) &&
      fieldKey !== 'father_phone'
    ) {
      sections.father[fieldKey] = value;
    }
    // Mother information
    else if (
      (fieldKey.startsWith('mother_') ||
        ['mother_name', 'mother_name_english'].includes(fieldKey)) &&
      fieldKey !== 'mother_phone'
    ) {
      sections.mother[fieldKey] = value;
    }
    // Additional information
    else if (
      ['transport_requirement', 'transport_location', 'comments'].includes(
        fieldKey
      )
    ) {
      sections.additional[fieldKey] = value;
    }
    // Contact information
    else if (
      ['present_address', 'father_phone', 'mother_phone', 'email'].includes(
        fieldKey
      )
    ) {
      sections.contact[fieldKey] = value;
    }
  }

  /**
   * Get submission by row number
   * @param {number} rowNumber - The row number
   * @returns {Promise<Object|null>} The submission or null
   */
  async getSubmissionByRow(rowNumber) {
    try {
      const submissions = await this.fetchSubmissions();
      return submissions.find(sub => sub.rowNumber === rowNumber) || null;
    } catch (error) {
      console.error('❌ Error fetching submission by row:', error);
      return null;
    }
  }
}

module.exports = GoogleSheetsClient;
