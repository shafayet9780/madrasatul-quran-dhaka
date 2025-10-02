import { NextRequest, NextResponse } from 'next/server';

/**
 * API route for downloading Parents Code of Conduct PDF
 * Provides analytics and proper download headers
 */

export async function GET(request: NextRequest) {
  try {
    // Get the blob store URL from environment variable
    const blobStoreUrl = process.env.BLOB_STORE_URL;
    
    if (!blobStoreUrl) {
      return NextResponse.json(
        { success: false, error: 'BLOB_STORE_URL environment variable is not set' },
        { status: 500 }
      );
    }
    
    // Construct the full URL to the code of conduct file
    const codeOfConductUrl = `${blobStoreUrl}/prospectus/parents_code_of_conduct_mqd.pdf`;
    
    // Fetch the file from blob storage
    const response = await fetch(codeOfConductUrl);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch code of conduct file: ${response.statusText}`);
    }
    
    // Get the file as a blob
    const fileBlob = await response.blob();
    
    // Return the file with proper headers
    return new NextResponse(fileBlob, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="Parents-Code-of-Conduct-MQD.pdf"',
        'Cache-Control': 'public, max-age=3600',
        'Content-Length': fileBlob.size.toString(),
      },
    });

  } catch (error) {
    console.error('Error downloading code of conduct:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to download code of conduct' },
      { status: 500 }
    );
  }
}

