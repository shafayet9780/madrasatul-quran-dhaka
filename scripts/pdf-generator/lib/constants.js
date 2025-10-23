/**
 * PDF Generator Constants
 * Centralized configuration for layout, styling, and formatting
 */

// Page dimensions and layout
const LAYOUT = {
  PAGE_FORMAT: 'a4',
  PAGE_ORIENTATION: 'portrait',
  UNIT: 'mm',
  MARGIN: 12,
  SECTION_PADDING: 3,
  HEADER_GAP: 7,
  CONTENT_GAP: 2,
};

// Font sizes
const FONT_SIZES = {
  TITLE: 16,
  SUBTITLE: 14,
  SECTION_HEADER: 12,
  CONTENT: 10,
};

// Spacing
const SPACING = {
  LINE_HEIGHT_NORMAL: 4,
  LINE_HEIGHT_COMPACT: 3.5,
  LABEL_WIDTH: 50,
  VALUE_PADDING: 8,
};

// Photo dimensions
const PHOTOS = {
  STUDENT: {
    WIDTH: 25,
    HEIGHT: 35,
    TOP_MARGIN: 10,
  },
  PARENT: {
    WIDTH: 20,
    HEIGHT: 25,
  },
};

// Border styling
const BORDER = {
  COLOR: [0, 0, 0],
  WIDTH: 0.3,
};

// Font names
const FONTS = {
  BENGALI: 'NotoSansBengali',
  ENGLISH: 'helvetica',
  BENGALI_REGULAR_FILE: 'NotoSansBengali-Regular.ttf',
  BENGALI_BOLD_FILE: 'NotoSansBengali-Bold.ttf',
};

// Bengali character detection
const BENGALI_UNICODE_RANGE = /[\u0980-\u09FF]/;
const BENGALI_SENTENCE_DELIMITER = '।';

// Section positioning (Y coordinates from top or bottom)
const SECTION_POSITIONS = {
  HEADER: {
    TITLE_Y: 12,
    SUBTITLE_OFFSET: 6,
    DATE_OFFSET: 12,
  },
  PAGE_1: {
    STUDENT: -240, // From bottom
    ASSESSMENT: -175,
    FATHER: -115,
  },
  PAGE_2: {
    MOTHER: 20, // From top
    ADDITIONAL: 110,
    CONTACT: 180,
  },
};

// Section heights
const SECTION_HEIGHTS = {
  STUDENT: 45,
  ASSESSMENT: 35,
  FATHER: 90,
  MOTHER: 65,
  ADDITIONAL: 30,
  CONTACT: 30,
};

module.exports = {
  LAYOUT,
  FONT_SIZES,
  SPACING,
  PHOTOS,
  BORDER,
  FONTS,
  BENGALI_UNICODE_RANGE,
  BENGALI_SENTENCE_DELIMITER,
  SECTION_POSITIONS,
  SECTION_HEIGHTS,
};

