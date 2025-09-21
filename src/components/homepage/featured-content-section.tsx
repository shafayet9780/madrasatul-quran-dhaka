'use client';

import { useTranslations } from 'next-intl';
import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { 
  Phone, 
  BookOpen, 
  Users, 
  Calendar, 
  ArrowRight,
  Newspaper,
  Clock,
  MapPin
} from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

interface QuickAccessCardProps {
  title: string;
  description: string;
  href: string;
  icon: React.ReactNode;
  delay?: number;
}

function QuickAccessCard({
  title,
  description,
  href,
  icon,
  delay = 0,
}: QuickAccessCardProps) {
  const [isVisible, setIsVisible] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.3 }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={cardRef}
      className={`transition-all duration-700 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      }`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <Link href={href} className="quick-access-item block group">
        <div className="group relative mt-4">
          <div className="bg-white rounded-3xl shadow-xl p-8 h-full border border-primary-100 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <div className="w-16 h-16 bg-gradient-to-br from-primary-300 to-primary-400 rounded-full flex items-center justify-center shadow-lg">
                {icon}
              </div>
            </div>

            <div className="pt-8">
              <h3 className="text-2xl font-bold text-primary-800 mb-4 text-center">
                {title}
              </h3>

              <p className="text-gray-600 leading-relaxed mb-6 text-center">
                {description}
              </p>

              <div className="flex items-center justify-center text-primary-600 font-medium group-hover:text-primary-500 transition-colors">
                <span>Learn More</span>
                <ArrowRight className="w-4 h-4 ml-2 transform group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}

interface FeaturedNewsCardProps {
  title: string;
  excerpt: string;
  date: string;
  image: string;
  href: string;
  delay?: number;
}

function FeaturedNewsCard({
  title,
  excerpt,
  date,
  image,
  href,
  delay = 0,
}: FeaturedNewsCardProps) {
  const [isVisible, setIsVisible] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.3 }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={cardRef}
      className={`transition-all duration-700 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      }`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <Link href={href} className="news-item block group">
        <div className="group relative mt-4">
          <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-primary-100 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
            <div className="relative h-48 overflow-hidden">
              <Image
                src={image}
                alt={title}
                fill
                className="object-cover group-hover:scale-110 transition-transform duration-500"
                loading="lazy"
                onError={e => {
                  // Fallback to a placeholder if image doesn't exist
                  const target = e.target as HTMLImageElement;
                  target.src =
                    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 200'%3E%3Crect width='400' height='200' fill='%23f8e6c8'/%3E%3Ctext x='200' y='100' text-anchor='middle' dy='0.3em' font-family='Arial' font-size='16' fill='%23b8924f'%3ENews Image%3C/text%3E%3C/svg%3E";
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
              <div className="absolute top-4 right-4">
                <div className="w-12 h-12 bg-gradient-to-br from-primary-300 to-primary-400 rounded-full flex items-center justify-center shadow-lg">
                  <Newspaper className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="absolute bottom-4 left-4 text-white text-sm font-medium flex items-center gap-2">
                <Clock className="w-4 h-4" />
                {date}
              </div>
            </div>
            <div className="p-6">
              <h3 className="text-xl font-bold text-primary-800 mb-3 group-hover:text-primary-600 transition-colors line-clamp-2">
                {title}
              </h3>
              <p className="text-gray-600 leading-relaxed line-clamp-3 mb-4">
                {excerpt}
              </p>
              <div className="flex items-center text-primary-600 font-medium group-hover:text-primary-500 transition-colors">
                <span>Read More</span>
                <ArrowRight className="w-4 h-4 ml-2 transform group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}

import type { NewsEvent, Facility } from '@/types/sanity';
import { getLocalizedText } from '@/lib/multilingual-content';
import { useLocale } from 'next-intl';

interface FeaturedContentSectionProps {
  className?: string;
  featuredNews?: NewsEvent[];
  featuredFacilities?: Facility[];
}

export default function FeaturedContentSection({
  className = '',
  featuredNews,
  featuredFacilities = [],
}: FeaturedContentSectionProps) {
  const tNav = useTranslations('navigation');
  const locale = useLocale() as 'bengali' | 'english';
  const sectionRef = useRef<HTMLDivElement>(null);
  const quickAccessRef = useRef<HTMLDivElement>(null);
  const newsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Quick access section animations
      if (quickAccessRef.current) {
        const quickAccessTitle = quickAccessRef.current.querySelector('.quick-access-title');
        const quickAccessItems = gsap.utils.toArray('.quick-access-item');

        if (quickAccessTitle) {
          gsap.fromTo(quickAccessTitle,
            { y: 30, opacity: 0 },
            {
              y: 0,
              opacity: 1,
              duration: 0.8,
              ease: 'power2.out',
              scrollTrigger: {
                trigger: quickAccessRef.current,
                start: 'top 85%',
                toggleActions: 'play none none none'
              }
            }
          );
        }

        quickAccessItems.forEach((item, index) => {
          gsap.fromTo(item as any,
            { y: 30, opacity: 0 },
            {
              y: 0,
              opacity: 1,
              duration: 0.6,
              delay: index * 0.1,
              ease: 'power2.out',
              scrollTrigger: {
                trigger: quickAccessRef.current,
                start: 'top 85%',
                toggleActions: 'play none none none'
              }
            }
          );
        });
      }

      // News section animations
      if (newsRef.current) {
        const newsTitle = newsRef.current.querySelector('.news-title');
        const newsItems = gsap.utils.toArray('.news-item');

        if (newsTitle) {
          gsap.fromTo(newsTitle,
            { y: 30, opacity: 0 },
            {
              y: 0,
              opacity: 1,
              duration: 0.8,
              ease: 'power2.out',
              scrollTrigger: {
                trigger: newsRef.current,
                start: 'top 85%',
                toggleActions: 'play none none none'
              }
            }
          );
        }

        newsItems.forEach((item, index) => {
          gsap.fromTo(item as any,
            { y: 30, opacity: 0 },
            {
              y: 0,
              opacity: 1,
              duration: 0.6,
              delay: index * 0.15,
              ease: 'power2.out',
              scrollTrigger: {
                trigger: newsRef.current,
                start: 'top 85%',
                toggleActions: 'play none none none'
              }
            }
          );
        });
      }

      // Hover animations for cards
      const allCards = gsap.utils.toArray('.hover-card');
      allCards.forEach((card) => {
        const element = card as HTMLElement;
        element.addEventListener('mouseenter', () => {
          gsap.to(element, {
            y: -8,
            scale: 1.02,
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

    }, []);

    return () => ctx.revert();
  }, []);

  const quickAccessItems = [
    {
      title: tNav('curriculum'),
      description: locale === 'bengali' 
        ? 'আমাদের ইসলামী শিক্ষা ও NCTB কারিকুলাম সম্পর্কে জানুন'
        : 'Learn about our Islamic education and NCTB curriculum',
      href: '/curriculum',
      icon: <BookOpen className="w-8 h-8 text-white" />,
      delay: 0,
    },
    {
      title: tNav('admissions'),
      description: locale === 'bengali'
        ? 'ভর্তির প্রয়োজনীয়তা, আবেদন প্রক্রিয়া এবং গুরুত্বপূর্ণ তারিখসমূহ'
        : 'Admission requirements, application process, and important dates',
      href: '/admissions',
      icon: <Users className="w-8 h-8 text-white" />,
      delay: 200,
    },
    {
      title: tNav('contact'),
      description: locale === 'bengali'
        ? 'যেকোনো প্রশ্ন, ক্যাম্পাস পরিদর্শন বা অতিরিক্ত তথ্যের জন্য আমাদের সাথে যোগাযোগ করুন'
        : 'Get in touch with us for any inquiries, campus visits, or additional information',
      href: '/contact',
      icon: <Phone className="w-8 h-8 text-white" />,
      delay: 400,
    },
  ];

  // Use Sanity data or fallback to hardcoded data
  const newsData =
    featuredNews && featuredNews.length > 0
      ? featuredNews.slice(0, 3).map((news, index) => ({
          title: getLocalizedText(news.title, locale),
          excerpt:
            getLocalizedText(news.excerpt, locale) ||
            getLocalizedText(news.title, locale),
          date: new Date(news.publishedAt).toLocaleDateString(
            locale === 'bengali' ? 'bn-BD' : 'en-US',
            {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            }
          ),
          image: news.featuredImage
            ? `/api/image/${news.featuredImage.asset._ref}`
            : '/images/news/default.svg',
          href: `/news/${news.slug?.[locale]?.current || 'news-item'}`,
          delay: index * 200,
        }))
      : [
          {
            title: 'Annual Quran Competition Results Announced',
            excerpt:
              'Our students achieved remarkable success in the district-level Quran recitation competition, bringing honor to our institution.',
            date: 'January 15, 2025',
            image: '/images/news/quran-competition.svg',
            href: '/news/quran-competition-2025',
            delay: 0,
          },
          {
            title: 'New Science Laboratory Inauguration',
            excerpt:
              'State-of-the-art science laboratory inaugurated to enhance practical learning experience for our students.',
            date: 'January 10, 2025',
            image: '/images/news/science-lab.svg',
            href: '/news/science-lab-inauguration',
            delay: 200,
          },
          {
            title: 'Admission Open for Academic Year 2025-26',
            excerpt:
              'Applications are now open for the new academic year. Limited seats available for all classes.',
            date: 'January 5, 2025',
            image: '/images/news/admission-open.svg',
            href: '/admissions',
            delay: 400,
          },
        ];

  return (
    <section
      ref={sectionRef}
      className={`py-16 md:py-24 bg-white relative overflow-hidden ${className}`}
    >
      {/* Background Decoration */}
      <div className="absolute top-0 right-0 w-64 h-64 opacity-5">
        <div
          className="w-full h-full"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cpath d='M50 0L93.3 25L93.3 75L50 100L6.7 75L6.7 25Z' fill='%23b8924f' opacity='0.3'/%3E%3C/svg%3E")`,
            backgroundSize: '100px 100px',
            backgroundRepeat: 'repeat',
          }}
        />
      </div>

      <div className="container-custom relative z-10">
        {/* Quick Access Section */}
        <div ref={quickAccessRef} className="mb-20">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center space-x-4 mb-6">
              <h2 className="quick-access-title text-3xl md:text-4xl font-bold text-primary-400">
                {locale === 'bengali' ? 'দ্রুত অ্যাক্সেস' : 'Quick Access'}
              </h2>
            </div>
            <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto">
              {locale === 'bengali' 
                ? 'আমাদের সবচেয়ে গুরুত্বপূর্ণ বিভাগগুলির মাধ্যমে দ্রুত খুঁজে নিন'
                : 'Find what you\'re looking for quickly with our most important sections'
              }
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-12">
            {quickAccessItems.map((item, index) => (
              <QuickAccessCard
                key={index}
                title={item.title}
                description={item.description}
                href={item.href}
                icon={item.icon}
                delay={item.delay}
              />
            ))}
          </div>

          {/* Admissions CTA */}
          <div className="text-center">
            <div className="bg-white rounded-3xl p-8 md:p-12 border border-primary-200">
              <h3 className="text-3xl md:text-4xl font-bold mb-4 text-primary-400">
                {locale === 'bengali' 
                  ? `ভর্তি ${new Date().getFullYear()}–${new Date().getFullYear() + 1}`
                  : `Admission ${new Date().getFullYear()}–${new Date().getFullYear() + 1}`
                }
              </h3>
              <p className="text-xl text-primary-300 mb-8 max-w-2xl mx-auto">
                {locale === 'bengali'
                  ? 'আমাদের অনন্য কারিকুলামে ভর্তি হতে আজই আবেদন করুন'
                  : 'Apply today to join our unique curriculum'
                }
              </p>
              <Link 
                href="/admissions" 
                className="inline-flex items-center gap-3 bg-primary-600 text-white hover:bg-primary-700 font-semibold px-8 py-4 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              >
                <span className="text-lg">
                  {locale === 'bengali' ? 'ভর্তি আবেদন করুন' : 'Apply for Admission'}
                </span>
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>

        {/* Featured News Section */}
        <div ref={newsRef}>
          {/* <div className="text-center mb-12">
            <div className="flex items-center justify-center space-x-4 mb-6">
              <h2 className="news-title text-3xl md:text-4xl font-bold text-primary-400">
                {locale === 'bengali' ? 'সর্বশেষ সংবাদ ও ইভেন্ট' : 'Latest News & Events'}
              </h2>
            </div>
            <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto">
              {locale === 'bengali'
                ? 'আমাদের সর্বশেষ অর্জন, ইভেন্ট এবং ঘোষণার সাথে আপডেট থাকুন'
                : 'Stay updated with our latest achievements, events, and announcements'
              }
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {newsData.map((news, index) => (
              <FeaturedNewsCard
                key={index}
                title={news.title}
                excerpt={news.excerpt}
                date={news.date}
                image={news.image}
                href={news.href}
                delay={news.delay + 600}
              />
            ))}
          </div> */}

          {/* View All News Button - Hidden for MVP */}
          {/* <div
            className={`text-center mt-12 transition-all duration-1000 delay-1000 ${
              sectionVisible
                ? 'opacity-100 translate-y-0'
                : 'opacity-0 translate-y-4'
            }`}
          >
            <Link
              href="/news"
              className="btn-primary text-lg px-8 py-4 inline-flex items-center space-x-2 hover:scale-105 transition-all duration-300"
            >
              <span>View All News & Events</span>
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </Link>
          </div> */}
        </div>
      </div>

      {/* Performance Optimization: Preload images */}
      <div className="hidden">
        {newsData.map((news, index) => (
          <link key={index} rel="preload" as="image" href={news.image} />
        ))}
      </div>
    </section>
  );
}
