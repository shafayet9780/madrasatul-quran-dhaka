'use client';

import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';
import { MapPin, Phone, Mail, Clock, Calendar } from 'lucide-react';
import { type Locale } from '@/lib/i18n';
import type { FooterSettings } from '@/types/sanity';
import { getLocalizedText } from '@/lib/multilingual-content';

interface FooterProps {
  footerSettings?: FooterSettings | null;
}

export default function Footer({ footerSettings }: FooterProps) {
  const t = useTranslations('footer');
  const locale = useLocale() as Locale;

  // Use Sanity data or fallback to hardcoded data
  const quickLinks = footerSettings?.quickLinks?.filter(
    link => link.isActive
  ) || [
    {
      label: { bengali: 'হোম', english: 'Home' },
      url: '/',
      isActive: true,
      order: 1,
    },
    {
      label: { bengali: 'আমাদের সম্পর্কে', english: 'About' },
      url: '/about',
      isActive: true,
      order: 2,
    },
    {
      label: { bengali: 'প্রোগ্রাম', english: 'Programs' },
      url: '/programs',
      isActive: true,
      order: 3,
    },
    {
      label: { bengali: 'ভর্তি', english: 'Admissions' },
      url: '/admissions',
      isActive: true,
      order: 4,
    },
    {
      label: { bengali: 'ক্যাম্পাস', english: 'Campus' },
      url: '/campus',
      isActive: true,
      order: 5,
    },
    {
      label: { bengali: 'সংবাদ', english: 'News' },
      url: '/news',
      isActive: true,
      order: 6,
    },
    {
      label: { bengali: 'যোগাযোগ', english: 'Contact' },
      url: '/contact',
      isActive: true,
      order: 7,
    },
  ];

  const contactInfo = {
    address: footerSettings?.contactInfo?.address
      ? getLocalizedText(footerSettings.contactInfo.address, locale)
      : locale === 'bengali'
        ? 'ঢাকা, বাংলাদেশ'
        : 'Dhaka, Bangladesh',
    phone:
      footerSettings?.contactInfo?.phone?.find(p => p.isPrimary)?.number ||
      footerSettings?.contactInfo?.phone?.[0]?.number ||
      '+880 1234 567890',
    email:
      footerSettings?.contactInfo?.email?.find(e => e.isPrimary)?.address ||
      footerSettings?.contactInfo?.email?.[0]?.address ||
      'info@madrasatulquran.edu.bd',
    officeHours: footerSettings?.contactInfo?.officeHours
      ? getLocalizedText(footerSettings.contactInfo.officeHours, locale)
      : locale === 'bengali'
        ? 'রবি - বৃহস্পতি: সকাল ৮টা - বিকাল ৫টা'
        : 'Sun - Thu: 8:00 AM - 5:00 PM',
  };

  // Social media links with icons
  const getSocialIcon = (iconName: string) => {
    const iconProps = { className: 'w-5 h-5' };

    switch (iconName) {
      case 'facebook':
        return (
          <svg {...iconProps} fill="currentColor" viewBox="0 0 24 24">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
          </svg>
        );
      case 'youtube':
        return (
          <svg {...iconProps} fill="currentColor" viewBox="0 0 24 24">
            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
          </svg>
        );
      case 'twitter':
        return (
          <svg {...iconProps} fill="currentColor" viewBox="0 0 24 24">
            <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
          </svg>
        );
      case 'instagram':
        return (
          <svg {...iconProps} fill="currentColor" viewBox="0 0 24 24">
            <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 6.62 5.367 11.987 11.988 11.987 6.62 0 11.987-5.367 11.987-11.987C24.014 5.367 18.637.001 12.017.001zM8.449 16.988c-1.297 0-2.448-.49-3.323-1.297C4.198 14.895 3.708 13.744 3.708 12.447s.49-2.448 1.297-3.323c.875-.807 2.026-1.297 3.323-1.297s2.448.49 3.323 1.297c.807.875 1.297 2.026 1.297 3.323s-.49 2.448-1.297 3.323c-.875.807-2.026 1.297-3.323 1.297zm7.718-1.297c-.875.807-2.026 1.297-3.323 1.297s-2.448-.49-3.323-1.297c-.807-.875-1.297-2.026-1.297-3.323s.49-2.448 1.297-3.323c.875-.807 2.026-1.297 3.323-1.297s2.448.49 3.323 1.297c.807.875 1.297 2.026 1.297 3.323s-.49 2.448-1.297 3.323z" />
          </svg>
        );
      case 'linkedin':
        return (
          <svg {...iconProps} fill="currentColor" viewBox="0 0 24 24">
            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
          </svg>
        );
      default:
        return (
          <svg {...iconProps} fill="currentColor" viewBox="0 0 24 24">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
          </svg>
        );
    }
  };

  const getSocialColor = (iconName: string) => {
    switch (iconName) {
      case 'facebook':
        return 'hover:text-blue-400';
      case 'youtube':
        return 'hover:text-red-400';
      case 'twitter':
        return 'hover:text-blue-300';
      case 'instagram':
        return 'hover:text-pink-400';
      case 'linkedin':
        return 'hover:text-blue-500';
      default:
        return 'hover:text-blue-400';
    }
  };

  const socialLinks = footerSettings?.socialLinks
    ?.filter(s => s.isActive)
    ?.sort((a, b) => (a.order || 0) - (b.order || 0)) || [
    {
      platform: 'Facebook',
      url: 'https://facebook.com/madrasatulquran',
      icon: 'facebook' as const,
      isActive: true,
    },
    {
      platform: 'YouTube',
      url: 'https://youtube.com/@madrasatulquran',
      icon: 'youtube' as const,
      isActive: true,
    },
  ];

  // Prayer times from centralized data or fallback
  const prayerTimes = footerSettings?.prayerTimes
    ?.filter(p => p.isActive)
    ?.sort((a, b) => (a.order || 0) - (b.order || 0)) || [
    {
      prayerName: { bengali: 'ফজর', english: 'Fajr' },
      time: '5:15 AM',
      isActive: true,
    },
    {
      prayerName: { bengali: 'যুহর', english: 'Dhuhr' },
      time: '12:30 PM',
      isActive: true,
    },
    {
      prayerName: { bengali: 'আসর', english: 'Asr' },
      time: '4:15 PM',
      isActive: true,
    },
    {
      prayerName: { bengali: 'মাগরিব', english: 'Maghrib' },
      time: '6:00 PM',
      isActive: true,
    },
    {
      prayerName: { bengali: 'ইশা', english: 'Isha' },
      time: '7:30 PM',
      isActive: true,
    },
  ];

  return (
    <footer className="bg-primary-800 text-white relative overflow-hidden">
      {/* Beach Wave Pattern */}
      <div className="absolute top-0 left-0 w-full h-20 bg-sand-light opacity-10"></div>

      {/* Main Footer Content */}
      <div className="container-custom py-12 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* School Information */}
          <div className="space-y-4">
            <div className="flex flex-col items-start space-y-2">
              <div className="text-2xl font-bold font-arabic text-white drop-shadow-lg">
                ﷽
              </div>
              <h3 className="text-xl font-bold font-bengali text-white">
                {footerSettings?.title
                  ? getLocalizedText(footerSettings.title, locale)
                  : 'মাদরাসাতুল কুরআন'}
              </h3>
              <p className="text-sm text-white font-english font-semibold">
                {footerSettings?.subtitle
                  ? getLocalizedText(footerSettings.subtitle, locale)
                  : 'Excellence in Islamic Education'}
              </p>
            </div>

            <p className="text-sm text-white leading-relaxed opacity-90">
              {footerSettings?.description
                ? getLocalizedText(footerSettings.description, locale)
                : locale === 'bengali'
                  ? 'কুরআন ও সুন্নাহর আলোকে শিক্ষার্থীদের চরিত্র গঠন এবং আধুনিক শিক্ষায় দক্ষতা অর্জনের মাধ্যমে একটি আদর্শ মুসলিম সমাজ গড়ে তোলা।'
                  : 'Building an ideal Muslim society through character development of students in the light of Quran and Sunnah and achieving excellence in modern education.'}
            </p>

            {/* Social Media Links */}
            <div className="flex space-x-4 pt-2">
              {socialLinks.map(social => {
                const iconElement = getSocialIcon(social.icon);
                const colorClass = getSocialColor(social.icon);
                return (
                  <a
                    key={social.platform}
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`p-3 rounded-full bg-white/10 text-white ${colorClass} transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 hover:scale-110`}
                    aria-label={`Follow us on ${social.platform}`}
                  >
                    {iconElement}
                  </a>
                );
              })}
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-white mb-1">
              {t('quickLinks')}
            </h3>
            <div className="w-12 h-1 bg-white/30 rounded-full mb-3"></div>
            <ul className="space-y-2">
              {quickLinks
                .sort((a, b) => (a.order || 0) - (b.order || 0))
                .map(link => (
                  <li key={link.url}>
                    <Link
                      href={link.url}
                      className="text-white text-sm block py-1 hover:text-white/80 transition-colors"
                    >
                      {getLocalizedText(link.label, locale)}
                    </Link>
                  </li>
                ))}
            </ul>
          </div>

          {/* Contact Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-white mb-1">
              {t('contactInfo')}
            </h3>
            <div className="w-12 h-1 bg-white/30 rounded-full mb-3"></div>
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <MapPin className="w-5 h-5 text-white/70 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm text-white/70">
                    {locale === 'bengali' ? 'ঠিকানা:' : 'Address:'}
                  </p>
                  <p className="text-sm text-white">{contactInfo.address}</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Phone className="w-5 h-5 text-white/70 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm text-white/70">
                    {locale === 'bengali' ? 'ফোন:' : 'Phone:'}
                  </p>
                  <a
                    href={`tel:${contactInfo.phone}`}
                    className="text-sm text-white hover:text-white/80 transition-colors"
                  >
                    {contactInfo.phone}
                  </a>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Mail className="w-5 h-5 text-white/70 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm text-white/70">
                    {locale === 'bengali' ? 'ইমেইল:' : 'Email:'}
                  </p>
                  <a
                    href={`mailto:${contactInfo.email}`}
                    className="text-sm text-white hover:text-white/80 transition-colors"
                  >
                    {contactInfo.email}
                  </a>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Clock className="w-5 h-5 text-white/70 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm text-white/70">
                    {locale === 'bengali' ? 'অফিস সময়:' : 'Office Hours:'}
                  </p>
                  <p className="text-sm text-white">
                    {contactInfo.officeHours}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Prayer Times Widget */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center space-x-2 mb-1">
              <Calendar className="w-5 h-5" />
              <span>
                {locale === 'bengali' ? 'নামাজের সময়' : 'Prayer Times'}
              </span>
            </h3>
            <div className="w-12 h-1 bg-white/30 rounded-full mb-3"></div>
            <div className="bg-white/10 rounded-xl p-4 space-y-2 shadow-lg border border-white/20">
              {prayerTimes.map((prayer, index) => (
                <div
                  key={index}
                  className="flex justify-between items-center text-sm"
                >
                  <span className="text-white/80">
                    {getLocalizedText(prayer.prayerName, locale)}
                  </span>
                  <span className="font-medium text-white">{prayer.time}</span>
                </div>
              ))}
              <div className="pt-2 border-t border-white/20">
                <p className="text-xs text-white/60 text-center">
                  {locale === 'bengali'
                    ? 'ঢাকার স্থানীয় সময় অনুযায়ী'
                    : 'Based on Dhaka local time'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Footer */}
      <div className="border-t border-white/20 bg-primary-900/50 backdrop-blur-sm">
        <div className="container-custom py-6">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="text-sm text-white/80">
              {footerSettings?.copyright
                ? getLocalizedText(footerSettings.copyright, locale)
                : t('copyright')}
            </div>

            <div className="flex flex-col md:flex-row items-center space-y-2 md:space-y-0 md:space-x-6 text-sm text-white/80">
              {footerSettings?.legalLinks
                ?.filter(link => link.isActive)
                ?.map(link => (
                  <Link
                    key={link.url}
                    href={link.url}
                    className="text-white/80 hover:text-white transition-colors"
                  >
                    {getLocalizedText(link.label, locale)}
                  </Link>
                )) || (
                <>
                  <Link
                    href="/privacy"
                    className="text-white/80 hover:text-white transition-colors"
                  >
                    {locale === 'bengali' ? 'গোপনীয়তা নীতি' : 'Privacy Policy'}
                  </Link>
                  <Link
                    href="/terms"
                    className="text-white/80 hover:text-white transition-colors"
                  >
                    {locale === 'bengali'
                      ? 'ব্যবহারের শর্তাবলী'
                      : 'Terms of Service'}
                  </Link>
                  <Link
                    href="/sitemap"
                    className="text-white/80 hover:text-white transition-colors"
                  >
                    {locale === 'bengali' ? 'সাইটম্যাপ' : 'Sitemap'}
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
