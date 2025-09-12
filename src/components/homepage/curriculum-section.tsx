'use client';

import Link from 'next/link';
import { useLocale } from 'next-intl';
import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

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

  const title = locale === 'bengali' ? 'আমাদের অনন্য কারিকুলাম' : 'Our Unique Curriculum';
  const subtitle =
    locale === 'bengali'
      ? 'কুরআন-সুন্নাহ ভিত্তিক তারবিয়াহ্‌ ও আধুনিক শিক্ষার সমন্বয়ে ভবিষ্যৎ উম্মাহর তারকা তৈরি'
      : 'Integrating Quran-Sunnah tarbiyah with modern education to build leaders of the Ummah';

  const pillars = [
    {
      icon: '📖',
      title: locale === 'bengali' ? 'কুরআন ও তাজবীদ' : 'Quran & Tajweed',
      desc:
        locale === 'bengali'
          ? 'হিফজ/নজিরাহ, তাজবীদ ও তিলাওয়াতের বিশেষ যত্ন'
          : 'Hifz/Nazirah with strong Tajweed and Tilawah focus',
    },
    {
      icon: '🕌',
      title: locale === 'bengali' ? 'আরবী ও দীনী আদব' : 'Arabic & Tarbiyah',
      desc:
        locale === 'bengali'
          ? 'আরবী, আকীদাহ, সীরাহ, আদব ও আখলাক গঠন'
          : 'Arabic, Aqeedah, Seerah, Adab and character formation',
    },
    {
      icon: '📚',
      title: locale === 'bengali' ? 'NCTB একাডেমিক' : 'NCTB Academic',
      desc:
        locale === 'bengali'
          ? 'বাংলাদেশ জাতীয় শিক্ষাক্রমের সাথে একীভূত মানসম্পন্ন পাঠদান'
          : 'Integrated delivery aligned with Bangladesh NCTB standards',
    },
  ];

  return (
    <section className="bg-white">
      <div className="container-custom py-16 md:py-24">
        <div ref={titleRef} className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-primary-800 mb-3">{title}</h2>
          <p ref={subtitleRef} className="text-lg md:text-xl text-secondary-900 max-w-3xl mx-auto">{subtitle}</p>
        </div>

        <div ref={pillarsRef} className="grid md:grid-cols-3 gap-6 lg:gap-8">
          {pillars.map((p, i) => (
            <div key={i} className="curriculum-pillar card hover:shadow-xl">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 rounded-xl bg-primary-100 text-primary-800 flex items-center justify-center text-2xl">
                  {p.icon}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-primary-800 mb-2">{p.title}</h3>
                  <p className="text-secondary-900">{p.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div ref={ctaRef} className="text-center mt-12">
          <Link
            href="/curriculum"
            className="inline-flex items-center px-6 py-3 rounded-xl bg-primary-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all hover:scale-105"
          >
            {locale === 'bengali' ? 'কারিকুলাম বিস্তারিত' : 'Explore Curriculum'}
            <svg className="w-4 h-4 ml-2" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}


