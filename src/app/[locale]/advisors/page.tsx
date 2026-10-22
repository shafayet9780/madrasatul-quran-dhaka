import { permanentRedirect } from 'next/navigation';

/** The advisors live on the About us page now (its #advisors section); old links and bookmarks land there. */
export default async function AdvisorsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  permanentRedirect(`/${locale}/about#advisors`);
}
