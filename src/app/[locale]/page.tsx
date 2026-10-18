import { generatePageMetadata } from '@/lib/page-metadata';
import type { Locale } from '@/lib/i18n';
import { Metadata } from 'next';
import { draftMode } from 'next/headers';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Hero, NumbersBand, EducationModel, StudyPlan, SchoolDay, Campus, Why, Founder, Reviews, Faq, PreAdmissionCard } from '@/components/homepage';
import { transportPhone, visibleRoutes } from '@/lib/home/day';
import { getAdmissionsContact } from '@/lib/admissions-contact';
import { getAdmissionCta } from '@/lib/admissions/pages';
import { reviewsFor } from '@/lib/home/reviews';
import { getContentService } from '@/lib/content-service';
import { isSectionVisible } from '@/lib/nav-visibility';
import { getPreviewContext } from '@/lib/preview';
import { PreviewBanner } from '@/components/preview/preview-banner';
import { generateSchoolStructuredData, serializeJsonLd } from '@/lib/seo';
import { sitePhone } from '@/lib/site/phone';
import { txt } from '@/lib/admissions/display';
import { urlFor } from '@/lib/sanity';

export async function generateMetadata({params}: {params:Promise<{locale:Locale}>}): Promise<Metadata> {
  const {locale}=await params;
  const t = await getTranslations({locale,namespace:'home'});

  return generatePageMetadata({title:t('meta.title'),description:t('meta.description'),locale});
}

export default async function Home({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const draft = await draftMode();
  const isPreview = draft.isEnabled;
  const contentService = getContentService(isPreview);
  const previewContext = await getPreviewContext();

  // Fetch dynamic content
  const [siteSettings, feeSettings, homePage, testimonials, admissionCta] = await Promise.all([
    contentService.getSiteSettings(),
    contentService.getFeeSettings(),
    contentService.getHomePage(),
    contentService.getHomeTestimonials(),
    getAdmissionCta(locale),
  ]);

  const contact = siteSettings?.contactInfo;
  const school = generateSchoolStructuredData({
    locale,
    logo: siteSettings?.logo?.asset ? urlFor(siteSettings.logo).width(512).url() : undefined,
    address: txt(contact?.address, locale).trim() || undefined,
    hours: contact?.officeHours?.english,
    telephone: sitePhone(getAdmissionsContact(contact).phone ?? undefined, locale)?.e164,
    emails: (contact?.email ?? []).filter((e) => e.isActive).map((e) => e.address),
    mapUrl: siteSettings?.locationInfo?.googleMapsUrl,
    sameAs: (siteSettings?.socialMedia ?? []).filter((s) => s.isActive).map((s) => s.url),
  });

  return (
    <>
      {previewContext.isPreview && <PreviewBanner exitUrl={previewContext.exitUrl} />}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(school) }} />
      
      <Hero locale={locale} siteSettings={siteSettings} />
      <NumbersBand locale={locale} siteSettings={siteSettings} />
      <EducationModel locale={locale} />
      <StudyPlan locale={locale} />
      <SchoolDay locale={locale} routine={homePage?.routine} routes={visibleRoutes(feeSettings?.transportRoutes, locale)} transportPhone={transportPhone(siteSettings?.contactInfo)} />
      <Campus locale={locale} mapUrl={siteSettings?.locationInfo?.googleMapsUrl} playSpaces={homePage?.playSpaces} showVisit={isSectionVisible('campus', siteSettings?.navigationVisibility)} showGallery={isSectionVisible('gallery', siteSettings?.navigationVisibility)} />
      <Why locale={locale} />
      <Founder locale={locale} />
      <Reviews locale={locale} reviews={reviewsFor(testimonials, locale)} />
      <Faq locale={locale} questions={homePage?.faq} officePhone={getAdmissionsContact(siteSettings?.contactInfo).phone ?? undefined} />
      <PreAdmissionCard locale={locale} cta={admissionCta} />
    </>
  );
}
