/**
 * Font Manager for PDF Generation
 * Handles Bengali font loading and font selection logic
 */

const fs = require('fs');
const path = require('path');
const { FONTS } = require('./constants');
const { containsBengali } = require('./text-utils');

/**
 * Font Manager class
 */
class FontManager {
  constructor() {
    this.fonts = {
      regular: null,
      bold: null,
    };
    this.loadFonts();
  }

  /**
   * Load Bengali fonts from disk
   */
  loadFonts() {
    try {
      const regularFontPath = path.join(
        __dirname,
        '../fonts',
        FONTS.BENGALI_REGULAR_FILE
      );
      const boldFontPath = path.join(
        __dirname,
        '../fonts',
        FONTS.BENGALI_BOLD_FILE
      );

      if (fs.existsSync(regularFontPath)) {
        this.fonts.regular = fs.readFileSync(regularFontPath);
      }
      
      if (fs.existsSync(boldFontPath)) {
        this.fonts.bold = fs.readFileSync(boldFontPath);
      }

      console.log('📝 Bengali fonts loaded successfully');
    } catch (error) {
      console.error('❌ Error loading fonts:', error);
      // Don't throw error, continue without Bengali fonts
    }
  }

  /**
   * Register Bengali fonts with jsPDF document
   * @param {Object} doc - jsPDF document instance
   * @returns {boolean} True if Bengali fonts were successfully loaded
   */
  registerFonts(doc) {
    let bengaliFontLoaded = false;

    try {
      if (this.fonts.regular) {
        doc.addFileToVFS(
          FONTS.BENGALI_REGULAR_FILE,
          this.fonts.regular.toString('base64')
        );
        doc.addFont(
          FONTS.BENGALI_REGULAR_FILE,
          FONTS.BENGALI,
          'normal'
        );
        bengaliFontLoaded = true;
      }

      if (this.fonts.bold) {
        doc.addFileToVFS(
          FONTS.BENGALI_BOLD_FILE,
          this.fonts.bold.toString('base64')
        );
        doc.addFont(
          FONTS.BENGALI_BOLD_FILE,
          FONTS.BENGALI,
          'bold'
        );
      }
    } catch (error) {
      console.log('⚠️ Bengali font loading failed, using fallback fonts');
      bengaliFontLoaded = false;
    }

    return bengaliFontLoaded;
  }

  /**
   * Get appropriate font for text content
   * @param {string} text - The text content
   * @param {boolean} isBold - Whether to use bold font (currently unused for Bengali)
   * @param {boolean} bengaliFontLoaded - Whether Bengali font is available
   * @returns {string} Font name to use
   */
  getFontForText(text, isBold = false, bengaliFontLoaded = false) {
    if (containsBengali(text)) {
      return bengaliFontLoaded ? FONTS.BENGALI : FONTS.ENGLISH;
    }
    return FONTS.ENGLISH;
  }

  /**
   * Set font for text on document
   * @param {Object} doc - jsPDF document instance
   * @param {string} text - Text content
   * @param {boolean} isBold - Whether to use bold style
   * @param {boolean} bengaliFontLoaded - Whether Bengali font is available
   */
  setFontForText(doc, text, isBold, bengaliFontLoaded) {
    const fontName = this.getFontForText(text, isBold, bengaliFontLoaded);
    const style = isBold ? 'bold' : 'normal';
    doc.setFont(fontName, style);
  }
}

module.exports = FontManager;

