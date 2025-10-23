/**
 * PDF Generator - Main Export
 * Uses Puppeteer for perfect Bengali text rendering
 * 
 * Note: The old jsPDF implementation has been backed up to:
 * pdf-generator-jspdf-backup.js
 */

const PuppeteerPDFGenerator = require('./pdf-generator-puppeteer');

// Export Puppeteer generator as default
module.exports = PuppeteerPDFGenerator;
