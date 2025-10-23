/**
 * PDF Generator using Puppeteer
 * Generates PDFs with perfect Bengali text rendering using headless Chrome
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const TemplateRenderer = require('./template-renderer');
const { generateFilename } = require('./text-utils');

/**
 * Puppeteer PDF Generator class
 */
class PuppeteerPDFGenerator {
  constructor() {
    this.browser = null;
    this.templateRenderer = new TemplateRenderer();
    this.templatePath = path.join(__dirname, '../templates/admission-form.html');
  }

  /**
   * Initialize browser (reuse across multiple PDF generations)
   */
  async initBrowser() {
    if (!this.browser) {
      console.log('🚀 Launching headless Chrome...');
      this.browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu'
        ]
      });
      console.log('✅ Chrome launched successfully');
    }
    return this.browser;
  }

  /**
   * Close browser
   */
  async closeBrowser() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      console.log('🔒 Browser closed');
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

      // Prepare template data
      const templateData = this.templateRenderer.prepareTemplateData(
        submission,
        studentPhoto,
        fatherPhoto
      );

      // Render HTML
      const html = this.templateRenderer.render(this.templatePath, templateData);

      // Initialize browser
      await this.initBrowser();

      // Create new page
      const page = await this.browser.newPage();

      // Set content and wait for fonts to load
      await page.setContent(html, {
        waitUntil: ['networkidle0', 'load'],
        timeout: 30000
      });

      // Wait a bit more for web fonts to fully render
      await page.evaluateHandle('document.fonts.ready');

      // Generate PDF filename and path
      const filename = generateFilename(submission);
      const outputPath = path.join(__dirname, '../output', filename);

      // Ensure output directory exists
      const outputDir = path.dirname(outputPath);
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      // Generate PDF
      await page.pdf({
        path: outputPath,
        format: 'A4',
        printBackground: true,
        margin: {
          top: '0mm',
          right: '0mm',
          bottom: '0mm',
          left: '0mm'
        }
      });

      // Close page
      await page.close();

      console.log(`✅ PDF generated: ${filename}`);
      return outputPath;

    } catch (error) {
      console.error('❌ Error generating PDF:', error);
      throw error;
    }
  }

  /**
   * Generate multiple PDFs (batch operation)
   * More efficient than calling generatePDF multiple times
   * @param {Array} submissions - Array of {submission, studentPhoto, fatherPhoto}
   * @returns {Promise<Array>} Array of output paths
   */
  async generateBatch(submissions) {
    try {
      console.log(`📦 Generating ${submissions.length} PDFs in batch...`);

      // Initialize browser once
      await this.initBrowser();

      const results = [];

      for (const { submission, studentPhoto, fatherPhoto } of submissions) {
        try {
          const outputPath = await this.generatePDF(submission, studentPhoto, fatherPhoto);
          results.push({ success: true, outputPath, submission });
        } catch (error) {
          console.error(`❌ Failed to generate PDF for ${submission.studentName}:`, error.message);
          results.push({ success: false, error: error.message, submission });
        }
      }

      console.log(`✅ Batch complete: ${results.filter(r => r.success).length}/${submissions.length} successful`);
      return results;

    } catch (error) {
      console.error('❌ Error in batch generation:', error);
      throw error;
    }
  }
}

module.exports = PuppeteerPDFGenerator;

