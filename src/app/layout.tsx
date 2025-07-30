import type { Metadata } from 'next';
import { Inter, Noto_Sans_Bengali, Amiri } from 'next/font/google';
import './globals.css';

// Font configurations
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-english',
  display: 'swap',
});

const notoSansBengali = Noto_Sans_Bengali({
  subsets: ['bengali'],
  variable: '--font-bengali',
  display: 'swap',
});

const amiri = Amiri({
  subsets: ['arabic'],
  weight: ['400', '700'],
  variable: '--font-arabic',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Madrasatul Quran - Excellence in Islamic Education',
  description:
    'Combining traditional Islamic values with contemporary education for holistic development',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${notoSansBengali.variable} ${amiri.variable}`}>
      <body className="font-english antialiased">
        {children}
      </body>
    </html>
  );
}
