import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import type { Locale } from '@/lib/i18n';
import { pageMetadata } from '@/lib/page-seo';
import { getContentService } from '@/lib/content-service';
import { policyView } from '@/lib/policies';
import { PolicyArticle } from '@/components/policies/policy-article';

/** The privacy policy, from Studio → Privacy & cookie policies. */
async function policy(locale: Locale) {
  const service = getContentService(false);
  const [doc, settings] = await Promise.all([service.getPolicies(), service.getSiteSettings()]);
  return policyView(doc, 'privacy', locale, settings);
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const locale = (await params).locale as Locale;
  const view = await policy(locale);
  if (!view) return {};
  // The shared helper adds the canonical link and hreflang; the title keeps the site's ending (the school's name).
  return pageMetadata({ title: view.title, description: view.intro, locale, path: '/privacy-policy', withSiteName: true });
}

export default async function PrivacyPolicyPage({ params }: { params: Promise<{ locale: string }> }) {
  const locale = (await params).locale as Locale;
  setRequestLocale(locale);
  const view = await policy(locale);
  if (!view) notFound();
  return <PolicyArticle policy={view} locale={locale} />;
}
