import { permanentRedirect } from 'next/navigation';

/** The board of directors live on the About us page now (its #board section); old links and bookmarks land there. */
export default async function DirectorsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  permanentRedirect(`/${locale}/about#board`);
}
