import { NextRequest, NextResponse } from 'next/server';
import { draftMode } from 'next/headers';
import { redirect } from 'next/navigation';

/**
 * API route to enable preview mode
 * Called from Sanity Studio preview buttons
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret');
  const slug = searchParams.get('slug');
  const type = searchParams.get('type');
  const lang = searchParams.get('lang') || 'bengali';

  // Check for secret
  if (!secret || secret !== process.env.SANITY_PREVIEW_SECRET) {
    return NextResponse.json(
      { message: 'Invalid or missing preview secret' },
      { status: 401 }
    );
  }

  // Validate required parameters
  if (!slug) {
    return NextResponse.json(
      { message: 'Missing slug parameter' },
      { status: 400 }
    );
  }

  try {
    // Enable draft mode
    const draft = await draftMode();
    draft.enable();

    // Construct the preview URL based on content type
    let previewUrl = `/${lang}`;
    
    switch (type) {
      case 'page':
        previewUrl += `/${slug}`;
        break;
      case 'newsEvent':
        previewUrl += `/news/${slug}`;
        break;
      case 'academicProgram':
        previewUrl += `/programs/${slug}`;
        break;
      case 'facility':
        previewUrl += `/campus/${slug}`;
        break;
      default:
        previewUrl += `/${slug}`;
    }

    // Redirect to the preview URL
    redirect(previewUrl);
  } catch (error) {
    console.error('Preview mode error:', error);
    return NextResponse.json(
      { message: 'Failed to enable preview mode' },
      { status: 500 }
    );
  }
}

/**
 * Handle POST requests for webhook-based preview updates
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { secret, documentId, documentType, slug } = body;

    // Verify secret
    if (!secret || secret !== process.env.SANITY_PREVIEW_SECRET) {
      return NextResponse.json(
        { message: 'Invalid or missing preview secret' },
        { status: 401 }
      );
    }

    // Here you could implement webhook handling for real-time preview updates
    // For example, revalidating specific paths when content changes

    return NextResponse.json({ 
      message: 'Preview webhook received',
      documentId,
      documentType,
      slug 
    });
  } catch (error) {
    console.error('Preview webhook error:', error);
    return NextResponse.json(
      { message: 'Failed to process preview webhook' },
      { status: 500 }
    );
  }
}