import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import type { Locale } from '@/lib/i18n';
import { generatePageMetadata } from '@/lib/page-metadata';
import { getContentService } from '@/lib/content-service';
import { getPublishedIntake } from '@/lib/admissions/pages';
import { intakeStatus } from '@/lib/admissions/intake';
import { classTiles } from '@/lib/admissions/admissions-page';
import { allBringItems } from '@/lib/admissions/bring-list';
import { sessionStart } from '@/lib/admissions/age';
import { buildTransport } from '@/lib/admissions/snapshot';
import { num, taka, txt } from '@/lib/admissions/display';
import { getAdmissionsContact } from '@/lib/admissions-contact';
import { usableFeeSettings } from '@/lib/fees';
import { transportPhone } from '@/lib/home/day';
import { sitePhone } from '@/lib/site/phone';
import { AdmissionsHero } from '@/components/admissions/admissions-hero';
import { AdmissionClasses } from '@/components/admissions/admission-classes';
import { AdmissionSteps } from '@/components/admissions/admission-steps';
import { AdmissionFees } from '@/components/admissions/admission-fees';
import { AdmissionsClose } from '@/components/admissions/admissions-close';
import { AdmissionsWhy } from '@/components/admissions/admissions-why';
import { Reviews } from '@/components/homepage/reviews';
import { reviewsFor } from '@/lib/home/reviews';
import { FaqSection } from '@/components/site/faq-section';

type Props = { params: Promise<{ locale: Locale }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'admissions.meta' });
  return generatePageMetadata({ title: t('title'), description: t('description'), locale, path: '/admissions' });
}

/**
 * Admissions and fees: the intake (Studio → Pre-admission form: status, fees, classes, what to bring), why the school
 * (four of the homepage's reasons, before the price), the fees, discounts, payment rules and van routes (Studio → Fees &
 * Discounts), guardian reviews (consented ones only; with none, none shown), questions, and the admissions office.
 * While no intake is open or announced, the classes, the steps and the questions are left out and the page points to the office.
 */
export default async function AdmissionsPage({ params }: Props) {
  const { locale } = await params;
  const service = getContentService(false);
  const [{ intake, snapshot }, settings, site, testimonials] = await Promise.all([
    getPublishedIntake(),
    service.getFeeSettings(),
    service.getSiteSettings(),
    service.getHomeTestimonials(),
  ]);
  const t = await getTranslations({ locale, namespace: 'admissions.page' });
  const intro = await getTranslations({ locale, namespace: 'preAdmission.intro' });
  const chapter = await getTranslations({ locale, namespace: 'preAdmission.chapter' });
  const faqCopy = await getTranslations({ locale, namespace: 'home.faq' });

  // The intake's classes and steps show while it is open or announced.
  const offer = snapshot && (intake.state === 'open' || intake.state === 'not_open') ? snapshot : undefined;
  const fees = offer && { session: num(offer.settings.session, locale), applicationFee: taka(offer.settings.applicationFee, locale), evaluationFee: taka(offer.settings.evaluationFee, locale) };
  const classes = offer ? classTiles(offer, locale) : [];
  // The pre-admission page's steps; step 5 lists what to bring.
  const bring = offer ? allBringItems(offer, locale).map((i) => (i.conditional ? `${i.text} ${chapter('ifApplicable')}` : i.text)) : [];
  const steps = offer
    ? [1, 2, 3, 4, 5, 6].map((n) => ({
        title: intro(`step${n}`),
        note: n === 5 && bring.length ? intro('step5Bring') : intro(`step${n}Note`, { fee: n === 5 ? fees!.evaluationFee : fees!.applicationFee }),
        list: n === 5 ? bring : [],
      }))
    : [];

  // The pre-admission page's questions. (The discounts are in the fee section, so their CMS question is not repeated.)
  const faq = offer
    ? [
        { q: intro('faqRefundQ'), a: [txt(offer.settings.refundNote, locale), intro('faqRefundA')].filter(Boolean).join(' ') },
        { q: intro('faqResumeQ'), a: intro('faqResumeA') },
        { q: intro('faqScheduleQ'), a: intro('faqScheduleA') },
        { q: intro('faqPaymentQ'), a: intro('faqPaymentA') },
      ]
    : [];
  const contact = site?.contactInfo;
  const hasRoutes = usableFeeSettings(settings) && buildTransport(settings).routes.length > 0;

  const links = [
    ...(classes.length ? [{ id: 'classes', label: t('nav.classes') }] : []),
    ...(steps.length ? [{ id: 'steps', label: t('nav.steps') }] : []),
    { id: 'fees', label: t('nav.fees') },
    ...(hasRoutes ? [{ id: 'transport', label: t('nav.transport') }] : []),
    ...(faq.length ? [{ id: 'faq', label: t('nav.faq') }] : []),
  ];

  return (
    <>
      <AdmissionsHero locale={locale} state={intake.state} status={intakeStatus(intake, locale, intro)} facts={fees} links={links} />
      {classes.length > 0 && <AdmissionClasses locale={locale} classes={classes} year={sessionStart(offer!.settings.session).slice(0, 4)} />}
      {steps.length > 0 && <AdmissionSteps locale={locale} title={intro('stepsTitle')} steps={steps} />}
      <AdmissionsWhy locale={locale} />
      <AdmissionFees locale={locale} settings={settings} transportPhone={transportPhone(contact)} />
      <Reviews locale={locale} reviews={reviewsFor(testimonials, locale)} tone="dark" />
      {faq.length > 0 && (
        <FaqSection id="faq" locale={locale} title={intro('faqTitle')} lede={faqCopy('lede')} phone={sitePhone(getAdmissionsContact(contact).phone ?? undefined, locale)} items={faq} />
      )}
      <AdmissionsClose locale={locale} contact={contact} open={intake.state === 'open'} />
    </>
  );
}
