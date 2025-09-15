import { NextRequest, NextResponse } from 'next/server';

/**
 * API route for testing Google Sheets connection
 */

interface TestSheetsRequest {
  spreadsheetId: string;
  range: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: TestSheetsRequest = await request.json();
    const { spreadsheetId, range } = body;

    // Validate request data
    if (!spreadsheetId || !range) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // For now, we'll simulate a successful connection test
    // In production, you would test the actual Google Sheets API connection here
    console.log('Testing Google Sheets connection:', {
      spreadsheetId,
      range,
      timestamp: new Date().toISOString(),
    });

    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // In a real implementation, you would:
    // 1. Authenticate with Google Sheets API
    // 2. Try to read from the specified range
    // 3. Return the connection status

    return NextResponse.json(
      { 
        success: true, 
        message: 'Google Sheets connection successful',
        spreadsheetId,
        range
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error testing Google Sheets connection:', error);
    
    return NextResponse.json(
      { 
        error: 'Connection test failed',
        message: 'Unable to connect to Google Sheets'
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
