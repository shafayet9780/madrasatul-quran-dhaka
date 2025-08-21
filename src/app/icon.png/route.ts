import { NextRequest, NextResponse } from 'next/server';
import { getContentService } from '@/lib/content-service';

export async function GET(request: NextRequest) {
  try {
    const contentService = getContentService(false);
    const siteSettings = await contentService.getSiteSettings();
    
    if (siteSettings?.favicon?.asset?._ref) {
      // Redirect to Sanity favicon as PNG
      const faviconUrl = `/api/image/${siteSettings.favicon.asset._ref}?w=32&h=32&f=png`;
      return NextResponse.redirect(new URL(faviconUrl, request.url));
    }
    
    // Fallback: serve default favicon
    return NextResponse.redirect(new URL('/favicon.ico', request.url));
  } catch (error) {
    console.error('Icon PNG Error:', error);
    return NextResponse.redirect(new URL('/favicon.ico', request.url));
  }
}

export const runtime = 'edge';
