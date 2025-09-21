'use client';

import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';
import { useEffect, useRef } from 'react';
import { MapPin, Phone, Mail, Clock, Smartphone, Download } from 'lucide-react';
import { type Locale } from '@/lib/i18n';
import type { FooterSettings, SiteSettings } from '@/types/sanity';
import { getLocalizedText } from '@/lib/multilingual-content';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

interface FooterProps {
  footerSettings?: FooterSettings | null;
  siteSettings?: SiteSettings | null;
}

export default function Footer({ footerSettings, siteSettings }: FooterProps) {
  const t = useTranslations('footer');
  const locale = useLocale() as Locale;

  const footerRef = useRef<HTMLElement>(null);
  const logoRef = useRef<HTMLDivElement>(null);
  const linksRef = useRef<HTMLDivElement>(null);
  const contactRef = useRef<HTMLDivElement>(null);
  const socialRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Main footer sections animations
      gsap.fromTo(logoRef.current,
        { y: 30, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: footerRef.current,
            start: 'top 90%',
            toggleActions: 'play none none none'
          }
        }
      );

      gsap.fromTo(linksRef.current,
        { y: 30, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          delay: 0.2,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: footerRef.current,
            start: 'top 90%',
            toggleActions: 'play none none none'
          }
        }
      );

      gsap.fromTo(contactRef.current,
        { y: 30, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          delay: 0.4,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: footerRef.current,
            start: 'top 90%',
            toggleActions: 'play none none none'
          }
        }
      );

      gsap.fromTo(socialRef.current,
        { y: 30, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          delay: 0.6,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: footerRef.current,
            start: 'top 90%',
            toggleActions: 'play none none none'
          }
        }
      );

      // Social media icons hover animations
      const socialIcons = gsap.utils.toArray('.social-icon');
      socialIcons.forEach((icon) => {
        const element = icon as HTMLElement;
        element.addEventListener('mouseenter', () => {
          gsap.to(element, {
            y: -5,
            scale: 1.1,
            duration: 0.3,
            ease: 'power2.out'
          });
        });

        element.addEventListener('mouseleave', () => {
          gsap.to(element, {
            y: 0,
            scale: 1,
            duration: 0.3,
            ease: 'power2.out'
          });
        });
      });

      // Quick links hover animations
      const quickLinks = gsap.utils.toArray('.footer-link');
      quickLinks.forEach((link) => {
        const element = link as HTMLElement;
        element.addEventListener('mouseenter', () => {
          gsap.to(element, {
            x: 5,
            duration: 0.2,
            ease: 'power2.out'
          });
        });

        element.addEventListener('mouseleave', () => {
          gsap.to(element, {
            x: 0,
            duration: 0.2,
            ease: 'power2.out'
          });
        });
      });

    }, []);

    return () => ctx.revert();
  }, []);

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

  // Use centralized contact info from siteSettings or fallback
  const siteContactInfo = siteSettings?.contactInfo;
  const contactInfo = {
    address: siteContactInfo?.address
      ? getLocalizedText(siteContactInfo.address, locale)
      : locale === 'bengali'
        ? 'ঢাকা, বাংলাদেশ'
        : 'Dhaka, Bangladesh',
    phone:
      siteContactInfo?.phone?.find(p => p.isPrimary)?.number ||
      siteContactInfo?.phone?.[0]?.number ||
      '+880 1234 567890',
    email:
      siteContactInfo?.email?.find(e => e.isPrimary)?.address ||
      siteContactInfo?.email?.[0]?.address ||
      'info@madrasatulquran.edu.bd',
    officeHours: siteContactInfo?.officeHours
      ? getLocalizedText(siteContactInfo.officeHours, locale)
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

  // Use centralized social links from siteSettings or fallback
  const socialLinks = siteSettings?.socialMedia
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


  return (
    <footer ref={footerRef} className="bg-primary-700 text-white relative overflow-hidden">
      {/* Beach Wave Pattern */}
      <div className="absolute top-0 left-0 w-full h-20 bg-sand-light opacity-10"></div>

      {/* Main Footer Content */}
      <div className="container-custom py-12 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* School Information */}
          <div ref={logoRef} className="space-y-4">
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
            <div ref={socialRef} className="flex space-x-4 pt-2">
              {socialLinks.map(social => {
                const iconElement = getSocialIcon(social.icon);
                const colorClass = getSocialColor(social.icon);
                return (
                  <a
                    key={social.platform}
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`social-icon p-3 rounded-full bg-white/10 text-white ${colorClass} transition-all duration-300 shadow-lg hover:shadow-xl`}
                    aria-label={`Follow us on ${social.platform}`}
                  >
                    {iconElement}
                  </a>
                );
              })}
            </div>
          </div>

          {/* Quick Links */}
          <div ref={linksRef} className="space-y-4">
            <h3 className="text-lg font-bold text-white mb-1">
              {t('quickLinks')}
            </h3>
            <div className="w-12 h-1 bg-white/30 rounded-full mb-3"></div>
            <ul className="space-y-2">
              {quickLinks.map(link => (
                <li key={link.url}>
                  <Link
                    href={link.url}
                    className="footer-link text-white/80 hover:text-white transition-colors duration-300 text-sm"
                  >
                    {getLocalizedText(link.label, locale)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Information */}
          <div ref={contactRef} className="space-y-4">
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

          {/* Mobile Apps Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center space-x-2 mb-1">
              <Smartphone className="w-5 h-5" />
              <span>
                {locale === 'bengali' ? 'মোবাইল অ্যাপ' : 'Mobile Apps'}
              </span>
            </h3>
            <div className="w-12 h-1 bg-white/30 rounded-full mb-3"></div>
            <div className="space-y-3">
              {/* Android App */}
              <a
                href="https://play.google.com/store/apps/details?id=com.eximusedu.app"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-3 bg-white/10 hover:bg-white/20 transition-all duration-300 rounded-xl p-3 shadow-lg hover:shadow-xl group"
              >
                <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.53,12.9 20.18,13.18L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-white">
                    {locale === 'bengali' ? 'Android অ্যাপ' : 'Android App'}
                  </p>
                  <p className="text-xs text-white/70">
                    {locale === 'bengali' ? 'Google Play Store' : 'Google Play Store'}
                  </p>
                </div>
                <Download className="w-4 h-4 text-white/70 group-hover:text-white transition-colors" />
              </a>

              {/* iOS App */}
              <a
                href="https://apps.apple.com/us/app/eximusedu/id1459487310"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-3 bg-white/10 hover:bg-white/20 transition-all duration-300 rounded-xl p-3 shadow-lg hover:shadow-xl group"
              >
                <div className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.71,19.5C17.88,20.74 17,21.95 15.66,21.97C14.32,22 13.89,21.18 12.37,21.18C10.84,21.18 10.37,21.95 9.1,22C7.79,22.05 6.8,20.68 5.96,19.47C4.25,17 2.94,12.45 4.7,9.39C5.57,7.87 7.13,6.91 8.82,6.88C10.1,6.86 11.32,7.75 12.11,7.75C12.89,7.75 14.37,6.68 15.92,6.84C16.57,6.87 18.39,7.1 19.56,8.82C19.47,8.88 17.39,10.1 17.41,12.63C17.44,15.65 20.06,16.66 20.09,16.67C20.06,16.74 19.67,18.11 18.71,19.5M13,3.5C13.73,2.67 14.94,2.04 15.94,2C16.07,3.17 15.6,4.35 14.9,5.19C14.21,6.04 13.07,6.7 11.95,6.61C11.8,5.46 12.36,4.26 13,3.5Z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-white">
                    {locale === 'bengali' ? 'iOS অ্যাপ' : 'iOS App'}
                  </p>
                  <p className="text-xs text-white/70">
                    {locale === 'bengali' ? 'App Store' : 'App Store'}
                  </p>
                </div>
                <Download className="w-4 h-4 text-white/70 group-hover:text-white transition-colors" />
              </a>
            </div>
          </div>

        </div>
      </div>

      {/* Bottom Footer */}
      <div className="border-t border-white/20 bg-primary-800/40 backdrop-blur-sm">
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
