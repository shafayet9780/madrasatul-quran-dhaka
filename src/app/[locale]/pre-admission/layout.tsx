import { setRequestLocale } from 'next-intl/server';
import { ClientMessages } from '@/components/client-messages';

// The flow's pages read the guardian's application (a cookie) and are rendered on each visit (each says so); the
// pre-admission page itself is cached (page.tsx, mine/page.tsx).

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
