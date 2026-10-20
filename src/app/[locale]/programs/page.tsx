import { permanentRedirect } from 'next/navigation';

/** The old Academic Programs page: the curriculum page tells the same story now. */
export default async function ProgramsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  permanentRedirect(`/${locale}/curriculum`);
}
