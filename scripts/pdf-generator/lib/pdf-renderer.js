/**
 * PDF Renderer
 * Handles rendering of PDF sections and content
 */

const {
  LAYOUT,
  FONT_SIZES,
  SPACING,
  PHOTOS,
  BORDER,
  FONTS,
  SECTION_POSITIONS,
  SECTION_HEIGHTS,
} = require('./constants');
const { wrapText, formatDate, normalizeText } = require('./text-utils');

/**
 * PDF Renderer class
 */
class PDFRenderer {
  constructor(doc, fontManager) {
    this.doc = doc;
    this.fontManager = fontManager;
    this.pageWidth = doc.internal.pageSize.getWidth();
    this.pageHeight = doc.internal.pageSize.getHeight();
  }

  /**
   * Render PDF header with school info and student photo
   * @param {Object} submission - Submission data
   * @param {string} studentPhoto - Base64 student photo
   * @param {boolean} bengaliFontLoaded - Whether Bengali font is available
   */
  renderHeader(submission, studentPhoto, bengaliFontLoaded) {
    let y = SECTION_POSITIONS.HEADER.TITLE_Y;

    // School name (Bengali) - normalize for consistency
    const schoolName = normalizeText('মাদরাসাতুল কুরআন ঢাকা');
    this.fontManager.setFontForText(
      this.doc,
      schoolName,
      true,
      bengaliFontLoaded
    );
    this.doc.setFontSize(FONT_SIZES.TITLE);
    this.doc.text(schoolName, this.pageWidth / 2, y, {
      align: 'center',
    });

    // Subtitle (English)
    y += SECTION_POSITIONS.HEADER.SUBTITLE_OFFSET;
    this.doc.setFont(FONTS.ENGLISH, 'bold');
    this.doc.setFontSize(FONT_SIZES.SUBTITLE);
    this.doc.text('Pre-Admission Application Form', this.pageWidth / 2, y, {
      align: 'center',
    });

    // Student photo (top-right)
    if (studentPhoto) {
      this.addPhoto(
        studentPhoto,
        this.pageWidth - LAYOUT.MARGIN - PHOTOS.STUDENT.WIDTH,
        PHOTOS.STUDENT.TOP_MARGIN,
        PHOTOS.STUDENT.WIDTH,
        PHOTOS.STUDENT.HEIGHT
      );
    }

    // Submission date
    y += SECTION_POSITIONS.HEADER.DATE_OFFSET;
    this.doc.setFont(FONTS.ENGLISH, 'normal');
    this.doc.setFontSize(FONT_SIZES.CONTENT);
    this.doc.text(
      `Application Date: ${formatDate(submission.timestamp)}`,
      LAYOUT.MARGIN,
      y
    );
  }

  /**
   * Render a section with fields
   * @param {Object} config - Section configuration
   * @param {string} config.title - Section title
   * @param {number} config.yPosition - Y position for section
   * @param {number} config.height - Section height
   * @param {Array} config.fields - Field definitions
   * @param {boolean} config.bengaliFontLoaded - Whether Bengali font is available
   * @param {string} config.photo - Optional photo base64
   * @param {number} config.lineSpacing - Line spacing multiplier
   */
  renderSection({
    title,
    yPosition,
    height,
    fields,
    bengaliFontLoaded,
    photo = null,
    lineSpacing = SPACING.LINE_HEIGHT_NORMAL,
  }) {
    let y = yPosition;

    // Section header
    this.doc.setFont(FONTS.ENGLISH, 'bold');
    this.doc.setFontSize(FONT_SIZES.SECTION_HEADER);
    this.doc.text(title, LAYOUT.MARGIN, y);
    y += LAYOUT.HEADER_GAP;

    // Draw section border
    this.doc.setDrawColor(...BORDER.COLOR);
    this.doc.setLineWidth(BORDER.WIDTH);
    this.doc.rect(
      LAYOUT.MARGIN,
      y - LAYOUT.SECTION_PADDING,
      this.pageWidth - 2 * LAYOUT.MARGIN,
      height
    );

    // Add photo if provided (top-right of section)
    if (photo) {
      this.addPhoto(
        photo,
        this.pageWidth - LAYOUT.MARGIN - PHOTOS.PARENT.WIDTH,
        y - LAYOUT.SECTION_PADDING,
        PHOTOS.PARENT.WIDTH,
        PHOTOS.PARENT.HEIGHT
      );
    }

    // Render fields
    let currentY = y + LAYOUT.CONTENT_GAP;
    this.doc.setFontSize(FONT_SIZES.CONTENT);

    fields.forEach((field) => {
      if (field.value && field.value.trim() !== '') {
        currentY += this.renderField(
          field,
          currentY,
          bengaliFontLoaded,
          lineSpacing
        );
      }
    });
  }

  /**
   * Render a single field (label + value)
   * @param {Object} field - Field definition
   * @param {number} y - Y position
   * @param {boolean} bengaliFontLoaded - Whether Bengali font is available
   * @param {number} lineSpacing - Line spacing multiplier
   * @returns {number} Height consumed by this field
   */
  renderField(field, y, bengaliFontLoaded, lineSpacing) {
    const x = LAYOUT.MARGIN + LAYOUT.SECTION_PADDING;
    const valueWidth =
      this.pageWidth - 2 * LAYOUT.MARGIN - SPACING.LABEL_WIDTH - SPACING.VALUE_PADDING;

    // Render label (always English)
    this.doc.setFont(FONTS.ENGLISH, 'bold');
    this.doc.text(field.label + ':', x, y);

    // Normalize text for proper Bengali rendering (fixes vowel sign displacement)
    const normalizedValue = normalizeText(field.value);
    
    // Debug logging for Bengali text
    if (/[\u0980-\u09FF]/.test(normalizedValue)) {
      console.log(`📝 Rendering Bengali text for "${field.label}":`, normalizedValue.substring(0, 20));
      console.log(`   Length: ${normalizedValue.length}, First 5 codes:`, 
        normalizedValue.substring(0, 5).split('').map(c => 
          'U+' + c.charCodeAt(0).toString(16).toUpperCase().padStart(4, '0')
        ).join(' ')
      );
    }

    // Render value (use appropriate font)
    this.fontManager.setFontForText(
      this.doc,
      normalizedValue,
      false,
      bengaliFontLoaded
    );
    this.doc.setFontSize(FONT_SIZES.CONTENT);
    
    const wrappedText = wrapText(normalizedValue, valueWidth, this.doc);
    this.doc.text(wrappedText, x + SPACING.LABEL_WIDTH, y);

    // Calculate height consumed
    const lineCount = wrappedText.split('\n').length;
    return lineCount * lineSpacing;
  }

  /**
   * Add a photo to the PDF
   * @param {string} photoBase64 - Base64 encoded photo
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {number} width - Photo width
   * @param {number} height - Photo height
   */
  addPhoto(photoBase64, x, y, width, height) {
    try {
      this.doc.addImage(photoBase64, 'JPEG', x, y, width, height);
    } catch (error) {
      console.log('⚠️ Could not add photo:', error.message);
    }
  }

  /**
   * Get Y position (handles negative values as offset from bottom)
   * @param {number} position - Position value (negative = from bottom)
   * @returns {number} Actual Y position
   */
  getYPosition(position) {
    return position < 0 ? this.pageHeight + position : position;
  }
}

module.exports = PDFRenderer;

