'use client';

import Script from 'next/script';
import { useEffect, Suspense } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { trackFacebookPageView } from '@/lib/analytics';

interface FacebookPixelProps {
  pixelId?: string;
}

function FacebookPixelInner({ pixelId }: FacebookPixelProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  // Get pixel ID from props or environment variable
  const FB_PIXEL_ID = pixelId || process.env.NEXT_PUBLIC_FB_PIXEL_ID;

  useEffect(() => {
    if (!FB_PIXEL_ID) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('⚠️ Facebook Pixel: NEXT_PUBLIC_FB_PIXEL_ID is not set');
        console.warn('⚠️ Add NEXT_PUBLIC_FB_PIXEL_ID to your .env.local file');
      }
      return;
    }

    // Wait a bit for the script to load, then track page view
    const timer = setTimeout(() => {
      if (typeof window !== 'undefined' && typeof window.fbq === 'function') {
        trackFacebookPageView();
        
        // Development-only verification
        if (process.env.NODE_ENV === 'development') {
          console.log('✅ Facebook Pixel PageView tracked for:', pathname);
        }
      } else if (process.env.NODE_ENV === 'development') {
        console.warn('⚠️ Facebook Pixel: fbq function not found. Script may not have loaded yet.');
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [pathname, searchParams, FB_PIXEL_ID]);

  // Don't render if no pixel ID
  if (!FB_PIXEL_ID) {
    if (process.env.NODE_ENV === 'development') {
      return (
        <div style={{ display: 'none' }}>
          {/* Debug info - only in development */}
          <script
            dangerouslySetInnerHTML={{
              __html: `console.warn('Facebook Pixel: No pixel ID configured');`,
            }}
          />
        </div>
      );
    }
    return null;
  }

  return (
    <>
      <Script
        id="facebook-pixel"
        strategy="afterInteractive"
        onLoad={() => {
          if (process.env.NODE_ENV === 'development') {
            console.log('✅ Facebook Pixel script loaded');
            console.log('✅ Pixel ID:', FB_PIXEL_ID);
          }
        }}
        onError={() => {
          if (process.env.NODE_ENV === 'development') {
            console.error('❌ Facebook Pixel script failed to load');
          }
        }}
        dangerouslySetInnerHTML={{
          __html: `
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${FB_PIXEL_ID}');
            fbq('track', 'PageView');
          `,
        }}
      />
      <noscript>
        <img
          height="1"
          width="1"
          style={{ display: 'none' }}
          src={`https://www.facebook.com/tr?id=${FB_PIXEL_ID}&ev=PageView&noscript=1`}
          alt=""
        />
      </noscript>
    </>
  );
}

export function FacebookPixel({ pixelId }: FacebookPixelProps) {
  return (
    <Suspense fallback={null}>
      <FacebookPixelInner pixelId={pixelId} />
    </Suspense>
  );
}

