const { jsPDF } = require('jspdf');
const fs = require('fs');
const path = require('path');

/**
 * PDF Generator for Pre-Admission Form Submissions
 */
class PDFGenerator {
  constructor() {
    this.doc = null;
    this.fonts = {
      regular: null,
      bold: null,
    };
    this.init();
  }

  /**
   * Initialize PDF generator with Bengali fonts
   */
  init() {
    try {
      // Load Bengali fonts
      this.loadFonts();
      console.log('✅ PDF Generator initialized with Bengali fonts');
    } catch (error) {
      console.error('❌ Error initializing PDF generator:', error);
      throw error;
    }
  }

  /**
   * Load Bengali fonts for jsPDF
   */
  loadFonts() {
    try {
      const regularFontPath = path.join(
        __dirname,
        '../fonts/NotoSansBengali-Regular.ttf'
      );
      const boldFontPath = path.join(
        __dirname,
        '../fonts/NotoSansBengali-Bold.ttf'
      );

      if (fs.existsSync(regularFontPath)) {
        this.fonts.regular = fs.readFileSync(regularFontPath);
      }
      if (fs.existsSync(boldFontPath)) {
        this.fonts.bold = fs.readFileSync(boldFontPath);
      }

      console.log('📝 Bengali fonts loaded');
    } catch (error) {
      console.error('❌ Error loading fonts:', error);
      // Don't throw error, continue without Bengali fonts
    }
  }

  /**
   * Check if text contains Bengali characters
   * @param {string} text - The text to check
   * @returns {boolean} True if text contains Bengali characters
   */
  containsBengali(text) {
    if (!text) return false;
    // Bengali Unicode range: U+0980 to U+09FF
    const bengaliRegex = /[\u0980-\u09FF]/;
    return bengaliRegex.test(text);
  }

  /**
   * Get appropriate font for text content
   * @param {string} text - The text content
   * @param {boolean} isBold - Whether to use bold font
   * @param {boolean} bengaliFontLoaded - Whether Bengali font is available
   * @returns {string} Font name to use
   */
  getFontForText(text, isBold = false, bengaliFontLoaded = false) {
    if (this.containsBengali(text)) {
      if (bengaliFontLoaded) {
        return isBold ? 'NotoSansBengali' : 'NotoSansBengali';
      } else {
        // Fallback to helvetica if Bengali font not available
        return 'helvetica';
      }
    } else {
      return 'helvetica';
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
      this.doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      // Add Bengali fonts if available
      let bengaliFontLoaded = false;
      try {
        if (this.fonts.regular) {
          this.doc.addFileToVFS(
            'NotoSansBengali-Regular.ttf',
            this.fonts.regular.toString('base64')
          );
          this.doc.addFont(
            'NotoSansBengali-Regular.ttf',
            'NotoSansBengali',
            'normal'
          );
          bengaliFontLoaded = true;
        }
        if (this.fonts.bold) {
          this.doc.addFileToVFS(
            'NotoSansBengali-Bold.ttf',
            this.fonts.bold.toString('base64')
          );
          this.doc.addFont(
            'NotoSansBengali-Bold.ttf',
            'NotoSansBengali',
            'bold'
          );
        }
      } catch (error) {
        console.log('⚠️ Bengali font loading failed, using fallback fonts');
        bengaliFontLoaded = false;
      }

      // Set default font - use helvetica for English labels
      this.doc.setFont('helvetica', 'normal');
      this.doc.setFontSize(12);

      // Generate PDF content with proper layout
      await this.generateHeader(submission, studentPhoto, bengaliFontLoaded);
      await this.generateStudentSection(submission, bengaliFontLoaded);
      await this.generateAssessmentSection(submission, bengaliFontLoaded);
      await this.generateFatherSection(
        submission,
        fatherPhoto,
        bengaliFontLoaded
      );

      // Add new page for mother section and additional sections
      this.doc.addPage();
      await this.generateMotherSection(submission, bengaliFontLoaded);
      await this.generateAdditionalSection(submission, bengaliFontLoaded);
      await this.generateContactSection(submission, bengaliFontLoaded);

      // Save PDF
      const filename = this.generateFilename(submission);
      const outputPath = path.join(__dirname, '../output', filename);

      // Ensure output directory exists
      const outputDir = path.dirname(outputPath);
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      this.doc.save(outputPath);
      console.log(`✅ PDF generated: ${filename}`);

      return outputPath;
    } catch (error) {
      console.error('❌ Error generating PDF:', error);
      throw error;
    }
  }

  /**
   * Generate PDF header with school info and student photo
   */
  async generateHeader(submission, studentPhoto, bengaliFontLoaded = false) {
    const pageWidth = this.doc.internal.pageSize.getWidth();
    const margin = 12; // Reduced margin
    let y = 12; // Better positioning

    // School name and title
    if (bengaliFontLoaded) {
      this.doc.setFont('NotoSansBengali', 'bold');
    } else {
      this.doc.setFont('helvetica', 'bold');
    }
    this.doc.setFontSize(16);
    this.doc.text('মাদরাসাতুল কুরআন ঢাকা', pageWidth / 2, y, {
      align: 'center',
    });

    y += 6;
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(14);
    this.doc.text('Pre-Admission Application Form', pageWidth / 2, y, {
      align: 'center',
    });

    // Student photo (top-right)
    if (studentPhoto) {
      try {
        const photoWidth = 25;
        const photoHeight = 35;
        const photoX = pageWidth - margin - photoWidth;
        const photoY = 10;

        this.doc.addImage(
          studentPhoto,
          'JPEG',
          photoX,
          photoY,
          photoWidth,
          photoHeight
        );
      } catch (error) {
        console.log('⚠️ Could not add student photo:', error.message);
      }
    }

    // Submission info
    y += 12;
    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(10);
    this.doc.text(
      `Application Date: ${this.formatDate(submission.timestamp)}`,
      margin,
      y
    );
  }

  /**
   * Generate student information section
   */
  async generateStudentSection(submission, bengaliFontLoaded = false) {
    const pageWidth = this.doc.internal.pageSize.getWidth();
    const margin = 12; // Reduced margin
    let y = this.doc.internal.pageSize.getHeight() - 240; // Better positioning

    // Section header
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(12); // Bigger font
    this.doc.text('Student Information', margin, y);
    y += 7; // Better gap

    // Draw section border
    this.doc.setDrawColor(0, 0, 0);
    this.doc.setLineWidth(0.3);
    const sectionHeight = 45;
    this.doc.rect(margin, y - 3, pageWidth - 2 * margin, sectionHeight);

    // Student information fields
    const studentData = submission.sections.student;
    const fields = [
      {
        key: 'student_name_bengali',
        label: 'Name (Bengali)',
        value: studentData.student_name_bengali || submission.studentName,
      },
      {
        key: 'student_name_english',
        label: 'Name (English)',
        value:
          studentData.student_name_english || submission.studentNameEnglish,
      },
      {
        key: 'student_gender',
        label: 'Gender',
        value: studentData.student_gender,
      },
      {
        key: 'date_of_birth',
        label: 'Date of Birth',
        value: studentData.date_of_birth,
      },
      {
        key: 'desired_class',
        label: 'Desired Class',
        value: studentData.desired_class || submission.desiredClass,
      },
      {
        key: 'last_class_attended',
        label: 'Last Class Attended',
        value: studentData.last_class_attended,
      },
      {
        key: 'previous_school',
        label: 'Previous School',
        value: studentData.previous_school,
      }
    ];

    this.doc.setFontSize(10); // Bigger font for content

    let currentY = y + 3;
    fields.forEach((field, index) => {
      if (field.value && field.value.trim() !== '') {
        const x = margin + 3;
        const labelWidth = 50; // Reduced label width
        const valueWidth = pageWidth - 2 * margin - labelWidth - 8;

        // Label (always English, always helvetica)
        this.doc.setFont('helvetica', 'bold');
        this.doc.text(field.label + ':', x, currentY);

        // Value (use Bengali font if contains Bengali characters)
        const valueFont = this.getFontForText(
          field.value,
          false,
          bengaliFontLoaded
        );
        this.doc.setFont(valueFont, 'normal');
        this.doc.setFontSize(10);
        const wrappedText = this.wrapText(field.value, valueWidth);
        this.doc.text(wrappedText, x + labelWidth, currentY);

        currentY += wrappedText.split('\n').length * 4; // Better line spacing
      }
    });
  }

  /**
   * Generate student assessment section
   */
  async generateAssessmentSection(submission, bengaliFontLoaded = false) {
    const pageWidth = this.doc.internal.pageSize.getWidth();
    const margin = 12; // Reduced margin
    let y = this.doc.internal.pageSize.getHeight() - 175; // Better positioning

    // Section header
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(12); // Bigger font
    this.doc.text('Student Assessment', margin, y);
    y += 7; // Better gap

    // Draw section border
    this.doc.setDrawColor(0, 0, 0);
    this.doc.setLineWidth(0.3);
    const sectionHeight = 35;
    this.doc.rect(margin, y - 3, pageWidth - 2 * margin, sectionHeight);

    const assessmentData = submission.sections.assessment;
    const fields = [
      {
        key: 'quran_level',
        label: 'Quran Reading Level',
        value: assessmentData.quran_level,
      },
      {
        key: 'arabic_level',
        label: 'Arabic Language Level',
        value: assessmentData.arabic_level,
      },
      {
        key: 'general_subjects_level',
        label: 'General Subjects Level',
        value: assessmentData.general_subjects_level,
      },
      {
        key: 'obeying_parents',
        label: 'Obeying Parents',
        value: assessmentData.obeying_parents,
      },
      {
        key: 'purpose_of_study',
        label: 'Purpose of Study',
        value: assessmentData.purpose_of_study,
      },
    ];

    this.doc.setFontSize(10); // Bigger font for content

    let currentY = y + 3;
    fields.forEach((field, index) => {
      if (field.value && field.value.trim() !== '') {
        const x = margin + 3;
        const labelWidth = 50; // Reduced label width
        const valueWidth = pageWidth - 2 * margin - labelWidth - 8;

        // Label (always English, always helvetica)
        this.doc.setFont('helvetica', 'bold');
        this.doc.text(field.label + ':', x, currentY);

        // Value (use Bengali font if contains Bengali characters)
        const valueFont = this.getFontForText(
          field.value,
          false,
          bengaliFontLoaded
        );
        this.doc.setFont(valueFont, 'normal');
        const wrappedText = this.wrapText(field.value, valueWidth);
        this.doc.text(wrappedText, x + labelWidth, currentY);

        currentY += wrappedText.split('\n').length * 4; // Better line spacing
      }
    });
  }

  /**
   * Generate father information section
   */
  async generateFatherSection(
    submission,
    fatherPhoto,
    bengaliFontLoaded = false
  ) {
    const pageWidth = this.doc.internal.pageSize.getWidth();
    const margin = 12; // Reduced margin
    let y = this.doc.internal.pageSize.getHeight() - 115; // Better positioning

    // Section header
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(12); // Bigger font
    this.doc.text('Father Information', margin, y);
    y += 7; // Better gap

    // Draw section border
    this.doc.setDrawColor(0, 0, 0);
    this.doc.setLineWidth(0.3);
    const sectionHeight = 90; // Taller for more fields
    this.doc.rect(margin, y - 3, pageWidth - 2 * margin, sectionHeight);

    // Father photo (if available)
    if (fatherPhoto) {
      try {
        const photoWidth = 20;
        const photoHeight = 25;
        const photoX = pageWidth - margin - photoWidth;
        const photoY = y - 3;

        this.doc.addImage(
          fatherPhoto,
          'JPEG',
          photoX,
          photoY,
          photoWidth,
          photoHeight
        );
      } catch (error) {
        console.log('⚠️ Could not add father photo:', error.message);
      }
    }

    const fatherData = submission.sections.father;
    const fields = [
      {
        key: 'father_name',
        label: 'Father Name',
        value: fatherData.father_name || submission.fatherName,
      },
      {
        key: 'father_name_english',
        label: "Father's Name (English)",
        value: fatherData.father_name_english,
      },
      {
        key: 'father_occupation',
        label: 'Occupation',
        value: fatherData.father_occupation,
      },
      {
        key: 'father_organization',
        label: 'Organization',
        value: fatherData.father_organization,
      },
      {
        key: 'father_designation',
        label: 'Designation',
        value: fatherData.father_designation,
      },
      {
        key: 'father_monthly_income',
        label: 'Monthly Income',
        value: fatherData.father_monthly_income,
      },
      {
        key: 'father_prayer_location',
        label: 'Prayer Location',
        value: fatherData.father_prayer_location,
      },
      {
        key: 'father_prayer_times',
        label: 'Prayer Times',
        value: fatherData.father_prayer_times,
      },
      {
        key: 'father_daily_quran',
        label: 'Daily Quran',
        value: fatherData.father_daily_quran,
      },
      {
        key: 'father_tv_at_home',
        label: 'TV at Home',
        value: fatherData.father_tv_at_home,
      },
      {
        key: 'father_screen_time',
        label: 'Screen Time',
        value: fatherData.father_screen_time,
      },
      {
        key: 'father_smoking',
        label: 'Smoking Habit',
        value: fatherData.father_smoking,
      },
      {
        key: 'father_time_with_children',
        label: 'Time with Children',
        value: fatherData.father_time_with_children,
      },
      {
        key: 'father_islamic_clothing',
        label: 'Islamic Clothing',
        value: fatherData.father_islamic_clothing,
      },
      {
        key: 'father_mahram',
        label: 'Follows Mahram Rules',
        value: fatherData.father_mahram,
      },
      {
        key: 'father_favorite_scholar',
        label: 'Favorite Scholar',
        value: fatherData.father_favorite_scholar,
      }
    ];

    this.doc.setFontSize(10); // Bigger font for content

    let currentY = y + 2;
    fields.forEach((field, index) => {
      if (field.value && field.value.trim() !== '') {
        const x = margin + 3;
        const labelWidth = 50; // Reduced label width for more fields
        const valueWidth = pageWidth - 2 * margin - labelWidth - 8;

        // Label (always English, always helvetica)
        this.doc.setFont('helvetica', 'bold');
        this.doc.text(field.label + ':', x, currentY);

        // Value (use Bengali font if contains Bengali characters)
        const valueFont = this.getFontForText(
          field.value,
          false,
          bengaliFontLoaded
        );
        this.doc.setFont(valueFont, 'normal');
        const wrappedText = this.wrapText(field.value, valueWidth);
        this.doc.text(wrappedText, x + labelWidth, currentY);

        currentY += wrappedText.split('\n').length * 3.5; // Better line spacing
      }
    });
  }

  /**
   * Generate mother information section
   */
  async generateMotherSection(submission, bengaliFontLoaded = false) {
    const pageWidth = this.doc.internal.pageSize.getWidth();
    const margin = 12; // Reduced margin
    let y = 20; // Start from top of new page

    // Section header
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(12); // Bigger font
    this.doc.text('Mother Information', margin, y);
    y += 7; // Better gap

    // Draw section border
    this.doc.setDrawColor(0, 0, 0);
    this.doc.setLineWidth(0.3);
    const sectionHeight = 65;
    this.doc.rect(margin, y - 3, pageWidth - 2 * margin, sectionHeight);

    const motherData = submission.sections.mother;
    const fields = [
      {
        key: 'mother_name',
        label: 'Mother Name',
        value: motherData.mother_name || submission.motherName,
      },
      {
        key: 'mother_name_english',
        label: "Mother's Name (English)",
        value: motherData.mother_name_english,
      },
      {
        key: 'mother_occupation',
        label: 'Occupation',
        value: motherData.mother_occupation,
      },
      {
        key: 'mother_organization',
        label: 'Organization',
        value: motherData.mother_organization,
      },
      {
        key: 'mother_designation',
        label: 'Designation',
        value: motherData.mother_designation,
      },
      {
        key: 'mother_prayer_times',
        label: 'Prayer Times',
        value: motherData.mother_prayer_times,
      },
      {
        key: 'mother_daily_quran',
        label: 'Daily Quran',
        value: motherData.mother_daily_quran,
      },
      {
        key: 'mother_islamic_clothing',
        label: 'Islamic Clothing (Purdah)',
        value: motherData.mother_islamic_clothing,
      },
      {
        key: 'mother_screen_time',
        label: 'Screen Time',
        value: motherData.mother_screen_time,
      },
      {
        key: 'mother_mahram',
        label: 'Follows Mahram Rules',
        value: motherData.mother_mahram,
      },
      {
        key: 'mother_favorite_scholar',
        label: 'Favorite Scholar',
        value: motherData.mother_favorite_scholar,
      }
    ];

    this.doc.setFontSize(10); // Bigger font for content

    let currentY = y + 2;
    fields.forEach((field, index) => {
      if (field.value && field.value.trim() !== '') {
        const x = margin + 3;
        const labelWidth = 50; // Reduced label width for more fields
        const valueWidth = pageWidth - 2 * margin - labelWidth - 8;

        // Label (always English, always helvetica)
        this.doc.setFont('helvetica', 'bold');
        this.doc.text(field.label + ':', x, currentY);

        // Value (use Bengali font if contains Bengali characters)
        const valueFont = this.getFontForText(
          field.value,
          false,
          bengaliFontLoaded
        );
        this.doc.setFont(valueFont, 'normal');
        const wrappedText = this.wrapText(field.value, valueWidth);
        this.doc.text(wrappedText, x + labelWidth, currentY);

        currentY += wrappedText.split('\n').length * 3.5; // Better line spacing
      }
    });
  }

  /**
   * Generate additional information section
   */
  async generateAdditionalSection(submission, bengaliFontLoaded = false) {
    const pageWidth = this.doc.internal.pageSize.getWidth();
    const margin = 12; // Reduced margin
    let y = 110; // Better positioning after mother section

    // Section header
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(12); // Bigger font
    this.doc.text('Additional Information', margin, y);
    y += 7; // Better gap

    // Draw section border
    this.doc.setDrawColor(0, 0, 0);
    this.doc.setLineWidth(0.3);
    const sectionHeight = 30; // Slightly taller
    this.doc.rect(margin, y - 3, pageWidth - 2 * margin, sectionHeight);

    const additionalData = submission.sections.additional;
    const fields = [
      {
        key: 'transport_requirement',
        label: 'Transport Requirement',
        value: additionalData.transport_requirement,
      },
      {
        key: 'transport_location',
        label: 'Transport Location',
        value: additionalData.transport_location,
      },
      { key: 'comments', label: 'Comments', value: additionalData.comments },
    ];

    this.doc.setFontSize(10); // Bigger font for content

    let currentY = y + 2;
    fields.forEach((field, index) => {
      if (field.value && field.value.trim() !== '') {
        const x = margin + 3;
        const labelWidth = 50; // Reduced label width
        const valueWidth = pageWidth - 2 * margin - labelWidth - 8;

        // Label (always English, always helvetica)
        this.doc.setFont('helvetica', 'bold');
        this.doc.text(field.label + ':', x, currentY);

        // Value (use Bengali font if contains Bengali characters)
        const valueFont = this.getFontForText(
          field.value,
          false,
          bengaliFontLoaded
        );
        this.doc.setFont(valueFont, 'normal');
        const wrappedText = this.wrapText(field.value, valueWidth);
        this.doc.text(wrappedText, x + labelWidth, currentY);

        currentY += wrappedText.split('\n').length * 4; // Better line spacing
      }
    });
  }

  /**
   * Generate contact information section
   */
  async generateContactSection(submission, bengaliFontLoaded = false) {
    const pageWidth = this.doc.internal.pageSize.getWidth();
    const margin = 12; // Reduced margin
    let y = 180; // Better positioning after additional section

    // Section header
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(12); // Bigger font
    this.doc.text('Contact Information', margin, y);
    y += 7; // Better gap

    // Draw section border
    this.doc.setDrawColor(0, 0, 0);
    this.doc.setLineWidth(0.3);
    const sectionHeight = 30; // Slightly taller
    this.doc.rect(margin, y - 3, pageWidth - 2 * margin, sectionHeight);

    const contactData = submission.sections.contact;
    const fields = [
      {
        key: 'present_address',
        label: 'Present Address',
        value: contactData.present_address,
      },
      {
        key: 'father_phone',
        label: 'Father Phone',
        value: contactData.father_phone,
      },
      {
        key: 'mother_phone',
        label: 'Mother Phone',
        value: contactData.mother_phone,
      },
      { key: 'email', label: 'Email', value: contactData.email },
    ];

    this.doc.setFontSize(10); // Bigger font for content

    let currentY = y + 2;
    fields.forEach((field, index) => {
      if (field.value && field.value.trim() !== '') {
        const x = margin + 3;
        const labelWidth = 50; // Reduced label width
        const valueWidth = pageWidth - 2 * margin - labelWidth - 8;

        // Label (always English, always helvetica)
        this.doc.setFont('helvetica', 'bold');
        this.doc.text(field.label + ':', x, currentY);

        // Value (use Bengali font if contains Bengali characters)
        const valueFont = this.getFontForText(
          field.value,
          false,
          bengaliFontLoaded
        );
        this.doc.setFont(valueFont, 'normal');
        const wrappedText = this.wrapText(field.value, valueWidth);
        this.doc.text(wrappedText, x + labelWidth, currentY);

        currentY += wrappedText.split('\n').length * 4; // Better line spacing
      }
    });
  }



  /**
   * Wrap text to fit within specified width
   * @param {string} text - The text to wrap
   * @param {number} maxWidth - Maximum width in mm
   * @returns {string} Wrapped text
   */
  wrapText(text, maxWidth) {
    if (!text) return '';

    const lines = [];
    const paragraphs = text.split('\n');

    paragraphs.forEach(paragraph => {
      if (!paragraph.trim()) {
        lines.push('');
        return;
      }

      // Handle Bengali text (sentences end with full stop)
      if (paragraph.includes('।')) {
        const sentences = paragraph.split('।');
        sentences.forEach(sentence => {
          if (!sentence.trim()) return;

          const words = sentence.trim().split(' ');
          let currentLine = '';

          words.forEach(word => {
            const testLine = currentLine + (currentLine ? ' ' : '') + word;
            const testWidth = this.doc.getTextWidth(testLine);

            if (testWidth <= maxWidth) {
              currentLine = testLine;
            } else {
              if (currentLine) {
                lines.push(currentLine);
                currentLine = word;
              } else {
                // If a single word is too long, break it
                const chars = word.split('');
                let wordLine = '';
                chars.forEach(char => {
                  const testWord = wordLine + char;
                  if (this.doc.getTextWidth(testWord) <= maxWidth) {
                    wordLine = testWord;
                  } else {
                    if (wordLine) {
                      lines.push(wordLine);
                      wordLine = char;
                    } else {
                      lines.push(char);
                    }
                  }
                });
                if (wordLine) {
                  currentLine = wordLine;
                }
              }
            }
          });

          if (currentLine) {
            lines.push(currentLine + '।');
          }
        });
      } else {
        // Handle English text (sentences end with period, question mark, or exclamation)
        const sentences = paragraph.split(/[.!?]/);
        sentences.forEach(sentence => {
          if (!sentence.trim()) return;

          const words = sentence.trim().split(' ');
          let currentLine = '';

          words.forEach(word => {
            const testLine = currentLine + (currentLine ? ' ' : '') + word;
            const testWidth = this.doc.getTextWidth(testLine);

            if (testWidth <= maxWidth) {
              currentLine = testLine;
            } else {
              if (currentLine) {
                lines.push(currentLine);
                currentLine = word;
              } else {
                // If a single word is too long, break it
                const chars = word.split('');
                let wordLine = '';
                chars.forEach(char => {
                  const testWord = wordLine + char;
                  if (this.doc.getTextWidth(testWord) <= maxWidth) {
                    wordLine = testWord;
                  } else {
                    if (wordLine) {
                      lines.push(wordLine);
                      wordLine = char;
                    } else {
                      lines.push(char);
                    }
                  }
                });
                if (wordLine) {
                  currentLine = wordLine;
                }
              }
            }
          });

          if (currentLine) {
            // Add back the punctuation that was removed by split
            const originalSentence = paragraph
              .split(/[.!?]/)
              .find(s => s.trim() === sentence.trim());
            if (originalSentence) {
              const punctuation = paragraph.charAt(
                paragraph.indexOf(originalSentence) + originalSentence.length
              );
              lines.push(currentLine + punctuation);
            } else {
              lines.push(currentLine);
            }
          }
        });
      }
    });

    return lines.join('\n');
  }

  /**
   * Format date for display
   * @param {string} dateString - ISO date string
   * @returns {string} Formatted date
   */
  formatDate(dateString) {
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
  generateFilename(submission) {
    const studentName = (submission.studentNameEnglish || 'unknown').trim();
    const classLevel = submission.desiredClass || 'unknown';
    const timestamp = new Date().toISOString().slice(0, 10);

    // Clean student name for filename - handle Bengali characters
    const cleanName = studentName
      .trim()
      .replace(/[^\u0000-\u007F\u0980-\u09FF]/g, '') // Keep ASCII and Bengali characters
      .replace(/[^a-zA-Z0-9\u0980-\u09FF]/g, '-') // Replace special chars with dash
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    return `${cleanName}_${classLevel}_${timestamp}.pdf`;
  }
}

module.exports = PDFGenerator;
