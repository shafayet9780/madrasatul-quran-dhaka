const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

/**
 * Google Sheets client for fetching pre-admission form submissions
 */
class GoogleSheetsClient {
  constructor() {
    this.sheets = null;
    this.formQuestions = null;
    this.init();
  }

  async init() {
    try {
      // Load form questions configuration
      const formQuestionsPath = path.join(__dirname, '../pre-admission-form-questions.json');
      this.formQuestions = JSON.parse(fs.readFileSync(formQuestionsPath, 'utf8'));

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
      const submissions = dataRows.map((row, index) => {
        const submission = this.parseSubmission(row, fieldKeys, index + 3); // +3 for 1-based indexing
        return submission;
      }).filter(submission => submission !== null);

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
          contact: {}
        }
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
        } else if (fieldKey === 'desired_class') {
          submission.desiredClass = this.convertOptionValue(fieldKey, value);
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
    if (fieldKey.startsWith('general_')) {
      sections.general[fieldKey] = this.convertOptionValue(fieldKey, value);
    }
    // Student information
    else if (fieldKey.startsWith('student_') || ['student_name_bengali', 'student_name_english', 'student_gender', 'date_of_birth', 'desired_class', 'last_class_attended', 'previous_school', 'student_birth_registration'].includes(fieldKey)) {
      sections.student[fieldKey] = this.convertOptionValue(fieldKey, value);
    }
    // Student assessment
    else if (['quran_level', 'arabic_level', 'general_subjects_level', 'obeying_parents', 'purpose_of_study'].includes(fieldKey)) {
      sections.assessment[fieldKey] = this.convertOptionValue(fieldKey, value);
    }
    // Father information
    else if (fieldKey.startsWith('father_') || ['father_name', 'father_name_english'].includes(fieldKey)) {
      sections.father[fieldKey] = this.convertOptionValue(fieldKey, value);
    }
    // Mother information
    else if (fieldKey.startsWith('mother_') || ['mother_name', 'mother_name_english'].includes(fieldKey)) {
      sections.mother[fieldKey] = this.convertOptionValue(fieldKey, value);
    }
    // Additional information
    else if (['transport_requirement', 'transport_location', 'comments'].includes(fieldKey)) {
      sections.additional[fieldKey] = this.convertOptionValue(fieldKey, value);
    }
    // Contact information
    else if (['present_address', 'father_phone', 'mother_phone', 'email'].includes(fieldKey)) {
      sections.contact[fieldKey] = this.convertOptionValue(fieldKey, value);
    }
  }

  /**
   * Convert option values to display labels
   * @param {string} fieldKey - The field key
   * @param {string} value - The field value
   * @returns {string} The display label
   */
  convertOptionValue(fieldKey, value) {
    if (!value || !this.formQuestions) return value;

    // Handle boolean fields
    if (fieldKey.includes('obeying_parents') || fieldKey.includes('prayer_times') || fieldKey.includes('tv_at_home') || fieldKey.includes('smoking') || fieldKey.includes('mahram')) {
      if (value.toLowerCase() === 'yes' || value.toLowerCase() === 'true' || value === '1') {
        return 'হ্যাঁ';
      } else if (value.toLowerCase() === 'no' || value.toLowerCase() === 'false' || value === '0') {
        return 'না';
      }
      return value;
    }

    // Find the field configuration
    const field = this.findFieldByKey(fieldKey);
    if (!field || !field.options) {
      return value;
    }

    // Handle multiple values (checkbox fields)
    if (value.includes(', ')) {
      const values = value.split(', ');
      return values.map(v => {
        const option = field.options.find(opt => opt.value.toLowerCase() === v.trim().toLowerCase());
        return option ? option.label : v.trim();
      }).join(', ');
    }

    // Handle single values - case insensitive matching
    const option = field.options.find(opt => opt.value.toLowerCase() === value.toLowerCase());
    return option ? option.label : value;
  }

  /**
   * Find field configuration by field key
   * @param {string} fieldKey - The field key to search for
   * @returns {Object|null} Field configuration or null
   */
  findFieldByKey(fieldKey) {
    if (!this.formQuestions) return null;

    // Search in all sections
    for (const section of this.formQuestions.sections) {
      for (const field of section.fields) {
        if (field.fieldName === fieldKey) {
          return field;
        }
        
        // For general questions, check if the generated key matches
        if (fieldKey.startsWith('general_') && field.questionTitle) {
          const questionText = field.questionTitle;
          const cleanText = questionText.toLowerCase().replace(/[^a-z0-9]/g, '_');
          const generatedKey = `general_${cleanText}_`;
          if (fieldKey.startsWith(generatedKey)) {
            return field;
          }
        }
        
        // Special handling for the "how did you learn about" question
        if (fieldKey === 'general_how_did_you_learn_about_madrasatul_quran__0' && field.questionTitle && field.questionTitle.includes('কিভাবে')) {
          return field;
        }
      }
    }

    return null;
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
