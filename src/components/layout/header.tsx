'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useTranslations, useLocale } from 'next-intl';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Menu, X, Phone, LogIn, ChevronDown } from 'lucide-react';
import LanguageToggle from '@/components/language-toggle';
import { ProfileAvatar } from '@/components/people/profile-avatar';
import { type Locale } from '@/lib/i18n';
import type { SiteSettings } from '@/types/sanity';
import type { PeopleNavData } from '@/lib/queries/site';
import { getLocalizedText, getLocalizedSlug, getFontClass } from '@/lib/sanity-utils';
import { isSectionVisible } from '@/lib/nav-visibility';
import { trackClickToCall, trackOutboundClick } from '@/lib/analytics/track';

interface HeaderProps {
  siteSettings?: SiteSettings | null;
  peopleNav?: PeopleNavData;
}

type NavItem =
  | { type: 'link'; key: string; href: string; target?: string }
  | { type: 'dropdown'; key: string; items: Array<{ key: string; href: string }> }
  | { type: 'mega'; key: 'people' };

const NAV_ITEMS: NavItem[] = [
  { type: 'link', key: 'home', href: '/' },
  {
    type: 'dropdown',
    key: 'about',
    items: [
      { key: 'ourStory', href: '/about' },
      { key: 'campus', href: '/campus' },
      { key: 'news', href: '/news' },
    ],
  },
  {
    type: 'dropdown',
    key: 'academics',
    items: [
      { key: 'curriculum', href: '/curriculum' },
      { key: 'programs', href: '/programs' },
    ],
  },
  { type: 'mega', key: 'people' },
  { type: 'link', key: 'admissions', href: '/admissions' },
  { type: 'link', key: 'contact', href: '/contact' },
  { type: 'link', key: 'books', href: 'https://alquranervasha.com/downloads', target: '_blank' },
];

export default function Header({ siteSettings, peopleNav }: HeaderProps) {
  const t = useTranslations('navigation');
  const tCommon = useTranslations('common');
  const locale = useLocale() as Locale;
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [mobileOpenKey, setMobileOpenKey] = useState<string | null>(null);
  const navRef = useRef<HTMLElement>(null);

  const placeholders = {
    male: siteSettings?.defaultMaleAvatar ?? null,
    female: siteSettings?.defaultFemaleAvatar ?? null,
  };

  // Editor-controlled "Our People" section visibility (Site Settings).
  const navVis = siteSettings?.navigationVisibility;
  const peopleVisible = {
    directors: isSectionVisible('directors', navVis),
    teachers: isSectionVisible('teachers', navVis),
    advisors: isSectionVisible('advisors', navVis),
  };
  const anyPeopleVisible = peopleVisible.directors || peopleVisible.teachers || peopleVisible.advisors;

  const siteTitle = siteSettings?.title
    ? getLocalizedText(siteSettings.title, locale)
    : locale === 'bengali'
      ? 'মাদরাসাতুল কুরআন'
      : 'Madrasatul Quran';

  const siteSubtitle =
    locale === 'bengali'
      ? 'ইসলামিক ও সাধারণ শিক্ষার একটি আদর্শ সমন্বয়'
      : 'An ideal combination of islamic and general education';

  const logoUrl = siteSettings?.logo ? `/api/image/${siteSettings.logo.asset._ref}?w=80&h=80` : null;

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close menus on route change
  useEffect(() => {
    setOpenMenu(null);
    setIsMobileMenuOpen(false);
  }, [pathname]);

  // Close desktop dropdowns on Escape / outside click
  useEffect(() => {
    if (!openMenu) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpenMenu(null);
    const onClick = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) setOpenMenu(null);
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onClick);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onClick);
    };
  }, [openMenu]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1280) setIsMobileMenuOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
    } else {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    };
  }, [isMobileMenuOpen]);

  const closeAll = () => {
    setIsMobileMenuOpen(false);
    setOpenMenu(null);
  };

  /* ---------- Desktop "Our People" mega-menu ---------- */
  const PeopleMega = () => {
    const columns: React.ReactNode[] = [];

    if (peopleVisible.directors) {
      columns.push(
        <div key="directors">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">{t('directors')}</p>
          <ul className="space-y-1">
            {(peopleNav?.directors ?? []).map((d) => {
              const row = (
                <>
                  <ProfileAvatar
                    photo={d.photo}
                    gender={d.gender}
                    placeholders={placeholders}
                    name={getLocalizedText(d.name, locale)}
                    className="h-9 w-9 ring-1 ring-primary-100"
                  />
                  <span className={`text-sm text-gray-700 ${getFontClass(locale)}`}>
                    {getLocalizedText(d.name, locale)}
                  </span>
                </>
              );
              return (
                <li key={d._id}>
                  {d.showDetailPage !== false ? (
                    <Link
                      href={`/directors/${getLocalizedSlug(d.slug, locale)}`}
                      onClick={closeAll}
                      className="flex items-center gap-3 rounded-lg p-2 hover:bg-primary-50"
                    >
                      {row}
                    </Link>
                  ) : (
                    <div className="flex items-center gap-3 rounded-lg p-2">{row}</div>
                  )}
                </li>
              );
            })}
          </ul>
          <Link href="/directors" onClick={closeAll} className="mt-2 inline-block text-sm font-medium text-accent-600 hover:text-accent-700">
            {t('allDirectors')} →
          </Link>
        </div>
      );
    }

    if (peopleVisible.advisors) {
      columns.push(
        <div key="advisors">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">{t('advisors')}</p>
          <ul className="space-y-1">
            {(peopleNav?.advisors ?? []).map((a) => (
              <li key={a._id} className="flex items-center gap-3 rounded-lg p-2">
                <ProfileAvatar
                  photo={a.photo}
                  gender={a.gender}
                  placeholders={placeholders}
                  name={getLocalizedText(a.name, locale)}
                  className="h-9 w-9 ring-1 ring-primary-100"
                />
                <span className={`text-sm text-gray-700 ${getFontClass(locale)}`}>
                  {getLocalizedText(a.name, locale)}
                </span>
              </li>
            ))}
          </ul>
          <Link href="/advisors" onClick={closeAll} className="mt-2 inline-block text-sm font-medium text-accent-600 hover:text-accent-700">
            {t('allAdvisors')} →
          </Link>
        </div>
      );
    }

    if (peopleVisible.teachers) {
      columns.push(
        <div key="teachers">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">{t('teachers')}</p>
          <ul className="space-y-1">
            {(peopleNav?.departments ?? []).map((dept) => (
              <li key={dept._id}>
                <Link
                  href={`/teachers?department=${getLocalizedSlug(dept.slug, locale)}`}
                  onClick={closeAll}
                  className={`block rounded-lg px-2 py-1.5 text-sm text-gray-600 hover:bg-primary-50 hover:text-primary-700 ${getFontClass(locale)}`}
                >
                  {getLocalizedText(dept.name, locale)}
                </Link>
              </li>
            ))}
          </ul>
          <Link href="/teachers" onClick={closeAll} className="mt-2 inline-block text-sm font-medium text-accent-600 hover:text-accent-700">
            {t('allTeachers')} →
          </Link>
        </div>
      );
    }

    const widthClass =
      columns.length >= 3
        ? 'w-[48rem] grid-cols-3'
        : columns.length === 2
          ? 'w-[34rem] grid-cols-2'
          : 'w-72 grid-cols-1';

    return <div className={`grid ${widthClass} gap-6 p-6`}>{columns}</div>;
  };

  /* ---------- Mobile menu ---------- */
  const MobileMenuContent = () => (
    <>
      <div
        className={`fixed inset-0 z-[9998] xl:hidden transition-all duration-300 ease-in-out ${
          isMobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        style={{
          background: isMobileMenuOpen
            ? 'linear-gradient(135deg, rgba(184, 146, 79, 0.4) 0%, rgba(125, 98, 53, 0.6) 100%)'
            : 'transparent',
        }}
        onClick={() => setIsMobileMenuOpen(false)}
        aria-hidden="true"
      />

      <div
        className={`fixed top-0 right-0 h-full w-80 max-w-[85vw] bg-white shadow-2xl z-[9999] transform transition-all duration-300 ease-in-out xl:hidden backdrop-blur-md ${
          isMobileMenuOpen ? 'translate-x-0 opacity-100 scale-100' : 'translate-x-full opacity-0 scale-95'
        }`}
        style={{ transformOrigin: 'right center' }}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-4 md:p-6 border-b border-sand-medium bg-sand-light">
            <Link href="/" className="flex flex-col items-start" onClick={() => setIsMobileMenuOpen(false)}>
              <div className="text-lg font-bold text-primary-700 font-arabic">﷽</div>
              <div className="text-base font-bold text-primary-700 font-bengali">মাদরাসাতুল কুরআন</div>
            </Link>
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-2 rounded-lg text-primary-700 hover:bg-sand-light"
              aria-label={tCommon('close')}
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto py-4">
            <div className="space-y-1 px-4">
              {NAV_ITEMS.map((item) => {
                if (item.type === 'mega' && (!isSectionVisible('people', navVis) || !anyPeopleVisible)) return null;
                if (item.type === 'link') {
                  if (!isSectionVisible(item.key, navVis)) return null;
                  return (
                    <Link
                      key={item.key}
                      href={item.href}
                      target={item.target}
                      rel={item.target === '_blank' ? 'noopener noreferrer' : undefined}
                      className="block py-3 font-medium text-gray-700 hover:text-primary-700"
                      onClick={() => {
                        if (item.target === '_blank') {
                          trackOutboundClick({
                            linkDomain: 'alquranervasha.com',
                            locale,
                            ctaLocation: `header_nav_${item.key}`,
                          });
                        }
                        setIsMobileMenuOpen(false);
                      }}
                    >
                      {t(item.key)}
                    </Link>
                  );
                }
                const dropdownItems =
                  item.type === 'dropdown'
                    ? item.items.filter((sub) => isSectionVisible(sub.key, navVis))
                    : [];
                if (item.type === 'dropdown' && (!isSectionVisible(item.key, navVis) || dropdownItems.length === 0)) return null;
                const isOpen = mobileOpenKey === item.key;
                return (
                  <div key={item.key} className="border-b border-gray-100 last:border-0">
                    <button
                      onClick={() => setMobileOpenKey(isOpen ? null : item.key)}
                      className="flex w-full items-center justify-between py-3 font-medium text-gray-700"
                      aria-expanded={isOpen}
                    >
                      {t(item.key)}
                      <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {isOpen && (
                      <div className="pb-2 pl-3">
                        {item.type === 'dropdown'
                          ? dropdownItems.map((sub) => (
                              <Link
                                key={sub.key}
                                href={sub.href}
                                className="block py-2 text-sm text-gray-600 hover:text-primary-700"
                                onClick={() => setIsMobileMenuOpen(false)}
                              >
                                {t(sub.key)}
                              </Link>
                            ))
                          : (
                            <>
                              {peopleVisible.directors && (
                                <Link href="/directors" className="block py-2 text-sm font-medium text-gray-700" onClick={() => setIsMobileMenuOpen(false)}>
                                  {t('allDirectors')}
                                </Link>
                              )}
                              {peopleVisible.advisors && (
                                <Link href="/advisors" className="block py-2 text-sm font-medium text-gray-700" onClick={() => setIsMobileMenuOpen(false)}>
                                  {t('allAdvisors')}
                                </Link>
                              )}
                              {peopleVisible.teachers && (
                                <>
                                  <Link href="/teachers" className="block py-2 text-sm font-medium text-gray-700" onClick={() => setIsMobileMenuOpen(false)}>
                                    {t('allTeachers')}
                                  </Link>
                                  {(peopleNav?.departments ?? []).map((dept) => (
                                    <Link
                                      key={dept._id}
                                      href={`/teachers?department=${getLocalizedSlug(dept.slug, locale)}`}
                                      className={`block py-1.5 pl-3 text-sm text-gray-500 hover:text-primary-700 ${getFontClass(locale)}`}
                                      onClick={() => setIsMobileMenuOpen(false)}
                                    >
                                      {getLocalizedText(dept.name, locale)}
                                    </Link>
                                  ))}
                                </>
                              )}
                            </>
                          )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </nav>

          <div className="border-t border-gray-200 p-4">
            <a
              href="https://www.eximusedu.com/go/mqd"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-3 text-white bg-gradient-to-r from-secondary-600 to-secondary-700 rounded-xl px-4 py-3 mb-4 font-semibold shadow-lg"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <LogIn className="w-5 h-5" />
              <span>{locale === 'bengali' ? 'লগইন' : 'Login'}</span>
            </a>
            <div className="sm:hidden mb-4">
              <LanguageToggle />
            </div>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <>
      <header className="bg-white/90 border-b border-secondary-200 backdrop-blur-md shadow-xl">
        <div className="container-custom">
          <div className="flex items-center justify-between h-16 md:h-18">
            <Link href="/" className="flex items-center space-x-3 flex-shrink-0 min-w-0 hover:opacity-80 transition-opacity duration-300">
              <div className="w-10 h-10 bg-secondary-50 border border-secondary-200 rounded-full flex items-center justify-center overflow-hidden">
                {logoUrl ? (
                  <img src={logoUrl} alt={siteSettings?.logo?.alt || 'Institution Logo'} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-lg font-bold text-primary-700">🕋</span>
                )}
              </div>
              <div className="flex flex-col">
                <div className="text-base md:text-lg font-extrabold text-primary-800 leading-tight">{siteTitle}</div>
                <div className="text-xs text-secondary-800 hidden md:block">{siteSubtitle}</div>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav ref={navRef} className="hidden xl:flex items-center justify-center flex-1 max-w-3xl mx-6">
              <div className="flex items-center gap-2">
                {NAV_ITEMS.map((item) => {
                  if (item.type === 'mega' && (!isSectionVisible('people', navVis) || !anyPeopleVisible)) return null;
                  if (item.type === 'link') {
                    if (!isSectionVisible(item.key, navVis)) return null;
                    return (
                      <Link
                        key={item.key}
                        href={item.href}
                        target={item.target}
                        rel={item.target === '_blank' ? 'noopener noreferrer' : undefined}
                        className="nav-link"
                        onClick={() => {
                          if (item.target === '_blank') {
                            trackOutboundClick({
                              linkDomain: 'alquranervasha.com',
                              locale,
                              ctaLocation: `header_nav_${item.key}`,
                            });
                          }
                        }}
                      >
                        {t(item.key)}
                      </Link>
                    );
                  }
                  const isMega = item.type === 'mega';
                  const dropdownItems =
                    item.type === 'dropdown'
                      ? item.items.filter((sub) => isSectionVisible(sub.key, navVis))
                      : [];
                  // Hide a dropdown entirely when all its children are hidden.
                  if (item.type === 'dropdown' && (!isSectionVisible(item.key, navVis) || dropdownItems.length === 0)) return null;
                  const isOpen = openMenu === item.key;
                  return (
                    <div
                      key={item.key}
                      className="relative"
                      onMouseEnter={() => setOpenMenu(item.key)}
                      onMouseLeave={() => setOpenMenu(null)}
                    >
                      <button
                        className="nav-link inline-flex items-center gap-1"
                        aria-expanded={isOpen}
                        aria-haspopup="true"
                        onClick={() => setOpenMenu(isOpen ? null : item.key)}
                      >
                        {t(item.key)}
                        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                      </button>
                      {isOpen && (
                        // Outer wrapper uses top padding (not margin) to bridge the
                        // gap to the panel, so moving the cursor down keeps hover.
                        <div className={`absolute top-full z-50 pt-2 ${isMega ? 'left-1/2 -translate-x-1/2' : 'left-0'}`}>
                          <div
                            className={`rounded-2xl border border-gray-100 bg-white shadow-xl ${
                              isMega ? '' : 'min-w-[13rem] p-2'
                            }`}
                          >
                            {isMega ? (
                              <PeopleMega />
                            ) : (
                              dropdownItems.map((sub) => (
                                <Link
                                  key={sub.key}
                                  href={sub.href}
                                  className="block rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-primary-50 hover:text-primary-700"
                                >
                                  {t(sub.key)}
                                </Link>
                              ))
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </nav>

            <div className="flex items-center space-x-2 md:space-x-3 flex-shrink-0">
              <a
                href="https://www.eximusedu.com/go/mqd"
                target="_blank"
                rel="noopener noreferrer"
                className="hidden lg:flex items-center space-x-2 px-3 py-2 rounded-full bg-gradient-to-r from-secondary-600 to-secondary-700 text-white hover:from-secondary-700 hover:to-secondary-800 transition-all duration-300 shadow-lg font-semibold text-sm whitespace-nowrap"
                aria-label="Login to School Management System"
              >
                <LogIn className="w-4 h-4" />
                <span>{locale === 'bengali' ? 'লগইন' : 'Login'}</span>
              </a>

              <a
                href={`tel:${siteSettings?.contactInfo?.phone?.find((p) => p.isPrimary)?.number ||
                  siteSettings?.contactInfo?.phone?.[0]?.number ||
                  '+8801234567890'}`}
                onClick={() => trackClickToCall({ ctaLocation: 'header_phone', locale })}
                className="hidden xl:flex items-center space-x-2 px-3 py-2 rounded-full bg-primary-700 text-white hover:bg-primary-800 transition-all duration-300 shadow-lg font-semibold text-sm whitespace-nowrap"
                aria-label="Call us"
              >
                <Phone className="w-4 h-4" />
                <span>{locale === 'bengali' ? 'কল করুন' : 'Call Us'}</span>
              </a>

              <div className="hidden sm:block">
                <LanguageToggle />
              </div>

              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="xl:hidden p-2 md:p-3 rounded-xl bg-sand-light text-primary-700 hover:bg-sand-medium transition-all duration-300 shadow-lg"
                aria-label={isMobileMenuOpen ? tCommon('close') : tCommon('menu')}
                aria-expanded={isMobileMenuOpen}
              >
                {isMobileMenuOpen ? <X className="w-5 h-5 md:w-6 md:h-6" /> : <Menu className="w-5 h-5 md:w-6 md:h-6" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {mounted && isMobileMenuOpen && createPortal(<MobileMenuContent />, document.body)}
    </>
  );
}
