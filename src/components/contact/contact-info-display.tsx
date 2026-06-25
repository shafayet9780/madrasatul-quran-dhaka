'use client';

import { useTranslations, useLocale } from 'next-intl';
import { Phone, Mail, Clock, MapPin } from 'lucide-react';
import type { SiteSettings } from '@/types/sanity';
import { getLocalizedText } from '@/lib/multilingual-content';
import { trackClickToCall, trackClickToEmail } from '@/lib/analytics/track';
import type { AnalyticsLocale } from '@/lib/analytics/types';

interface ContactInfoProps {
  title: string;
  phone: string;
  email: string;
  hours: string;
  address?: string;
  locale: AnalyticsLocale;
}

const ContactInfoCard = ({ title, phone, email, hours, address, locale }: ContactInfoProps) => {
  const handlePhoneClick = (phoneNumber: string) => {
    trackClickToCall({ ctaLocation: 'contact_info_phone', locale });
    window.location.href = `tel:${phoneNumber}`;
  };

  const handleEmailClick = (emailAddress: string) => {
    trackClickToEmail({ ctaLocation: 'contact_info_email', locale });
    window.location.href = `mailto:${emailAddress}`;
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200 hover:shadow-lg transition-shadow duration-300">
      <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
        <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center mr-3">
          <MapPin className="w-4 h-4 text-primary-600" />
        </div>
        {title}
      </h3>
      
      <div className="space-y-3">
        <div className="flex items-center text-gray-700">
          <Phone className="w-5 h-5 text-primary-600 mr-3 flex-shrink-0" />
          <button
            onClick={() => handlePhoneClick(phone)}
            className="hover:text-primary-600 transition-colors duration-200 text-left"
          >
            {phone}
          </button>
        </div>
        
        <div className="flex items-center text-gray-700">
          <Mail className="w-5 h-5 text-primary-600 mr-3 flex-shrink-0" />
          <button
            onClick={() => handleEmailClick(email)}
            className="hover:text-primary-600 transition-colors duration-200 text-left break-all"
          >
            {email}
          </button>
        </div>
        
        <div className="flex items-center text-gray-700">
          <Clock className="w-5 h-5 text-primary-600 mr-3 flex-shrink-0" />
          <span>{hours}</span>
        </div>
        
        {address && (
          <div className="flex items-start text-gray-700">
            <MapPin className="w-5 h-5 text-primary-600 mr-3 flex-shrink-0 mt-0.5" />
            <span className="leading-relaxed">{address}</span>
          </div>
        )}
      </div>
    </div>
  );
};

// interface DepartmentContactProps {
//   title: string;
//   head: string;
//   phone: string;
//   email: string;
// }

// DepartmentContactCard component commented out as it's not currently used
// const DepartmentContactCard = ({ title, head, phone, email }: DepartmentContactProps) => {
//   const handlePhoneClick = (phoneNumber: string) => {
//     window.location.href = `tel:${phoneNumber}`;
//   };

//   const handleEmailClick = (emailAddress: string) => {
//     window.location.href = `mailto:${emailAddress}`;
//   };

//   return (
//     <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200 hover:shadow-lg transition-shadow duration-300">
//       <h4 className="text-lg font-semibold text-gray-900 mb-3">{title}</h4>
      
//       <div className="space-y-3">
//         <div className="flex items-center text-gray-700">
//           <User className="w-4 h-4 text-primary-600 mr-3 flex-shrink-0" />
//           <span className="font-medium">{head}</span>
//         </div>
        
//         <div className="flex items-center text-gray-700">
//           <Phone className="w-4 h-4 text-primary-600 mr-3 flex-shrink-0" />
//           <button
//             onClick={() => handlePhoneClick(phone)}
//             className="hover:text-primary-600 transition-colors duration-200"
//           >
//             {phone}
//           </button>
//         </div>
        
//         <div className="flex items-center text-gray-700">
//           <Mail className="w-4 h-4 text-primary-600 mr-3 flex-shrink-0" />
//           <button
//             onClick={() => handleEmailClick(email)}
//             className="hover:text-primary-600 transition-colors duration-200 break-all"
//           >
//             {email}
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// };

interface ContactInfoDisplayProps {
  siteSettings?: SiteSettings | null;
}

export default function ContactInfoDisplay({ siteSettings }: ContactInfoDisplayProps) {
  const t = useTranslations('contact');
  const locale = useLocale() as 'bengali' | 'english';

  return (
    <section className="py-12 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Contact Information */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            {t('contactInfo.title')}
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            {t('contactInfo.subtitle')}
          </p>
        </div>

        {/* Main Office Contact Card */}
        <div className="flex justify-center mb-12">
          <div className="w-full max-w-md">
            <ContactInfoCard
              title={t('contactInfo.mainOffice.title')}
              phone={siteSettings?.contactInfo?.phone?.find(p => p.type === 'main')?.number || t('contactInfo.mainOffice.phone')}
              email={siteSettings?.contactInfo?.email?.find(e => e.type === 'info')?.address || t('contactInfo.mainOffice.email')}
              hours={siteSettings?.contactInfo?.officeHours
                ? getLocalizedText(siteSettings.contactInfo.officeHours, locale)
                : t('contactInfo.mainOffice.hours')}
              address={siteSettings?.contactInfo?.address
                ? getLocalizedText(siteSettings.contactInfo.address, locale)
                : t('contactInfo.mainOffice.address')}
              locale={locale}
            />
          </div>
        </div>

        {/* Department Contacts - Temporarily commented out */}
        {/* <div className="mb-12">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              {t('departments.title')}
            </h3>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              {t('departments.subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {siteSettings?.officeContacts?.filter(dept => dept.isActive).map((dept, index) => (
              <DepartmentContactCard
                key={index}
                title={dept.name ? getLocalizedText(dept.name, locale) : `Department ${index + 1}`}
                head={dept.head ? getLocalizedText(dept.head, locale) : 'Department Head'}
                phone={dept.phone || t(`departments.${dept.type}.phone`)}
                email={dept.email || t(`departments.${dept.type}.email`)}
              />
            )) || (
              <DepartmentContactCard
                title={t('departments.academic.title')}
                head={t('departments.academic.head')}
                phone={t('departments.academic.phone')}
                email={t('departments.academic.email')}
              />
              
              <DepartmentContactCard
                title={t('departments.islamic.title')}
                head={t('departments.islamic.head')}
                phone={t('departments.islamic.phone')}
                email={t('departments.islamic.email')}
              />
              
              <DepartmentContactCard
                title={t('departments.student.title')}
                head={t('departments.student.head')}
                phone={t('departments.student.phone')}
                email={t('departments.student.email')}
              />
              
              <DepartmentContactCard
                title={t('departments.finance.title')}
                head={t('departments.finance.head')}
                phone={t('departments.finance.phone')}
                email={t('departments.finance.email')}
              />
            )}
          </div>
        </div> */}

      </div>
    </section>
  );
}