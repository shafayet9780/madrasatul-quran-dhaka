import { NextRequest, NextResponse } from 'next/server';
import { getContentService } from '@/lib/content-service';

export async function GET(request: NextRequest) {
  try {
    const contentService = getContentService(false);
    const siteSettings = await contentService.getSiteSettings();
    

    
    if (siteSettings?.favicon?.asset?._ref) {
      // Redirect to Sanity favicon with proper transformations
      const faviconUrl = `/api/image/${siteSettings.favicon.asset._ref}?w=32&h=32&f=png`;

      
      // Add cache control headers for favicon
      const response = NextResponse.redirect(new URL(faviconUrl, request.url));
      response.headers.set('Cache-Control', 'public, max-age=86400'); // Cache for 24 hours
      response.headers.set('Vary', 'Accept');
      return response;
    }
    
    // Fallback: serve default favicon
    const response = NextResponse.redirect(new URL('/favicon.ico', request.url));
    response.headers.set('Cache-Control', 'public, max-age=86400');
    return response;
  } catch (error) {
    // Fallback to default favicon on error
    const response = NextResponse.redirect(new URL('/favicon.ico', request.url));
    response.headers.set('Cache-Control', 'public, max-age=86400');
    return response;
  }
}
