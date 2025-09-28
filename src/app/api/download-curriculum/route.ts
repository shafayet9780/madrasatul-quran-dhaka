import { NextRequest, NextResponse } from 'next/server';

/**
 * API route for downloading detailed curriculum PDF
 * Provides analytics and proper download headers
 */

export async function GET(request: NextRequest) {
  try {
    // Log download for analytics (you can extend this to save to database)
    console.log('Detailed curriculum download requested:', {
      timestamp: new Date().toISOString(),
      userAgent: request.headers.get('user-agent'),
      referer: request.headers.get('referer'),
    });

    // Get the blob store URL from environment variable
    const blobStoreUrl = process.env.BLOB_STORE_URL;
    
    if (!blobStoreUrl) {
      return NextResponse.json(
        { success: false, error: 'BLOB_STORE_URL environment variable is not set' },
        { status: 500 }
      );
    }
    
    // Construct the full URL to the curriculum file
    const curriculumUrl = `${blobStoreUrl}/curriculum/madrasatul_quran_detailed_curriculum.pdf`;
    
    // Fetch the file from blob storage
    const response = await fetch(curriculumUrl);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch curriculum file: ${response.statusText}`);
    }
    
    // Get the file as a blob
    const fileBlob = await response.blob();
    
    // Return the file with proper headers
    return new NextResponse(fileBlob, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="Madrasatul-Quran-Detailed-Curriculum.pdf"',
        'Cache-Control': 'public, max-age=3600',
        'Content-Length': fileBlob.size.toString(),
      },
    });

  } catch (error) {
    console.error('Error downloading curriculum:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to download curriculum' },
      { status: 500 }
    );
  }
}
