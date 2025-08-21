import type { Metadata } from 'next';
import { Inter, Noto_Sans_Bengali, Amiri } from 'next/font/google';
import { GoogleAnalytics, CookieConsent, InteractionTracker } from '@/components/analytics/google-analytics';
import { PageErrorBoundary } from '@/components/error-boundary';
import './globals.css';

// Font configurations with optimized loading
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-english',
  display: 'swap',
  preload: true,
  fallback: ['system-ui', 'arial'],
  adjustFontFallback: true,
});

const notoSansBengali = Noto_Sans_Bengali({
  subsets: ['bengali'],
  variable: '--font-bengali',
  display: 'swap',
  preload: true,
  fallback: ['SolaimanLipi', 'Kalpurush', 'sans-serif'],
  adjustFontFallback: true,
});

const amiri = Amiri({
  subsets: ['arabic'],
  weight: ['400', '700'],
  variable: '--font-arabic',
  display: 'swap',
  preload: false, // Load on demand for Arabic text
  fallback: ['Times New Roman', 'serif'],
  adjustFontFallback: true,
});

export const metadata: Metadata = {
  metadataBase: new URL('https://madrasatul-quran.edu.bd'),
  title: {
    template: '%s | Madrasatul Quran',
    default: 'Madrasatul Quran - Excellence in Islamic Education',
  },
  description: 'A leading Islamic educational institution in Dhaka combining traditional Islamic values with contemporary education for holistic development',
  keywords: ['Islamic education', 'Madrasah', 'Quran', 'Hadith', 'Dhaka', 'Bangladesh', 'Educational institution'],
  authors: [{ name: 'Madrasatul Quran' }],
  creator: 'Madrasatul Quran',
  publisher: 'Madrasatul Quran',
  
  // Icons
  icons: {
    icon: [
      { url: '/api/favicon', sizes: '32x32' },
      { url: '/favicon.ico' },
      { url: '/icon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/icon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  
  // Open Graph
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://madrasatul-quran.edu.bd',
    siteName: 'Madrasatul Quran',
    title: 'Madrasatul Quran - Excellence in Islamic Education',
    description: 'A leading Islamic educational institution in Dhaka combining traditional Islamic values with contemporary education for holistic development',
    images: [
      {
        url: '/images/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Madrasatul Quran - Islamic Education Excellence',
      },
    ],
  },
  
  // Twitter
  twitter: {
    card: 'summary_large_image',
    title: 'Madrasatul Quran - Excellence in Islamic Education',
    description: 'A leading Islamic educational institution in Dhaka combining traditional Islamic values with contemporary education for holistic development',
    images: ['/images/twitter-image.jpg'],
    creator: '@madrasatul_quran',
    site: '@madrasatul_quran',
  },
  
  // Verification
  verification: {
    google: 'your-google-verification-code',
    yandex: 'your-yandex-verification-code',
    yahoo: 'your-yahoo-verification-code',
  },
  
  // Robots
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  
  // Additional meta tags
  other: {
    'geo.region': 'BD-13',
    'geo.placename': 'Dhaka',
    'geo.position': '23.8103;90.4125',
    'ICBM': '23.8103, 90.4125',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${notoSansBengali.variable} ${amiri.variable}`}>
      <body className="font-english antialiased">
        <PageErrorBoundary>
          <InteractionTracker>
            {children}
          </InteractionTracker>
        </PageErrorBoundary>
        
        {/* Analytics and Monitoring */}
        <GoogleAnalytics />
        <CookieConsent />
      </body>
    </html>
  );
}
