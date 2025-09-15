/**
 * Google Sheets API integration for form submissions
 * This module handles sending form data to Google Sheets
 */

interface FormSubmissionData {
  [key: string]: string | string[] | boolean | number;
}

interface GoogleSheetsConfig {
  spreadsheetId: string;
  range: string;
  apiKey?: string;
}

/**
 * Send form data to Google Sheets
 * @param data - Form submission data
 * @param config - Google Sheets configuration
 * @returns Promise<boolean> - Success status
 */
export async function submitToGoogleSheets(
  data: FormSubmissionData,
  config: GoogleSheetsConfig
): Promise<{ success: boolean; error?: string }> {
  try {
    // Prepare the data for Google Sheets
    const values = prepareDataForSheets(data);
    
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
        range: config.range,
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
 * @returns Array of values for Google Sheets
 */
function prepareDataForSheets(data: FormSubmissionData): string[] {
  const values: string[] = [];
  
  // Add timestamp
  values.push(new Date().toISOString());
  
  // Convert all form data to strings
  Object.entries(data).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      values.push(value.join(', '));
    } else if (typeof value === 'boolean') {
      values.push(value ? 'Yes' : 'No');
    } else {
      values.push(String(value || ''));
    }
  });
  
  return values;
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
