import type { Metadata } from 'next';
import { connection } from 'next/server';
import { setRequestLocale } from 'next-intl/server';
import { asLocale } from '@/lib/admissions/display';
import { previewDraftMode } from '@/lib/admissions/cycle';
import { PreAdmissionIntro, introMetadata } from './intro';

// The cached pre-admission page (reads no cookie). Visitors with an application or a test pass see mine/page.tsx.

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return introMetadata(asLocale((await params).locale), false);
}

export default async function PreAdmissionPage({ params }: Props) {
  const locale = asLocale((await params).locale);
  setRequestLocale(locale);
  // A draft preview reads the Studio draft on every visit.
  if (previewDraftMode()) await connection();
  return <PreAdmissionIntro locale={locale} personal={false} />;
}
