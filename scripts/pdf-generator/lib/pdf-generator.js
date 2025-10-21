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
      bold: null
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
      const regularFontPath = path.join(__dirname, '../fonts/NotoSansBengali-Regular.ttf');
      const boldFontPath = path.join(__dirname, '../fonts/NotoSansBengali-Bold.ttf');

      if (fs.existsSync(regularFontPath)) {
        this.fonts.regular = fs.readFileSync(regularFontPath);
      }
      if (fs.existsSync(boldFontPath)) {
        this.fonts.bold = fs.readFileSync(boldFontPath);
      }

      console.log('📝 Bengali fonts loaded');
    } catch (error) {
      console.error('❌ Error loading fonts:', error);
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
        format: 'a4'
      });

      // Add Bengali fonts if available
      if (this.fonts.regular) {
        this.doc.addFileToVFS('NotoSansBengali-Regular.ttf', this.fonts.regular.toString('base64'));
        this.doc.addFont('NotoSansBengali-Regular.ttf', 'NotoSansBengali', 'normal');
      }
      if (this.fonts.bold) {
        this.doc.addFileToVFS('NotoSansBengali-Bold.ttf', this.fonts.bold.toString('base64'));
        this.doc.addFont('NotoSansBengali-Bold.ttf', 'NotoSansBengali', 'bold');
      }

      // Set default font
      this.doc.setFont('NotoSansBengali', 'normal');
      this.doc.setFontSize(10);

      // Generate PDF content with proper layout
      await this.generateHeader(submission, studentPhoto);
      await this.generateStudentSection(submission);
      await this.generateAssessmentSection(submission);
      await this.generateFatherSection(submission, fatherPhoto);
      await this.generateMotherSection(submission);
      
      // Add new page for additional sections
      this.doc.addPage();
      await this.generateAdditionalSection(submission);
      await this.generateContactSection(submission);
      await this.generateDeclaration(submission);

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
  async generateHeader(submission, studentPhoto) {
    const pageWidth = this.doc.internal.pageSize.getWidth();
    const margin = 20;
    let y = 20;

    // School name and title
    this.doc.setFont('NotoSansBengali', 'bold');
    this.doc.setFontSize(16);
    this.doc.text('মাদরাসাতুল কুরআন ঢাকা', pageWidth / 2, y, { align: 'center' });

    y += 8;
    this.doc.setFontSize(12);
    this.doc.text('প্রাক-ভর্তি আবেদন ফরম', pageWidth / 2, y, { align: 'center' });

    // Student photo (top-right)
    if (studentPhoto) {
      try {
        const photoWidth = 30;
        const photoHeight = 40;
        const photoX = pageWidth - margin - photoWidth;
        const photoY = 15;

        this.doc.addImage(studentPhoto, 'JPEG', photoX, photoY, photoWidth, photoHeight);
        
        // Photo label
        this.doc.setFont('NotoSansBengali', 'normal');
        this.doc.setFontSize(8);
        this.doc.text('শিক্ষার্থীর ছবি', photoX + photoWidth / 2, photoY + photoHeight + 5, { align: 'center' });
      } catch (error) {
        console.log('⚠️ Could not add student photo:', error.message);
      }
    }

    // Submission info
    y += 15;
    this.doc.setFont('NotoSansBengali', 'normal');
    this.doc.setFontSize(10);
    this.doc.text(`আবেদনের তারিখ: ${this.formatDate(submission.timestamp)}`, margin, y);
    this.doc.text(`সারি নম্বর: ${submission.rowNumber}`, pageWidth - margin - 30, y);
  }

  /**
   * Generate student information section
   */
  async generateStudentSection(submission) {
    const pageWidth = this.doc.internal.pageSize.getWidth();
    const margin = 20;
    let y = this.doc.internal.pageSize.getHeight() - 250;

    // Section header
    this.doc.setFont('NotoSansBengali', 'bold');
    this.doc.setFontSize(12);
    this.doc.text('শিক্ষার্থীর তথ্য', margin, y);
    y += 8;

    // Draw section border
    this.doc.setDrawColor(0, 0, 0);
    this.doc.setLineWidth(0.5);
    const sectionHeight = 60;
    this.doc.rect(margin, y - 5, pageWidth - 2 * margin, sectionHeight);

    // Student information fields
    const studentData = submission.sections.student;
    const fields = [
      { key: 'student_name_bengali', label: 'নাম (বাংলায়)', value: studentData.student_name_bengali || submission.studentName },
      { key: 'student_name_english', label: 'Name (English)', value: studentData.student_name_english || submission.studentNameEnglish },
      { key: 'student_gender', label: 'লিঙ্গ', value: studentData.student_gender },
      { key: 'date_of_birth', label: 'জন্ম তারিখ', value: studentData.date_of_birth },
      { key: 'desired_class', label: 'যে ক্লাসে ভর্তি হতে ইচ্ছুক', value: studentData.desired_class || submission.desiredClass },
      { key: 'last_class_attended', label: 'সর্বশেষ যে শ্রেণীতে অধ্যয়ন করেছে', value: studentData.last_class_attended },
      { key: 'previous_school', label: 'পূর্ববর্তী শিক্ষা প্রতিষ্ঠানের নাম', value: studentData.previous_school }
    ];

    this.doc.setFont('NotoSansBengali', 'normal');
    this.doc.setFontSize(9);

    let currentY = y + 5;
    fields.forEach((field, index) => {
      if (field.value && field.value.trim() !== '') {
        const x = margin + 5;
        const labelWidth = 50;
        const valueWidth = pageWidth - 2 * margin - labelWidth - 10;

        // Label
        this.doc.setFont('NotoSansBengali', 'bold');
        this.doc.text(field.label + ':', x, currentY);
        
        // Value
        this.doc.setFont('NotoSansBengali', 'normal');
        const wrappedText = this.wrapText(field.value, valueWidth);
        this.doc.text(wrappedText, x + labelWidth, currentY);
        
        currentY += wrappedText.split('\n').length * 4;
      }
    });
  }

  /**
   * Generate student assessment section
   */
  async generateAssessmentSection(submission) {
    const pageWidth = this.doc.internal.pageSize.getWidth();
    const margin = 20;
    let y = this.doc.internal.pageSize.getHeight() - 180;

    // Section header
    this.doc.setFont('NotoSansBengali', 'bold');
    this.doc.setFontSize(12);
    this.doc.text('শিক্ষার্থীর মূল্যায়ন', margin, y);
    y += 8;

    // Draw section border
    this.doc.setDrawColor(0, 0, 0);
    this.doc.setLineWidth(0.5);
    const sectionHeight = 50;
    this.doc.rect(margin, y - 5, pageWidth - 2 * margin, sectionHeight);

    const assessmentData = submission.sections.assessment;
    const fields = [
      { key: 'quran_level', label: 'কুরআন পড়ার দক্ষতা', value: assessmentData.quran_level },
      { key: 'arabic_level', label: 'আরবি ভাষার দক্ষতা', value: assessmentData.arabic_level },
      { key: 'general_subjects_level', label: 'জেনারেল শিক্ষার দক্ষতা', value: assessmentData.general_subjects_level },
      { key: 'obeying_parents', label: 'পিতামাতার অনুগত', value: assessmentData.obeying_parents },
      { key: 'purpose_of_study', label: 'শিক্ষার মূল উদ্দেশ্য', value: assessmentData.purpose_of_study }
    ];

    this.doc.setFont('NotoSansBengali', 'normal');
    this.doc.setFontSize(9);

    let currentY = y + 5;
    fields.forEach((field, index) => {
      if (field.value && field.value.trim() !== '') {
        const x = margin + 5;
        const labelWidth = 50;
        const valueWidth = pageWidth - 2 * margin - labelWidth - 10;

        this.doc.setFont('NotoSansBengali', 'bold');
        this.doc.text(field.label + ':', x, currentY);
        
        this.doc.setFont('NotoSansBengali', 'normal');
        const wrappedText = this.wrapText(field.value, valueWidth);
        this.doc.text(wrappedText, x + labelWidth, currentY);
        
        currentY += wrappedText.split('\n').length * 4;
      }
    });
  }

  /**
   * Generate father information section
   */
  async generateFatherSection(submission, fatherPhoto) {
    const pageWidth = this.doc.internal.pageSize.getWidth();
    const margin = 20;
    let y = this.doc.internal.pageSize.getHeight() - 120;

    // Section header
    this.doc.setFont('NotoSansBengali', 'bold');
    this.doc.setFontSize(12);
    this.doc.text('পিতার তথ্য', margin, y);
    y += 8;

    // Draw section border
    this.doc.setDrawColor(0, 0, 0);
    this.doc.setLineWidth(0.5);
    const sectionHeight = 60;
    this.doc.rect(margin, y - 5, pageWidth - 2 * margin, sectionHeight);

    // Father photo (if available)
    if (fatherPhoto) {
      try {
        const photoWidth = 25;
        const photoHeight = 30;
        const photoX = pageWidth - margin - photoWidth;
        const photoY = y - 5;

        this.doc.addImage(fatherPhoto, 'JPEG', photoX, photoY, photoWidth, photoHeight);
      } catch (error) {
        console.log('⚠️ Could not add father photo:', error.message);
      }
    }

    const fatherData = submission.sections.father;
    const fields = [
      { key: 'father_name', label: 'পিতার নাম', value: fatherData.father_name || submission.fatherName },
      { key: 'father_name_english', label: "Father's Name", value: fatherData.father_name_english },
      { key: 'father_occupation', label: 'পেশার বিবরণ', value: fatherData.father_occupation },
      { key: 'father_organization', label: 'প্রতিষ্ঠান/ব্যবসার ধরণ', value: fatherData.father_organization },
      { key: 'father_designation', label: 'পদবী', value: fatherData.father_designation },
      { key: 'father_monthly_income', label: 'মাসিক আয়', value: fatherData.father_monthly_income }
    ];

    this.doc.setFont('NotoSansBengali', 'normal');
    this.doc.setFontSize(9);

    let currentY = y + 5;
    fields.forEach((field, index) => {
      if (field.value) {
        const x = margin + 5;
        const labelWidth = 50;
        const valueWidth = pageWidth - 2 * margin - labelWidth - 10;

        this.doc.setFont('NotoSansBengali', 'bold');
        this.doc.text(field.label + ':', x, currentY);
        
        this.doc.setFont('NotoSansBengali', 'normal');
        const wrappedText = this.wrapText(field.value, valueWidth);
        this.doc.text(wrappedText, x + labelWidth, currentY);
        
        currentY += wrappedText.split('\n').length * 4;
      }
    });
  }

  /**
   * Generate mother information section
   */
  async generateMotherSection(submission) {
    const pageWidth = this.doc.internal.pageSize.getWidth();
    const margin = 20;
    let y = this.doc.internal.pageSize.getHeight() - 50;

    // Section header
    this.doc.setFont('NotoSansBengali', 'bold');
    this.doc.setFontSize(12);
    this.doc.text('মাতার তথ্য', margin, y);
    y += 8;

    // Draw section border
    this.doc.setDrawColor(0, 0, 0);
    this.doc.setLineWidth(0.5);
    const sectionHeight = 30;
    this.doc.rect(margin, y - 5, pageWidth - 2 * margin, sectionHeight);

    const motherData = submission.sections.mother;
    const fields = [
      { key: 'mother_name', label: 'মাতার নাম', value: motherData.mother_name || submission.motherName },
      { key: 'mother_name_english', label: "Mother's Name", value: motherData.mother_name_english },
      { key: 'mother_occupation', label: 'পেশার বিবরণ', value: motherData.mother_occupation }
    ];

    this.doc.setFont('NotoSansBengali', 'normal');
    this.doc.setFontSize(9);

    let currentY = y + 5;
    fields.forEach((field, index) => {
      if (field.value) {
        const x = margin + 5;
        const labelWidth = 50;
        const valueWidth = pageWidth - 2 * margin - labelWidth - 10;

        this.doc.setFont('NotoSansBengali', 'bold');
        this.doc.text(field.label + ':', x, currentY);
        
        this.doc.setFont('NotoSansBengali', 'normal');
        const wrappedText = this.wrapText(field.value, valueWidth);
        this.doc.text(wrappedText, x + labelWidth, currentY);
        
        currentY += wrappedText.split('\n').length * 4;
      }
    });
  }

  /**
   * Generate additional information section
   */
  async generateAdditionalSection(submission) {
    const pageWidth = this.doc.internal.pageSize.getWidth();
    const margin = 20;
    let y = 30;

    // Section header
    this.doc.setFont('NotoSansBengali', 'bold');
    this.doc.setFontSize(12);
    this.doc.text('অতিরিক্ত তথ্য', margin, y);
    y += 8;

    // Draw section border
    this.doc.setDrawColor(0, 0, 0);
    this.doc.setLineWidth(0.5);
    const sectionHeight = 30;
    this.doc.rect(margin, y - 5, pageWidth - 2 * margin, sectionHeight);

    const additionalData = submission.sections.additional;
    const fields = [
      { key: 'transport_requirement', label: 'পরিবহন সুবিধা প্রয়োজন', value: additionalData.transport_requirement },
      { key: 'transport_location', label: 'পরিবহন এলাকা', value: additionalData.transport_location },
      { key: 'comments', label: 'মন্তব্য/পরামর্শ', value: additionalData.comments }
    ];

    this.doc.setFont('NotoSansBengali', 'normal');
    this.doc.setFontSize(9);

    let currentY = y + 5;
    fields.forEach((field, index) => {
      if (field.value) {
        const x = margin + 5;
        const labelWidth = 50;
        const valueWidth = pageWidth - 2 * margin - labelWidth - 10;

        this.doc.setFont('NotoSansBengali', 'bold');
        this.doc.text(field.label + ':', x, currentY);
        
        this.doc.setFont('NotoSansBengali', 'normal');
        const wrappedText = this.wrapText(field.value, valueWidth);
        this.doc.text(wrappedText, x + labelWidth, currentY);
        
        currentY += wrappedText.split('\n').length * 4;
      }
    });
  }

  /**
   * Generate contact information section
   */
  async generateContactSection(submission) {
    const pageWidth = this.doc.internal.pageSize.getWidth();
    const margin = 20;
    let y = 120;

    // Section header
    this.doc.setFont('NotoSansBengali', 'bold');
    this.doc.setFontSize(12);
    this.doc.text('যোগাযোগের তথ্য', margin, y);
    y += 8;

    // Draw section border
    this.doc.setDrawColor(0, 0, 0);
    this.doc.setLineWidth(0.5);
    const sectionHeight = 30;
    this.doc.rect(margin, y - 5, pageWidth - 2 * margin, sectionHeight);

    const contactData = submission.sections.contact;
    const fields = [
      { key: 'present_address', label: 'বর্তমান ঠিকানা', value: contactData.present_address },
      { key: 'father_phone', label: 'মোবাইল ফোন নম্বর (পিতা)', value: contactData.father_phone },
      { key: 'mother_phone', label: 'মোবাইল ফোন নম্বর (মাতা)', value: contactData.mother_phone },
      { key: 'email', label: 'ইমেইল', value: contactData.email }
    ];

    this.doc.setFont('NotoSansBengali', 'normal');
    this.doc.setFontSize(9);

    let currentY = y + 5;
    fields.forEach((field, index) => {
      if (field.value) {
        const x = margin + 5;
        const labelWidth = 50;
        const valueWidth = pageWidth - 2 * margin - labelWidth - 10;

        this.doc.setFont('NotoSansBengali', 'bold');
        this.doc.text(field.label + ':', x, currentY);
        
        this.doc.setFont('NotoSansBengali', 'normal');
        const wrappedText = this.wrapText(field.value, valueWidth);
        this.doc.text(wrappedText, x + labelWidth, currentY);
        
        currentY += wrappedText.split('\n').length * 4;
      }
    });
  }

  /**
   * Generate declaration section
   */
  async generateDeclaration(submission) {
    const pageWidth = this.doc.internal.pageSize.getWidth();
    const margin = 20;
    let y = 200;

    // Declaration text
    this.doc.setFont('NotoSansBengali', 'normal');
    this.doc.setFontSize(10);
    
    const declarationText = `মাদরাসাতুল কুরআন একটি সম্পূর্ণ ইসলামিক শিক্ষা প্রতিষ্ঠান। আমি স্বীকৃতি প্রদান করছি যে,

১। উপরে প্রদত্ত সকল তথ্য সঠিক ও সত্য। কোন তথ্য ভুল প্রমাণিত হলে কর্তৃপক্ষ ভর্তি বাতিল করতে পারবে।

২। আমি সকল অভিভাবক আচরণবিধি পড়েছি ও তা মানতে বাধ্য থাকবো।`;

    const wrappedDeclaration = this.wrapText(declarationText, pageWidth - 2 * margin);
    this.doc.text(wrappedDeclaration, margin, y);

    // Signature line
    y += wrappedDeclaration.split('\n').length * 5 + 20;
    this.doc.text('স্বাক্ষর:', margin, y);
    this.doc.text('তারিখ:', pageWidth - margin - 30, y);
  }

  /**
   * Wrap text to fit within specified width
   * @param {string} text - The text to wrap
   * @param {number} maxWidth - Maximum width in mm
   * @returns {string} Wrapped text
   */
  wrapText(text, maxWidth) {
    if (!text) return '';
    
    const words = text.split(' ');
    const lines = [];
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
          lines.push(word);
        }
      }
    });

    if (currentLine) {
      lines.push(currentLine);
    }

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
      return date.toLocaleDateString('bn-BD', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
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
    const studentName = (submission.studentName || 'unknown').trim();
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
