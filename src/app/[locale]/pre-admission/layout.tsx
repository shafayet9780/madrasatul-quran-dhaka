import { setRequestLocale } from 'next-intl/server';
import { ClientMessages } from '@/components/client-messages';

// Every page here reads the guardian's application (a cookie): rendered on each visit, never cached.
export const dynamic = 'force-dynamic';

/** The pre-admission pages' forms, fields and steps: their text in the browser. */
export default async function PreAdmissionLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <ClientMessages locale={locale} keys={['preAdmission']}>
      {children}
    </ClientMessages>
  );
}
