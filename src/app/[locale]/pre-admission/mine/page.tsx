import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { asLocale } from '@/lib/admissions/display';
import { PreAdmissionIntro, introMetadata } from '../intro';

// The pre-admission page for a device with an application or a test pass: the proxy shows it at /pre-admission
// (src/proxy.ts). It offers to continue the application, and a test pass opens the form.
export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  // Shown at /pre-admission; its own address is not for search engines.
  return { ...(await introMetadata(asLocale((await params).locale), true)), robots: { index: false } };
}

export default async function PersonalPreAdmissionPage({ params }: Props) {
  const locale = asLocale((await params).locale);
  setRequestLocale(locale);
  return <PreAdmissionIntro locale={locale} personal />;
}
