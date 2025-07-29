import type { Metadata } from 'next';
import './globals.css';

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
  return children;
}
