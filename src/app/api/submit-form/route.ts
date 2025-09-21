import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';

/**
 * Convert a number to Excel column letter (1 -> A, 26 -> Z, 27 -> AA, etc.)
 */
function numberToColumnLetter(num: number): string {
  let result = '';
  while (num > 0) {
    num--; // Adjust for 0-based indexing
    result = String.fromCharCode(65 + (num % 26)) + result;
    num = Math.floor(num / 26);
  }
  return result;
}


/**
 * API route for submitting pre-admission form data to Google Sheets
 * This route handles the server-side integration with Google Sheets API
 */

interface FormSubmissionRequest {
  data: string[];
  spreadsheetId: string;
  range: string;
  fieldOrder?: string[];
  autoDetectRange?: boolean;
}

export async function POST(request: NextRequest) {
  try {
    const body: FormSubmissionRequest = await request.json();
    const { data, spreadsheetId, range, fieldOrder, autoDetectRange } = body;

    // Validate request data
    if (!data || !spreadsheetId || !range) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Google Sheets API integration
    try {
      // Validate environment variables
      if (!process.env.GOOGLE_PROJECT_ID || !process.env.GOOGLE_PRIVATE_KEY || !process.env.GOOGLE_CLIENT_EMAIL) {
        throw new Error('Google Sheets credentials not configured');
      }

      // Initialize Google Sheets API client
      const auth = new google.auth.GoogleAuth({
        credentials: {
          type: 'service_account',
          project_id: process.env.GOOGLE_PROJECT_ID,
          private_key_id: process.env.GOOGLE_PRIVATE_KEY_ID,
          private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
          client_email: process.env.GOOGLE_CLIENT_EMAIL,
          client_id: process.env.GOOGLE_CLIENT_ID,
        },
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
      });

      const sheets = google.sheets({ version: 'v4', auth });

      // First, try to get spreadsheet info to verify access
      try {
        await sheets.spreadsheets.get({
          spreadsheetId,
        });
      } catch (accessError) {
        console.error('Spreadsheet access error:', accessError);
        throw new Error(`Cannot access spreadsheet. Please check: 1) Spreadsheet ID is correct, 2) Service account has access, 3) Spreadsheet exists. Error: ${accessError instanceof Error ? accessError.message : 'Unknown error'}`);
      }

      // Get headers to determine the correct range and data order
      let headers: string[] = [];
      let actualRange = range;
      
      if (autoDetectRange || fieldOrder) {
        try {
          // Get the first two rows: field keys (row 1) and display headers (row 2)
          const headerResponse = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: '1:2', // Get first two rows
          });
          
          if (headerResponse.data.values && headerResponse.data.values.length >= 2) {
            const fieldKeys = headerResponse.data.values[0];
            
            // Use field keys for mapping (row 1)
            headers = fieldKeys;
            
            // Calculate the correct range based on number of headers
            const endColumn = numberToColumnLetter(headers.length);
            actualRange = `A:${endColumn}`;
          }
        } catch (headerError) {
          console.warn('Could not fetch headers, using provided range:', headerError);
        }
      }

      // Prepare data for Google Sheets
      let rowData: string[];
      
      if (fieldOrder && headers.length > 0) {
        // Map form data to match header order using exact field key matching
        rowData = [];
        
        // Create a map of field names to values
        const dataMap = new Map<string, string>();
        data.forEach((value, index) => {
          if (fieldOrder[index]) {
            dataMap.set(fieldOrder[index], value);
          }
        });
        
        // Fill data in header order, including timestamp if present
        for (let i = 0; i < headers.length; i++) {
          const fieldKey = headers[i]; // This is now the exact field key from row 1
          let value = dataMap.get(fieldKey) || '';
          
          // If this is timestamp and no value from frontend, add current timestamp
          if (fieldKey === 'timestamp' && !value) {
            value = new Date().toISOString();
          }

          rowData.push(value);
        }
      } else {
        // Fallback to original behavior
        rowData = [new Date().toISOString(), ...data];
      }

      // Append data to the spreadsheet
      const response = await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: actualRange,
        valueInputOption: 'RAW',
        requestBody: {
          values: [rowData],
        },
      });

      return NextResponse.json(
        {
          success: true,
          message: 'Form submitted successfully to Google Sheets',
          submissionId: `SUB-${Date.now()}`,
          googleSheetsResponse: response.data
        },
        { status: 200 }
      );

    } catch (sheetsError) {
      console.error('Google Sheets API error:', sheetsError);

      // Provide more specific error messages
      let errorMessage = 'Failed to submit to Google Sheets';
      if (sheetsError instanceof Error) {
        if (sheetsError.message.includes('404')) {
          errorMessage = 'Spreadsheet not found. Please check the spreadsheet ID and ensure the service account has access.';
        } else if (sheetsError.message.includes('403')) {
          errorMessage = 'Access denied. Please ensure the service account has edit permissions on the spreadsheet.';
        } else if (sheetsError.message.includes('400')) {
          errorMessage = 'Invalid request. Please check the spreadsheet format and range.';
        } else {
          errorMessage = sheetsError.message;
        }
      }

      return NextResponse.json(
        {
          success: false,
          error: 'Failed to submit to Google Sheets',
          message: errorMessage
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Error processing form submission:', error);

    return NextResponse.json(
      {
        error: 'Internal server error',
        message: 'Failed to submit form. Please try again later.'
      },
      { status: 500 }
    );
  }
}

// Handle preflight requests
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
