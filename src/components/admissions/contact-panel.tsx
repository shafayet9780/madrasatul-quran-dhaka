'use client';
import Link from 'next/link';
import { getAdmissionsContact } from '@/lib/admissions-contact';
import { trackClickToWhatsapp, trackClickToCall } from '@/lib/analytics/track';
import type { ContactInfo } from '@/types/sanity';
import type { FeeLocale } from '@/types/fees';
export const actionClass =
  'inline-flex min-h-11 items-center justify-center rounded-lg bg-primary-500 px-5 py-3 font-semibold text-white hover:bg-primary-600 focus-visible:outline-2 focus-visible:outline-offset-2';
export function ApplicationAction({
  available,
  locale,
}: {
  available: boolean;
  locale: FeeLocale;
}) {
  const bn = locale === 'bengali';
  return (
    <Link
      className={actionClass}
      href={`/${locale}/${available ? 'pre-admission' : 'contact'}`}
    >
      {available
        ? bn
          ? 'প্রি-অ্যাডমিশন ফর্ম'
          : 'Pre-admission'
        : bn
          ? 'ভর্তি বিষয়ে যোগাযোগ'
          : 'Contact Admissions'}
    </Link>
  );
}
export function ContactPanel({
  contact,
  locale,
}: {
  contact?: ContactInfo;
  locale: FeeLocale;
}) {
  const bn = locale === 'bengali';
  const details = getAdmissionsContact(contact);
  return (
    <section
      id="contact-admissions"
      className="scroll-mt-48 rounded-2xl border border-gray-200 p-6 md:p-10 bg-secondary-50"
    >
      <h2 className="text-2xl font-semibold tracking-tight text-[var(--color-text-primary)]">
        {bn ? 'আমরা সাহায্য করতে প্রস্তুত' : 'Talk to Admissions'}
      </h2>
      <p className="mt-3 max-w-xl text-secondary-800 leading-relaxed">
        {bn
          ? 'ভর্তির সময়সূচি, ফি বা আপনার সন্তানের বিষয়ে জানতে অফিসে যোগাযোগ করুন।'
          : 'Contact the office about admission dates, fees, or your child’s next steps.'}
      </p>
      <div className="mt-5 flex flex-wrap gap-3">
        {details.phone && (
          <a
            className={actionClass}
            href={`tel:${details.phone}`}
            onClick={() =>
              trackClickToCall({ ctaLocation: 'admissions_contact', locale })
            }
          >
            {bn ? 'ভর্তি অফিসে কল করুন' : 'Call Admissions'}
          </a>
        )}
        {details.whatsapp && (
          <a
            className="inline-flex min-h-11 items-center justify-center rounded-lg border border-primary-200 px-5 py-3 font-semibold text-primary-500 hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2"
            href={`https://wa.me/${details.whatsapp.slice(1)}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() =>
              trackClickToWhatsapp({
                ctaLocation: 'admissions_contact',
                locale,
              })
            }
          >
            {bn ? 'হোয়াটসঅ্যাপ' : 'WhatsApp'}
          </a>
        )}
        <Link
          className="inline-flex min-h-11 items-center px-3 font-semibold text-primary-500 underline underline-offset-4"
          href={`/${locale}/contact`}
        >
          {bn ? 'যোগাযোগের বিস্তারিত' : 'Contact details'}
        </Link>
      </div>
      {details.officeHours?.[locale] && (
        <p className="mt-4 text-sm text-gray-700">
          {bn ? 'অফিসের সময়: ' : 'Office hours: '}
          {details.officeHours[locale]}
        </p>
      )}
    </section>
  );
}
