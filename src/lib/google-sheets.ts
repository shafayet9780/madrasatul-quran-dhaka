/**
 * Google Sheets API integration for form submissions
 * This module handles sending form data to Google Sheets
 */

interface FormSubmissionData {
  [key: string]: string | string[] | boolean | number;
}

interface GoogleSheetsConfig {
  spreadsheetId: string;
  range?: string;
  apiKey?: string;
  fieldOrder?: string[];
  autoDetectRange?: boolean;
}

/**
 * Send form data to Google Sheets
 * @param data - Form submission data
 * @param config - Google Sheets configuration
 * @returns Promise<boolean> - Success status
 */
export async function submitToGoogleSheets(
  data: FormSubmissionData,
  config: GoogleSheetsConfig,
  formConfig?: any // Add form configuration for option value-to-label conversion
): Promise<{ success: boolean; error?: string }> {
  try {
    // Prepare the data for Google Sheets
    const values = prepareDataForSheets(data, config.fieldOrder, formConfig);
    
    // For now, we'll use a server-side API route to handle the Google Sheets integration
    // This is more secure than exposing API keys on the client side
    const response = await fetch('/api/submit-form', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data: values,
        spreadsheetId: config.spreadsheetId,
        range: config.range || 'A:Z',
        fieldOrder: config.fieldOrder,
        autoDetectRange: config.autoDetectRange || false,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to submit form');
    }

    return { success: true };
  } catch (error) {
    console.error('Error submitting to Google Sheets:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    };
  }
}

/**
 * Prepare form data for Google Sheets format
 * @param data - Form submission data
 * @param fieldOrder - Array of field names in the correct order
 * @param formConfig - Form configuration for option value-to-label conversion
 * @returns Array of values for Google Sheets
 */
function prepareDataForSheets(data: FormSubmissionData, fieldOrder?: string[], formConfig?: any): string[] {
  const values: string[] = [];
  
  if (fieldOrder) {
    // Use the provided field order (timestamp is now included in field order if needed)
    fieldOrder.forEach(fieldName => {
      const value = data[fieldName];
      
      // If this is timestamp and no value provided, add current timestamp
      let convertedValue = value;
      if (fieldName === 'timestamp' && !value) {
        convertedValue = new Date().toISOString();
      } else {
        convertedValue = convertValueToLabel(value, fieldName, formConfig);
      }
      
      if (Array.isArray(convertedValue)) {
        values.push(convertedValue.join(', '));
      } else if (typeof convertedValue === 'boolean') {
        values.push(convertedValue ? 'Yes' : 'No');
      } else {
        values.push(String(convertedValue || ''));
      }
    });
  } else {
    // Fallback to original behavior - add timestamp first, then data
    values.push(new Date().toISOString());
    Object.entries(data).forEach(([key, value]) => {
      const convertedValue = convertValueToLabel(value, key, formConfig);
      
      if (Array.isArray(convertedValue)) {
        values.push(convertedValue.join(', '));
      } else if (typeof convertedValue === 'boolean') {
        values.push(convertedValue ? 'Yes' : 'No');
      } else {
        values.push(String(convertedValue || ''));
      }
    });
  }
  
  return values;
}

/**
 * Convert option values to display labels
 * @param value - The form field value
 * @param fieldName - The field name
 * @param formConfig - Form configuration
 * @returns Converted value (label instead of value for options)
 */
function convertValueToLabel(value: any, fieldName: string, formConfig?: any): any {
  if (!formConfig || !value) return value;
  
  // Find the field configuration
  const field = findFieldByKey(fieldName, formConfig);
  if (!field || !field.options) return value;
  
  // Handle array values (checkbox fields)
  if (Array.isArray(value)) {
    return value.map(v => {
      const option = field.options.find((opt: any) => opt.value === v);
      return option ? option.label.english || option.label.bengali || v : v;
    });
  }
  
  // Handle single values (select, radio fields)
  const option = field.options.find((opt: any) => opt.value === value);
  const result = option ? option.label.english || option.label.bengali || value : value;
  return result;
}

/**
 * Find field configuration by field key
 * @param fieldKey - The field key to search for
 * @param formConfig - Form configuration
 * @returns Field configuration or null
 */
function findFieldByKey(fieldKey: string, formConfig: any): any {
  // Search in all field arrays
  const allFields = [
    ...(formConfig.generalQuestions || []),
    ...(formConfig.studentInfoFields || []),
    ...(formConfig.studentAssessmentFields || []),
    ...(formConfig.parentInfoFields?.fatherFields || []),
    ...(formConfig.parentInfoFields?.motherFields || []),
    ...(formConfig.additionalQuestions || []),
    ...(formConfig.contactInfoFields || [])
  ];
  
  // Find field by fieldName or by generated key
  return allFields.find(field => {
    if (field.fieldName === fieldKey) return true;
    
    // For general questions, check if the generated key matches
    if (field.question && fieldKey.startsWith('general_')) {
      const questionText = field.question.english || field.question.bengali || '';
      const generatedKey = `general_${questionText.toLowerCase().replace(/[^a-z0-9]/g, '_')}_`;
      return fieldKey.startsWith(generatedKey);
    }
    
    return false;
  });
}

/**
 * Get Google Sheets headers for the form
 * This should match the order of fields in the form
 * @param formFields - Array of form field names
 * @returns Array of header strings
 */
export function getSheetsHeaders(formFields: string[]): string[] {
  return [
    'Submission Date',
    ...formFields
  ];
}

/**
 * Validate Google Sheets configuration
 * @param config - Google Sheets configuration
 * @returns boolean - Whether config is valid
 */
export function validateSheetsConfig(config: GoogleSheetsConfig): boolean {
  return !!(config.spreadsheetId && config.range);
}

/**
 * Test Google Sheets connection
 * @param config - Google Sheets configuration
 * @returns Promise<boolean> - Connection status
 */
export async function testSheetsConnection(config: GoogleSheetsConfig): Promise<boolean> {
  try {
    const response = await fetch('/api/test-sheets', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        spreadsheetId: config.spreadsheetId,
        range: config.range,
      }),
    });

    return response.ok;
  } catch (error) {
    console.error('Error testing Google Sheets connection:', error);
    return false;
  }
}
