import { NextRequest, NextResponse } from 'next/server';
import imageUrlBuilder from '@sanity/image-url';
import { client } from '@/lib/sanity';

const builder = imageUrlBuilder(client);

export async function GET(
  request: NextRequest,
  { params }: { params: { ref: string } }
) {
  try {
    const { ref } = params;
    const { searchParams } = new URL(request.url);
    
    // Get query parameters for image transformations
    const width = searchParams.get('w') ? parseInt(searchParams.get('w')!) : undefined;
    const height = searchParams.get('h') ? parseInt(searchParams.get('h')!) : undefined;
    const quality = searchParams.get('q') ? parseInt(searchParams.get('q')!) : 80;
    const format = searchParams.get('f') || 'webp';

    // Build the image URL
    let urlBuilder = builder.image({ _ref: ref, _type: 'reference' });
    
    if (width) urlBuilder = urlBuilder.width(width);
    if (height) urlBuilder = urlBuilder.height(height);
    urlBuilder = urlBuilder.quality(quality).format(format as any);

    const imageUrl = urlBuilder.url();

    // Redirect to the Sanity CDN URL
    return NextResponse.redirect(imageUrl);
  } catch (error) {
    console.error('Error processing image:', error);
    
    // Return a placeholder image on error
    const placeholderSvg = `
      <svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
        <rect width="400" height="300" fill="#f3f4f6"/>
        <text x="200" y="150" text-anchor="middle" fill="#6b7280" font-family="Arial" font-size="16">
          Image not available
        </text>
      </svg>
    `;
    
    return new NextResponse(placeholderSvg, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  }
}