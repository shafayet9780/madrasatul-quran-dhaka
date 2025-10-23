/**
 * PDF Generator for Pre-Admission Form Submissions
 * Refactored for better maintainability and code quality
 */

const { jsPDF } = require('jspdf');
const fs = require('fs');
const path = require('path');

const FontManager = require('./font-manager');
const PDFRenderer = require('./pdf-renderer');
const {
  getStudentFields,
  getAssessmentFields,
  getFatherFields,
  getMotherFields,
  getAdditionalFields,
  getContactFields,
} = require('./field-definitions');
const { generateFilename } = require('./text-utils');
const {
  LAYOUT,
  FONT_SIZES,
  FONTS,
  SECTION_POSITIONS,
  SECTION_HEIGHTS,
  SPACING,
} = require('./constants');

/**
 * PDF Generator class
 */
class PDFGenerator {
  constructor() {
    this.doc = null;
    this.fontManager = null;
    this.renderer = null;
    this.init();
  }

  /**
   * Initialize PDF generator with Bengali fonts
   */
  init() {
    try {
      this.fontManager = new FontManager();
      console.log('✅ PDF Generator initialized with Bengali fonts');
    } catch (error) {
      console.error('❌ Error initializing PDF generator:', error);
      throw error;
    }
  }

  /**
   * Generate PDF for a submission
   * @param {Object} submission - The submission object
   * @param {string} studentPhoto - Base64 student photo
   * @param {string} fatherPhoto - Base64 father photo
   * @returns {Promise<string>} The generated PDF file path
   */
  async generatePDF(submission, studentPhoto = null, fatherPhoto = null) {
    try {
      console.log(`📄 Generating PDF for: ${submission.studentName}`);

      // Initialize new PDF document
      this.initializeDocument();

      // Register Bengali fonts
      const bengaliFontLoaded = this.fontManager.registerFonts(this.doc);

      // Initialize renderer
      this.renderer = new PDFRenderer(this.doc, this.fontManager);

      // Set default font
      this.doc.setFont(FONTS.ENGLISH, 'normal');
      this.doc.setFontSize(FONT_SIZES.CONTENT);

      // Generate page 1
      this.generatePage1(submission, studentPhoto, fatherPhoto, bengaliFontLoaded);

      // Generate page 2
      this.doc.addPage();
      this.generatePage2(submission, bengaliFontLoaded);

      // Save PDF
      const outputPath = this.savePDF(submission);
      console.log(`✅ PDF generated: ${path.basename(outputPath)}`);

      return outputPath;
    } catch (error) {
      console.error('❌ Error generating PDF:', error);
      throw error;
    }
  }

  /**
   * Initialize PDF document
   */
  initializeDocument() {
    this.doc = new jsPDF({
      orientation: LAYOUT.PAGE_ORIENTATION,
      unit: LAYOUT.UNIT,
      format: LAYOUT.PAGE_FORMAT,
    });
  }

  /**
   * Generate page 1 content
   * @param {Object} submission - Submission data
   * @param {string} studentPhoto - Student photo base64
   * @param {string} fatherPhoto - Father photo base64
   * @param {boolean} bengaliFontLoaded - Whether Bengali font is available
   */
  generatePage1(submission, studentPhoto, fatherPhoto, bengaliFontLoaded) {
    // Header
    this.renderer.renderHeader(submission, studentPhoto, bengaliFontLoaded);

    // Student Information Section
    this.renderer.renderSection({
      title: 'Student Information',
      yPosition: this.renderer.getYPosition(SECTION_POSITIONS.PAGE_1.STUDENT),
      height: SECTION_HEIGHTS.STUDENT,
      fields: getStudentFields(submission.sections.student, submission),
      bengaliFontLoaded,
      lineSpacing: SPACING.LINE_HEIGHT_NORMAL,
    });

    // Assessment Section
    this.renderer.renderSection({
      title: 'Student Assessment',
      yPosition: this.renderer.getYPosition(SECTION_POSITIONS.PAGE_1.ASSESSMENT),
      height: SECTION_HEIGHTS.ASSESSMENT,
      fields: getAssessmentFields(submission.sections.assessment),
      bengaliFontLoaded,
      lineSpacing: SPACING.LINE_HEIGHT_NORMAL,
    });

    // Father Information Section
    this.renderer.renderSection({
      title: 'Father Information',
      yPosition: this.renderer.getYPosition(SECTION_POSITIONS.PAGE_1.FATHER),
      height: SECTION_HEIGHTS.FATHER,
      fields: getFatherFields(submission.sections.father, submission),
      bengaliFontLoaded,
      photo: fatherPhoto,
      lineSpacing: SPACING.LINE_HEIGHT_COMPACT,
    });
  }

  /**
   * Generate page 2 content
   * @param {Object} submission - Submission data
   * @param {boolean} bengaliFontLoaded - Whether Bengali font is available
   */
  generatePage2(submission, bengaliFontLoaded) {
    // Mother Information Section
    this.renderer.renderSection({
      title: 'Mother Information',
      yPosition: SECTION_POSITIONS.PAGE_2.MOTHER,
      height: SECTION_HEIGHTS.MOTHER,
      fields: getMotherFields(submission.sections.mother, submission),
      bengaliFontLoaded,
      lineSpacing: SPACING.LINE_HEIGHT_COMPACT,
    });

    // Additional Information Section
    this.renderer.renderSection({
      title: 'Additional Information',
      yPosition: SECTION_POSITIONS.PAGE_2.ADDITIONAL,
      height: SECTION_HEIGHTS.ADDITIONAL,
      fields: getAdditionalFields(submission.sections.additional),
      bengaliFontLoaded,
      lineSpacing: SPACING.LINE_HEIGHT_NORMAL,
    });

    // Contact Information Section
    this.renderer.renderSection({
      title: 'Contact Information',
      yPosition: SECTION_POSITIONS.PAGE_2.CONTACT,
      height: SECTION_HEIGHTS.CONTACT,
      fields: getContactFields(submission.sections.contact),
      bengaliFontLoaded,
      lineSpacing: SPACING.LINE_HEIGHT_NORMAL,
    });
  }

  /**
   * Save PDF to disk
   * @param {Object} submission - Submission data
   * @returns {string} Output file path
   */
  savePDF(submission) {
    const filename = generateFilename(submission);
    const outputPath = path.join(__dirname, '../output', filename);

    // Ensure output directory exists
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    this.doc.save(outputPath);
    return outputPath;
  }
}

module.exports = PDFGenerator;
