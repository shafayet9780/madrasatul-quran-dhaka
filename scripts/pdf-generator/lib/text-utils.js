/**
 * Text utility functions for PDF generation
 * Handles text wrapping, Bengali detection, and formatting
 */

const { BENGALI_UNICODE_RANGE, BENGALI_SENTENCE_DELIMITER } = require('./constants');

/**
 * Normalize text for proper rendering
 * Converts text to NFC (Canonical Composition) form to ensure Bengali vowel signs render correctly
 * Also handles potential encoding issues from data sources
 * @param {string} text - Text to normalize
 * @returns {string} Normalized text
 */
function normalizeText(text) {
  if (!text) return text;
  
  try {
    // First, ensure proper string encoding (handle potential UTF-8 issues)
    let cleanText = text;
    
    // Check if text might be double-encoded (UTF-8 bytes interpreted as Latin-1)
    // This can happen when data passes through systems with different encodings
    if (text.includes('à¦') || text.includes('à§')) {
      try {
        // Attempt to fix double-encoding by converting back to bytes and re-decoding
        const bytes = [];
        for (let i = 0; i < text.length; i++) {
          bytes.push(text.charCodeAt(i) & 0xff);
        }
        cleanText = Buffer.from(bytes).toString('utf8');
      } catch (e) {
        // If conversion fails, use original text
        console.log('⚠️ Could not fix encoding, using original text');
      }
    }
    
    // Normalize to NFC form (Canonical Composition)
    // This ensures Bengali vowel signs and diacritics are properly composed
    return cleanText.normalize('NFC');
  } catch (error) {
    console.error('❌ Error normalizing text:', error);
    return text;
  }
}

/**
 * Check if text contains Bengali characters
 * @param {string} text - The text to check
 * @returns {boolean} True if text contains Bengali characters
 */
function containsBengali(text) {
  if (!text) return false;
  return BENGALI_UNICODE_RANGE.test(text);
}

/**
 * Wrap text to fit within specified width
 * @param {string} text - The text to wrap
 * @param {number} maxWidth - Maximum width in mm
 * @param {Object} doc - jsPDF document instance for width calculation
 * @returns {string} Wrapped text with newlines
 */
function wrapText(text, maxWidth, doc) {
  if (!text) return '';

  const lines = [];
  const paragraphs = text.split('\n');

  paragraphs.forEach((paragraph) => {
    if (!paragraph.trim()) {
      lines.push('');
      return;
    }

    // Handle Bengali text (sentences end with '।')
    if (paragraph.includes(BENGALI_SENTENCE_DELIMITER)) {
      lines.push(...wrapBengaliParagraph(paragraph, maxWidth, doc));
    } else {
      // Handle English text (sentences end with . ! ?)
      lines.push(...wrapEnglishParagraph(paragraph, maxWidth, doc));
    }
  });

  return lines.join('\n');
}

/**
 * Wrap Bengali paragraph
 * @param {string} paragraph - Bengali paragraph
 * @param {number} maxWidth - Maximum width
 * @param {Object} doc - jsPDF document instance
 * @returns {Array<string>} Wrapped lines
 */
function wrapBengaliParagraph(paragraph, maxWidth, doc) {
  const lines = [];
  const sentences = paragraph.split(BENGALI_SENTENCE_DELIMITER);

  sentences.forEach((sentence) => {
    if (!sentence.trim()) return;

    const wrappedLines = wrapSentenceByWords(sentence.trim(), maxWidth, doc);
    
    // Add delimiter back to the last line
    if (wrappedLines.length > 0) {
      wrappedLines[wrappedLines.length - 1] += BENGALI_SENTENCE_DELIMITER;
    }
    
    lines.push(...wrappedLines);
  });

  return lines;
}

/**
 * Wrap English paragraph
 * @param {string} paragraph - English paragraph
 * @param {number} maxWidth - Maximum width
 * @param {Object} doc - jsPDF document instance
 * @returns {Array<string>} Wrapped lines
 */
function wrapEnglishParagraph(paragraph, maxWidth, doc) {
  const lines = [];
  const sentenceRegex = /[.!?]/g;
  let lastIndex = 0;
  let match;

  // Split by sentence delimiters while preserving them
  while ((match = sentenceRegex.exec(paragraph)) !== null) {
    const sentence = paragraph.substring(lastIndex, match.index).trim();
    const punctuation = match[0];
    
    if (sentence) {
      const wrappedLines = wrapSentenceByWords(sentence, maxWidth, doc);
      
      // Add punctuation back to the last line
      if (wrappedLines.length > 0) {
        wrappedLines[wrappedLines.length - 1] += punctuation;
      }
      
      lines.push(...wrappedLines);
    }
    
    lastIndex = match.index + 1;
  }

  // Handle any remaining text after the last delimiter
  const remainingText = paragraph.substring(lastIndex).trim();
  if (remainingText) {
    lines.push(...wrapSentenceByWords(remainingText, maxWidth, doc));
  }

  return lines;
}

/**
 * Wrap a sentence by words
 * @param {string} sentence - Sentence to wrap
 * @param {number} maxWidth - Maximum width
 * @param {Object} doc - jsPDF document instance
 * @returns {Array<string>} Wrapped lines
 */
function wrapSentenceByWords(sentence, maxWidth, doc) {
  const lines = [];
  const words = sentence.split(' ');
  let currentLine = '';

  words.forEach((word) => {
    const testLine = currentLine + (currentLine ? ' ' : '') + word;
    const testWidth = doc.getTextWidth(testLine);

    if (testWidth <= maxWidth) {
      currentLine = testLine;
    } else {
      if (currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        // Single word is too long, break it by character
        lines.push(...breakLongWord(word, maxWidth, doc));
        currentLine = '';
      }
    }
  });

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
}

/**
 * Break a long word that doesn't fit on one line
 * @param {string} word - Word to break
 * @param {number} maxWidth - Maximum width
 * @param {Object} doc - jsPDF document instance
 * @returns {Array<string>} Broken word parts
 */
function breakLongWord(word, maxWidth, doc) {
  const lines = [];
  const chars = word.split('');
  let currentLine = '';

  chars.forEach((char) => {
    const testWord = currentLine + char;
    
    if (doc.getTextWidth(testWord) <= maxWidth) {
      currentLine = testWord;
    } else {
      if (currentLine) {
        lines.push(currentLine);
        currentLine = char;
      } else {
        // Even a single character is too wide (unlikely but handle it)
        lines.push(char);
      }
    }
  });

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
}

/**
 * Format date for display
 * @param {string} dateString - ISO date string
 * @returns {string} Formatted date
 */
function formatDate(dateString) {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch (error) {
    return dateString;
  }
}

/**
 * Generate filename for PDF
 * @param {Object} submission - The submission object
 * @returns {string} The filename
 */
function generateFilename(submission) {
  const studentName = (submission.studentNameEnglish || 'unknown').trim();
  const classLevel = submission.desiredClass || 'unknown';
  const timestamp = new Date().toISOString().slice(0, 10);

  // Clean student name for filename - handle Bengali characters
  const cleanName = studentName
    .trim()
    .replace(/[^\u0000-\u007F\u0980-\u09FF]/g, '') // Keep ASCII and Bengali characters
    .replace(/[^a-zA-Z0-9\u0980-\u09FF]/g, '-') // Replace special chars with dash
    .replace(/-+/g, '-') // Collapse multiple dashes
    .replace(/^-|-$/g, ''); // Remove leading/trailing dashes

  return `${cleanName}_${classLevel}_${timestamp}.pdf`;
}

module.exports = {
  normalizeText,
  containsBengali,
  wrapText,
  formatDate,
  generateFilename,
};

