# PDF Generator Library

This directory contains the refactored PDF generation library for the Pre-Admission Form system.

## Architecture Overview

The library has been refactored into a modular, maintainable architecture with clear separation of concerns:

```
lib/
├── pdf-generator.js      # Main orchestrator class
├── pdf-renderer.js       # Rendering logic for sections and content
├── font-manager.js       # Bengali font handling
├── field-definitions.js  # Field configuration for each section
├── text-utils.js         # Text wrapping and formatting utilities
└── constants.js          # Configuration and constants
```

## Components

### 1. PDFGenerator (pdf-generator.js)
**Responsibility**: Main orchestrator that coordinates the PDF generation process.

**Key Methods**:
- `generatePDF(submission, studentPhoto, fatherPhoto)` - Main entry point
- `generatePage1()` - Renders first page content
- `generatePage2()` - Renders second page content
- `savePDF()` - Saves PDF to disk

**Example Usage**:
```javascript
const PDFGenerator = require('./lib/pdf-generator');

const generator = new PDFGenerator();
const pdfPath = await generator.generatePDF(submission, studentPhoto, fatherPhoto);
```

### 2. PDFRenderer (pdf-renderer.js)
**Responsibility**: Handles all rendering operations - sections, fields, photos, text.

**Key Methods**:
- `renderHeader()` - Renders document header with title and student photo
- `renderSection()` - Generic section renderer
- `renderField()` - Renders individual field (label + value)
- `addPhoto()` - Adds photos to PDF

**Design Pattern**: This class abstracts the repetitive rendering logic, eliminating code duplication.

### 3. FontManager (font-manager.js)
**Responsibility**: Manages Bengali font loading and font selection logic.

**Key Methods**:
- `loadFonts()` - Loads Bengali fonts from disk
- `registerFonts(doc)` - Registers fonts with jsPDF document
- `getFontForText(text, isBold, bengaliFontLoaded)` - Returns appropriate font
- `setFontForText(doc, text, isBold, bengaliFontLoaded)` - Sets font on document

**Features**:
- Automatic Bengali character detection
- Graceful fallback to English fonts if Bengali fonts unavailable
- Centralized font management

### 4. Field Definitions (field-definitions.js)
**Responsibility**: Centralizes all field configurations for different sections.

**Functions**:
- `getStudentFields()` - Student information fields
- `getAssessmentFields()` - Assessment section fields
- `getFatherFields()` - Father information fields
- `getMotherFields()` - Mother information fields
- `getAdditionalFields()` - Additional information fields
- `getContactFields()` - Contact information fields

**Benefits**:
- Single source of truth for field configurations
- Easy to add/remove/modify fields
- Consistent field structure across sections

### 5. Text Utils (text-utils.js)
**Responsibility**: Text processing, wrapping, and formatting utilities.

**Key Functions**:
- `containsBengali(text)` - Detects Bengali characters
- `wrapText(text, maxWidth, doc)` - Wraps text to fit within width
- `formatDate(dateString)` - Formats dates for display
- `generateFilename(submission)` - Generates PDF filename

**Features**:
- Intelligent text wrapping for both Bengali and English
- Handles sentence delimiters correctly (। for Bengali, .!? for English)
- Breaks long words that don't fit on a single line

### 6. Constants (constants.js)
**Responsibility**: Centralized configuration for layout, styling, and formatting.

**Configuration Groups**:
- `LAYOUT` - Page dimensions, margins, padding
- `FONT_SIZES` - Font sizes for different elements
- `SPACING` - Line heights, label widths, gaps
- `PHOTOS` - Photo dimensions and positioning
- `BORDER` - Border styling
- `FONTS` - Font names and file references
- `SECTION_POSITIONS` - Y positions for each section
- `SECTION_HEIGHTS` - Heights for bordered sections

**Benefits**:
- No magic numbers in code
- Easy to adjust layout and styling
- Consistent spacing and sizing

## Code Quality Improvements

### Before Refactoring
❌ **Problems**:
- 973 lines of code in a single file
- Massive code duplication across section methods
- Magic numbers everywhere (margins, spacing, positions)
- Complex text wrapping logic embedded in main class
- Field definitions mixed with rendering logic
- No separation of concerns

### After Refactoring
✅ **Improvements**:
- **Modular Architecture**: 6 focused files with clear responsibilities
- **DRY Principle**: Generic `renderSection()` eliminates duplication
- **Separation of Concerns**: 
  - Data (field-definitions.js)
  - Presentation (pdf-renderer.js)
  - Business Logic (pdf-generator.js)
  - Utilities (text-utils.js, font-manager.js)
  - Configuration (constants.js)
- **Maintainability**: Easy to find and modify specific functionality
- **Testability**: Each module can be tested independently
- **Readability**: Clear, focused functions with single responsibilities
- **Extensibility**: Easy to add new sections or modify existing ones

## Adding a New Section

To add a new section to the PDF:

1. **Define fields** in `field-definitions.js`:
```javascript
function getNewSectionFields(data) {
  return [
    { key: 'field1', label: 'Field 1', value: data.field1 },
    { key: 'field2', label: 'Field 2', value: data.field2 },
  ];
}
module.exports = { ..., getNewSectionFields };
```

2. **Add position and height** to `constants.js`:
```javascript
const SECTION_POSITIONS = {
  PAGE_2: {
    NEW_SECTION: 220, // Add position
  },
};

const SECTION_HEIGHTS = {
  NEW_SECTION: 40, // Add height
};
```

3. **Render section** in `pdf-generator.js`:
```javascript
generatePage2(submission, bengaliFontLoaded) {
  // ... existing sections ...
  
  this.renderer.renderSection({
    title: 'New Section Title',
    yPosition: SECTION_POSITIONS.PAGE_2.NEW_SECTION,
    height: SECTION_HEIGHTS.NEW_SECTION,
    fields: getNewSectionFields(submission.sections.newSection),
    bengaliFontLoaded,
  });
}
```

That's it! The generic rendering logic handles everything else.

## Customizing Layout

All layout parameters are in `constants.js`. To adjust:

**Margins**:
```javascript
const LAYOUT = {
  MARGIN: 15, // Change from 12 to 15
};
```

**Font Sizes**:
```javascript
const FONT_SIZES = {
  SECTION_HEADER: 14, // Change from 12 to 14
};
```

**Spacing**:
```javascript
const SPACING = {
  LINE_HEIGHT_NORMAL: 5, // Change from 4 to 5
};
```

## Testing

Each module can be tested independently:

```javascript
// Test font manager
const FontManager = require('./font-manager');
const { containsBengali } = require('./text-utils');

console.log(containsBengali('বাংলা')); // true
console.log(containsBengali('English')); // false

// Test text wrapping
const { wrapText } = require('./text-utils');
// ... test wrapping logic

// Test field definitions
const { getStudentFields } = require('./field-definitions');
const fields = getStudentFields(mockData, mockSubmission);
// ... verify field structure
```

## Performance Considerations

- **Font Loading**: Fonts are loaded once during initialization
- **Text Wrapping**: Efficient word-by-word algorithm with character fallback
- **Memory**: PDF document is kept in memory until save

## Future Enhancements

Potential improvements:
1. **Async Font Loading**: Make font loading truly asynchronous
2. **Custom Themes**: Support multiple color schemes/layouts
3. **Template System**: Load section configurations from JSON
4. **Multi-language Support**: Extend beyond Bengali/English
5. **Dynamic Sizing**: Auto-adjust section heights based on content
6. **Unit Tests**: Add comprehensive test coverage
7. **Photo Optimization**: Compress/resize photos before embedding

## Dependencies

- `jspdf`: PDF generation library
- `fs`: File system operations
- `path`: Path manipulation

## License

Same as parent project.

