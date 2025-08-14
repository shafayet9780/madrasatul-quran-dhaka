import { NextRequest, NextResponse } from 'next/server';
import { draftMode } from 'next/headers';
import { redirect } from 'next/navigation';

/**
 * API route to disable preview mode
 */
export async function GET(request: NextRequest) {
  try {
    // Disable draft mode
    const draft = await draftMode();
    draft.disable();

    // Get the return URL from query params or default to home
    const { searchParams } = new URL(request.url);
    const returnUrl = searchParams.get('returnUrl') || '/';

    // Redirect to the return URL
    redirect(returnUrl);
  } catch (error) {
    console.error('Exit preview error:', error);
    return NextResponse.json(
      { message: 'Failed to exit preview mode' },
      { status: 500 }
    );
  }
}

/**
 * Handle POST requests for programmatic preview exit
 */
export async function POST() {
  try {
    const draft = await draftMode();
    draft.disable();

    return NextResponse.json({ 
      message: 'Preview mode disabled successfully' 
    });
  } catch (error) {
    console.error('Exit preview error:', error);
    return NextResponse.json(
      { message: 'Failed to exit preview mode' },
      { status: 500 }
    );
  }
}