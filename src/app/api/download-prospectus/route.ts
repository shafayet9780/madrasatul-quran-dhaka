import { NextRequest, NextResponse } from 'next/server';

/**
 * API route for downloading prospectus PDF
 * Provides analytics and proper download headers
 */

export async function GET(request: NextRequest) {
  try {
    // Log download for analytics (you can extend this to save to database)
    console.log('Prospectus download requested:', {
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
    
    // Construct the full URL to the prospectus file
    const prospectusUrl = `${blobStoreUrl}/prospectus/madrasatul-quran-prospectus.pdf`;
    
    // Redirect to the blob URL with download headers
    return NextResponse.redirect(prospectusUrl, {
      status: 302,
      headers: {
        'Content-Disposition': 'attachment; filename="Madrasatul-Quran-Prospectus.pdf"',
        'Cache-Control': 'public, max-age=3600',
      },
    });

  } catch (error) {
    console.error('Error downloading prospectus:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to download prospectus' },
      { status: 500 }
    );
  }
}
