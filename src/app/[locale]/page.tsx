import { pageMetadata, sharePicture } from '@/lib/page-seo';
import type { Locale } from '@/lib/i18n';
import { Metadata } from 'next';
import { draftMode } from 'next/headers';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Hero, NumbersBand, EducationModel, StudyPlan, SchoolDay, Campus, Why, Founder, Reviews, Faq, PreAdmissionCard } from '@/components/homepage';
import { visibleRoutes } from '@/lib/home/day';
import { getAdmissionsContact } from '@/lib/admissions-contact';
import { getAdmissionCta, getPublishedIntake } from '@/lib/admissions/pages';
import { allBringItems } from '@/lib/admissions/bring-list';
import { reviewsFor } from '@/lib/home/reviews';
import { getContentService } from '@/lib/content-service';
import { isSectionVisible } from '@/lib/nav-visibility';
import { HomeNotices } from '@/components/notices/home-notices';
import { getPreviewContext } from '@/lib/preview';
import { PreviewBanner } from '@/components/preview/preview-banner';
import { generateSchoolStructuredData, serializeJsonLd } from '@/lib/seo';
import { sitePhone } from '@/lib/site/phone';
import { txt } from '@/lib/admissions/display';
import { urlFor } from '@/lib/sanity';
import { contactDetails } from '@/lib/contact/details';
import { homePhoto } from '@/lib/home/photos';
import { loadPlan } from '@/lib/curriculum/load';

export async function generateMetadata({params}: {params:Promise<{locale:Locale}>}): Promise<Metadata> {
  const {locale}=await params;
  const t = await getTranslations({locale,namespace:'home'});

  return pageMetadata({ page: 'home', title: t('meta.title'), description: t('meta.description'), locale });
}

export default async function Home({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const draft = await draftMode();
  const isPreview = draft.isEnabled;
  const contentService = getContentService(isPreview);
  const previewContext = await getPreviewContext();

  // Fetch dynamic content
  const [siteSettings, feeSettings, homePage, testimonials, admissionCta, notices, seo, { snapshot }, chapter, home, plan] = await Promise.all([
    contentService.getSiteSettings(),
    contentService.getFeeSettings(),
    contentService.getHomePage(),
    contentService.getHomeTestimonials(),
    getAdmissionCta(locale),
    contentService.getNotices(),
    contentService.getSeoSettings(),
    getPublishedIntake(),
    getTranslations({ locale, namespace: 'preAdmission.chapter' }),
    getTranslations({ locale, namespace: 'home' }),
    loadPlan(locale),
  ]);
  // What to bring, as the Admissions page lists it, while an intake is offered.
  const docs = admissionCta && snapshot ? allBringItems(snapshot, locale).map((i) => (i.conditional ? `${i.text} ${chapter('ifApplicable')}` : i.text)) : [];

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
    image: sharePicture(seo, locale)?.url,
  });

  return (
    <>
      {previewContext.isPreview && <PreviewBanner exitUrl={previewContext.exitUrl} />}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(school) }} />
      
      <Hero locale={locale} images={homePage?.heroImages} hero={homePage?.hero} />
      <NumbersBand locale={locale} statistics={homePage?.statistics} />
      <EducationModel locale={locale} plan={plan} />
      <StudyPlan locale={locale} plan={plan} />
      <SchoolDay locale={locale} routine={homePage?.routine} routes={visibleRoutes(feeSettings?.transportRoutes, locale)} van={homePhoto(homePage, 'van', locale, 900, home('day.transport.vanAlt'))} plan={plan} />
      <Campus locale={locale} where={contactDetails(siteSettings, locale)} home={homePage} showVisit={isSectionVisible('campus', siteSettings?.navigationVisibility)} showGallery={isSectionVisible('gallery', siteSettings?.navigationVisibility)} />
      <Why locale={locale} home={homePage} />
      <Founder locale={locale} />
      <Reviews locale={locale} reviews={reviewsFor(testimonials, locale)} />
      {isSectionVisible('notices', siteSettings?.navigationVisibility) && <HomeNotices locale={locale} raw={notices} />}
      <Faq locale={locale} questions={homePage?.faq} officePhone={getAdmissionsContact(siteSettings?.contactInfo).phone ?? undefined} />
      <PreAdmissionCard locale={locale} cta={admissionCta} docs={docs} showVisit={isSectionVisible('campus', siteSettings?.navigationVisibility)} />
    </>
  );
}
