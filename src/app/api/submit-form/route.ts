import { NextRequest, NextResponse } from 'next/server';

/**
 * API route for submitting pre-admission form data to Google Sheets
 * This route handles the server-side integration with Google Sheets API
 */

interface FormSubmissionRequest {
  data: string[];
  spreadsheetId: string;
  range: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: FormSubmissionRequest = await request.json();
    const { data, spreadsheetId, range } = body;

    // Validate request data
    if (!data || !spreadsheetId || !range) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // For now, we'll simulate the Google Sheets integration
    // In production, you would integrate with Google Sheets API here
    console.log('Form submission received:', {
      spreadsheetId,
      range,
      dataCount: data.length,
      timestamp: new Date().toISOString(),
    });

    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // In a real implementation, you would:
    // 1. Authenticate with Google Sheets API
    // 2. Append the data to the specified range
    // 3. Handle any errors from the API

    // For now, we'll just log the data and return success
    console.log('Form data to be submitted:', data);

    return NextResponse.json(
      { 
        success: true, 
        message: 'Form submitted successfully',
        submissionId: `SUB-${Date.now()}`
      },
      { status: 200 }
    );

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
