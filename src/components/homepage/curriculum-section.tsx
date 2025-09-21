'use client';

import Link from 'next/link';
import { useLocale } from 'next-intl';
import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  BookOpen,
  Languages,
  Heart,
  Scale,
  MessageSquare,
  Clock,
  BookMarked,
  GraduationCap,
  ScrollText,
  History,
} from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

export default function CurriculumSection() {
  const locale = useLocale() as 'bengali' | 'english';

  const titleRef = useRef<HTMLDivElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const pillarsRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Title animation
      gsap.fromTo(titleRef.current,
        { y: 30, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: titleRef.current,
            start: 'top 85%',
            toggleActions: 'play none none none'
          }
        }
      );

      // Subtitle animation
      gsap.fromTo(subtitleRef.current,
        { y: 20, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.6,
          delay: 0.2,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: subtitleRef.current,
            start: 'top 85%',
            toggleActions: 'play none none none'
          }
        }
      );

      // Pillars animation
      const pillars = gsap.utils.toArray('.curriculum-pillar');
      pillars.forEach((pillar, index) => {
        gsap.fromTo(pillar as gsap.TweenTarget,
          { y: 30, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.6,
            delay: index * 0.1,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: pillarsRef.current,
              start: 'top 85%',
              toggleActions: 'play none none none'
            }
          }
        );
      });

      // CTA animation
      gsap.fromTo(ctaRef.current,
        { y: 20, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.6,
          delay: 0.4,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: ctaRef.current,
            start: 'top 85%',
            toggleActions: 'play none none none'
          }
        }
      );

      // Hover animation for pillars
      pillars.forEach((pillar) => {
        const element = pillar as HTMLElement;
        element.addEventListener('mouseenter', () => {
          gsap.to(element, {
            y: -5,
            duration: 0.3,
            ease: 'power2.out'
          });
        });

        element.addEventListener('mouseleave', () => {
          gsap.to(element, {
            y: 0,
            duration: 0.3,
            ease: 'power2.out'
          });
        });
      });

    }, []);

    return () => ctx.revert();
  }, []);

  const isBengali = locale === 'bengali';

  // Curriculum data matching the breakdown component
  const curriculumData = [
    {
      icon: 'quran',
      title: {
        bengali: 'কুরআন',
        english: 'Quran',
      },
      description: {
        bengali: 'সামর্থ্য অনুযায়ী হিফজ ও কুরআন তর্জমা',
        english: 'Hifz (memorization) and Quranic translation according to ability',
      },
    },
    {
      icon: 'arabic',
      title: {
        bengali: 'আরবী ভাষা',
        english: 'Arabic Language',
      },
      description: {
        bengali: 'আরবী বলতে পারা, শুনে বুঝতে পারা, ইবারাত পড়তে পারা ও লিখতে পারা',
        english: 'Ability to speak, understand by listening, read Ibaarat (Arabic text without diacritics), and write Arabic',
      },
    },
    {
      icon: 'aqidah',
      title: {
        bengali: 'আকিদাহ',
        english: 'Aqidah (Islamic Creed)',
      },
      description: {
        bengali: 'ইমান ও আকিদার বিষয়াবলি ও ইসলামিক মূল্যবোধ',
        english: 'Matters of faith and creed, and Islamic values',
      },
    },
  ];

  const getIcon = (iconName: string) => {
    const iconProps = { className: 'w-8 h-8 text-white' };

    switch (iconName) {
      case 'quran':
        return <BookMarked {...iconProps} />;
      case 'arabic':
        return <Languages {...iconProps} />;
      case 'aqidah':
        return <Heart {...iconProps} />;
      case 'fiqh':
        return <Scale {...iconProps} />;
      case 'hadith':
        return <ScrollText {...iconProps} />;
      case 'history':
        return <History {...iconProps} />;
      default:
        return <BookOpen {...iconProps} />;
    }
  };

  return (
    <section className="bg-white">
      <div className="container-custom py-16 md:py-24">
        {/* Section Title */}
        <div ref={titleRef} className="text-center mb-12">
          <div className="flex items-center justify-center space-x-4 mb-6">
            <h2 className="text-3xl md:text-4xl font-bold text-primary-400">
              {isBengali
                ? 'আমাদের অনন্য কারিকুলাম'
                : 'Our Unique Curriculum'}
            </h2>
          </div>
          <p ref={subtitleRef} className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto">
            {isBengali
              ? 'কুরআন-সুন্নাহ ভিত্তিক তারবিয়াহ্‌ ও আধুনিক শিক্ষার সমন্বয়ে ভবিষ্যৎ উম্মাহর তারকা তৈরি'
              : 'Integrating Quran-Sunnah tarbiyah with modern education to build leaders of the Ummah'}
          </p>
        </div>

        {/* Curriculum Cards */}
        <div ref={pillarsRef} className="grid md:grid-cols-3 gap-8">
          {curriculumData.map((subject, index) => (
            <div key={index} className="group relative mt-4 curriculum-pillar">
              <div className="bg-white rounded-3xl shadow-xl p-8 h-full border border-primary-100 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                  <div className="w-16 h-16 bg-gradient-to-br from-primary-300 to-primary-400 rounded-full flex items-center justify-center shadow-lg">
                    {getIcon(subject.icon)}
                  </div>
                </div>

                <div className="pt-8">
                  <h3 className="text-2xl font-bold text-primary-800 mb-4 text-center">
                    {isBengali ? subject.title.bengali : subject.title.english}
                  </h3>

                  <p className="text-gray-600 leading-relaxed mb-6 text-center">
                    {isBengali
                      ? subject.description.bengali
                      : subject.description.english}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div ref={ctaRef} className="text-center mt-12">
          <Link
            href="/curriculum"
            className="inline-flex items-center px-6 py-3 rounded-xl bg-primary-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all hover:scale-105"
          >
            {isBengali ? 'কারিকুলাম বিস্তারিত' : 'Explore Curriculum'}
            <svg className="w-4 h-4 ml-2" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}


