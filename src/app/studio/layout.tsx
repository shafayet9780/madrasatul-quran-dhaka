import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Madrasatul Quran Dhaka CMS Studio',
  description: 'Content Management System for the Madrasatul Quran Dhaka website',
  robots: {
    index: false, // Don't index the studio in search engines
    follow: false,
  },
}

export default function StudioLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body style={{ margin: 0 }}>
        {children}
      </body>
    </html>
  )
}