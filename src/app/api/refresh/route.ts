import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';

/**
 * API route to manually refresh content in development mode
 * This is useful for testing content updates without restarting the dev server
 */
export async function POST(request: NextRequest) {
  // Only allow in development mode
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { message: 'Refresh only available in development mode' },
      { status: 403 }
    );
  }

  try {
    const { tags } = await request.json();
    
    if (!tags || !Array.isArray(tags)) {
      return NextResponse.json(
        { message: 'Tags array is required' },
        { status: 400 }
      );
    }

    // Revalidate all provided tags
    tags.forEach((tag: string) => {
      revalidateTag(tag);
    });



    return NextResponse.json({
      message: 'Content refreshed successfully',
      revalidatedTags: tags,
    });
  } catch (error) {
    return NextResponse.json(
      { message: 'Failed to refresh content' },
      { status: 500 }
    );
  }
}

/**
 * GET method to check if refresh is available
 */
export async function GET() {
  return NextResponse.json({
    available: process.env.NODE_ENV === 'development',
    message: process.env.NODE_ENV === 'development' 
      ? 'Refresh endpoint is available' 
      : 'Refresh only available in development mode',
  });
}
