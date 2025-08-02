'use client';

import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';
import { MapPin, Phone, Mail, Clock, Facebook, Youtube, Calendar } from 'lucide-react';
import { type Locale } from '@/lib/i18n';

export default function Footer() {
  const t = useTranslations('footer');
  const tNav = useTranslations('navigation');
  const locale = useLocale() as Locale;

  const quickLinks = [
    { key: 'home', href: '/' },
    { key: 'about', href: '/about' },
    { key: 'programs', href: '/programs' },
    { key: 'admissions', href: '/admissions' },
    { key: 'campus', href: '/campus' },
    { key: 'news', href: '/news' },
    { key: 'contact', href: '/contact' },
  ];

  const contactInfo = {
    address: locale === 'bengali' 
      ? 'ঢাকা, বাংলাদেশ' 
      : 'Dhaka, Bangladesh',
    phone: '+880 1234 567890',
    email: 'info@madrasatulquran.edu.bd',
    officeHours: locale === 'bengali'
      ? 'রবি - বৃহস্পতি: সকাল ৮টা - বিকাল ৫টা'
      : 'Sun - Thu: 8:00 AM - 5:00 PM'
  };

  const socialLinks = [
    {
      name: 'Facebook',
      href: 'https://facebook.com/madrasatulquran',
      icon: Facebook,
      color: 'hover:text-blue-600'
    },
    {
      name: 'YouTube',
      href: 'https://youtube.com/@madrasatulquran',
      icon: Youtube,
      color: 'hover:text-red-600'
    }
  ];

  // Prayer times (example data - in real implementation, this would come from an API)
  const prayerTimes = [
    { name: locale === 'bengali' ? 'ফজর' : 'Fajr', time: '5:15 AM' },
    { name: locale === 'bengali' ? 'যুহর' : 'Dhuhr', time: '12:30 PM' },
    { name: locale === 'bengali' ? 'আসর' : 'Asr', time: '4:15 PM' },
    { name: locale === 'bengali' ? 'মাগরিব' : 'Maghrib', time: '6:00 PM' },
    { name: locale === 'bengali' ? 'ইশা' : 'Isha', time: '7:30 PM' },
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
              <div className="text-2xl font-bold font-arabic text-accent-300 drop-shadow-lg">
                ﷽
              </div>
              <h3 className="text-xl font-bold font-bengali text-accent-300">
                মাদরাসাতুল কুরআন
              </h3>
              <p className="text-sm text-accent-100 font-english font-semibold">
                Excellence in Islamic Education
              </p>
            </div>
            
            <p className="text-sm text-accent-100 leading-relaxed opacity-90">
              {locale === 'bengali' 
                ? 'কুরআন ও সুন্নাহর আলোকে শিক্ষার্থীদের চরিত্র গঠন এবং আধুনিক শিক্ষায় দক্ষতা অর্জনের মাধ্যমে একটি আদর্শ মুসলিম সমাজ গড়ে তোলা।'
                : 'Building an ideal Muslim society through character development of students in the light of Quran and Sunnah and achieving excellence in modern education.'
              }
            </p>

            {/* Social Media Links */}
            <div className="flex space-x-4 pt-2">
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`p-3 rounded-full bg-accent-600 ${social.color} transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 hover:scale-110`}
                  aria-label={`Follow us on ${social.name}`}
                >
                  <social.icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-accent-300 mb-1">
              {t('quickLinks')}
            </h3>
            <div className="w-12 h-1 bg-accent-400 rounded-full mb-3"></div>
            <ul className="space-y-2">
              {quickLinks.map((link) => (
                <li key={link.key}>
                  <Link
                    href={link.href}
                    className="footer-link text-sm block py-1"
                  >
                    {tNav(link.key as keyof typeof tNav)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-accent-300 mb-1">
              {t('contactInfo')}
            </h3>
            <div className="w-12 h-1 bg-accent-400 rounded-full mb-3"></div>
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <MapPin className="w-5 h-5 text-accent-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm text-gray-300">
                    {locale === 'bengali' ? 'ঠিকানা:' : 'Address:'}
                  </p>
                  <p className="text-sm">
                    {contactInfo.address}
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Phone className="w-5 h-5 text-accent-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm text-gray-300">
                    {locale === 'bengali' ? 'ফোন:' : 'Phone:'}
                  </p>
                  <a 
                    href={`tel:${contactInfo.phone}`}
                    className="text-sm hover:text-accent-400 transition-colors"
                  >
                    {contactInfo.phone}
                  </a>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Mail className="w-5 h-5 text-accent-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm text-gray-300">
                    {locale === 'bengali' ? 'ইমেইল:' : 'Email:'}
                  </p>
                  <a 
                    href={`mailto:${contactInfo.email}`}
                    className="text-sm hover:text-accent-400 transition-colors"
                  >
                    {contactInfo.email}
                  </a>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Clock className="w-5 h-5 text-accent-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm text-gray-300">
                    {locale === 'bengali' ? 'অফিস সময়:' : 'Office Hours:'}
                  </p>
                  <p className="text-sm">
                    {contactInfo.officeHours}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Prayer Times Widget */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-accent-300 flex items-center space-x-2 mb-1">
              <Calendar className="w-5 h-5" />
              <span>
                {locale === 'bengali' ? 'নামাজের সময়' : 'Prayer Times'}
              </span>
            </h3>
            <div className="w-12 h-1 bg-accent-400 rounded-full mb-3"></div>
            <div className="bg-primary-700 rounded-xl p-4 space-y-2 shadow-lg border border-accent-600/20">
              {prayerTimes.map((prayer, index) => (
                <div key={index} className="flex justify-between items-center text-sm">
                  <span className="text-gray-300">{prayer.name}</span>
                  <span className="font-medium text-accent-400">{prayer.time}</span>
                </div>
              ))}
              <div className="pt-2 border-t border-accent-500/30">
                <p className="text-xs text-gray-400 text-center">
                  {locale === 'bengali' 
                    ? 'ঢাকার স্থানীয় সময় অনুযায়ী' 
                    : 'Based on Dhaka local time'
                  }
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Footer */}
      <div className="border-t border-accent-600/30 bg-primary-900/50 backdrop-blur-sm">
        <div className="container-custom py-6">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="text-sm text-gray-300">
              {t('copyright')}
            </div>
            
            <div className="flex flex-col md:flex-row items-center space-y-2 md:space-y-0 md:space-x-6 text-sm text-gray-300">
              <Link 
                href="/privacy" 
                className="footer-link"
              >
                {locale === 'bengali' ? 'গোপনীয়তা নীতি' : 'Privacy Policy'}
              </Link>
              <Link 
                href="/terms" 
                className="footer-link"
              >
                {locale === 'bengali' ? 'ব্যবহারের শর্তাবলী' : 'Terms of Service'}
              </Link>
              <Link 
                href="/sitemap" 
                className="footer-link"
              >
                {locale === 'bengali' ? 'সাইটম্যাপ' : 'Sitemap'}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}