/**
 * Template Renderer
 * Renders HTML templates with data using Handlebars-like syntax
 */

const fs = require('fs');
const path = require('path');
const { formatDate } = require('./text-utils');
const {
  getStudentFields,
  getAssessmentFields,
  getFatherFields,
  getMotherFields,
  getAdditionalFields,
  getContactFields,
} = require('./field-definitions');

/**
 * Simple template renderer using string replacement
 * Handles {{variable}} and {{#each array}} syntax
 */
class TemplateRenderer {
  /**
   * Render template with data
   * @param {string} templatePath - Path to HTML template
   * @param {Object} data - Data to render
   * @returns {string} Rendered HTML
   */
  render(templatePath, data) {
    let html = fs.readFileSync(templatePath, 'utf8');

    // Handle {{#each array}} blocks FIRST (before replacing variables inside them)
    html = this.handleEachBlocks(html, data);

    // Handle {{#if variable}} blocks at top level
    html = this.handleIfBlocks(html, data);

    // Replace simple variables {{variable}} (top-level only, after loops processed)
    html = html.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      const value = data[key];
      return value !== undefined && value !== null ? this.escapeHtml(String(value)) : '';
    });

    return html;
  }

  /**
   * Handle {{#if}} conditional blocks
   */
  handleIfBlocks(html, data) {
    const ifRegex = /\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g;
    
    return html.replace(ifRegex, (match, key, content) => {
      const value = data[key];
      return value ? content : '';
    });
  }

  /**
   * Handle {{#each}} iteration blocks
   */
  handleEachBlocks(html, data) {
    const eachRegex = /\{\{#each\s+(\w+)\}\}([\s\S]*?)\{\{\/each\}\}/g;
    
    return html.replace(eachRegex, (match, key, template) => {
      const array = data[key];
      if (!Array.isArray(array)) {
        console.log(`⚠️ Array not found for key: ${key}`);
        return '';
      }

      return array.map(item => {
        let itemHtml = template;
        
        // Handle {{#if value}} blocks within items
        itemHtml = itemHtml.replace(/\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g, (m, prop, content) => {
          const val = item[prop];
          return val && String(val).trim() !== '' ? content : '';
        });
        
        // Replace {{label}}, {{value}}, etc.
        itemHtml = itemHtml.replace(/\{\{(\w+)\}\}/g, (m, prop) => {
          return item[prop] !== undefined && item[prop] !== null 
            ? this.escapeHtml(String(item[prop])) 
            : '';
        });
        
        return itemHtml;
      }).join('');
    });
  }

  /**
   * Escape HTML special characters
   */
  escapeHtml(text) {
    const str = String(text);
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return str.replace(/[&<>"']/g, m => map[m]);
  }

  /**
   * Prepare data for template rendering
   * @param {Object} submission - Submission data
   * @param {string} studentPhoto - Base64 student photo
   * @param {string} fatherPhoto - Base64 father photo
   * @returns {Object} Template data
   */
  prepareTemplateData(submission, studentPhoto = null, fatherPhoto = null) {
    const data = {
      // Header data
      applicationDate: formatDate(submission.timestamp),
      studentPhoto: studentPhoto,
      fatherPhoto: fatherPhoto,

      // Field arrays
      studentFields: this.filterEmptyFields(
        getStudentFields(submission.sections.student, submission)
      ),
      assessmentFields: this.filterEmptyFields(
        getAssessmentFields(submission.sections.assessment)
      ),
      fatherFields: this.filterEmptyFields(
        getFatherFields(submission.sections.father, submission)
      ),
      motherFields: this.filterEmptyFields(
        getMotherFields(submission.sections.mother, submission)
      ),
      additionalFields: this.filterEmptyFields(
        getAdditionalFields(submission.sections.additional)
      ),
      contactFields: this.filterEmptyFields(
        getContactFields(submission.sections.contact)
      ),
    };

    // Debug logging
    console.log('📊 Template data prepared:');
    console.log(`   Student fields: ${data.studentFields.length}`);
    console.log(`   Assessment fields: ${data.assessmentFields.length}`);
    console.log(`   Father fields: ${data.fatherFields.length}`);
    console.log(`   Mother fields: ${data.motherFields.length}`);
    console.log(`   Additional fields: ${data.additionalFields.length}`);
    console.log(`   Contact fields: ${data.contactFields.length}`);

    return data;
  }

  /**
   * Filter out fields with empty values
   */
  filterEmptyFields(fields) {
    return fields.filter(field => 
      field.value && String(field.value).trim() !== ''
    );
  }
}

module.exports = TemplateRenderer;

